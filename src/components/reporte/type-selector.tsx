import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { coloresOficiales } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { TipoDeReporte } from "@/types";
import { type ComponentProps } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type IconName = ComponentProps<typeof Icon>["name"];

export interface TypeSelectorProps {
    types: readonly TipoDeReporte[];
    selectedTypeId: string | null;
    onSelect: (typeId: string) => void;
}

export function TypeSelector({ types, selectedTypeId, onSelect }: TypeSelectorProps) {
    const theme = useTheme();

    return (
        <View style={styles.grid} accessibilityRole="radiogroup">
            {types.map((type) => {
                const isSelected = type.id === selectedTypeId;

                return (
                    <Pressable
                        key={type.id}
                        onPress={() => onSelect(type.id)}
                        accessibilityRole="radio"
                        accessibilityLabel={type.nombre}
                        accessibilityState={{ selected: isSelected }}
                        style={({ pressed }) => [
                            styles.option,
                            {
                                backgroundColor: isSelected ? theme.backgroundSelected : theme.backgroundElement,
                                borderColor: isSelected ? coloresOficiales.primario : theme.border,
                            },
                            pressed && styles.pressed,
                        ]}
                    >
                        <View style={[styles.iconCircle, { backgroundColor: type.color }]}>
                            <Icon name={type.icono as IconName} size={24} color="#FFFFFF" />
                        </View>
                        <ThemedText type={isSelected ? "smallBold" : "small"} style={styles.label}>
                            {type.nombre}
                        </ThemedText>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    option: {
        width: "20%",
        flexGrow: 1,
        minHeight: 36,
        borderRadius: 12,
        padding: 6,
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
    },
    pressed: {
        opacity: 0.7,
    },
    iconCircle: {
        width: 46,
        height: 44,
        borderRadius: 25,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        textAlign: "center",
    },
});