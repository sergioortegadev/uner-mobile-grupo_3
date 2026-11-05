import type { EstadoReporte } from "@/types";

export const ESTADO_OPTIONS: { value: EstadoReporte; label: string }[] = [
  { value: "recibido", label: "Recibido" },
  { value: "en_revision", label: "En revisión" },
  { value: "asignado", label: "Asignado" },
  { value: "resuelto", label: "Resuelto" },
  { value: "rechazado", label: "Rechazado" },
];

/** El comentario es obligatorio al pasar un reporte a 'resuelto' o 'rechazado'. */
export const requiresComment = (estado: EstadoReporte): boolean =>
  estado === "resuelto" || estado === "rechazado";

/** Un reporte está "abierto" mientras no esté resuelto ni rechazado. */
export const isOpenStatus = (estado: EstadoReporte): boolean => !requiresComment(estado);

/**
 * Estados a los que el operador puede pasar un reporte desde cada estado (reglas de la API).
 * 'asignado' se alcanza con la asignación de cuadrilla (desde 'recibido' la app pasa antes por 'en_revision').
 * 'resuelto' sólo es posible desde 'asignado'; 'resuelto' y 'rechazado' son estados finales.
 */
const TRANSICIONES: Record<EstadoReporte, EstadoReporte[]> = {
  recibido: ["en_revision", "asignado", "rechazado"],
  en_revision: ["asignado", "rechazado"],
  asignado: ["en_revision", "resuelto", "rechazado"],
  resuelto: [],
  rechazado: [],
};

export const getNextEstados = (actual: EstadoReporte): EstadoReporte[] => TRANSICIONES[actual];
