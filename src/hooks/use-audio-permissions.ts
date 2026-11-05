import { AudioModule } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppState,
  type AppStateStatus,
  PermissionsAndroid,
  Platform,
} from "react-native";

export interface AudioPermissionsState {
  permissionGranted: boolean | null;
  canAskPermission: boolean;
  permissionError: string | null;
}

export interface UseAudioPermissionsReturn extends AudioPermissionsState {
  requestPermission: () => Promise<boolean>;
  checkPermissions: () => Promise<boolean>;
}

async function queryPermissions(errorMessage: string): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  error: string | null;
}> {
  try {
    let { granted, canAskAgain } =
      await AudioModule.getRecordingPermissionsAsync();

    // En Android  el PermissionsService interno
    // puede quedar desincronizado con los permisos reales del sistema operativo.
    // Usamos PermissionsAndroid directo del sistema para corroborar.
    if (Platform.OS === "android" && !granted) {
      try {
        const hasNative = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        );
        if (hasNative) {
          granted = true;
          canAskAgain = true;
        }
      } catch {}
    }

    return { granted, canAskAgain, error: null };
  } catch {
    return { granted: false, canAskAgain: true, error: errorMessage };
  }
}

const initialPermissionAudioState: AudioPermissionsState = {
  permissionError: null,
  canAskPermission: true,
  permissionGranted: null,
};

export function useAudioPermissions(
  errorMessageCheck = "Error al verificar permisos del micrófono.",
  errorMessageRequest = "Error al solicitar permisos para el micrófono.",
): UseAudioPermissionsReturn {
  const [audioPermissionState, setAudioPermissionState] =
    useState<AudioPermissionsState>(initialPermissionAudioState);

  const isMountedRef = useRef<boolean>(true);
  const checkPermissions = useCallback(async () => {
    const { granted, error, canAskAgain } =
      await queryPermissions(errorMessageCheck);
    if (error) {
      if (isMountedRef.current) {
        setAudioPermissionState((prevState) => ({
          ...prevState,
          permissionError: error,
        }));
      }
      return false;
    }
    if (isMountedRef.current) {
      setAudioPermissionState({
        permissionError: null,
        canAskPermission: canAskAgain,
        permissionGranted: granted,
      });
    }
    return granted;
  }, [errorMessageCheck]);
  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        if (nextAppState === "active") {
          checkPermissions();
        }
      },
    );

    return () => {
      isMountedRef.current = false;
      subscription.remove();
    };
  }, [checkPermissions]);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { granted, canAskAgain } =
        await AudioModule.requestRecordingPermissionsAsync();
      setAudioPermissionState({
        permissionError: null,
        canAskPermission: canAskAgain,
        permissionGranted: granted,
      });
      return granted;
    } catch {
      setAudioPermissionState((prevState) => ({
        ...prevState,
        permissionError: errorMessageRequest,
      }));
      return false;
    }
  };

  return {
    ...audioPermissionState,
    requestPermission,
    checkPermissions,
  };
}
