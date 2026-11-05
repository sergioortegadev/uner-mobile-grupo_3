import type { Coordenadas, EstadoReporte } from "./index";
export interface ReportePublico {
  id: string;
  codigo: string;
  tipoId: string;
  direccion: string;
  coordenadas: Coordenadas;
  zonaId: string;
  estado: EstadoReporte;
  adhesiones: number;
  creadoEn: string;
}
