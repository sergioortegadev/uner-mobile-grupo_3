import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { kvStorage } from "./kv-client";

/**
 * SecureStore no está disponible en web: ahí se usa el almacenamiento común como alternativa.
 * Las claves de SecureStore solo admiten letras, números, ".", "-" y "_".
 */
const usaSecureStore = Platform.OS !== "web";

export const secureStorage = {
  /**
   * Obtiene y parsea un valor guardado de forma segura.
   */
  async getItem<T>(key: string): Promise<T | null> {
    if (!usaSecureStore) {
      return kvStorage.getItem<T>(key);
    }
    try {
      const raw = await SecureStore.getItemAsync(key);
      if (raw === null) {
        return null;
      }
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Serializa y guarda un valor de forma segura.
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    if (!usaSecureStore) {
      await kvStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, JSON.stringify(value));
  },

  /**
   * Elimina una clave del almacenamiento seguro.
   */
  async removeItem(key: string): Promise<void> {
    if (!usaSecureStore) {
      await kvStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
