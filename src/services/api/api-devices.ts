import type { Usuario } from "../../types";
import { apiRequest } from "./client";

export type PlataformaPush = "ios" | "android";

/** POST /dispositivos: registra (o reasigna al usuario actual) el token Expo del teléfono. */
export async function registerDevice(tokenExpo: string, plataforma: PlataformaPush): Promise<void> {
  await apiRequest("/dispositivos", { method: "POST", body: { tokenExpo, plataforma } });
}

/** DELETE /dispositivos/:tokenExpo: da de baja el token del usuario con sesión. */
export async function unregisterDevice(tokenExpo: string): Promise<void> {
  await apiRequest(`/dispositivos/${encodeURIComponent(tokenExpo)}`, { method: "DELETE" });
}

/** PATCH /yo: activa o desactiva los avisos push del usuario. */
export async function updateAvisosActivos(avisosActivos: boolean): Promise<Usuario> {
  const { datos } = await apiRequest<Usuario>("/yo", { method: "PATCH", body: { avisosActivos } });
  return datos;
}
