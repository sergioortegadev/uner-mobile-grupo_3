import { useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Icon } from "@/components/ui/icon";
import { Input, type InputProps } from "@/components/ui/input";

export type PasswordInputProps = Omit<InputProps, "secureTextEntry" | "rightIcon">;

type VisibilityConfig = {
  secureTextEntry: boolean;
  iconName: "eye-outline" | "eye-off-outline";
  accessibilityLabel: string;
};

const VISIBILITY_CONFIG: Record<"hidden" | "visible", VisibilityConfig> = {
  hidden: {
    secureTextEntry: true,
    iconName: "eye-outline",
    accessibilityLabel: "Mostrar contraseña",
  },
  visible: {
    secureTextEntry: false,
    iconName: "eye-off-outline",
    accessibilityLabel: "Ocultar contraseña",
  },
};

export const PasswordInput = ({
  autoCapitalize = "none",
  autoCorrect = false,
  disabled = false,
  ref,
  ...rest
}: PasswordInputProps) => {
  const [visible, setVisible] = useState(false);
  const theme = useTheme();

  const currentConfig = visible ? VISIBILITY_CONFIG.visible : VISIBILITY_CONFIG.hidden;

  return (
    <Input
      autoCapitalize={autoCapitalize}
      autoCorrect={autoCorrect}
      ref={ref}
      disabled={disabled}
      secureTextEntry={currentConfig.secureTextEntry}
      autoComplete="password"
      rightIcon={
        <Pressable
          onPress={() => setVisible((v) => !v)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={currentConfig.accessibilityLabel}
          hitSlop={8}
          style={styles.toggleButton}
        >
          <Icon name={currentConfig.iconName} size={22} color={theme.textSecondary} />
        </Pressable>
      }
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  toggleButton: {
    width: 48,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
