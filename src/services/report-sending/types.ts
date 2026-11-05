import type { Coordenadas, Foto, Reporte } from '@/types/index';
import type { PendingReport } from '@/types/offline';

/**
 * Datos crudos que la pantalla Reportar entrega al módulo de envío.
 */
export interface NewReportInput {
  tipoId?: string | null;
  descripcion?: string | null;
  audioUrl?: string | null;
  fotos?: Foto[];
  coordenadas?: Coordenadas | null;
  direccion?: string | null;
  zonaId?: string | null;
}

/** Campos del reporte que pueden quedar inválidos, con su mensaje para la pantalla. */
export type ReportField = 'autorId' | 'tipoId' | 'fotos' | 'coordenadas' | 'descripcion';

export type ReportFieldErrors = Partial<Record<ReportField, string>>;

/** El servidor confirmó el reporte: el vecino recibe su número de seguimiento. */
export interface SentReportResult {
  status: 'enviado';
  reporte: Reporte;
  codigo: string;
}

/** El reporte quedó guardado en el teléfono: el vecino recibe el código provisorio. */
export interface PendingReportResult {
  status: 'pendiente';
  reporte: PendingReport;
  codigo: string;
}

/** Los datos no alcanzan para crear el reporte: no se llamó a la red ni a la cola. */
export interface InvalidReportResult {
  status: 'invalido';
  errors: ReportFieldErrors;
}

/** El servidor rechazó el reporte con error de cliente (HTTP 4xx): no se encola. */
export interface RejectedReportResult {
  status: 'rechazado';
  mensaje: string;
  codigoError: string;
  httpStatus: number;
  errors: ReportFieldErrors;
}

export type SendReportResult =
  | SentReportResult
  | PendingReportResult
  | InvalidReportResult
  | RejectedReportResult;

/** Resumen de una pasada de sincronización. */
export interface SyncSummary {
  sent: number;
  pending: number | null;
}
