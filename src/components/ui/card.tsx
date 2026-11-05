import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "@/hooks/use-theme";

export const Card = ({ style, children, ...rest }: ViewProps) => {
  const theme = useTheme();

  return (
    <View
      style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}
      {...rest}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
