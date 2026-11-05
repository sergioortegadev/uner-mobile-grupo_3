import type { Coordenadas, Foto } from '@/types/index';
import type { NewReportInput, ReportFieldErrors } from './types';

const MIN_FOTOS = 1;
const MAX_FOTOS = 2;

/**
 * Datos del reporte ya validados y normalizados, listos para construir el DTO
 * del servicio de reportes o para encolarse como pendiente.
 */
export interface ValidatedReportData {
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  zonaId: string;
}

export type ValidationResult =
  | { ok: true; datos: ValidatedReportData }
  | { ok: false; errors: ReportFieldErrors };

function hasValidCoordinates(coordenadas?: Coordenadas | null): coordenadas is Coordenadas {
  if (!coordenadas) {
    return false;
  }

  const { latitud, longitud } = coordenadas;

  return (
    Number.isFinite(latitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    Number.isFinite(longitud) &&
    longitud >= -180 &&
    longitud <= 180
  );
}

function formatCoordinateFallback(coordenadas: Coordenadas): string {
  return `Lat: ${coordenadas.latitud.toFixed(5)}, Lon: ${coordenadas.longitud.toFixed(5)}`;
}

/**
 * Valida y normaliza los datos crudos del formulario antes de enviar o encolar.
 */
export function validateNewReport(datos: NewReportInput): ValidationResult {
  const errors: ReportFieldErrors = {};
  const fotos = datos.fotos ?? [];
  const descripcion = datos.descripcion?.trim() ? datos.descripcion.trim() : null;
  const audioUrl = datos.audioUrl?.trim() ? datos.audioUrl.trim() : null;
  const direccionLimpia = datos.direccion?.trim() ?? '';

  if (!datos.tipoId) {
    errors.tipoId = 'Seleccioná el tipo de problema.';
  }

  if (fotos.length < MIN_FOTOS) {
    errors.fotos = 'Sacá o elegí al menos una foto del problema.';
  } else if (fotos.length > MAX_FOTOS) {
    errors.fotos = `Podés adjuntar hasta ${MAX_FOTOS} fotos.`;
  }

  if (!hasValidCoordinates(datos.coordenadas)) {
    errors.coordenadas = 'Falta la ubicación del problema.';
  }

  if (!descripcion && !audioUrl) {
    errors.descripcion = 'Escribí una descripción o grabá una nota de voz.';
  }

  if (!datos.tipoId || !hasValidCoordinates(datos.coordenadas)) {
    return { ok: false, errors };
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    datos: {
      tipoId: datos.tipoId,
      descripcion,
      audioUrl,
      fotos,
      coordenadas: datos.coordenadas,
      direccion: direccionLimpia || formatCoordinateFallback(datos.coordenadas),
      zonaId: datos.zonaId ?? '',
    },
  };
}
