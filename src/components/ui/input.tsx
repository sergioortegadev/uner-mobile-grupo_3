import { useState, type ReactNode } from "react";
import { TextInput, View, StyleSheet, type TextInputProps } from "react-native";
import { ThemedText } from "../themed-text";
import { useTheme } from "@/hooks/use-theme";
import { coloresOficiales } from "@/constants/theme";

export type InputProps = TextInputProps & {
  label?: string;
  error?: string | null;
  disabled?: boolean;
  rightIcon?: ReactNode;
  ref?: React.Ref<TextInput>;
};

export const Input = ({
  label,
  error,
  style,
  disabled = false,
  rightIcon,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) => {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="small" style={styles.label} themeColor="textSecondary">
          {label}
        </ThemedText>
      )}

      <View style={styles.inputWrapper}>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            {
              backgroundColor: disabled ? theme.border : theme.backgroundElement,
              color: theme.text,
              borderColor: error ? coloresOficiales.rechazado : focused ? coloresOficiales.primario : theme.border,
            },
            rightIcon ? styles.inputWithRightIcon : null,
            style,
          ]}
          placeholderTextColor={theme.textSecondary}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          editable={!disabled}
          {...rest}
        />
        {rightIcon ? (
          <View style={styles.rightIconContainer} pointerEvents="box-none">
            {rightIcon}
          </View>
        ) : null}
      </View>
      {error && (
        <ThemedText type="small" style={styles.errorText}>
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontWeight: "600",
  },
  inputWrapper: {
    position: "relative",
    justifyContent: "center",
  },
  input: {
    height: 56,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputWithRightIcon: {
    paddingRight: 48,
  },
  rightIconContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: coloresOficiales.rechazado,
    marginTop: 4,
  },
});
