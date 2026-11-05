import { logDevError } from "@/helpers/log";
import * as ImagePicker from "expo-image-picker";
import { Alert, Linking } from "react-native";

/**
 * Captura de fotos con cámara o galería, con manejo de permisos.
 * Lo comparten el reporte del vecino (PhotoSelector) y el arreglo del operador.
 */
export function usePhotoPicker() {
  const [permission, requestPermission, getPermissionStatus] = ImagePicker.useCameraPermissions();

  const takeFromGallery = async (onPhoto: (uri: string) => void) => {
    // La galería usa el selector del sistema: no necesita permiso.
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });

    if (result.canceled) return;
    onPhoto(result.assets[0].uri);
  };

  const takePhoto = async (onPhoto: (uri: string) => void) => {
    // Rama 1: consultamos el permiso EN ESTE MOMENTO (pudo cambiar en la configuración del teléfono).
    let current = await getPermissionStatus();

    // Rama 2: no tenemos permiso.
    if (!current.granted) {
      if (!current.canAskAgain) {
        Alert.alert(
          "Permiso denegado",
          "No se puede solicitar el permiso de la cámara. Podés habilitarlo en la configuración o usar la galería.",
          [
            { text: "Usar galería", onPress: () => takeFromGallery(onPhoto) },
            { text: "Abrir configuración", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      current = await requestPermission();
      if (!current.granted) {
        Alert.alert("Sin acceso a la cámara", "Podés elegir una foto de la galería.");
        return;
      }
    }

    // Rama 3: tenemos permiso.
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });

      if (result.canceled) return;
      onPhoto(result.assets[0].uri);
    } catch (error) {
      logDevError("[usePhotoPicker] No se pudo abrir la cámara:", error);
      Alert.alert("No se pudo abrir la cámara", "Probá de nuevo o elegí una foto de la galería.");
    }
  };

  return { permission, takePhoto, takeFromGallery };
}
