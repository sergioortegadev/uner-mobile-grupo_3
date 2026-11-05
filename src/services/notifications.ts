import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { logDevError } from "../helpers/log";
import type { Rol } from "../types";
import { registerDevice, unregisterDevice } from "./api/api-devices";
import { kvStorage } from "./storage/kv-client";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK !== "false";
/** Token Expo con el que se registró este teléfono (no es sensible: sirve para darlo de baja). */
const PUSH_TOKEN_KEY = "push.expo_token";

/** Canales de Android: `default` y uno por tipo de aviso (los ids los manda la API en `channelId`). */
export const CANALES = {
  default: "default",
  estado: "estado",
  adhesion: "adhesion",
  nuevoReporte: "nuevo-reporte",
} as const;

const COLOR_PRIMARIO = "#FF9117";

/** Push solo en Android físico y con la API real. En iOS, web o mocks no hace nada. */
export const isPushSupported = (): boolean => Platform.OS === "android" && Device.isDevice && !USE_MOCK;

/** Cómo se muestra una push con la app abierta. Llamar una vez, al arrancar. */
export function configureForegroundHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function setupChannels(): Promise<void> {
  const base = { importance: Notifications.AndroidImportance.HIGH, lightColor: COLOR_PRIMARIO };
  await Promise.all([
    Notifications.setNotificationChannelAsync(CANALES.default, { ...base, name: "General" }),
    Notifications.setNotificationChannelAsync(CANALES.estado, { ...base, name: "Cambios de estado de mis reportes" }),
    Notifications.setNotificationChannelAsync(CANALES.adhesion, { ...base, name: "Vecinos que se suman a mis reportes" }),
    Notifications.setNotificationChannelAsync(CANALES.nuevoReporte, { ...base, name: "Reportes nuevos" }),
  ]);
}

export type EstadoPermisoPush = "granted" | "denied" | "undetermined";

export async function getPushPermission(): Promise<EstadoPermisoPush> {
  try {
    return (await Notifications.getPermissionsAsync()).status;
  } catch (error) {
    logDevError("[push] No se pudo leer el permiso.", error);
    return "undetermined";
  }
}

/**
 * Pide permiso (Android 13+) y devuelve el token Expo de este teléfono.
 * Devuelve null si no aplica (iOS, emulador, mocks), si no hay permiso o si algo falla: nunca lanza.
 */
export async function registerForPush(): Promise<string | null> {
  if (!isPushSupported()) return null;
  try {
    // El canal tiene que existir antes de pedir el permiso en Android 13+.
    await setupChannels();
    let status = await getPushPermission();
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) throw new Error("Falta extra.eas.projectId en app.json.");
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    logDevError("[push] No se pudo obtener el token de push.", error);
    return null;
  }
}

/** Obtiene el token y lo registra en la API (POST /dispositivos). Nunca lanza. */
export async function registerPushDevice(): Promise<boolean> {
  try {
    const token = await registerForPush();
    if (!token) return false;
    await registerDevice(token, "android");
    await kvStorage.setItem(PUSH_TOKEN_KEY, token);
    return true;
  } catch (error) {
    logDevError("[push] No se pudo registrar el dispositivo.", error);
    return false;
  }
}

/**
 * Da de baja el token en la API (necesita la sesión activa: llamar ANTES de cerrarla).
 * Nunca lanza: si no hay red, el token pasa al siguiente usuario cuando registre el teléfono.
 */
export async function unregisterPushDevice(): Promise<void> {
  try {
    const token = await kvStorage.getItem<string>(PUSH_TOKEN_KEY);
    if (!token) return;
    await kvStorage.removeItem(PUSH_TOKEN_KEY);
    await unregisterDevice(token);
  } catch (error) {
    logDevError("[push] No se pudo dar de baja el dispositivo.", error);
  }
}

/** Ruta del detalle del reporte notificado, según el rol. Null si la push no trae `reporteId`. */
export function routeForNotification(data: Record<string, unknown> | null | undefined, rol: Rol): string | null {
  const reporteId = data?.reporteId;
  if (typeof reporteId !== "string" || reporteId.length === 0) return null;
  const grupo = rol === "operador" ? "(operador)" : "(vecino)";
  return `/${grupo}/reporte/${encodeURIComponent(reporteId)}`;
}
