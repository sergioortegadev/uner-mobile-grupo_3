import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "../themed-text";
import { Icon } from "./icon";

export interface FilterPillOption {
  label: string;
  value: string;
}

interface FilterPillProps {
  /** Nombre del filtro; se muestra cuando no hay valor elegido (ej: "Estado"). */
  label: string;
  options: FilterPillOption[];
  /** `null` = sin filtro (opción "Todos"). */
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
}

const ALL_VALUE = "__all__";

/** Selector compacto en forma de píldora para barras de filtros. */
export const FilterPill = ({ label, options, selectedValue, onSelect }: FilterPillProps) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selected = options.find((option) => option.value === selectedValue);
  const isActive = selected !== undefined;
  const allOptions: FilterPillOption[] = [{ label: "Todos", value: ALL_VALUE }, ...options];

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`Filtro ${label}${isActive ? `: ${selected.label}` : ": todos"}`}
        style={[
          styles.pill,
          {
            backgroundColor: isActive ? theme.backgroundSelected : theme.backgroundElement,
            borderColor: isActive ? coloresOficiales.primario : theme.border,
          },
        ]}
      >
        <ThemedText
          type="small"
          numberOfLines={1}
          style={[styles.pillText, { color: isActive ? coloresOficiales.primario : theme.text }]}
        >
          {isActive ? selected.label : label}
        </ThemedText>
        <Icon name="chevron-down" size={14} color={isActive ? coloresOficiales.primario : theme.text} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView style={styles.safeAreaModal}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
            >
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <ThemedText type="default">{label}</ThemedText>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar opciones"
                >
                  <Icon name="close-outline" size={24} color={theme.text} />
                </Pressable>
              </View>

              <FlatList
                data={allOptions}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.value === ALL_VALUE ? selectedValue === null : item.value === selectedValue;
                  return (
                    <Pressable
                      style={[
                        styles.optionRow,
                        {
                          borderBottomColor: theme.border,
                          backgroundColor: isSelected ? theme.backgroundSelected : "transparent",
                        },
                      ]}
                      onPress={() => {
                        onSelect(item.value === ALL_VALUE ? null : item.value);
                        setModalVisible(false);
                      }}
                    >
                      <ThemedText
                        style={{
                          fontWeight: isSelected ? "700" : "400",
                          color: isSelected ? coloresOficiales.primario : theme.text,
                        }}
                      >
                        {item.label}
                      </ThemedText>
                      {isSelected && <Icon name="checkmark-sharp" size={20} color={coloresOficiales.primario} />}
                    </Pressable>
                  );
                }}
              />
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  pill: {
    flex: 1,
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  pillText: { flexShrink: 1, fontWeight: "600" },
  overlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)", justifyContent: "center", padding: 20 },
  safeAreaModal: { justifyContent: "center" },
  modalCard: {
    maxHeight: 380,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
});
