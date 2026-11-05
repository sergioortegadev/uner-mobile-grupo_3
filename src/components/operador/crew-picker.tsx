import { ThemedText } from "@/components/themed-text";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { Cuadrilla } from "@/types";
import { Pressable, StyleSheet, View } from "react-native";

interface CrewPickerProps {
  cuadrillas: Cuadrilla[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

/** Lista de cuadrillas (ya filtradas por la zona del reporte) para elegir una. */
export const CrewPicker = ({ cuadrillas, selectedId, onSelect, disabled = false }: CrewPickerProps) => {
  const theme = useTheme();

  if (cuadrillas.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No hay cuadrillas activas en la zona de este reporte.
      </ThemedText>
    );
  }

  return (
    <View style={styles.list}>
      {cuadrillas.map((cuadrilla) => {
        const isSelected = cuadrilla.id === selectedId;
        return (
          <Pressable
            key={cuadrilla.id}
            disabled={disabled}
            onPress={() => onSelect(cuadrilla.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, disabled }}
            style={[
              styles.option,
              {
                borderColor: isSelected ? coloresOficiales.primario : theme.border,
                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
              },
            ]}
          >
            <ThemedText style={{ fontWeight: isSelected ? "700" : "500" }}>{cuadrilla.nombre}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {cuadrilla.especialidad}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  list: { gap: 8 },
  option: { padding: 12, borderRadius: 8, borderWidth: 1.5, gap: 2 },
});
