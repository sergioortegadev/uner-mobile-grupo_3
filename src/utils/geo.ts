import type { Coordenadas, Coordinates } from "../types";

export type GeoPoint = Coordenadas | Coordinates;

const EARTH_RADIUS_METERS = 6_371_000;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Normaliza cualquier formato de coordenadas soportado (dominio Coordenadas o expo Coordinates)
 * a latitud y longitud numéricas.
 */
export function extractLatLng(point: GeoPoint): { lat: number; lng: number } {
  if ("latitud" in point) {
    return { lat: point.latitud, lng: point.longitud };
  }
  return { lat: point.latitude, lng: point.longitude };
}

/**
 * Calcula la distancia en metros entre dos puntos geográficos utilizando la fórmula de Haversine.
 * Acepta tanto Coordenadas (latitud/longitud) como Coordinates (latitude/longitude).
 */
export function calculateDistanceInMeters(origin: GeoPoint, destination: GeoPoint): number {
  const p1 = extractLatLng(origin);
  const p2 = extractLatLng(destination);

  const dLat = toRadians(p2.lat - p1.lat);
  const dLng = toRadians(p2.lng - p1.lng);

  const lat1 = toRadians(p1.lat);
  const lat2 = toRadians(p2.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  // Math.min protege contra imprecisiones de punto flotante que superen 1
  return Math.round(2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h))));
}

/**
 * Determina si dos coordenadas se encuentran dentro del radio especificado en metros.
 */
export function isWithinRadius(
  origin: GeoPoint,
  destination: GeoPoint,
  radiusMeters: number = 50
): boolean {
  return calculateDistanceInMeters(origin, destination) <= radiusMeters;
}
