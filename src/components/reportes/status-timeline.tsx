import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { ESTADO_OPTIONS } from "@/constants/report";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { CambioDeEstado } from "@/types";
import { StyleSheet, View } from "react-native";

/** Historial en forma de línea de tiempo vertical (más reciente arriba). */
export const StatusTimeline = ({ historial }: { historial: CambioDeEstado[] }) => {
  const theme = useTheme();
  if (historial.length === 0) return null;

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold" accessibilityRole="header">
        Historial
      </ThemedText>
      {historial.map((item, index) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.rail}>
            <View style={[styles.dot, { backgroundColor: coloresOficiales.primario }]} />
            {index < historial.length - 1 && <View style={[styles.line, { backgroundColor: theme.border }]} />}
          </View>
          <View style={styles.content}>
            <ThemedText type="smallBold">
              {ESTADO_OPTIONS.find((o) => o.value === item.estado)?.label ?? item.estado}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {new Date(item.fechaHora).toLocaleString("es-AR")}
            </ThemedText>
            {/* Sin comentario del operador: string vacío */}
            <ThemedText type="small">{item.comentario ?? ""}</ThemedText>
          </View>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 8 },
  row: { flexDirection: "row", gap: 12 },
  rail: { alignItems: "center", width: 12 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  line: { flex: 1, width: 2, marginTop: 2 },
  content: { flex: 1, gap: 2, paddingBottom: 12 },
});
