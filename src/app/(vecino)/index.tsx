import MapaFiltros from "@/components/MapaFiltros";
import OsmMap, { type MapMarker } from "@/components/OsmMap";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
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
import type { EstadoReporte, ReportePublico } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VecinoMapaScreen = () => {
  const insets = useSafeAreaInsets();
  const [reportes, setReportes] = useState<ReportePublico[] | null>(null);
  const tipos = REPORT_TYPES;
  const [hayError, setHayError] = useState(false);
  const [tipoId, setTipoId] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoReporte | null>(null);

  useEffect(() => {
    let activo = true;

    reportService
      .getReports()
      .then((listaReportes) => {
        if (!activo) return;

        setReportes(listaReportes.map(toPublicReport));
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
    const nombreTipo = new Map(tipos.map((t) => [t.id, t.nombre]));

    const abiertos = reportes.filter((r) =>
      ESTADOS_ABIERTOS.includes(r.estado),
    );
    return filtrarReportes(abiertos, { tipoId, estado }).map((r) => ({
      id: r.id,
      latitud: r.coordenadas.latitud,
      longitud: r.coordenadas.longitud,
      color: COLOR_POR_ESTADO[r.estado],
      titulo: `${nombreTipo.get(r.tipoId) ?? "Reporte"} en ${r.direccion}`,
      detalle: ETIQUETA_POR_ESTADO[r.estado],
    }));
  }, [reportes, tipos, tipoId, estado]);

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
        tipos={tipos}
        tipoId={tipoId}
        estado={estado}
        onTipoChange={setTipoId}
        onEstadoChange={setEstado}
      />
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.contador}
      >
        {markers.length === 0
          ? "No hay reportes con esos filtros"
          : `${markers.length} ${markers.length === 1 ? "reporte" : "reportes"}`}
      </ThemedText>
      <OsmMap markers={markers} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, gap: 8 },
  contador: { paddingHorizontal: 12 },
  centro: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});

export default VecinoMapaScreen;
