import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { WebView } from "react-native-webview";

export interface MapMarker {
  id: string;
  latitud: number;
  longitud: number;
  color: string;
  titulo: string;
  detalle?: string;
}

export interface UserLocationMarker {
  latitud: number;
  longitud: number;
  radiusMeters?: number;
}

export interface OsmMapProps {
  markers: MapMarker[];
  center?: { latitud: number; longitud: number };
  zoom?: number;
  interactive?: boolean;
  zoomControl?: boolean;
  userLocation?: UserLocationMarker;
  onMarkerPress?: (id: string) => void;
  onPopupPress?: (id: string) => void;
  onReady?: () => void;
  onError?: (reason: string) => void;
}

const DEFAULT_CENTER = { latitud: -33.0094, longitud: -58.5172 };

function buildHtml(
  markers: MapMarker[],
  center: { latitud: number; longitud: number },
  zoom: number,
  interactive: boolean,
  zoomControl: boolean,
  userLocation?: UserLocationMarker,
) {
  const markersJson = JSON.stringify(markers).replace(/</g, "\\u003c");
  const userLocationJson = userLocation
    ? JSON.stringify(userLocation).replace(/</g, "\\u003c")
    : "null";

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
  <style>html, body, #map { height: 100%; margin: 0; padding: 0; overflow: hidden; }</style>
</head>
<body>
  <div id="map"></div>
  <script>
    (function () {
      function postBridgeMessage(payload) {
        if (window.ReactNativeWebView && typeof window.ReactNativeWebView.postMessage === "function") {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      try {
        if (typeof L === "undefined") {
          postBridgeMessage({ type: "MAP_ERROR", reason: "leaflet_unavailable" });
          return;
        }

        var markers = ${markersJson};
        var map = L.map("map", {
          zoomControl: false,
          dragging: ${interactive},
          touchZoom: ${interactive},
          scrollWheelZoom: ${interactive},
          doubleClickZoom: ${interactive},
          boxZoom: ${interactive},
          keyboard: ${interactive}
        }).setView([${center.latitud}, ${center.longitud}], ${zoom});

        ${
          interactive && zoomControl
            ? 'L.control.zoom({ position: "bottomright" }).addTo(map);'
            : ""
        }

        var isReady = false;
        var consecutiveErrors = 0;
        var tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors"
        });

        tileLayer.on("load", function () {
          if (!isReady) {
            isReady = true;
            postBridgeMessage({ type: "MAP_READY" });
          }
        });

        tileLayer.on("tileerror", function () {
          consecutiveErrors++;
          if (!isReady && consecutiveErrors >= 3) {
            postBridgeMessage({ type: "MAP_ERROR", reason: "tile_error" });
          }
        });

        tileLayer.addTo(map);

        var userLoc = ${userLocationJson};
        if (userLoc) {
          if (typeof userLoc.radiusMeters === "number" && userLoc.radiusMeters > 0) {
            L.circle([userLoc.latitud, userLoc.longitud], {
              radius: userLoc.radiusMeters,
              color: "#0B3D91",
              weight: 1.5,
              dashArray: "4, 6",
              fillColor: "#2373F4",
              fillOpacity: 0.08,
              interactive: false
            }).addTo(map);
          }

          var userHalo = document.createElement("div");
          userHalo.style.width = "32px";
          userHalo.style.height = "32px";
          userHalo.style.borderRadius = "16px";
          userHalo.style.backgroundColor = "rgba(35, 115, 244, 0.28)";
          userHalo.style.display = "flex";
          userHalo.style.alignItems = "center";
          userHalo.style.justifyContent = "center";

          var userDot = document.createElement("div");
          userDot.style.width = "14px";
          userDot.style.height = "14px";
          userDot.style.borderRadius = "7px";
          userDot.style.backgroundColor = "#0B3D91";
          userDot.style.border = "2.5px solid #ffffff";
          userDot.style.boxSizing = "border-box";
          userHalo.appendChild(userDot);

          var userIcon = L.divIcon({
            html: userHalo,
            className: "",
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          L.marker([userLoc.latitud, userLoc.longitud], {
            icon: userIcon,
            interactive: false
          }).addTo(map);
        }

        var grupo = L.markerClusterGroup({
          maxClusterRadius: 30,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false
        });

        markers.forEach(function (m) {
          var punto = document.createElement("div");
          punto.style.width = "20px";
          punto.style.height = "20px";
          punto.style.borderRadius = "50%";
          punto.style.border = "2px solid #ffffff";
          punto.style.boxShadow = "0 0 3px rgba(0,0,0,0.5)";
          punto.style.background = m.color;

          var marker = L.marker([m.latitud, m.longitud], {
            icon: L.divIcon({ html: punto, className: "", iconSize: [20, 20] })
          });

          var box = document.createElement("div");
          var title = document.createElement("strong");
          title.textContent = m.titulo;
          box.appendChild(title);
          if (m.detalle) {
            box.appendChild(document.createElement("br"));
            box.appendChild(document.createTextNode(m.detalle));
          }
          marker.bindPopup(box);

          marker.on("click", function () {
            postBridgeMessage({ type: "MARKER_PRESS", id: m.id });
          });

          marker.on("popupopen", function (event) {
            var popupElement = event.popup.getElement();
            if (popupElement) {
              popupElement.addEventListener("click", function () {
                postBridgeMessage({ type: "POPUP_PRESS", id: m.id });
              });
            }
          });

          grupo.addLayer(marker);
        });

        map.addLayer(grupo);
      } catch (e) {
        postBridgeMessage({ type: "MAP_ERROR", reason: String(e) });
      }
    })();
  </script>
</body>
</html>`;
}

export default function OsmMap({
  markers,
  center = DEFAULT_CENTER,
  zoom = 14,
  interactive = true,
  zoomControl = true,
  userLocation,
  onMarkerPress,
  onPopupPress,
  onReady,
  onError,
}: OsmMapProps) {
  const centerLat = center?.latitud ?? DEFAULT_CENTER.latitud;
  const centerLng = center?.longitud ?? DEFAULT_CENTER.longitud;
  const userLocLat = userLocation?.latitud;
  const userLocLng = userLocation?.longitud;
  const userLocRadius = userLocation?.radiusMeters;

  const html = useMemo(
    () =>
      buildHtml(
        markers,
        { latitud: centerLat, longitud: centerLng },
        zoom,
        interactive,
        zoomControl,
        userLocLat !== undefined && userLocLng !== undefined
          ? {
              latitud: userLocLat,
              longitud: userLocLng,
              radiusMeters: userLocRadius,
            }
          : undefined,
      ),
    [
      markers,
      centerLat,
      centerLng,
      zoom,
      interactive,
      zoomControl,
      userLocLat,
      userLocLng,
      userLocRadius,
    ],
  );

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === "MARKER_PRESS" && onMarkerPress) {
        onMarkerPress(msg.id);
      } else if (msg.type === "POPUP_PRESS" && onPopupPress) {
        onPopupPress(msg.id);
      } else if (msg.type === "MAP_READY" && onReady) {
        onReady();
      } else if (msg.type === "MAP_ERROR" && onError) {
        onError(msg.reason ?? "unknown_error");
      }
    } catch {
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://localhost/" }}
        style={styles.webview}
        onMessage={handleMessage}
        onError={() => onError?.("webview_error")}
        onHttpError={() => onError?.("webview_error")}
        javaScriptEnabled
        scrollEnabled={interactive}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1 },
});
