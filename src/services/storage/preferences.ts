import { kvStorage } from './kv-client';

/**
 * Preferencias de usuario persistidas localmente (A08, tercer nivel de almacenamiento).
 * Datos livianos y no sensibles: nunca guardar tokens ni contraseñas aquí.
 */
export interface UserPreferences {
  notificacionesActivas: boolean;
  avisosCambioEstado: boolean;
  avisosCercanos: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  notificacionesActivas: true,
  avisosCambioEstado: true,
  avisosCercanos: true,
};

const PREFERENCES_KEY = 'user.preferences';

export async function getPreferences(): Promise<UserPreferences> {
  try {
    const stored = await kvStorage.getItem<Partial<UserPreferences>>(PREFERENCES_KEY);
    return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function updatePreferences(
  patch: Partial<UserPreferences>
): Promise<UserPreferences> {
  const next = { ...(await getPreferences()), ...patch };
  await kvStorage.setItem(PREFERENCES_KEY, next);
  return next;
}

export async function clearPreferences(): Promise<void> {
  await kvStorage.removeItem(PREFERENCES_KEY);
}
