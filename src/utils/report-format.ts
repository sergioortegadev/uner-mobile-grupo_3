import { UNKNOWN_REPORT_TYPE_NAME } from "@/constants/report-types-static";
import type { Reporte, TipoDeReporte, Zona } from "@/types";

/** "Bacheo y Calzada en Rocamora 1250". Si no se conoce el tipo, se usa solo la dirección. */
export const buildReportTitle = (tipoNombre: string | undefined, direccion: string): string =>
  tipoNombre ? `${tipoNombre} en ${direccion}` : direccion;

/** Nombre del tipo; si la app no lo conoce (versión desactualizada) devuelve "Otro". */
export const getTypeName = (tipos: readonly TipoDeReporte[], tipoId: string): string =>
  tipos.find((tipo) => tipo.id === tipoId)?.nombre ?? UNKNOWN_REPORT_TYPE_NAME;

export const getReportTitle = (reporte: Pick<Reporte, "tipoId" | "direccion">, tipos: readonly TipoDeReporte[]): string =>
  buildReportTitle(getTypeName(tipos, reporte.tipoId), reporte.direccion);

/** Etiqueta del selector de duplicados: "rep-103 · Bacheo y Calzada en Rocamora 1250". */
export const buildDuplicateOptionLabel = (id: string, title: string): string => `${id} · ${title}`;

/** Comentario del historial: "Reclamo duplicado con id: rep-103, Bacheo y Calzada en Rocamora 1250". */
export const buildDuplicateComment = (originalId: string, originalTitle: string): string =>
  `Reclamo duplicado con id: ${originalId}, ${originalTitle}`;

/** Etiqueta de zona con su número (id sin 'zone-'): "3 - Zona Oeste". */
export const buildZoneLabel = (zona: Pick<Zona, "id" | "nombre">): string =>
  `${zona.id.replace("zone-", "")} - ${zona.nombre}`;
