import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { ESTADO_OPTIONS, getNextEstados, requiresComment } from "@/constants/report";
import type { ActionResult, ChangeStatusInput } from "@/hooks/use-operator-report";
import type { Cuadrilla, EstadoReporte } from "@/types";
import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { CrewPicker } from "./crew-picker";
import { RepairPhotoField } from "./repair-photo-field";

interface StatusChangeFormProps {
  estadoActual: EstadoReporte;
  cuadrillas: Cuadrilla[];
  isSubmitting: boolean;
  onSubmit: (input: ChangeStatusInput) => Promise<ActionResult>;
}

/** OP05 + OP06: cambiar el estado con comentario. 'asignado' pide cuadrilla; 'resuelto' admite foto (OP09). */
export const StatusChangeForm = ({ estadoActual, cuadrillas, isSubmitting, onSubmit }: StatusChangeFormProps) => {
  const [estado, setEstado] = useState<EstadoReporte | null>(null);
  const [comentario, setComentario] = useState("");
  const [cuadrillaId, setCuadrillaId] = useState<string | null>(null);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const reset = () => {
    setEstado(null);
    setComentario("");
    setCuadrillaId(null);
    setFotoUri(null);
    setCommentError(null);
    setPhotoError(null);
  };

  const nextOptions = ESTADO_OPTIONS.filter((option) => getNextEstados(estadoActual).includes(option.value));

  const selectEstado = (value: EstadoReporte) => {
    setEstado(value);
    setCommentError(null);
  };

  const handleSave = async () => {
    if (!estado) return;

    // Camino (a): elegir 'asignado' sin cuadrilla cancela el cambio de estado
    if (estado === "asignado" && !cuadrillaId) {
      Alert.alert("Cambio cancelado", "No elegiste una cuadrilla, así que el estado no se modificó.");
      reset();
      return;
    }

    if (requiresComment(estado) && !comentario.trim()) {
      setCommentError("El comentario es obligatorio para resolver o rechazar.");
    }
    if (estado === "resuelto" && !fotoUri) {
      setPhotoError("La foto del arreglo es obligatoria para resolver.");
    }
    if ((requiresComment(estado) && !comentario.trim()) || (estado === "resuelto" && !fotoUri)) {
      return;
    }

    const result = await onSubmit({ estado, comentario, cuadrillaId, fotoUri });
    Alert.alert(result.ok ? "Listo" : "No se pudo guardar", result.message);
    if (result.ok) reset();
  };

  return (
    <Card style={styles.card}>
      <ThemedText type="smallBold">Cambiar estado</ThemedText>

      {nextOptions.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Este reporte ya está finalizado: no admite más cambios de estado.
        </ThemedText>
      ) : (
        <View style={styles.chips}>
          {nextOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={estado === option.value}
              onPress={() => selectEstado(option.value)}
            />
          ))}
        </View>
      )}

      {estado === "asignado" && (
        <View style={styles.block}>
          <ThemedText type="small" themeColor="textSecondary">
            Elegí la cuadrilla para completar el cambio. Si no elegís ninguna, el cambio se cancela.
          </ThemedText>
          <CrewPicker cuadrillas={cuadrillas} selectedId={cuadrillaId} onSelect={setCuadrillaId} disabled={isSubmitting} />
        </View>
      )}

      {estado && (
        <Input
          label={requiresComment(estado) ? "Comentario (obligatorio)" : "Comentario (opcional)"}
          value={comentario}
          onChangeText={(text) => {
            setComentario(text);
            if (commentError) setCommentError(null);
          }}
          placeholder="Escribí un comentario..."
          multiline
          error={commentError}
          disabled={isSubmitting}
          style={styles.comment}
        />
      )}

      {estado === "resuelto" && (
        <RepairPhotoField
          uri={fotoUri}
          onChange={(uri) => {
            setFotoUri(uri);
            if (uri) setPhotoError(null);
          }}
          disabled={isSubmitting}
          error={photoError}
        />
      )}

      <Button
        title="Guardar cambio"
        disabled={!estado}
        loading={isSubmitting}
        onPress={handleSave}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 12 },
  chips: { flexDirection: "row", flexWrap: "wrap" },
  block: { gap: 8 },
  comment: { height: 96, paddingTop: 12, textAlignVertical: "top" },
});
