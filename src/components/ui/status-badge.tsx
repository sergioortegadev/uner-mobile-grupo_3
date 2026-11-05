import { StyleSheet, View } from "react-native";
import { ThemedText } from "../themed-text";
import { EstadoReporte } from "@/types";
import { coloresOficiales } from "@/constants/theme";

const CONFIG_ESTADOS: Record<EstadoReporte, { label: string; simbolo: string; color: string }> = {
  recibido: { label: "Recibido", simbolo: "•", color: coloresOficiales.recibido },
  en_revision: { label: "En revisión", simbolo: "◐", color: coloresOficiales.enRevision },
  asignado: { label: "Asignado", simbolo: "◆", color: coloresOficiales.asignado },
  resuelto: { label: "Resuelto", simbolo: "✔", color: coloresOficiales.resuelto },
  rechazado: { label: "Rechazado", simbolo: "✖", color: coloresOficiales.rechazado },
};

export const StatusBadge = ({ status }: { status: EstadoReporte }) => {
  const config = CONFIG_ESTADOS[status] || CONFIG_ESTADOS.recibido;

  return (
    <View style={[styles.badge, { backgroundColor: `${config.color}20`, borderColor: config.color }]}>
      <ThemedText style={[styles.text, { color: config.color }]} type="small">
        {config.simbolo} {config.label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: { fontWeight: "700" },
});
