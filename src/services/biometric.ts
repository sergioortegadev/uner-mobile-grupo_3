import * as LocalAuthentication from "expo-local-authentication";

/** Hay sensor biométrico y al menos una huella/rostro registrado en el dispositivo. */
export const isBiometricAvailable = async (): Promise<boolean> => {
  try {
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hardware && enrolled;
  } catch {
    return false;
  }
};

/**
 * Pide la biometría del dispositivo (huella en Android). Se acepta el PIN/patrón
 * del dispositivo como respaldo (disableDeviceFallback: false).
 */
export const authenticateBiometric = async (): Promise<boolean> => {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Ingresá a Reporte Ciudadano",
      cancelLabel: "Cancelar",
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
};
