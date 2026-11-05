import { kvStorage, StorageReadError } from './kv-client';
import type { CreateReportDTO, Reporte } from '@/types/index';
import type { PendingReport, SyncStatus } from '@/types/offline';
import { persistAudioFile } from '@/utils/audio-storage';
import { persistReportPhotos } from '@/utils/photo-storage';

export const PENDING_REPORT_KEY_PREFIX = '@reporte_ciudadano:pending_report:';

export function getPendingReportKey(localId: string): string {
  return `${PENDING_REPORT_KEY_PREFIX}${localId}`;
}

/**
 * Genera un id compatible con la API (`rep-<timestampBase36><aleatorio>`).
 */
export function generateReportId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `rep-${timestamp}${random}`;
}

/**
 * Deriva el código provisional determinista a partir del identificador.
 */
function generateProvisionalCode(localId: string): string {
  const suffix = localId
    .replace(/[^a-z0-9]/gi, '')
    .toUpperCase()
    .slice(-12);
  return `RC-PEND-${suffix}`;
}

/**
 * Obtiene la lista completa de reportes guardados localmente.
 * Solo la ausencia de datos se interpreta como lista vacía.
 */
export async function getAllLocalReports(): Promise<PendingReport[]> {
  const keys = await kvStorage.getAllKeys();
  const reportKeys = keys.filter((key) => key.startsWith(PENDING_REPORT_KEY_PREFIX));

  if (reportKeys.length === 0) {
    return [];
  }

  const items = await Promise.all(
    reportKeys.map(async (key) => {
      const stored = await kvStorage.getItem<unknown>(key);
      if (stored === null) {
        return null;
      }

      if (typeof stored !== 'object' || !('localId' in stored)) {
        throw new StorageReadError(key, JSON.stringify(stored));
      }

      return stored as PendingReport;
    }),
  );

  const reports = items.filter((item): item is PendingReport => item !== null);

  return reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/**
 * Obtiene únicamente los reportes pendientes de sincronización (no sincronizados ni rechazados).
 */
export async function getPendingReports(): Promise<PendingReport[]> {
  const all = await getAllLocalReports();
  if (__DEV__) {
    console.log(
      '[storage] Reportes locales pendientes de sincronización:',
      JSON.stringify(
        all.filter((item) => item.syncStatus === 'pendiente'),
        null,
        2,
      ),
    );
  }
  return all.filter(
    (item) =>
      item.syncStatus !== 'sincronizado' &&
      item.syncStatus !== 'rechazado' &&
      !item.reporte.sincronizado,
  );
}

/**
 * Obtiene un reporte local por su ID local o clientRequestId.
 */
export async function getLocalReportById(id: string): Promise<PendingReport | null> {
  const direct = await kvStorage.getItem<PendingReport>(getPendingReportKey(id));
  if (direct && (direct.localId === id || direct.clientRequestId === id)) {
    return direct;
  }

  const all = await getAllLocalReports();
  return all.find((item) => item.localId === id || item.clientRequestId === id) ?? null;
}

/**
 * Guarda un nuevo reporte en la cola local marcado como sincronizado: false.
 */
export async function savePendingReport(
  payload: CreateReportDTO,
  options?: { uncertainResponse?: boolean },
): Promise<PendingReport> {
  const localId = payload.id ?? generateReportId();
  const clientRequestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const creadoEn = payload.creadoEn ?? new Date().toISOString();

  const persistedPhotos = payload.fotos?.length ? await persistReportPhotos(payload.fotos) : [];
  const persistedAudio = payload.audioUrl ? await persistAudioFile(payload.audioUrl) : null;

  const reporteLocal: Reporte = {
    id: localId,
    codigo: generateProvisionalCode(localId),
    tipoId: payload.tipoId,
    descripcion: payload.descripcion,
    audioUrl: persistedAudio,
    fotos: persistedPhotos,
    coordenadas: payload.coordenadas,
    direccion: payload.direccion,
    zonaId: payload.zonaId,
    estado: 'recibido',
    autorId: payload.autorId,
    cuadrillaId: payload.cuadrillaId,
    duplicadoDe: null,
    adhesiones: 0,
    creadoEn,
    sincronizado: false,
  };

  const pendingItem: PendingReport = {
    localId,
    clientRequestId,
    reporte: reporteLocal,
    payload: {
      ...payload,
      id: localId,
      creadoEn,
      fotos: persistedPhotos,
      audioUrl: persistedAudio,
    },
    syncStatus: 'pendiente',
    uncertainResponse: options?.uncertainResponse ?? false,
    retryCount: 0,
    createdAt: creadoEn,
  };

  await kvStorage.setItem(getPendingReportKey(localId), pendingItem);

  return pendingItem;
}

export interface UpdateSyncStatusOptions {
  uncertainResponse?: boolean;
}

/**
 * Normaliza a 'pendiente' con respuesta incierta cualquier reporte que haya quedado
 * en estado 'sincronizando' a causa de un cierre o interrupción previa de la aplicación.
 */
export async function normalizeInterruptedReports(): Promise<number> {
  const queue = await getAllLocalReports();
  const interrupted = queue.filter((item) => item.syncStatus === 'sincronizando');

  if (interrupted.length === 0) {
    return 0;
  }

  await Promise.all(
    interrupted.map((item) => {
      const updated: PendingReport = {
        ...item,
        syncStatus: 'pendiente',
        uncertainResponse: true,
      };
      return kvStorage.setItem(getPendingReportKey(item.localId), updated);
    }),
  );

  return interrupted.length;
}

/**
 * Actualiza el estado de sincronización y registra errores o reintentos.
 */
export async function updateSyncStatus(
  localId: string,
  status: SyncStatus,
  errorMessage?: string,
  options?: UpdateSyncStatusOptions,
): Promise<PendingReport | null> {
  const key = getPendingReportKey(localId);
  const current = await kvStorage.getItem<PendingReport>(key);

  if (!current) {
    return null;
  }

  const updated: PendingReport = {
    ...current,
    syncStatus: status,
    lastAttemptAt: new Date().toISOString(),
    retryCount: status === 'sincronizando' ? current.retryCount + 1 : current.retryCount,
    errorMessage: errorMessage ?? current.errorMessage,
    uncertainResponse:
      options?.uncertainResponse !== undefined
        ? options.uncertainResponse
        : current.uncertainResponse,
  };

  await kvStorage.setItem(key, updated);
  return updated;
}

/**
 * Marca un reporte local como sincronizado exitosamente, conservando el registro
 * y asociando el identificador y el número de seguimiento definitivo del servidor.
 */
export async function markReportAsSynced(
  localId: string,
  serverReportId: string,
  codigo: string,
): Promise<PendingReport | null> {
  const key = getPendingReportKey(localId);
  const current = await kvStorage.getItem<PendingReport>(key);

  if (!current) {
    return null;
  }

  const updated: PendingReport = {
    ...current,
    syncStatus: 'sincronizado',
    uncertainResponse: false,
    serverReportId,
    reporte: {
      ...current.reporte,
      id: serverReportId,
      codigo,
      sincronizado: true,
    },
    errorMessage: undefined,
  };

  await kvStorage.setItem(key, updated);
  return updated;
}

/**
 * Elimina un reporte del almacenamiento local.
 */
export async function removeLocalReport(localId: string): Promise<boolean> {
  const key = getPendingReportKey(localId);
  const current = await kvStorage.getItem<PendingReport>(key);

  if (!current) {
    return false;
  }

  await kvStorage.removeItem(key);
  return true;
}

/**
 * Limpia todos los reportes almacenados localmente.
 */
export async function clearAllLocalReports(): Promise<void> {
  const keys = await kvStorage.getAllKeys();
  const reportKeys = keys.filter((key) => key.startsWith(PENDING_REPORT_KEY_PREFIX));

  await Promise.all(reportKeys.map((key) => kvStorage.removeItem(key)));
}
