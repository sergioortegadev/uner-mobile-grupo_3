import type { EstadoReporte } from "@/types";

export const COLOR_POR_ESTADO: Record<EstadoReporte, string> = {
  recibido: "#2196F3",
  en_revision: "#9C27B0",
  asignado: "#FF9800",
  resuelto: "#4CAF50",
  rechazado: "#F44336",
};

export const ETIQUETA_POR_ESTADO: Record<EstadoReporte, string> = {
  recibido: "Recibido",
  en_revision: "En revisión",
  asignado: "Asignado",
  resuelto: "Resuelto",
  rechazado: "Rechazado",
};
export const ESTADOS_ABIERTOS: EstadoReporte[] = [
  "recibido",
  "en_revision",
  "asignado",
];
