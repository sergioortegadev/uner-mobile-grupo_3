import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from "react-native";
import { ThemedText } from "../themed-text";

export type ButtonVariant = "accion" | "primario" | "secundario" | "contorno" | "peligro" | "texto";
export type ButtonSize = "grande" | "mediano";

type ButtonProps = PressableProps & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export const Button = ({
  title,
  variant = "primario",
  size = "grande",
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) => {
  const theme = useTheme();

  const getVariantStyles = (pressed: boolean) => {
    if (disabled) {
      return {
        backgroundColor: variant === "texto" ? "transparent" : theme.border,
        borderWidth: variant === "contorno" ? 2 : 0,
        borderColor: variant === "contorno" ? theme.border : "transparent",
      };
    }

    switch (variant) {
      case "accion":
        return { backgroundColor: pressed ? "#D98200" : coloresOficiales.accion };
      case "primario":
        return { backgroundColor: pressed ? coloresOficiales.primarioPresionado : coloresOficiales.primario };
      case "secundario":
        return { backgroundColor: pressed ? "#3B72D0" : coloresOficiales.secundario };
      case "contorno":
        return {
          backgroundColor: pressed ? theme.backgroundSelected : "transparent",
          borderWidth: 2,
          borderColor: coloresOficiales.primario,
        };
      case "peligro":
        return { backgroundColor: pressed ? "#A22B2B" : coloresOficiales.rechazado };
      case "texto":
        return { backgroundColor: "transparent" };
    }
  };

  const getTextColor = () => {
    if (disabled) return theme.textSecondary;
    if (variant === "accion") return coloresOficiales.tinta; // Tinta sobre baliza supera 4.5:1
    if (variant === "contorno" || variant === "texto") return coloresOficiales.primario;

    return "#FFFFFF";
  };

  return (
    <Pressable
      disabled={disabled || loading}
      style={({ pressed, hovered }) => [
        styles.base,
        size === "grande" ? styles.grande : styles.mediano,
        getVariantStyles(pressed),
        typeof style === "function" ? style({ pressed, hovered }) : style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <ThemedText style={[styles.text, { color: getTextColor() }]} type={size === "grande" ? "default" : "small"}>
          {title}
        </ThemedText>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  grande: {
    height: 56, // Requerimiento accesible PRD (56 dp)
  },
  mediano: {
    height: 44,
  },
  text: {
    fontWeight: "700",
  },
});
