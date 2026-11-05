import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { coloresOficiales } from "@/constants/theme";
import { usePhotoPicker } from "@/hooks/use-photo-picker";
import { Image } from "expo-image";
import { Alert, StyleSheet, View } from "react-native";

interface RepairPhotoFieldProps {
  uri: string | null;
  onChange: (uri: string | null) => void;
  disabled?: boolean;
  error?: string | null;
}

/** OP09: foto del arreglo (obligatoria al resolver), tomada con la cámara o elegida de la galería. */
export const RepairPhotoField = ({ uri, onChange, disabled = false, error }: RepairPhotoFieldProps) => {
  const { permission, takePhoto, takeFromGallery } = usePhotoPicker();

  const confirmRemove = () =>
    Alert.alert("¿Quitar foto?", undefined, [
      { text: "Aceptar", onPress: () => onChange(null) },
      { text: "Cancelar", style: "cancel" },
    ]);

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">Foto del arreglo (obligatoria)</ThemedText>

      {uri && (
        <Image
          source={{ uri }}
          style={styles.photo}
          contentFit="cover"
          transition={200}
          accessibilityLabel="Foto del arreglo"
        />
      )}

      <View style={styles.buttonsRow}>
        <Button
          title={uri ? "Cambiar (cámara)" : "Tomar foto"}
          size="mediano"
          variant="primario"
          disabled={disabled || !permission}
          onPress={() => takePhoto(onChange)}
          accessibilityLabel="Tomar foto del arreglo con la cámara"
          style={styles.button}
        />
        <Button
          title="Galería"
          size="mediano"
          variant="contorno"
          disabled={disabled}
          onPress={() => takeFromGallery(onChange)}
          accessibilityLabel="Elegir foto del arreglo de la galería"
          style={styles.button}
        />
      </View>

      {uri && <Button title="Quitar foto" size="mediano" variant="texto" disabled={disabled} onPress={confirmRemove} />}

      {error && (
        <ThemedText type="small" style={{ color: coloresOficiales.rechazado }}>
          ✖ {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  photo: { width: "100%", aspectRatio: 4 / 3, borderRadius: 12 },
  buttonsRow: { flexDirection: "row", gap: 8 },
  button: { flex: 1 },
});
