import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkLocationPermissions,
  getCurrentLocation,
  requestLocationPermissions,
} from "../services/location";
import {
  Coordinates,
  LocationOptions,
  LocationResult,
  LocationState,
} from "../types";

export function useUserLocation(initialOptions?: LocationOptions) {
  const [state, setState] = useState<LocationState>({ status: "idle" });
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const initialFetchAddress = initialOptions?.fetchAddress;
  const initialHighAccuracy = initialOptions?.highAccuracy;

  const setSafeState = useCallback((nextState: LocationState) => {
    if (isMountedRef.current) {
      setState(nextState);
    }
  }, []);

  const requestLocation = useCallback(
    async (options?: LocationOptions): Promise<LocationResult | null> => {
      const config: LocationOptions = {
        fetchAddress: options?.fetchAddress ?? initialFetchAddress,
        highAccuracy: options?.highAccuracy ?? initialHighAccuracy,
      };

      try {
        setSafeState({ status: "requesting_permission" });
        const permissions = await checkLocationPermissions();

        if (!permissions.granted) {
          const requestResult = await requestLocationPermissions();
          if (!requestResult.granted) {
            setSafeState({
              status: "permission_denied",
              message: "Permiso de ubicación denegado por el usuario.",
              canAskAgain: requestResult.canAskAgain,
            });
            return null;
          }
        }

        setSafeState({ status: "fetching" });
        const result = await getCurrentLocation(config);

        setSafeState({
          status: "available",
          coordinates: result.coordinates,
          address: result.address,
          accuracy: result.accuracy,
          timestamp: result.timestamp,
        });

        return result;
      } catch (err: unknown) {
        if (err instanceof Error) {
          if (err.message === "SERVICES_DISABLED") {
            setSafeState({
              status: "services_disabled",
              message:
                "Los servicios de ubicación del dispositivo están desactivados.",
            });
            return null;
          }

          if (err.message === "PERMISSION_DENIED") {
            const canAskAgain =
              (err as Error & { canAskAgain?: boolean }).canAskAgain ?? true;
            setSafeState({
              status: "permission_denied",
              message: "Permiso de ubicación denegado por el usuario.",
              canAskAgain,
            });
            return null;
          }

          setSafeState({
            status: "error",
            message: err.message || "No se pudo obtener la ubicación.",
          });
          return null;
        }

        setSafeState({
          status: "error",
          message: "Ocurrió un error inesperado al obtener la ubicación.",
        });
        return null;
      }
    },
    [initialFetchAddress, initialHighAccuracy, setSafeState],
  );

  const clearLocation = useCallback(() => {
    setState({ status: "idle" });
  }, []);

  const coordinates: Coordinates | null =
    state.status === "available" ? state.coordinates : null;

  const address: string | null =
    state.status === "available" && state.address ? state.address : null;

  const isLoading =
    state.status === "requesting_permission" || state.status === "fetching";

  const isAvailable = state.status === "available";

  const hasError =
    state.status === "permission_denied" ||
    state.status === "services_disabled" ||
    state.status === "error";

  const errorMessage: string | null =
    "message" in state ? state.message : null;

  return {
    state,
    coordinates,
    address,
    isLoading,
    isAvailable,
    hasError,
    errorMessage,
    requestLocation,
    clearLocation,
  };
}
