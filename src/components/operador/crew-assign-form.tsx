import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActionResult } from "@/hooks/use-operator-report";
import type { Cuadrilla, Reporte } from "@/types";
import { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { CrewPicker } from "./crew-picker";

interface CrewAssignFormProps {
  reporte: Reporte;
  cuadrillas: Cuadrilla[];
  isSubmitting: boolean;
  onSubmit: (cuadrillaId: string) => Promise<ActionResult>;
}

/** OP07: asignar una cuadrilla de la zona del reporte. El reporte pasa a 'asignado'. */
export const CrewAssignForm = ({ reporte, cuadrillas, isSubmitting, onSubmit }: CrewAssignFormProps) => {
  const [cuadrillaId, setCuadrillaId] = useState<string | null>(null);
  const actual = cuadrillas.find((c) => c.id === reporte.cuadrillaId);

  const handleAssign = async () => {
    if (!cuadrillaId) return;
    const result = await onSubmit(cuadrillaId);
    Alert.alert(result.ok ? "Listo" : "No se pudo asignar", result.message);
    if (result.ok) setCuadrillaId(null);
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Asignar cuadrilla</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {actual ? `Cuadrilla actual: ${actual.nombre}` : "Todavía no tiene cuadrilla asignada."}
      </ThemedText>
      <CrewPicker cuadrillas={cuadrillas} selectedId={cuadrillaId} onSelect={setCuadrillaId} disabled={isSubmitting} />
      <Button title="Asignar cuadrilla" disabled={!cuadrillaId} loading={isSubmitting} onPress={handleAssign} />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 12 },
});
