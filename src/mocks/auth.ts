import { Usuario } from "../types";

export const MOCK_USERS: Record<string, Usuario> = {
  "vecino@gualeguaychu.gov.ar": {
    id: "usr-01",
    nombre: "Juan Pérez",
    email: "vecino@gualeguaychu.gov.ar",
    telefono: "3446123456",
    rol: "vecino",
    zonaId: null,
    avisosActivos: true,
    creadoEn: "2026-01-15T08:00:00-03:00",
  },
  "operador@gualeguaychu.gov.ar": {
    id: "usr-02",
    nombre: "María Gómez",
    email: "operador@gualeguaychu.gov.ar",
    telefono: "3446654321",
    rol: "operador",
    zonaId: "zona-norte",
    avisosActivos: true,
    creadoEn: "2025-11-10T10:30:00-03:00",
  },
};
