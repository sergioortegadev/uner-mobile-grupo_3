import type {
  CambioDeEstado,
  Coordenadas,
  CreateReportDTO,
  Cuadrilla,
  EstadoReporte,
  Reporte,
  Zona,
} from "../../types";
import type { ReportFilterParams, ReportService } from "../reports";
import { ApiError, apiGetAll, apiRequest, uploadFile } from "./client";

const TODOS_LOS_ESTADOS = "recibido,en_revision,asignado,resuelto,rechazado";
/** La API acepta hasta 50 m en la búsqueda de reportes cercanos. */
const RADIO_MAXIMO_CERCANOS_M = 50;
const POR_PAGINA_MAPA = 500;
const TIMEOUT_CREAR_MS = 30_000;
const PATRON_ID_FOTO = /^fot-[A-Za-z0-9_-]{3,36}$/;

/** Bandeja: más adhesiones primero; en empate, el más nuevo primero. */
const ordenBandeja = (a: Reporte, b: Reporte): number =>
  (b.adhesiones ?? 0) - (a.adhesiones ?? 0) || new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime();

export class ApiReportService implements ReportService {
  async getReports(filters?: ReportFilterParams): Promise<Reporte[]> {
    // Con autorId se piden "mis reportes"; si no, todos los de la ciudad (el operador filtra desde la app).
    const lista = filters?.autorId
      ? await apiGetAll<Reporte>("/yo/reportes")
      : await apiGetAll<Reporte>(
          "/reportes",
          {
            estado: filters?.estado ?? TODOS_LOS_ESTADOS,
            tipoId: filters?.tipoId,
            zonaId: filters?.zonaId,
          },
          POR_PAGINA_MAPA,
        );

    return lista
      .filter((r) => !filters?.autorId || r.autorId === filters.autorId)
      .filter((r) => !filters?.estado || r.estado === filters.estado)
      .filter((r) => !filters?.tipoId || r.tipoId === filters.tipoId)
      .filter((r) => !filters?.zonaId || r.zonaId === filters.zonaId)
      .sort(ordenBandeja);
  }

  async getReportById(id: string): Promise<Reporte | null> {
    try {
      const { datos } = await apiRequest<Reporte>(`/reportes/${encodeURIComponent(id)}`);
      return datos;
    } catch (error) {
      // 404: no existe. 400: el identificador no tiene forma de reporte.
      if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
      throw error;
    }
  }

  async createReport(data: CreateReportDTO): Promise<Reporte> {
    // Primero se suben las fotos y el audio (en orden), después se manda el reporte con sus URLs.
    const fotos: { id?: string; url: string }[] = [];
    for (const foto of data.fotos) {
      const url = await uploadFile(foto.url);
      fotos.push(PATRON_ID_FOTO.test(foto.id) ? { id: foto.id, url } : { url });
    }
    const audioUrl = data.audioUrl ? await uploadFile(data.audioUrl) : null;

    // zonaId, autorId y cuadrillaId los completa la API. creadoEn conserva la fecha en que ocurrió el hecho.
    const { datos } = await apiRequest<Reporte>("/reportes", {
      method: "POST",
      timeoutMs: TIMEOUT_CREAR_MS,
      body: {
        ...(data.id ? { id: data.id } : {}),
        tipoId: data.tipoId,
        descripcion: data.descripcion,
        audioUrl,
        fotos,
        coordenadas: data.coordenadas,
        direccion: data.direccion,
        ...(data.creadoEn ? { creadoEn: data.creadoEn } : {}),
      },
    });
    return datos;
  }

  async updateReportStatus(
    id: string,
    status: EstadoReporte,
    comment?: string | null,
    _operatorId?: string | null,
    repairPhotoUrl?: string | null,
  ): Promise<Reporte> {
    // La foto se sube antes: si falla, el reporte todavía no cambió de estado.
    const photoUrl = repairPhotoUrl ? await uploadFile(repairPhotoUrl) : null;

    const cambio = await apiRequest<Reporte>(`/reportes/${id}/estado`, {
      method: "PATCH",
      body: { estado: status, comentario: comment ?? null },
    });
    if (!photoUrl) return cambio.datos;

    const conFoto = await apiRequest<Reporte>(`/reportes/${id}/fotos`, {
      method: "POST",
      body: { url: photoUrl },
    });
    return conFoto.datos;
  }

  async addAdhesion(reportId: string): Promise<Reporte> {
    const { datos } = await apiRequest<Reporte>(`/reportes/${reportId}/adhesiones`, { method: "POST" });
    return datos;
  }

  async getNearbyReports(coordinates: Coordenadas, radiusMeters: number = 50, typeId?: string): Promise<Reporte[]> {
    const { datos } = await apiRequest<Reporte[]>("/reportes/cercanos", {
      query: {
        latitud: coordinates.latitud,
        longitud: coordinates.longitud,
        radioMetros: Math.min(Math.max(Math.round(radiusMeters), 1), RADIO_MAXIMO_CERCANOS_M),
        tipoId: typeId,
        porPagina: 100,
      },
    });
    return datos;
  }

  async getStatusHistory(reportId: string): Promise<CambioDeEstado[]> {
    // La API los devuelve del más viejo al más nuevo; la app los muestra al revés.
    const cambios = await apiGetAll<CambioDeEstado>(`/reportes/${reportId}/cambios`);
    return cambios.reverse();
  }

  getZones(): Promise<Zona[]> {
    return apiGetAll<Zona>("/zonas");
  }

  async getCrews(zonaId?: string): Promise<Cuadrilla[]> {
    const cuadrillas = await apiGetAll<Cuadrilla>("/cuadrillas", { activa: true });
    return cuadrillas.filter((c) => c.activa && (!zonaId || c.zonaId === zonaId));
  }

  async assignCrew(
    reportId: string,
    crewId: string,
    _operatorId: string | null = null,
    comment: string | null = null,
  ): Promise<Reporte> {
    // La API asigna sólo desde "en_revision" o "asignado": si el reporte recién llegó, primero se pasa a revisión.
    const actual = await this.getReportById(reportId);
    if (actual?.estado === "recibido") {
      await apiRequest<Reporte>(`/reportes/${reportId}/estado`, {
        method: "PATCH",
        body: { estado: "en_revision" },
      });
    }

    const { datos } = await apiRequest<Reporte>(`/reportes/${reportId}/cuadrilla`, {
      method: "PATCH",
      body: { cuadrillaId: crewId, comentario: comment },
    });
    return datos;
  }

  async markAsDuplicate(
    reportId: string,
    originalReportId: string,
    _comment: string | null = null,
    _operatorId: string | null = null,
  ): Promise<Reporte> {
    // La API arma sola el comentario «Duplicado de GCHU-…» y el operador sale de la sesión.
    const { datos } = await apiRequest<Reporte>(`/reportes/${reportId}/duplicado`, {
      method: "POST",
      body: { originalId: originalReportId },
    });
    return datos;
  }
}
