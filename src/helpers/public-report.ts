import type { Reporte, ReportePublico } from "@/types";

/**
 * Convierte un Reporte completo en su versión pública
 * Copia campo por campo a propósito: si mañana se agrega un campo
 * nuevo a Reporte, no pasa al público salvo que se agregue acá.
 */
export function toPublicReport(reporte: Reporte): ReportePublico {
  return {
    id: reporte.id,
    codigo: reporte.codigo,
    tipoId: reporte.tipoId,
    direccion: reporte.direccion,
    coordenadas: reporte.coordenadas,
    zonaId: reporte.zonaId,
    estado: reporte.estado,
    adhesiones: reporte.adhesiones,
    creadoEn: reporte.creadoEn,
  };
}
