import { AudioRecorderField } from "@/components/reporte/audio-recorder-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deleteAudioFile } from "@/utils/audio-storage";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export interface DescripcionValue {
  descripcion: string | null;
  audioUrl: string | null;
}

export type DescriptionValue = DescripcionValue;

export interface DescriptionFieldProps {
  value: DescripcionValue;
  onChange: (next: DescripcionValue) => void;
  textPlaceholder?: string;
}

type DescriptionMode = "texto" | "audio";

/**
 * Sección "Contanos": dos modos mutuamente excluyentes, texto o audio.
 * Al cambiar de modo se limpia el valor del otro campo
 */
export function DescriptionField({
  value,
  onChange,
  textPlaceholder,
}: DescriptionFieldProps) {
  const [mode, setMode] = useState<DescriptionMode>(
    value.audioUrl ? "audio" : "texto",
  );

  const selectTextMode = () => {
    setMode("texto");
    if (value.audioUrl) {
      deleteAudioFile(value.audioUrl).catch(() => {});
    }
    onChange({ descripcion: value.descripcion ?? "", audioUrl: null });
  };

  const selectAudioMode = () => {
    setMode("audio");
    // Mutua exclusión: al pasar a audio se limpia descripcion.
    onChange({ descripcion: null, audioUrl: value.audioUrl });
  };

  return (
    <View style={styles.container}>
      <View style={styles.toggleRow}>
        <Button
          title="Escribir"
          size="grande"
          variant={mode === "texto" ? "primario" : "contorno"}
          accessibilityLabel="Escribir descripción"
          accessibilityState={{ selected: mode === "texto" }}
          onPress={selectTextMode}
          style={styles.toggleButton}
        />

        <Button
          title="● Grabar audio"
          size="grande"
          variant={mode === "audio" ? "primario" : "contorno"}
          accessibilityLabel="Grabar descripción en audio"
          accessibilityState={{ selected: mode === "audio" }}
          onPress={selectAudioMode}
          style={styles.toggleButton}
        />
      </View>

      {mode === "texto" ? (
        <Input
          value={value.descripcion ?? ""}
          onChangeText={(text) => onChange({ ...value, descripcion: text })}
          placeholder={textPlaceholder ?? "Contanos qué pasa"}
          multiline
          textAlignVertical="top"
          style={styles.textInput}
          accessibilityLabel="Descripción del reporte"
          maxFontSizeMultiplier={2}
        />
      ) : (
        <AudioRecorderField
          uri={value.audioUrl}
          onChange={(uri) => onChange({ ...value, audioUrl: uri })}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleButton: {
    flex: 1,
    flexBasis: 0,
  },
  textInput: {
    height: "auto",
    minHeight: 120,
    textAlignVertical: "top",
    paddingTop: 14,
    paddingBottom: 14,
  },
});
