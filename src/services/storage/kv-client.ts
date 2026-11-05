import AsyncStorage from 'expo-sqlite/kv-store';


/**
 * Error de lectura para un valor guardado que no se pudo interpretar.
 */
export class StorageReadError extends Error {
  readonly key: string;
  readonly raw: string;

  constructor(key: string, raw: string) {
    super(`No se pudo leer el valor guardado en "${key}".`);
    this.name = 'StorageReadError';
    this.key = key;
    this.raw = raw;
  }
}

export const kvStorage = {
  /**
   * Obtiene y parsea un valor almacenado.
   * Lanza StorageReadError si el contenido guardado no es JSON válido.
   */
  async getItem<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItemAsync(key);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new StorageReadError(key, raw);
    }
  },

  /**
   * Serializa y almacena un valor.
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);
    await AsyncStorage.setItemAsync(key, serialized);
  },

  /**
   * Elimina una clave del almacenamiento.
   */
  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItemAsync(key);
  },

  /**
   * Limpia todas las claves del almacenamiento.
   */
  async clear(): Promise<void> {
    await AsyncStorage.clearAsync();
  },

  /**
   * Obtiene todas las claves almacenadas.
   */
  async getAllKeys(): Promise<string[]> {
    return AsyncStorage.getAllKeysAsync();
  },
};
