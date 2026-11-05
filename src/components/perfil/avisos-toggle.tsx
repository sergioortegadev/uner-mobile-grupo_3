import { ThemedText } from "@/components/themed-text";
import { useAuth } from "@/context/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { updateAvisosActivos } from "@/services/api/api-devices";
import { getPushPermission, isPushSupported, registerPushDevice } from "@/services/notifications";
import { useState } from "react";
import { Alert, Linking, StyleSheet, Switch, View } from "react-native";

/** Interruptor "Recibir avisos": se guarda en la API como `avisosActivos`. */
export const AvisosToggle = () => {
  const { user, updateUser } = useAuth();
  const theme = useTheme();
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const onChange = async (next: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      if (next && isPushSupported()) {
        // registerPushDevice pide el permiso del sistema (Android 13+) si falta.
        const registrado = await registerPushDevice();
        if (!registrado && (await getPushPermission()) === "denied") {
          Alert.alert(
            "Permiso de notificaciones",
            "Para recibir avisos, permití las notificaciones de la app en los ajustes del teléfono.",
            [
              { text: "Ahora no", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
            ],
          );
          return;
        }
      }
      await updateUser(await updateAvisosActivos(next));
    } catch (error) {
      Alert.alert("No se pudo guardar", error instanceof Error ? error.message : "Probá de nuevo en unos minutos.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.row, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <View style={styles.texts}>
        <ThemedText type="default">Recibir avisos</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Notificaciones sobre tus reportes
        </ThemedText>
      </View>
      <Switch
        testID="avisos-switch"
        accessibilityLabel="Recibir avisos"
        value={user.avisosActivos}
        onValueChange={onChange}
        disabled={saving}
        trackColor={{ true: theme.primary }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  texts: { flex: 1, gap: 2 },
});
