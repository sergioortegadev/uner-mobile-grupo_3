import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { reportService } from "@/services/reports";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const EscanearScreen = () => {
  const router = useRouter();
  const [permiso, pedirPermiso] = useCameraPermissions();
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const procesando = useRef(false);
  useFocusEffect(
    useCallback(() => {
      procesando.current = false;
      setMensaje("");
      setCamaraActiva(true);
      return () => setCamaraActiva(false);
    }, []),
  );

  const manejarEscaneo = async ({ data }: { data: string }) => {
    if (procesando.current) return;
    procesando.current = true;

    const id = data.trim();
    setMensaje("Buscando reporte...");

    try {
      const reporte = await reportService.getReportById(id);

      if (reporte) {
        router.push(`/(operador)/reporte/${reporte.id}` as any);
      } else {
        setMensaje(`El QR leído ("${id}") no corresponde a ningún reporte.`);
      }
    } catch {
      setMensaje("Ocurrió un error al buscar el reporte. Intentá de nuevo.");
    }
  };

  const reintentar = () => {
    setMensaje("");
    procesando.current = false;
  };

  const renderContenido = () => {
    if (!permiso) {
      return <ActivityIndicator size="large" />;
    }

    if (!permiso.granted) {
      return (
        <View style={styles.centrado}>
          <ThemedText type="subtitle">
            Necesitamos acceso a la cámara
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            Para escanear el QR de un reporte tenés que permitir el uso de la
            cámara.
          </ThemedText>
          <Button title="Permitir cámara" onPress={pedirPermiso} />
        </View>
      );
    }

    return (
      <View style={styles.contenido}>
        <ThemedText themeColor="textSecondary">
          Apuntá la cámara al código QR del reporte.
        </ThemedText>

        <View style={styles.camaraContenedor}>
          {camaraActiva && (
            <CameraView
              style={styles.camara}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={manejarEscaneo}
            />
          )}
        </View>

        {mensaje !== "" && <ThemedText>{mensaje}</ThemedText>}

        {mensaje.startsWith("El QR") || mensaje.startsWith("Ocurrió") ? (
          <Button title="Escanear otro QR" onPress={reintentar} />
        ) : null}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <ThemedText type="subtitle" accessibilityRole="header">
            Escanear QR
          </ThemedText>
        </View>
        {renderContenido()}
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  contenido: { flex: 1, padding: Spacing.three, gap: Spacing.three },
  centrado: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.three,
    gap: Spacing.three,
  },
  camaraContenedor: {
    width: "100%",
    height: 360,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  camara: { flex: 1 },
});

export default EscanearScreen;
