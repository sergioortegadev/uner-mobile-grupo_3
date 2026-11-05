import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Reporte } from "@/types";
import { daysSince, formatDaysAgo } from "@/utils/date";
import { Pressable, StyleSheet, View } from "react-native";

interface ReportCardProps {
  reporte: Reporte;
  /** "Bacheo y Calzada en Rocamora 1250" */
  titulo: string;
  onPress: () => void;
}

/** Card de la bandeja: título (2 líneas), id, y estado · vecinos adheridos · antigüedad. */
export const ReportCard = ({ reporte, titulo, onPress }: ReportCardProps) => {
  const { adhesiones } = reporte;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. Abrir reporte ${reporte.id}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {titulo}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {reporte.id}
        </ThemedText>
        <View style={styles.metaRow}>
          <StatusBadge status={reporte.estado} />
          {adhesiones > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              +{adhesiones} {adhesiones === 1 ? "vecino" : "vecinos"}
            </ThemedText>
          )}
          <ThemedText type="small" themeColor="textSecondary">
            {formatDaysAgo(daysSince(reporte.creadoEn))}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressed: { opacity: 0.75 },
  card: { gap: 4 },
  // minHeight = 2 líneas, para que el id quede siempre en la tercera línea
  title: { fontWeight: "700", minHeight: 48 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 },
});
