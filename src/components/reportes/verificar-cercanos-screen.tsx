import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Coordenadas, Reporte } from "@/types";
import { REPORT_TYPES } from "@/constants/report-types-static";
import { getTypeName } from "@/utils/report-format";
import { reportService } from "@/services/reports";
import { calculateDistanceInMeters } from "@/utils/geo";
import { coloresOficiales } from "@/constants/theme";
import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "@/components/ui/state-views";
import { NearbyMiniMap } from "./mini-mapa-cercanos";
import {
  NearbyCardActionStatus,
  NearbyReportCard,
  NearbyReportItem,
} from "./reporte-cercano-card";
import { useAuth } from "@/context/auth-context";
import { logDevError } from "@/helpers/log";

export const NEARBY_RADIUS_METERS = 50;

export interface CheckNearbyReportsScreenProps {
  coordinates?: Coordenadas;
  userCoordinates?: Coordenadas;
  typeId: Reporte["tipoId"];
  onBack?: () => void;
  onContinueNew?: () => void;
  onAdhereSuccess?: (report: Reporte) => void;
}

export const CheckNearbyReportsScreen = ({
  coordinates,
  userCoordinates: propUserCoordinates,
  typeId,
  onBack,
  onContinueNew,
  onAdhereSuccess,
}: CheckNearbyReportsScreenProps) => {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const userCoordinates = propUserCoordinates ?? coordinates;
  if (!userCoordinates) {
    throw new Error("CheckNearbyReportsScreen requiere 'coordinates' o 'userCoordinates'");
  }
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nearbyItems, setNearbyItems] = useState<NearbyReportItem[]>([]);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [adheredReportId, setAdheredReportId] = useState<string | null>(null);
  const [adheringReportId, setAdheringReportId] = useState<string | null>(null);

  const isExecutingAdhesionRef = useRef(false);

  useEffect(() => {
    let ignore = false;

    const fetchReports = async () => {
      try {
        const reports = await reportService.getNearbyReports(
          userCoordinates,
          NEARBY_RADIUS_METERS,
          typeId,
        );

        if (ignore) return;

        const mappedItems: NearbyReportItem[] = reports.map((report) => ({
          report,
          distanceMeters: calculateDistanceInMeters(
            userCoordinates,
            report.coordenadas,
          ),
          typeName: getTypeName(REPORT_TYPES, report.tipoId),
        }));

        setNearbyItems(mappedItems);
      } catch (err: unknown) {
        if (ignore) return;
          logDevError(
            "[CheckNearbyReportsScreen] Error al cargar reportes:",
            err,
          );
        setErrorMessage(
          "No pudimos cargar los reportes cercanos. Por favor, verifica tu conexión e intenta nuevamente.",
        );
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    fetchReports();

    return () => {
      ignore = true;
    };
  }, [userCoordinates, typeId, reloadTrigger]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadTrigger((count) => count + 1);
  }, []);

  const mapReports = useMemo(
    () =>
      nearbyItems.map((it) => ({
        ...it.report,
        distanciaMetros: it.distanceMeters,
      })),
    [nearbyItems],
  );

  const handleExecuteAdhesion = useCallback(
    async (item: NearbyReportItem) => {
      if (isExecutingAdhesionRef.current) return;
      isExecutingAdhesionRef.current = true;

      const reportId = item.report.id;
      try {
        setAdheringReportId(reportId);
        const updatedReport = await reportService.addAdhesion(reportId);

        setAdheredReportId(reportId);

        setNearbyItems((previous) =>
          previous.map((it) =>
            it.report.id === reportId ? { ...it, report: updatedReport } : it,
          ),
        );

        const message = `Te has sumado al reporte en ${updatedReport.direccion}.`;

        Alert.alert(
          "¡Adhesión registrada!",
          message,
          [
            {
              text: "Entendido",
              onPress: () => onAdhereSuccess?.(updatedReport),
            },
          ],
          {
            cancelable: false,
            onDismiss: () => onAdhereSuccess?.(updatedReport),
          },
        );
      } catch (error) {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "No se pudo registrar tu adhesión. Intenta nuevamente.";
        Alert.alert("Error", message);
      } finally {
        isExecutingAdhesionRef.current = false;
        setAdheringReportId(null);
      }
    },
    [onAdhereSuccess],
  );

  const handleSelectReportToAdhere = useCallback(
    (item: NearbyReportItem) => {
      const isOwnReport = Boolean(
        currentUserId && item.report.autorId === currentUserId,
      );
      if (
        isOwnReport ||
        adheredReportId !== null ||
        adheringReportId !== null ||
        isExecutingAdhesionRef.current
      ) {
        return;
      }

      Alert.alert(
        "Confirmar adhesión",
        `¿Deseas sumarte al reporte de ${item.typeName.toLowerCase()} en ${item.report.direccion}?`,
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Confirmar",
            onPress: () => {
              void handleExecuteAdhesion(item);
            },
          },
        ],
      );
    },
    [currentUserId, adheredReportId, adheringReportId, handleExecuteAdhesion],
  );

  const handleRenderItem = useCallback(
    ({ item }: { item: NearbyReportItem }) => {
      const reportId = item.report.id;
      const isOwnReport = Boolean(
        currentUserId && item.report.autorId === currentUserId,
      );
      const actionStatus: NearbyCardActionStatus = isOwnReport
        ? "own_report"
        : adheringReportId === reportId
          ? "adhering"
          : adheredReportId === reportId
            ? "adhered"
            : "available";
      const isInteractionDisabled =
        isOwnReport || adheredReportId !== null || adheringReportId !== null;
      return (
        <NearbyReportCard
          item={item}
          actionStatus={actionStatus}
          disabled={isInteractionDisabled}
          onAdhere={handleSelectReportToAdhere}
        />
      );
    },
    [currentUserId, adheredReportId, adheringReportId, handleSelectReportToAdhere],
  );

  return (
    <View style={styles.container}>
      {/* Cabecera azul */}
      <View style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            {onBack ? (
              <Pressable
                onPress={onBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Volver atrás"
                hitSlop={8}
              >
                <Icon name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.backButtonPlaceholder} />
            )}

            <ThemedText style={styles.headerTitle} numberOfLines={1}>
              ¿Es el mismo problema?
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>

      {/* Contenido principal */}
      <View style={styles.content}>
        {isLoading ? (
          <LoadingState message={`Buscando reportes en ${NEARBY_RADIUS_METERS} metros...`} />
        ) : errorMessage ? (
          <ErrorState message={errorMessage} onRetry={handleRetry} />
        ) : (
          <FlatList
            data={nearbyItems}
            keyExtractor={(item) => item.report.id}
            contentContainerStyle={styles.listContent}
            ListHeaderComponent={
              <View>
                <ThemedText style={styles.subtitle}>
                  Ya hay reportes a menos de {NEARBY_RADIUS_METERS} m de donde estás.
                </ThemedText>

                <NearbyMiniMap
                  userCoordinates={userCoordinates}
                  reports={mapReports}
                  radiusMeters={NEARBY_RADIUS_METERS}
                />
              </View>
            }
            renderItem={handleRenderItem}
            ListEmptyComponent={
              <EmptyState message={`No se encontraron otros reportes cercanos a menos de ${NEARBY_RADIUS_METERS} metros.`} />
            }
          />
        )}
      </View>

      {/* Botón inferior fijo */}
      <SafeAreaView edges={["bottom"]} style={styles.footerSafeArea}>
        <View style={styles.footerContainer}>
          <Button
            title="No es ninguno, seguir"
            variant="contorno"
            size="grande"
            onPress={onContinueNew}
          />
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: coloresOficiales.primario,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonPlaceholder: {
    width: 8,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    marginBottom: 4,
    lineHeight: 22,
  },
  footerSafeArea: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  footerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
