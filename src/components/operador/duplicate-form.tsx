import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import type { ActionResult, DuplicateCandidate } from "@/hooks/use-operator-report";
import { buildDuplicateComment, buildDuplicateOptionLabel } from "@/utils/report-format";
import { useState } from "react";
import { Alert, StyleSheet } from "react-native";

interface DuplicateFormProps {
  candidatos: DuplicateCandidate[];
  isSubmitting: boolean;
  onSubmit: (originalId: string) => Promise<ActionResult>;
}

/** OP08: marcar como duplicado de otro reclamo (mismo tipo y zona, aún abierto). Pide confirmación. */
export const DuplicateForm = ({ candidatos, isSubmitting, onSubmit }: DuplicateFormProps) => {
  const [originalId, setOriginalId] = useState<string | null>(null);

  const options = candidatos.map((c) => ({
    value: c.reporte.id,
    label: buildDuplicateOptionLabel(c.reporte.id, c.titulo),
  }));

  const handlePress = () => {
    const original = candidatos.find((c) => c.reporte.id === originalId);
    if (!original) return;

    Alert.alert(
      "¿Marcar como duplicado?",
      `El reclamo pasará a "Rechazado" con el comentario:\n\n${buildDuplicateComment(original.reporte.id, original.titulo)}`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            const result = await onSubmit(original.reporte.id);
            Alert.alert(result.ok ? "Listo" : "No se pudo marcar", result.message);
            if (result.ok) setOriginalId(null);
          },
        },
      ],
    );
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Marcar duplicado</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Elegí el reclamo original. Se listan los del mismo tipo y zona que siguen abiertos.
      </ThemedText>

      {options.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No hay otros reclamos abiertos del mismo tipo y zona.
        </ThemedText>
      ) : (
        <Select
          label="Reclamo original"
          options={options}
          selectedValue={originalId}
          onSelect={setOriginalId}
          placeholder="Seleccionar reclamo..."
          disabled={isSubmitting}
        />
      )}

      <Button
        title="Marcar como duplicado"
        variant="peligro"
        disabled={!originalId}
        loading={isSubmitting}
        onPress={handlePress}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 12 },
});
