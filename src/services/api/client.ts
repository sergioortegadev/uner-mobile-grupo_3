/**
 * Cliente HTTP único hacia la API de Reporte Ciudadano.
 * - Agrega el token (Authorization: Bearer) a cada pedido.
 * - Desenvuelve las respuestas `{ datos, meta }` y convierte los errores `{ error: { codigo, mensaje } }` en `ApiError`.
 * - Ante un 401 con sesión avisa (setUnauthorizedHandler) para cerrar la sesión.
 */

import { File } from "expo-file-system";
import { logDevError } from "@/helpers/log";

export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

const DEFAULT_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const MENSAJE_SIN_CONEXION = "No pudimos conectarnos con el servidor. Revisá tu conexión e intentá de nuevo.";
const MENSAJE_ERROR_GENERICO = "El servidor respondió con un error. Intentá de nuevo.";

export interface Meta {
  total: number;
  pagina: number;
  porPagina: number;
}

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

export class ApiError extends Error {
  codigo: string;
  status: number;

  constructor(mensaje: string, codigo: string, status: number) {
    super(mensaje);
    this.name = "ApiError";
    this.codigo = codigo;
    this.status = status;
  }
}

type TokenGetter = () => Promise<string | null>;

let tokenGetter: TokenGetter = async () => null;
let unauthorizedHandler: (() => void) | null = null;

/** Lo registra el servicio de auth: de dónde sale el token de la sesión. */
export const setTokenGetter = (getter: TokenGetter): void => {
  tokenGetter = getter;
};

/** Lo registra el AuthProvider: qué hacer cuando la API rechaza el token (401). */
export const setUnauthorizedHandler = (handler: (() => void) | null): void => {
  unauthorizedHandler = handler;
};

function buildQuery(query?: Query): string {
  if (!query) return "";
  const parts: string[] = [];
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

async function send<T>(
  path: string,
  init: { method: string; headers: Record<string, string>; body?: string | FormData },
  auth: boolean,
  timeoutMs: number,
): Promise<{ datos: T; meta: Meta | null }> {
  const headers = { ...init.headers };
  if (auth) {
    const token = await tokenGetter();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method,
      headers,
      body: init.body,
      signal: controller.signal,
    });
  } catch (error) {
    // Se registra el motivo real (sin respuesta o tiempo agotado) y a qué dirección se intentó llegar.
    const motivo = controller.signal.aborted ? "tiempo de espera agotado" : "sin respuesta del servidor";
    logDevError(`[api] ${init.method} ${API_BASE_URL}${path}: ${motivo}.`, error);
    throw new ApiError(MENSAJE_SIN_CONEXION, "SIN_CONEXION", 0);
  } finally {
    clearTimeout(timer);
  }

  let json: unknown = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }
  const cuerpo = (json ?? {}) as {
    datos?: unknown;
    meta?: Meta | null;
    error?: { codigo?: string; mensaje?: string };
  };

  if (!response.ok) {
    if (response.status === 401 && auth) unauthorizedHandler?.();
    throw new ApiError(
      cuerpo.error?.mensaje ?? MENSAJE_ERROR_GENERICO,
      cuerpo.error?.codigo ?? "ERROR_DEL_SERVIDOR",
      response.status,
    );
  }

  return { datos: cuerpo.datos as T, meta: cuerpo.meta ?? null };
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Query;
  body?: unknown;
  /** false para pedidos sin sesión (ingreso y registro). */
  auth?: boolean;
  timeoutMs?: number;
}

export function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<{ datos: T; meta: Meta | null }> {
  const { method = "GET", query, body, auth = true, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  return send<T>(
    `${path}${buildQuery(query)}`,
    { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined },
    auth,
    timeoutMs,
  );
}

/** Trae todas las páginas de un listado. */
export async function apiGetAll<T>(path: string, query: Query = {}, porPagina = 100): Promise<T[]> {
  const todos: T[] = [];
  for (let pagina = 1; ; pagina += 1) {
    const { datos, meta } = await apiRequest<T[]>(path, { query: { ...query, pagina, porPagina } });
    todos.push(...datos);
    if (datos.length === 0 || !meta || todos.length >= meta.total) return todos;
  }
}

/**
 * Sube un archivo local (foto o audio) con POST /archivos y devuelve su URL.
 * Si ya es una URL http(s) se devuelve tal cual: ya estaba subido.
 */
export async function uploadFile(uri: string): Promise<string> {
  if (/^https?:\/\//i.test(uri)) return uri;

  const file = new File(uri);
  if (!file.exists) {
    throw new ApiError(
      "El archivo no se encuentra en el dispositivo.",
      "ARCHIVO_NO_ENCONTRADO",
      400,
    );
  }

  // El fetch de Expo no acepta el objeto { uri, name, type } de React Native: el archivo se adjunta
  // como `File` de expo-file-system, que ya trae su nombre y su tipo (por la extensión).
  const form = new FormData();
  form.append("archivo", file as unknown as Blob);

  // Sin Content-Type: fetch lo arma solo, con el boundary del multipart.
  const { datos } = await send<{ url: string }>(
    "/archivos",
    { method: "POST", headers: { Accept: "application/json" }, body: form },
    true,
    UPLOAD_TIMEOUT_MS,
  );
  return datos.url;
}
