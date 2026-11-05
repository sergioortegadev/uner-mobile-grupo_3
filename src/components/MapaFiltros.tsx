import { ThemedText } from "@/components/themed-text";
import {
  COLOR_POR_ESTADO,
  ESTADOS_ABIERTOS,
  ETIQUETA_POR_ESTADO,
} from "@/constants/colores-estado";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { EstadoReporte, TipoDeReporte } from "@/types";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ESTADOS = ESTADOS_ABIERTOS;

interface Opcion {
  id: string | null;
  etiqueta: string;
  color?: string;
}

interface MapaFiltrosProps {
  tipos: readonly TipoDeReporte[];
  tipoId: string | null;
  estado: EstadoReporte | null;
  onTipoChange: (tipoId: string | null) => void;
  onEstadoChange: (estado: EstadoReporte | null) => void;
}

function Selector({
  etiqueta,
  valor,
  activo,
  onPress,
}: {
  etiqueta: string;
  valor: string;
  activo: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Filtrar por ${etiqueta}: ${valor}`}
      style={[
        styles.selector,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: activo ? coloresOficiales.primario : theme.border,
        },
      ]}
    >
      <View style={styles.selectorTexto}>
        <ThemedText type="small" themeColor="textSecondary">
          {etiqueta}
        </ThemedText>
        <ThemedText type="small" style={styles.valor} numberOfLines={1}>
          {valor}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        ▾
      </ThemedText>
    </Pressable>
  );
}

function HojaOpciones({
  visible,
  titulo,
  opciones,
  seleccionado,
  onSelect,
  onClose,
}: {
  visible: boolean;
  titulo: string;
  opciones: Opcion[];
  seleccionado: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.fondo} onPress={onClose} />
      <View
        style={[
          styles.hoja,
          {
            backgroundColor: theme.backgroundElement,
            paddingBottom: 16 + insets.bottom,
          },
        ]}
      >
        <ThemedText type="default" style={styles.tituloHoja}>
          {titulo}
        </ThemedText>
        <ScrollView>
          {opciones.map((op) => {
            const elegida = op.id === seleccionado;
            return (
              <Pressable
                key={op.id ?? "todos"}
                onPress={() => onSelect(op.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: elegida }}
                style={[
                  styles.opcion,
                  elegida && { backgroundColor: theme.backgroundSelected },
                ]}
              >
                {op.color && (
                  <View
                    style={[
                      styles.punto,
                      {
                        backgroundColor: op.color,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                )}
                <ThemedText type="default" style={styles.opcionTexto}>
                  {op.etiqueta}
                </ThemedText>
                {elegida && (
                  <ThemedText
                    type="default"
                    style={{ color: coloresOficiales.primario }}
                  >
                    ✓
                  </ThemedText>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function MapaFiltros({
  tipos,
  tipoId,
  estado,
  onTipoChange,
  onEstadoChange,
}: MapaFiltrosProps) {
  const [abierta, setAbierta] = useState<"tipo" | "estado" | null>(null);

  const opcionesTipo: Opcion[] = [
    { id: null, etiqueta: "Todos los tipos" },
    ...tipos.map((t) => ({ id: t.id, etiqueta: t.nombre })),
  ];

  const opcionesEstado: Opcion[] = [
    { id: null, etiqueta: "Todos los estados" },
    ...ESTADOS.map((e) => ({
      id: e,
      etiqueta: ETIQUETA_POR_ESTADO[e],
      color: COLOR_POR_ESTADO[e],
    })),
  ];

  const tipoActual = tipos.find((t) => t.id === tipoId);

  return (
    <View style={styles.fila}>
      <Selector
        etiqueta="Tipo"
        valor={tipoActual ? tipoActual.nombre : "Todos"}
        activo={tipoId !== null}
        onPress={() => setAbierta("tipo")}
      />
      <Selector
        etiqueta="Estado"
        valor={estado ? ETIQUETA_POR_ESTADO[estado] : "Todos"}
        activo={estado !== null}
        onPress={() => setAbierta("estado")}
      />

      <HojaOpciones
        visible={abierta === "tipo"}
        titulo="Filtrar por tipo"
        opciones={opcionesTipo}
        seleccionado={tipoId}
        onSelect={(id) => {
          onTipoChange(id);
          setAbierta(null);
        }}
        onClose={() => setAbierta(null)}
      />
      <HojaOpciones
        visible={abierta === "estado"}
        titulo="Filtrar por estado"
        opciones={opcionesEstado}
        seleccionado={estado}
        onSelect={(id) => {
          onEstadoChange(id as EstadoReporte | null);
          setAbierta(null);
        }}
        onClose={() => setAbierta(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  selector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 48,
  },
  selectorTexto: { flex: 1 },
  valor: { fontWeight: "700" },
  fondo: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  hoja: {
    maxHeight: "70%",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  tituloHoja: { fontWeight: "700", paddingHorizontal: 8, paddingBottom: 8 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  punto: { width: 14, height: 14, borderRadius: 7, borderWidth: 1 },
  opcionTexto: { flex: 1 },
});
