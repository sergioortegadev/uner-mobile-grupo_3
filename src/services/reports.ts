import { MOCK_CREWS, MOCK_REPORTS, MOCK_STATUS_HISTORY, MOCK_ZONES } from "../mocks/reports";
import { ApiReportService } from "./api/api-reports";
import {
  CambioDeEstado,
  Coordenadas,
  Cuadrilla,
  EstadoReporte,
  Reporte,
  Zona,
  CreateReportDTO
} from "../types/index";
import { calculateDistanceInMeters } from "../utils/geo";



export interface ReportFilterParams {
  estado?: EstadoReporte;
  tipoId?: string;
  zonaId?: string;
  autorId?: string;
}

export interface ReportService {
  getReports(filters?: ReportFilterParams): Promise<Reporte[]>;
  getReportById(id: string): Promise<Reporte | null>;
  createReport(data: CreateReportDTO): Promise<Reporte>;
  updateReportStatus(
    id: string,
    status: EstadoReporte,
    comment?: string | null,
    operatorId?: string | null,
    repairPhotoUrl?: string | null,
  ): Promise<Reporte>;
  addAdhesion(reportId: string): Promise<Reporte>;
  getNearbyReports(coordinates: Coordenadas, radiusMeters?: number, typeId?: string): Promise<Reporte[]>;

  getStatusHistory(reportId: string): Promise<CambioDeEstado[]>;
  getZones(): Promise<Zona[]>;
  getCrews(zonaId?: string): Promise<Cuadrilla[]>;
  assignCrew(
    reportId: string,
    crewId: string,
    operatorId?: string | null,
    comment?: string | null,
  ): Promise<Reporte>;
  markAsDuplicate(
    reportId: string,
    originalReportId: string,
    comment?: string | null,
    operatorId?: string | null,
  ): Promise<Reporte>;
}

// Simular latencia de red, (600ms)

const delay = (ms: number = 600) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockReportService implements ReportService {
  private reports: Reporte[] = [...MOCK_REPORTS];
  private history: CambioDeEstado[] = [...MOCK_STATUS_HISTORY];
  private crews: Cuadrilla[] = [...MOCK_CREWS];

  async getStatusHistory(reportId: string): Promise<CambioDeEstado[]> {
    await delay();

    return this.history
      .filter((h) => h.reporteId === reportId)
      .sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());
  }

  async getZones(): Promise<Zona[]> {
    await delay();
    return MOCK_ZONES;
  }

  async getCrews(zonaId?: string): Promise<Cuadrilla[]> {
    await delay();
    let resultado = this.crews.filter((c) => c.activa);
    if (zonaId) {
      resultado = resultado.filter((c) => c.zonaId === zonaId);
    }

    return resultado;
  }

  async assignCrew(
    reportId: string,
    crewId: string,
    operatorId: string | null = null,
    comment: string | null = null,
  ): Promise<Reporte> {
    await delay();

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.cuadrillaId = crewId;
    reporte.estado = "asignado";

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: "asignado",
      comentario: comment || `Asignado a la cuadrilla ${crewId}`,
      operadorId: operatorId,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async markAsDuplicate(
    reportId: string,
    originalReportId: string,
    comment: string | null = null,
    operatorId: string | null = null,
  ): Promise<Reporte> {
    await delay();

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.duplicadoDe = originalReportId;
    reporte.estado = "rechazado";

    // Registrar en el historial
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: "rechazado",
      comentario: comment || `Reclamo duplicado con id: ${originalReportId}`,
      operadorId: operatorId,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async getReports(filters?: ReportFilterParams): Promise<Reporte[]> {
    await delay();
    let resultado = [...this.reports];

    if (filters?.estado) {
      resultado = resultado.filter((r) => r.estado === filters.estado);
    }
    if (filters?.tipoId) {
      resultado = resultado.filter((r) => r.tipoId === filters.tipoId);
    }
    if (filters?.zonaId) {
      resultado = resultado.filter((r) => r.zonaId === filters.zonaId);
    }
    if (filters?.autorId) {
      resultado = resultado.filter((r) => r.autorId === filters.autorId);
    }
    // Bandeja: más adhesiones primero; en empate, el más nuevo primero
    return resultado.sort(
      (a, b) =>
        (b.adhesiones ?? 0) - (a.adhesiones ?? 0) ||
        new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime(),
    );
  }

  async getReportById(reportId: string): Promise<Reporte | null> {
    await delay(400);
    const reporte = this.reports.find((r) => r.id === reportId);

    return reporte || null;
  }

  async createReport(data: CreateReportDTO): Promise<Reporte> {
    await delay(900);

    if (data.id) {
      const existing = this.reports.find((r) => r.id === data.id);
      if (existing) return { ...existing };
    }

    // Generar nuevo reporte
    const nuevoReporte: Reporte = {
      id: data.id ?? `rep-${Date.now()}`,
      codigo: `RC-2026-${Math.floor(100 + Math.random() * 900)}`,
      tipoId: data.tipoId,
      descripcion: data.descripcion,
      audioUrl: data.audioUrl,
      fotos: data.fotos,
      coordenadas: data.coordenadas,
      direccion: data.direccion,
      zonaId: "zone-1",
      estado: "recibido",
      autorId: data.autorId,
      cuadrillaId: null,
      duplicadoDe: null,
      adhesiones: 0,
      creadoEn: new Date().toISOString(),
      sincronizado: true,
    };

    this.reports.unshift(nuevoReporte);
    return nuevoReporte;
  }

  async updateReportStatus(
    reportId: string,
    status: EstadoReporte,
    comment?: string | null,
    operatorId?: string | null,
    repairPhotoUrl?: string | null,
  ): Promise<Reporte> {
    await delay(800);

    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.estado = status;

    if (repairPhotoUrl) {
      reporte.fotos.push({
        id: `foto-${Date.now()}`,
        url: repairPhotoUrl,
        momento: "arreglo",
      });
    }

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: status,
      comentario: comment || null,
      operadorId: operatorId || null,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async addAdhesion(reportId: string): Promise<Reporte> {
    await delay(300);
    const reporte = this.reports.find((r) => r.id === reportId);
    if (!reporte) throw new Error("Reporte no encontrado");

    reporte.adhesiones = (reporte.adhesiones ?? 0) + 1;

    // Registrar en el historial de cambios
    this.history.push({
      id: `hist-${Date.now()}`,
      reporteId: reportId,
      estado: reporte.estado,
      comentario: `Se añadió un usuario al reporte`,
      operadorId: null,
      fechaHora: new Date().toISOString(),
    });

    return { ...reporte };
  }

  async getNearbyReports(
    coordinates: Coordenadas,
    radiusMeters: number = 50,
    typeId?: string,
  ): Promise<Reporte[]> {
    await delay();

    return this.reports
      .filter((report) => report.estado !== "resuelto" && report.estado !== "rechazado")
      .filter((report) => !typeId || report.tipoId === typeId)
      .filter((report) => {
        const distance = calculateDistanceInMeters(coordinates, report.coordenadas);
        return distance <= radiusMeters;
      })
      .sort((reportA, reportB) => {
        const distanceA = calculateDistanceInMeters(coordinates, reportA.coordenadas);
        const distanceB = calculateDistanceInMeters(coordinates, reportB.coordenadas);
        return distanceA - distanceB;
      });
  }
}

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";

export const mockReportService = new MockReportService();
export const reportService: ReportService = USE_MOCK ? mockReportService : new ApiReportService();
