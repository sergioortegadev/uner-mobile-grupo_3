import * as Location from "expo-location";
import {
  Coordinates,
  LocationOptions,
  LocationResult,
} from "../types/location";

export async function checkLocationPermissions(): Promise<Location.LocationPermissionResponse> {
  return Location.getForegroundPermissionsAsync();
}

export async function requestLocationPermissions(): Promise<Location.LocationPermissionResponse> {
  return Location.requestForegroundPermissionsAsync();
}

export async function isLocationServicesEnabled(): Promise<boolean> {
  try {
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

export async function reverseGeocodeCoordinates(
  coordinates: Coordinates,
): Promise<string | null> {
  try {
    let permissionResponse = await checkLocationPermissions();
    if (!permissionResponse.granted) {
      permissionResponse = await requestLocationPermissions();
    }
    if (!permissionResponse.granted) {
      return null;
    }

    const geocoded = await Location.reverseGeocodeAsync({
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    });

    if (!geocoded || geocoded.length === 0) {
      return null;
    }

    const firstResult = geocoded[0];
    const addressParts: string[] = [];

    if (firstResult.street) {
      if (firstResult.streetNumber) {
        addressParts.push(`${firstResult.street} ${firstResult.streetNumber}`);
      } else {
        addressParts.push(firstResult.street);
      }
    } else if (firstResult.name) {
      addressParts.push(firstResult.name);
    }

    if (firstResult.district) {
      addressParts.push(firstResult.district);
    } else if (firstResult.subregion) {
      addressParts.push(firstResult.subregion);
    }

    if (firstResult.city) {
      addressParts.push(firstResult.city);
    }

    return addressParts.length > 0 ? addressParts.join(", ") : null;
  } catch {
    return null;
  }
}

export async function getCurrentLocation(
  options?: LocationOptions,
): Promise<LocationResult> {
  const servicesEnabled = await isLocationServicesEnabled();
  if (!servicesEnabled) {
    throw new Error("SERVICES_DISABLED");
  }

  let permissionResponse = await checkLocationPermissions();
  if (!permissionResponse.granted) {
    permissionResponse = await requestLocationPermissions();
  }

  if (!permissionResponse.granted) {
    const permissionError = new Error("PERMISSION_DENIED");
    (permissionError as Error & { canAskAgain?: boolean }).canAskAgain =
      permissionResponse.canAskAgain;
    throw permissionError;
  }

  const accuracy = options?.highAccuracy
    ? Location.Accuracy.High
    : Location.Accuracy.Balanced;

  const { coords, timestamp } = await Location.getCurrentPositionAsync({
    accuracy,
  });
  const { latitude, longitude } = coords;
  const coordinates: Coordinates = { latitude, longitude };

  let address: string | undefined;
  if (options?.fetchAddress) {
    const resolvedAddress = await reverseGeocodeCoordinates(coordinates);
    if (resolvedAddress) {
      address = resolvedAddress;
    }
  }

  return {
    coordinates,
    address,
    accuracy: coords.accuracy ?? undefined,
    timestamp,
  };
}
