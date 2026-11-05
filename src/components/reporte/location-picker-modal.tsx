import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Button } from "@/components/ui/button";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Coordenadas } from "@/types";
import { useMemo, useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";

const DEFAULT_CENTER: Coordenadas = { latitud: -33.0094, longitud: -58.5172 };

const buildMapHtml = (start: Coordenadas) => `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html, body, #map { height: 100%; margin: 0; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    var start = [${start.latitud}, ${start.longitud}];
    var map = L.map("map").setView(start, 16);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(map);

    var marker = L.marker(start, { draggable: true }).addTo(map);

    function send(latlng) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ lat: latlng.lat, lng: latlng.lng }));
    }

    // Tocar el mapa: mueve el pin ahí.
    map.on("click", function (e) {
      marker.setLatLng(e.latlng);
      send(e.latlng);
    });

    // Arrastrar el pin: al soltarlo, avisa la nueva posición.
    marker.on("dragend", function () {
      send(marker.getLatLng());
    });
  </script>
</body>
</html>`;

export interface LocationPickerModalProps {
    visible: boolean; //si el mapa esta abierto
    initialCoordinates: Coordenadas | null;
    onConfirm: (coordinates: Coordenadas) => void; //devuelve las coordenadas seleccionadas
    onCancel: () => void; //cierra el modal sin seleccionar coordenadas
}

//V05 - corregir a mano la ubicacion, muestra el mapa con el punto y permite moverlo para seleccionar la ubicación exacta.

const LocationPickerModal = ({ visible, initialCoordinates, onConfirm, onCancel }: LocationPickerModalProps) => {
    const theme = useTheme();
    const initialLat = initialCoordinates?.latitud ?? DEFAULT_CENTER.latitud;
    const initialLng = initialCoordinates?.longitud ?? DEFAULT_CENTER.longitud;
    const [selected, setSelected] = useState<Coordenadas>({
        latitud: initialLat,
        longitud: initialLng,
    });

    const mapHtml = useMemo(
        () => buildMapHtml({ latitud: initialLat, longitud: initialLng }),
        [initialLat, initialLng],
    );

    const handleMessage = (event: WebViewMessageEvent) => {
        try {
            const punto: { lat: number; lng: number } = JSON.parse(event.nativeEvent.data);
            setSelected({ latitud: punto.lat, longitud: punto.lng });
        } catch {
        }
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
            <ThemedView style={styles.container}>
                <SafeAreaView style={styles.container}>
                    <View style={styles.header}>
                        <ThemedText type="subtitle">¿Dónde está el problema?</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                            Tocá el mapa o arrastrá el pin hasta el lugar exacto.
                        </ThemedText>
                    </View>

                    <WebView
                        style={styles.map}
                        originWhitelist={["*"]}
                        source={{ html: mapHtml, baseUrl: "https://localhost" }}
                        onMessage={handleMessage}
                    />

                    <View style={[styles.footer, { borderTopColor: theme.border }]}>
                        <ThemedText type="small" themeColor="textSecondary">
                            Lat: {selected.latitud.toFixed(5)}, Lon: {selected.longitud.toFixed(5)}
                        </ThemedText>
                        <View style={styles.buttonsRow}>
                            <Button
                                title="Cancelar"
                                variant="contorno"
                                onPress={onCancel}
                                style={styles.button}
                            />
                            <Button
                                title="Confirmar"
                                variant="primario"
                                onPress={() => onConfirm(selected)}
                                style={styles.button}
                            />
                        </View>
                    </View>
                </SafeAreaView>
            </ThemedView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.three,
        gap: Spacing.one,
    },
    map: {
        flex: 1,
    },
    footer: {
        padding: Spacing.three,
        gap: Spacing.two,
        borderTopWidth: 1,
    },
    buttonsRow: {
        flexDirection: "row",
        gap: Spacing.two,
    },
    button: {
        flex: 1,
    },
});

export default LocationPickerModal;