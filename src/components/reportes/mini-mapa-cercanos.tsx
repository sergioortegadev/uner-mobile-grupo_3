import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import OsmMap, { type MapMarker } from "@/components/OsmMap";
import { ThemedText } from "@/components/themed-text";
import { coloresOficiales } from "@/constants/theme";
import { useNetworkStatus } from "@/hooks/use-network-status";
import type { Coordenadas, EstadoReporte, Reporte } from "@/types";

export interface NearbyMiniMapProps {
  userCoordinates: Coordenadas;
  reports: (Reporte & { distanciaMetros?: number })[];
  radiusMeters?: number;
}

export type MiniMapDisplayState =
  | { readonly status: "checking" }
  | { readonly status: "offline" }
  | { readonly status: "loading" }
  | { readonly status: "ready" }
  | { readonly status: "error"; readonly reason: string };

const DEFAULT_RADIUS_METERS = 50;
export const NEARBY_MAP_ZOOM = 17;

const COLOR_BY_STATUS: Record<EstadoReporte, string> = {
  recibido: coloresOficiales.recibido,
  en_revision: coloresOficiales.enRevision,
  asignado: coloresOficiales.asignado,
  resuelto: coloresOficiales.resuelto,
  rechazado: coloresOficiales.rechazado,
};

export function toNearbyMapMarkers(
  reports: (Reporte & { distanciaMetros?: number })[],
): MapMarker[] {
  return reports.map((report, index) => ({
    id: report.id || `marker-${index}`,
    latitud: report.coordenadas.latitud,
    longitud: report.coordenadas.longitud,
    color: COLOR_BY_STATUS[report.estado] || coloresOficiales.primario,
    titulo: report.direccion || "Reporte cercano",
    detalle:
      typeof report.distanciaMetros === "number"
        ? `A ${Math.round(report.distanciaMetros)} m`
        : undefined,
  }));
}

function SchematicRadarFallback({
  userCoordinates,
  reports,
  badgeText,
}: {
  userCoordinates: Coordenadas;
  reports: (Reporte & { distanciaMetros?: number })[];
  badgeText: string | null;
}) {
  const METERS_RANGE = 65;
  const METERS_PER_DEGREE_LAT = 110900;
  const METERS_PER_DEGREE_LON =
    111320 * Math.cos((userCoordinates.latitud * Math.PI) / 180);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={[styles.horizontalStreet, { top: "30%" }]} />
      <View style={[styles.horizontalStreet, { top: "68%" }]} />
      <View style={[styles.verticalStreet, { left: "45%" }]} />
      <View style={[styles.verticalStreet, { left: "72%" }]} />

      {reports.map((report, index) => {
        const deltaLatMeters =
          (report.coordenadas.latitud - userCoordinates.latitud) *
          METERS_PER_DEGREE_LAT;
        const deltaLonMeters =
          (report.coordenadas.longitud - userCoordinates.longitud) *
          METERS_PER_DEGREE_LON;

        let percentX = 50 + (deltaLonMeters / METERS_RANGE) * 38;
        let percentY = 50 - (deltaLatMeters / METERS_RANGE) * 38;

        percentX = Math.max(14, Math.min(86, percentX));
        percentY = Math.max(16, Math.min(84, percentY));

        const color =
          COLOR_BY_STATUS[report.estado] || coloresOficiales.primario;
        const isAssigned = report.estado === "asignado";

        return (
          <View
            key={report.id || `marker-${index}`}
            style={[
              styles.markerWrapper,
              {
                left: `${percentX}%`,
                top: `${percentY}%`,
              },
            ]}
          >
            {isAssigned ? (
              <View style={[styles.diamondMarker, { backgroundColor: color }]}>
                <View style={styles.innerDot} />
              </View>
            ) : (
              <View style={[styles.circleMarker, { backgroundColor: color }]}>
                <View style={styles.innerDot} />
              </View>
            )}
          </View>
        );
      })}

      <View style={styles.userMarkerContainer}>
        <View style={styles.userHalo} />
        <View style={styles.userDot} />
      </View>

      {badgeText ? (
        <View style={styles.badgeContainer}>
          <ThemedText style={styles.badgeText} accessibilityRole="text">
            {badgeText}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

export const NearbyMiniMap = ({
  userCoordinates,
  reports,
  radiusMeters = DEFAULT_RADIUS_METERS,
}: NearbyMiniMapProps) => {
  const { isOnline, isChecking } = useNetworkStatus();
  const attemptKey = `${isOnline}:${userCoordinates.latitud}:${userCoordinates.longitud}`;
  const [settledState, setSettledState] = useState<{
    readonly key: string;
    readonly outcome: { readonly status: "ready" } | { readonly status: "error"; readonly reason: string };
  } | null>(null);

  const currentOutcome =
    settledState?.key === attemptKey ? settledState.outcome : null;

  const displayState: MiniMapDisplayState = useMemo(() => {
    if (isChecking) return { status: "checking" };
    if (!isOnline) return { status: "offline" };
    if (currentOutcome) return currentOutcome;
    return { status: "loading" };
  }, [isChecking, isOnline, currentOutcome]);

  const handleMapReady = useCallback(() => {
    setSettledState({
      key: attemptKey,
      outcome: { status: "ready" },
    });
  }, [attemptKey]);

  const handleMapError = useCallback(
    (reason: string) => {
      setSettledState({
        key: attemptKey,
        outcome: { status: "error", reason },
      });
    },
    [attemptKey],
  );

  const markers = useMemo(() => toNearbyMapMarkers(reports), [reports]);

  const badgeText = useMemo(() => {
    if (
      displayState.status === "checking" ||
      displayState.status === "loading"
    ) {
      return "Cargando mapa...";
    }
    if (displayState.status === "offline" || displayState.status === "error") {
      return "Sin conexión · Mapa esquemático";
    }
    return null;
  }, [displayState.status]);

  return (
    <View
      style={styles.container}
      accessibilityLabel="Vista previa de mapa con reportes cercanos"
    >
      <SchematicRadarFallback
        userCoordinates={userCoordinates}
        reports={reports}
        badgeText={badgeText}
      />

      {isOnline && !isChecking && displayState.status !== "error" ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { opacity: displayState.status === "ready" ? 1 : 0 },
          ]}
          pointerEvents="none"
        >
          <OsmMap
            markers={markers}
            center={userCoordinates}
            zoom={NEARBY_MAP_ZOOM}
            interactive={false}
            zoomControl={false}
            userLocation={{
              latitud: userCoordinates.latitud,
              longitud: userCoordinates.longitud,
              radiusMeters,
            }}
            onReady={handleMapReady}
            onError={handleMapError}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 192,
    borderRadius: 16,
    backgroundColor: "#DFECE5",
    borderWidth: 1,
    borderColor: "#D3DCE0",
    overflow: "hidden",
    position: "relative",
    marginVertical: 14,
  },
  horizontalStreet: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#FFFFFF",
  },
  verticalStreet: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 18,
    backgroundColor: "#FFFFFF",
  },
  userMarkerContainer: {
    position: "absolute",
    left: "48%",
    top: "48%",
    transform: [{ translateX: -17 }, { translateY: -17 }],
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  userHalo: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(35, 115, 244, 0.28)",
  },
  userDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: coloresOficiales.primario,
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
  },
  markerWrapper: {
    position: "absolute",
    transform: [{ translateX: -12 }, { translateY: -12 }],
    zIndex: 5,
  },
  diamondMarker: {
    width: 22,
    height: 22,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  circleMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  innerDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  badgeContainer: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(15, 23, 42, 0.72)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 20,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
});
