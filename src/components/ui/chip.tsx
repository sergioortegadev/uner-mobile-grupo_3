import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet } from "react-native";
import { ThemedText } from "../themed-text";
import { coloresOficiales } from "@/constants/theme";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export const Chip = ({ label, selected = false, onPress }: ChipProps) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? coloresOficiales.primario : theme.backgroundElement,
          borderColor: selected ? coloresOficiales.primario : theme.border,
        },
      ]}
    >
      <ThemedText type="small" style={{ color: selected ? "#FFFFFF" : theme.text, fontWeight: "600" }}>
        {label}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    marginRight: 8,
    marginBottom: 8,
  },
});
