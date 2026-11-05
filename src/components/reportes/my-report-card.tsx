import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { useTheme } from "@/hooks/use-theme";
import type { Reporte } from "@/types";
import { daysSince, formatDaysAgo } from "@/utils/date";
import { Pressable, StyleSheet, View } from "react-native";

interface MyReportCardProps {
  reporte: Reporte;
  /** "Bacheo y Calzada en Rocamora 1250" */
  titulo: string;
  /** Id visible; vacío si está pendiente de envío. */
  displayId: string;
  pending: boolean;
  onPress: () => void;
  onShowQr: () => void;
}

/** Card de "Mis reportes": título, id + QR, y estado · vecinos · antigüedad. */
export const MyReportCard = ({ reporte, titulo, displayId, pending, onPress, onShowQr }: MyReportCardProps) => {
  const theme = useTheme();
  const { adhesiones } = reporte;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${pending ? "Pendiente de envío" : `Abrir reporte ${displayId}`}`}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={styles.card}>
        <ThemedText numberOfLines={2} style={styles.title}>
          {titulo}
        </ThemedText>

        <View style={styles.idRow}>
          {pending ? (
            <ThemedText type="small" themeColor="textSecondary">
              Pendiente de envío
            </ThemedText>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                {displayId}
              </ThemedText>
              <Pressable
                onPress={onShowQr}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Mostrar QR del reporte ${displayId}`}
              >
                <Icon name="qr-code-outline" size={24} color={theme.text} />
              </Pressable>
            </>
          )}
        </View>

        <View style={styles.metaRow}>
          {pending ? null : <StatusBadge status={reporte.estado} />}
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
  title: { fontWeight: "700" },
  idRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 28 },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 },
});
