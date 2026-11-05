import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import LocationPickerModal from "@/components/reporte/location-picker-modal";
import PhotoSelector from "@/components/reporte/photo-selector";
import { TypeSelector } from "@/components/reporte/type-selector";
import {
  DescriptionField,
  type DescriptionValue,
} from "@/components/reporte/description-field";
import {
  PendingReportModal,
  type PendingReportSummary,
} from "@/components/reporte/pending-report-modal";
import { Button } from "@/components/ui/button";
import { ESTADOS_ABIERTOS } from "@/constants/colores-estado";
import { Spacing } from "@/constants/theme";
import { NEARBY_RADIUS_METERS } from "@/components/reportes/verificar-cercanos-screen";
import { takeNearbyDecision } from "@/helpers/nearby-decision";
import { useReportTypes } from "@/hooks/use-report-types";
import { useTheme } from "@/hooks/use-theme";
import { useUserLocation } from "@/hooks/use-user-location";
import { reverseGeocodeCoordinates } from "@/services/location";
import { vibrar } from "@/services/haptics";
import { sendReport } from "@/services/report-sending";
import type { ReportFieldErrors } from "@/services/report-sending/types";
import { reportService } from "@/services/reports";
import type { Coordenadas, Foto } from "@/types";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Alert, ScrollView, StyleSheet, View } from "react-native";
import {  useSafeAreaInsets } from "react-native-safe-area-context";

const Section = ({
  title,
  note,
  error,
  children,
}: {
  title: string;
  note?: string;
  error?: string | null;
  children: ReactNode;
}) => {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle} accessibilityRole="header">
        {title}{" "}
        {note && (
          <ThemedText type="small" themeColor="textSecondary">
            {note}
          </ThemedText>
        )}
      </ThemedText>
      {children}
      {error && (
        <ThemedText
          type="smallBold"
          themeColor="danger"
          accessibilityRole="alert"
        >
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
};

/**
 * M04: ¿hay un reclamo abierto del mismo tipo a menos de 50 m?
 * Si no se puede consultar (por ejemplo, sin conexión), se sigue con el envío.
 */
const hayReportesCercanos = async (
  coordenadas: Coordenadas,
  tipoId: string,
): Promise<boolean> => {
  try {
    const cercanos = await reportService.getNearbyReports(
      coordenadas,
      NEARBY_RADIUS_METERS,
      tipoId,
    );
    return cercanos.some((r) => ESTADOS_ABIERTOS.includes(r.estado));
  } catch {
    return false;
  }
};

const ReportarScreen = () => {
  const params = useLocalSearchParams<{
    latitud?: string;
    longitud?: string;
    direccion?: string;
    zonaId?: string;
    tipoId?: string;
  }>();

  const theme = useTheme();
  const { reportTypes } = useReportTypes();
  const {
    requestLocation,
    isLoading: locating,
    errorMessage: locationError,
  } = useUserLocation();

  const safeAreaInsets = useSafeAreaInsets();

  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(
    params.tipoId ?? null,
  );
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [descripcionValue, setDescripcionValue] = useState<DescriptionValue>({
    descripcion: null,
    audioUrl: null,
  });
  const [coordenadas, setCoordenadas] = useState<Coordenadas | null>(() => {
    if (params.latitud && params.longitud) {
      const lat = parseFloat(params.latitud);
      const lng = parseFloat(params.longitud);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitud: lat, longitud: lng };
      }
    }
    return null;
  });
  const [direccion, setDireccion] = useState<string>(params.direccion ?? "");
  const zonaId = params.zonaId ?? "";
  const [fieldErrors, setFieldErrors] = useState<ReportFieldErrors>({});
  const [isSending, setIsSending] = useState(false);
  const [pendingSummary, setPendingSummary] =
    useState<PendingReportSummary | null>(null);

  const [mapVisible, setMapVisible] = useState(false);

  const confirmMapLocation = async (nuevas: Coordenadas) => {
    setMapVisible(false);
    setCoordenadas(nuevas);
    setDireccion(""); // mientras se busca la nueva dirección
    if (fieldErrors.coordenadas) {
      setFieldErrors((prev) => ({ ...prev, coordenadas: undefined }));
    }
    const nuevaDireccion = await reverseGeocodeCoordinates({
      latitude: nuevas.latitud,
      longitude: nuevas.longitud,
    });
    setDireccion(nuevaDireccion ?? "");
  };

  const resetForm = () => {
    setSelectedTypeId(null);
    setFotos([]);
    setDescripcionValue({ descripcion: null, audioUrl: null });
    setCoordenadas(null);
    setDireccion("");
    setFieldErrors({});
  };

  const handleSendReport = async (omitirCercanos = false) => {
    if (isSending) return;

    setIsSending(true);
    setFieldErrors({});

    try {
      // M04: si hay un reclamo abierto del mismo tipo a menos de 50 m,
      // se muestra la pantalla de cercanos antes de enviar.
      if (!omitirCercanos && selectedTypeId && coordenadas) {
        const hayCercanos = await hayReportesCercanos(
          coordenadas,
          selectedTypeId,
        );
        if (hayCercanos) {
          vibrar("reporteCercano");
          router.push({
            pathname: "/(vecino)/reportar/cercanos",
            params: {
              latitud: String(coordenadas.latitud),
              longitud: String(coordenadas.longitud),
              tipoId: selectedTypeId,
            },
          });
          return;
        }
      }

      const result = await sendReport({
        tipoId: selectedTypeId,
        fotos,
        audioUrl: descripcionValue.audioUrl,
        descripcion: descripcionValue.descripcion,
        coordenadas,
        direccion,
        zonaId,
      });

      switch (result.status) {
        case "invalido": {
          setFieldErrors(result.errors);
          if (result.errors.autorId) {
            Alert.alert("Sesión requerida", result.errors.autorId);
          }
          return;
        }

        case "rechazado": {
          setFieldErrors(result.errors);
          Alert.alert("No se pudo enviar el reporte", result.mensaje);
          return;
        }

        case "enviado": {
          vibrar("envioConfirmado");
          Alert.alert(
            "¡Reporte enviado!",
            `Número de seguimiento:\n\n${result.codigo}\n\nTu reporte ha sido confirmado por el municipio.`,
            [{ text: "Aceptar" }],
          );

          resetForm();
          return;
        }

        case "pendiente": {
          vibrar("envioConfirmado");
          const tipoSeleccionado = reportTypes.find(
            (t) => t.id === selectedTypeId,
          );

          setPendingSummary({
            codigo: result.codigo,
            tipoNombre: tipoSeleccionado?.nombre ?? "Reporte",
            direccion:
              result.reporte.reporte.direccion || "Ubicación seleccionada",
            fotoUri: result.reporte.payload.fotos[0]?.url || null,
          });

          resetForm();
          return;
        }

        default: {
          const estadoNoContemplado: never = result;
          throw new Error(
            `Estado de envío no contemplado: ${String(estadoNoContemplado)}`,
          );
        }
      }
    } catch {
      Alert.alert(
        "Error inesperado",
        "No se pudo completar el envío del reporte. Intentá nuevamente.",
      );
    } finally {
      setIsSending(false);
    }
  };

  // M04: al volver de la pantalla de cercanos se atiende lo que decidió el vecino.
  // Las acciones se guardan en una ref para usar siempre los datos más nuevos del formulario.
  const accionesRef = useRef({ enviar: handleSendReport, limpiar: resetForm });
  useEffect(() => {
    accionesRef.current = { enviar: handleSendReport, limpiar: resetForm };
  });

  useFocusEffect(
    useCallback(() => {
      const decision = takeNearbyDecision();
      if (decision === "adherido") {
        accionesRef.current.limpiar();
      } else if (decision === "continuar") {
        void accionesRef.current.enviar(true);
      }
    }, []),
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
      <ScrollView contentContainerStyle={styles.content}>
          <Section title="Nuevo Reporte: ¿Qué pasa?" error={fieldErrors.tipoId}>
            <TypeSelector
              types={reportTypes}
              selectedTypeId={selectedTypeId}
              onSelect={(id) => {
                setSelectedTypeId(id);
                if (fieldErrors.tipoId) {
                  setFieldErrors((prev) => ({ ...prev, tipoId: undefined }));
                }
              }}
            />
          </Section>

          <Section title="Foto" note="(obligatoria)" error={fieldErrors.fotos}>
            <PhotoSelector
              photos={fotos}
              onChangePhotos={(nextFotos) => {
                setFotos(nextFotos);
                if (fieldErrors.fotos) {
                  setFieldErrors((prev) => ({ ...prev, fotos: undefined }));
                }
              }}
            />
          </Section>

          <Section
            title="¿Dónde?"
            error={
              fieldErrors.coordenadas ?? (coordenadas ? null : locationError)
            }
          >
            {coordenadas ? (
              <View style={[styles.placeholder, { borderColor: theme.border }]}>
                <ThemedText type="smallBold">
                  📍 {direccion || "Ubicación seleccionada"}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  Lat: {coordenadas.latitud.toFixed(5)}, Lon:{" "}
                  {coordenadas.longitud.toFixed(5)}
                </ThemedText>
                <Button
                  title="Corregir en el mapa"
                  variant="contorno"
                  size="mediano"
                  style={styles.locationButton}
                  onPress={() => setMapVisible(true)}
                />
              </View>
            ) : (
              <View style={[styles.placeholder, { borderColor: theme.border }]}>
                <Button
                  title="Detectar ubicación actual"
                  variant="contorno"
                  size="mediano"
                  style={styles.locationButton}
                  loading={locating}
                  disabled={locating}
                  onPress={async () => {
                    const loc = await requestLocation({ fetchAddress: true });
                    if (loc?.coordinates) {
                      setCoordenadas({
                        latitud: loc.coordinates.latitude,
                        longitud: loc.coordinates.longitude,
                      });
                      if (loc.address) setDireccion(loc.address);
                      if (fieldErrors.coordenadas) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          coordenadas: undefined,
                        }));
                      }
                    }
                  }}
                />
                <Button
                  title="Marcar en el mapa"
                  variant="texto"
                  size="mediano"
                  style={styles.locationButton}
                  disabled={locating}
                  onPress={() => setMapVisible(true)}
                />
              </View>
            )}
          </Section>

          <Section
            title="Contanos"
            note="(opcional)"
            error={fieldErrors.descripcion}
          >
            <DescriptionField
              value={descripcionValue}
              onChange={(next) => {
                setDescripcionValue(next);
                if (fieldErrors.descripcion) {
                  setFieldErrors((prev) => ({
                    ...prev,
                    descripcion: undefined,
                  }));
                }
              }}
            />
          </Section>
      </ScrollView>
      <View
        style={[styles.enviar, { backgroundColor: theme.backgroundElement }]}
      >
        <Button
          title={isSending ? "Enviando reporte..." : "Enviar reporte"}
          variant="accion"
          onPress={() => handleSendReport()}
          disabled={isSending}
          loading={isSending}
        />
      </View>
      <LocationPickerModal
        key={mapVisible ? "mapa-abierto" : "mapa-cerrado"}
        visible={mapVisible}
        initialCoordinates={coordenadas}
        onConfirm={confirmMapLocation}
        onCancel={() => setMapVisible(false)}
      />
      <PendingReportModal
        key={pendingSummary?.codigo}
        data={pendingSummary}
        onGoToMap={() => {
          setPendingSummary(null);
          router.navigate("/(vecino)");
        }}
        onGoToMyReports={() => {
          setPendingSummary(null);
          router.navigate("/(vecino)/mis-reportes");
        }}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    paddingTop: 0,
  },
  section: {
    paddingBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    paddingVertical: Spacing.two,
  },
  placeholder: {
    padding: Spacing.three,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
  },
  locationButton: {
    marginTop: 8,
  },
  enviar: {
    padding: Spacing.three,
    borderTopWidth: 1,
  },
});

export default ReportarScreen;
