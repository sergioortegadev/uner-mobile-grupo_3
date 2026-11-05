import type { EstadoReporte, ReportePublico } from "@/types";

export interface FiltrosMapa {
  tipoId: string | null;
  estado: EstadoReporte | null;
}

/** null significa sin filtro. Los dos filtros se combinan. */
export function filtrarReportes(
  reportes: ReportePublico[],
  filtros: FiltrosMapa,
): ReportePublico[] {
  return reportes.filter(
    (r) =>
      (filtros.tipoId === null || r.tipoId === filtros.tipoId) &&
      (filtros.estado === null || r.estado === filtros.estado),
  );
}
