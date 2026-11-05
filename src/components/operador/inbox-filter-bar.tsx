import { ESTADO_OPTIONS } from "@/constants/report";
import { FilterPill } from "@/components/ui/filter-pill";
import { Icon } from "@/components/ui/icon";
import { useTheme } from "@/hooks/use-theme";
import type { InboxFilters } from "@/hooks/use-operator-inbox";
import type { TipoDeReporte, Zona } from "@/types";
import { buildZoneLabel } from "@/utils/report-format";
import { Pressable, StyleSheet, View } from "react-native";

interface InboxFilterBarProps {
  filters: InboxFilters;
  tipos: readonly TipoDeReporte[];
  zonas: Zona[];
  onChange: (key: keyof InboxFilters, value: string | null) => void;
  onClear: () => void;
}

/** OP02–OP04: [Estado] [Tipo] [Zona] y un ícono para quitar todos los filtros. */
export const InboxFilterBar = ({ filters, tipos, zonas, onChange, onClear }: InboxFilterBarProps) => {
  const theme = useTheme();

  return (
    <View style={styles.bar}>
      <FilterPill
        label="Estado"
        options={ESTADO_OPTIONS}
        selectedValue={filters.estado}
        onSelect={(value) => onChange("estado", value)}
      />
      <FilterPill
        label="Tipo"
        options={tipos.map((tipo) => ({ label: tipo.nombre, value: tipo.id }))}
        selectedValue={filters.tipoId}
        onSelect={(value) => onChange("tipoId", value)}
      />
      <FilterPill
        label="Zona"
        options={zonas.map((zona) => ({ label: buildZoneLabel(zona), value: zona.id }))}
        selectedValue={filters.zonaId}
        onSelect={(value) => onChange("zonaId", value)}
      />
      <Pressable
        onPress={onClear}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Quitar filtros"
        style={styles.clear}
      >
        <Icon name="close-circle-outline" size={22} color={theme.textSecondary} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", gap: 8 },
  clear: { padding: 2 },
});
