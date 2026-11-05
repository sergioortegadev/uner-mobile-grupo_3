export interface Coordenadas {
  latitud: number;
  longitud: number;
}

export interface Foto {
  id: string;
  url: string;
  momento: "problema" | "arreglo";
}

export type EstadoReporte =
  | "recibido"
  | "en_revision"
  | "asignado"
  | "resuelto"
  | "rechazado";

export type Rol = "vecino" | "operador";

export interface Reporte {
  id: string;
  codigo: string;
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  zonaId: string;
  estado: EstadoReporte;
  autorId: string;
  cuadrillaId: string | null;
  duplicadoDe: string | null;
  adhesiones: number;
  creadoEn: string;
  sincronizado: boolean;
}

export interface CreateReportDTO {
  id?: string;
  tipoId: string;
  descripcion: string | null;
  audioUrl: string | null;
  fotos: Foto[];
  coordenadas: Coordenadas;
  direccion: string;
  autorId: string;
  zonaId: string;
  cuadrillaId: string | null;
  creadoEn?: string;
}

export interface TipoDeReporte {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  areaResponsable: string;
}

export interface CambioDeEstado {
  id: string;
  reporteId: string;
  estado: EstadoReporte;
  comentario: string | null;
  operadorId: string | null;
  fechaHora: string;
}

export interface Usuario {
  id: string;
  dni?: string;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: Rol;
  zonaId: string | null;
  avisosActivos: boolean;
  creadoEn: string;
}

export interface Zona {
  id: string;
  nombre: string;
  limite: Coordenadas[];
  referente: string;
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  zonaId: string;
  especialidad: string;
  activa: boolean;
}

export interface CredencialesAuth {
  email: string;
  password: string;
}

// Posiblemente se modifique cuando estén los endpoint implementados
export interface RespuestaAuth {
  user: Usuario;
  access_token: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: string;
  access_token_expires_at?: string;
  refresh_token_expires_at?: string;
}

export interface RegistroUsuarioDTO {
  nombre: string;
  dni?: string;
  email: string;
  password: string;
  telefono?: string | null;
}

export * from "./location";
export * from "./network";
export * from "./offline";
export * from "./public";
