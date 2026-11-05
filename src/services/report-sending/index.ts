import { logDevError } from '@/helpers/log';
import { ApiError } from '@/services/api/client';
import { authService } from '@/services/auth';
import { isOnline } from '@/services/network';
import { reportService } from '@/services/reports';
import {
  generateReportId,
  getPendingReports,
  markReportAsSynced,
  normalizeInterruptedReports,
  savePendingReport,
  updateSyncStatus,
} from '@/services/storage';
import type { CreateReportDTO, Reporte } from '@/types/index';
import { persistReportPhotos } from '@/utils/photo-storage';
import { SEND_TIMEOUT_MS, withTimeout } from './timeout';
import type { NewReportInput, ReportFieldErrors, SendReportResult, SyncSummary } from './types';
import { validateNewReport } from './validation';
import { persistAudioFile } from '@/utils/audio-storage';

function mapApiErrorToFieldErrors(error: ApiError): ReportFieldErrors {
  switch (error.codigo) {
    case 'FUERA_DE_LA_CIUDAD':
      return { coordenadas: error.message };
    case 'FOTO_REQUERIDA':
    case 'ARCHIVO_DEMASIADO_GRANDE':
    case 'TIPO_DE_ARCHIVO_NO_PERMITIDO':
    case 'ARCHIVO_NO_SUBIDO':
      return { fotos: error.message };
    case 'TIPO_NO_ENCONTRADO':
      return { tipoId: error.message };
    case 'NO_AUTENTICADO':
    case 'SIN_PERMISO':
      return { autorId: error.message };
    default:
      return {};
  }
}

/**
 * Crea un reporte a partir de los datos del formulario.
 * Con conexión se intenta enviar con un tiempo máximo de espera. Si el servicio
 * falla por red/servidor o no confirma a tiempo, el reporte se encola como pendiente.
 * Si el servidor lo rechaza con un error de cliente (HTTP 4xx), no se encola.
 */
export async function sendReport(data: NewReportInput): Promise<SendReportResult> {
  const validation = validateNewReport(data);

  if (!validation.ok) {
    return { status: 'invalido', errors: validation.errors };
  }
  try {
    const author = await authService.getCurrentUser();

    if (!author) {
      return {
        status: 'invalido',
        errors: { autorId: 'Necesitas iniciar sesión para enviar un reporte.' },
      };
    }

    const persistedPhotos = validation.datos.fotos?.length
      ? await persistReportPhotos(validation.datos.fotos)
      : [];
    const persistedAudio = validation.datos.audioUrl
      ? await persistAudioFile(validation.datos.audioUrl)
      : null;

    const reportData: CreateReportDTO = {
      id: generateReportId(),
      ...validation.datos,
      fotos: persistedPhotos,
      audioUrl: persistedAudio,
      autorId: author.id,
      cuadrillaId: null,
      creadoEn: new Date().toISOString(),
    };

    let timedOut = false;
    if (await isOnline()) {
      const attempt = await attemptSend(reportData);
      if (attempt.ok) {
        return {
          status: 'enviado',
          reporte: attempt.report,
          codigo: attempt.report.codigo,
        };
      }
      if (attempt.rejected) {
        return {
          status: 'rechazado',
          mensaje: attempt.errorMessage,
          codigoError: attempt.codigoError,
          httpStatus: attempt.httpStatus,
          errors: attempt.errors,
        };
      }
      timedOut = attempt.timedOut;
    }

    const pendingItem = await savePendingReport(reportData, {
      uncertainResponse: timedOut,
    });

    return {
      status: 'pendiente',
      reporte: pendingItem,
      codigo: pendingItem.reporte.codigo,
    };
  } catch (error) {
    logDevError('Error crítico en sendReport', error);
    throw error;
  }
}

/** Resultado de un intento de envío: confirmado por el servicio, rechazado por cliente (4xx) o fallo transitorio. */
type SendAttempt =
  | { ok: true; report: Reporte }
  | {
      ok: false;
      rejected: true;
      timedOut: false;
      httpStatus: number;
      codigoError: string;
      errorMessage: string;
      errors: ReportFieldErrors;
    }
  | {
      ok: false;
      rejected: false;
      timedOut: boolean;
      errorMessage: string;
    };

/**
 * Intenta enviar un reporte con el tiempo máximo de espera.
 */
async function attemptSend(payload: CreateReportDTO): Promise<SendAttempt> {
  try {
    const result = await withTimeout(reportService.createReport(payload));

    const seconds = SEND_TIMEOUT_MS / 1000;
    return result.timedOut
      ? {
          ok: false,
          rejected: false,
          timedOut: true,
          errorMessage: `El servicio no confirmó el envío en ${seconds} segundos.`,
        }
      : { ok: true, report: result.value };
  } catch (error) {
    logDevError('Falló el envío de un reporte.', error);
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return {
        ok: false,
        rejected: true,
        timedOut: false,
        httpStatus: error.status,
        codigoError: error.codigo,
        errorMessage: error.message,
        errors: mapApiErrorToFieldErrors(error),
      };
    }
    return {
      ok: false,
      rejected: false,
      timedOut: false,
      errorMessage: 'El servicio respondió con un error al enviar el reporte.',
    };
  }
}

/**
 * Pasada de sincronización en curso. un disparo a la vez
 */
let syncInFlight: Promise<SyncSummary> | null = null;

/**
 * Envía los reportes pendientes de la cola local, del más antiguo al más reciente.
 * Sin conexión no recorre la cola. Varias llamadas simultáneas comparten una sola pasada.
 */
export function syncPendingReports(): Promise<SyncSummary> {
  if (syncInFlight) {
    return syncInFlight;
  }

  syncInFlight = runSync().finally(() => {
    syncInFlight = null;
  });

  return syncInFlight;
}

async function runSync(): Promise<SyncSummary> {
  await normalizeInterruptedReports();

  if (!(await isOnline())) {
    return { sent: 0, pending: null };
  }

  const pending = (await getPendingReports()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  let sent = 0;

  for (const item of pending) {
    await updateSyncStatus(item.localId, 'sincronizando');

    if (item.uncertainResponse) {
      const existing = await reportService.getReportById(item.localId).catch(() => null);

      if (existing) {
        const synced = await markReportAsSynced(item.localId, existing.id, existing.codigo);
        if (synced) {
          sent += 1;
        }
        continue;
      }
    }

    const attempt = await attemptSend(item.payload);

    if (!attempt.ok) {
      if (
        attempt.rejected &&
        attempt.httpStatus !== 401 &&
        attempt.httpStatus !== 408 &&
        attempt.httpStatus !== 429
      ) {
        await updateSyncStatus(item.localId, 'rechazado', attempt.errorMessage);
        continue;
      }

      await updateSyncStatus(
        item.localId,
        'pendiente',
        attempt.errorMessage,
        attempt.timedOut ? { uncertainResponse: true } : undefined,
      );
      continue;
    }

    const synced = await markReportAsSynced(item.localId, attempt.report.id, attempt.report.codigo);

    if (synced) {
      sent += 1;
    }
  }

  const remaining = await getPendingReports();

  return { sent, pending: remaining.length };
}

export const enviarReporte = sendReport;

export type {
  InvalidReportResult,
  NewReportInput,
  PendingReportResult,
  RejectedReportResult,
  ReportField,
  ReportFieldErrors,
  SendReportResult,
  SentReportResult,
  SyncSummary,
} from './types';
