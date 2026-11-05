import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { ESTADO_OPTIONS } from "@/constants/report";
import type { CambioDeEstado } from "@/types";
import { StyleSheet, View } from "react-native";

/** Historial de cambios de estado (más reciente primero). */
export const StatusHistory = ({ historial }: { historial: CambioDeEstado[] }) => {
  if (historial.length === 0) return null;

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Historial</ThemedText>
      {historial.map((item) => (
        <View key={item.id} style={styles.item}>
          <ThemedText type="small">
            <ThemedText type="smallBold">{ESTADO_OPTIONS.find((o) => o.value === item.estado)?.label ?? item.estado}</ThemedText>
            {" · "}
            {item.comentario || "Sin comentario"}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {new Date(item.fechaHora).toLocaleString("es-AR")}
          </ThemedText>
        </View>
      ))}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 8 },
  item: { gap: 2 },
});
