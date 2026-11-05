import { ComponentProps } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { ThemedText } from "../themed-text";
import { Button } from "./button";
import { Icon } from "./icon";

export const LoadingState = ({ message = "Cargando..." }: { message?: string }) => {
  return (
    <View style={styles.centerContainer}>
      <ActivityIndicator size={"large"} />
      <ThemedText style={{ marginTop: 12 }}>{message}</ThemedText>
    </View>
  );
};

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => {
  return (
    <View style={styles.centerContainer}>
      <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
        Ocurrió un problema
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginBottom: 16 }}>
        {message}
      </ThemedText>
      {onRetry && <Button title="Reintentar" variant="contorno" onPress={onRetry} />}
    </View>
  );
};

type EmptyStateProps = {
  message: string;
  icon?: ComponentProps<typeof Icon>["name"];
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({ message, icon, actionLabel, onAction }: EmptyStateProps) => {
  const theme = useTheme();

  return (
    <View style={styles.centerContainer}>
      {icon && <Icon name={icon} size={48} color={theme.textSecondary} />}
      <ThemedText themeColor="textSecondary" style={{ textAlign: "center", marginTop: icon ? 12 : 0 }}>
        {message}
      </ThemedText>
      {actionLabel && onAction && (
        <Button title={actionLabel} variant="contorno" size="mediano" onPress={onAction} style={{ marginTop: 16 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
});
