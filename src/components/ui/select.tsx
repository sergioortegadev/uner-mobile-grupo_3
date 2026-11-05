import { useState } from "react";
import { Pressable, View, Modal, FlatList, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "./icon";
import { ThemedText } from "../themed-text";
import { useTheme } from "@/hooks/use-theme";
import { coloresOficiales } from "@/constants/theme";

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps {
  label?: string;
  options: SelectOption[];
  selectedValue: string | null;
  onSelect: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  disabled?: boolean;
}

export const Select = ({
  label,
  options,
  selectedValue,
  onSelect,
  placeholder = "Seleccionar...",
  error,
  disabled = false,
}: SelectProps) => {
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <View style={styles.container}>
      {/* Etiqueta del campo */}
      {label && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.label}>
          {label}
        </ThemedText>
      )}

      {/* Botón Gatillo / Campo Principal */}
      <Pressable
        disabled={disabled}
        onPress={() => setModalVisible(true)}
        accessibilityRole="combobox"
        accessibilityLabel={label || placeholder}
        accessibilityState={{ expanded: modalVisible, disabled }}
        style={[
          styles.triggerButton,
          {
            backgroundColor: disabled ? theme.border : theme.backgroundElement,
            borderColor: error ? coloresOficiales.rechazado : modalVisible ? coloresOficiales.primario : theme.border,
          },
        ]}
      >
        <ThemedText style={[styles.triggerText, { color: selectedOption ? theme.text : theme.textSecondary }]}>
          {selectedOption ? selectedOption.label : placeholder}
        </ThemedText>
        <Icon name="chevron-down" size={20} color={disabled ? theme.textSecondary : theme.text} />
      </Pressable>

      {/* Mensaje de Error */}
      {error && (
        <ThemedText type="small" style={styles.errorText}>
          ✖ {error}
        </ThemedText>
      )}

      {/* Modal Desplegable */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalVisible(false)}>
          <SafeAreaView style={styles.safeAreaModal}>
            <Pressable
              onPress={(e) => e.stopPropagation()}
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Encabezado del Modal */}
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <ThemedText type="default">{label || "Seleccione una opción"}</ThemedText>
                <Pressable
                  onPress={() => setModalVisible(false)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar opciones"
                >
                  <Icon name="close-outline" size={24} color={theme.text} />
                </Pressable>
              </View>

              {/* Lista de Opciones */}
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = item.value === selectedValue;
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
                        onSelect(item.value);
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6, fontWeight: "400" },
  triggerButton: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  triggerText: { fontSize: 16, flex: 1, marginRight: 8 },
  errorText: { color: coloresOficiales.rechazado, marginTop: 4 },
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
