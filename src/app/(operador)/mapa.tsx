import MapaFiltros from "@/components/MapaFiltros";
import OsmMap, { type MapMarker } from "@/components/OsmMap";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Icon } from "@/components/ui/icon";
import { LoadingState } from "@/components/ui/state-views";
import {
  COLOR_POR_ESTADO,
  ESTADOS_ABIERTOS,
  ETIQUETA_POR_ESTADO,
} from "@/constants/colores-estado";
import { REPORT_TYPES } from "@/constants/report-types-static";
import { filtrarReportes } from "@/helpers/filtrar-reportes";
import { toPublicReport } from "@/helpers/public-report";
import { reportService } from "@/services/reports";
import { useTheme } from "@/hooks/use-theme";
import type { EstadoReporte, ReportePublico } from "@/types";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MapaOperadorScreen = () => {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const theme = useTheme();
  const [reportes, setReportes] = useState<ReportePublico[] | null>(null);
  const [hayError, setHayError] = useState(false);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoReporte | null>(null);

  useEffect(() => {
    let activo = true;

    reportService
      .getReports()
      .then((listaReportes) => {
        if (activo) setReportes(listaReportes.map(toPublicReport));
      })
      .catch(() => {
        if (activo) setHayError(true);
      });

    return () => {
      activo = false;
    };
  }, []);

  const markers: MapMarker[] = useMemo(() => {
    if (reportes === null) return [];
    const nombreTipo = new Map(REPORT_TYPES.map((tipo) => [tipo.id, tipo.nombre]));
    const abiertos = reportes.filter((reporte) =>
      ESTADOS_ABIERTOS.includes(reporte.estado),
    );

    return filtrarReportes(abiertos, { tipoId, estado }).map((reporte) => ({
      id: reporte.id,
      latitud: reporte.coordenadas.latitud,
      longitud: reporte.coordenadas.longitud,
      color: COLOR_POR_ESTADO[reporte.estado],
      titulo: `${nombreTipo.get(reporte.tipoId) ?? "Reporte"} en ${reporte.direccion}`,
      detalle: ETIQUETA_POR_ESTADO[reporte.estado],
    }));
  }, [reportes, tipoId, estado]);

  if (hayError) {
    return (
      <ThemedView style={styles.centro}>
        <ThemedText type="default" themeColor="textSecondary">
          No se pudieron cargar los reportes.
        </ThemedText>
      </ThemedView>
    );
  }

  if (reportes === null) {
    return <LoadingState message="Cargando mapa de reportes..." />;
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <MapaFiltros
        tipos={REPORT_TYPES}
        tipoId={tipoId}
        estado={estado}
        onTipoChange={setTipoId}
        onEstadoChange={setEstado}
      />
      <View style={styles.filaContador}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.contador}>
          {markers.length === 0
            ? "No hay reportes con esos filtros"
            : `${markers.length} ${markers.length === 1 ? "reporte" : "reportes"}`}
        </ThemedText>
        <Pressable
          onPress={() => {
            setTipoId(null);
            setEstado(null);
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Quitar filtros"
          style={styles.limpiarFiltros}
        >
          <Icon name="close-circle-outline" size={22} color={theme.textSecondary} />
        </Pressable>
      </View>
      <OsmMap
        markers={markers}
        onPopupPress={(id) =>
          router.push({ pathname: "/(operador)/reporte/[id]", params: { id } })
        }
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  filaContador: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: 12,
  },
  contador: { paddingHorizontal: 12 },
  limpiarFiltros: { padding: 2 },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default MapaOperadorScreen;
