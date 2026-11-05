import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { coloresOficiales, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface QrModalProps {
  /** Texto a codificar (id del reporte). Con null el modal está cerrado. */
  value: string | null;
  onClose: () => void;
}

export const QrModal = ({ value, onClose }: QrModalProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={value !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.screen, { backgroundColor: theme.background }]} accessibilityViewIsModal>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, Spacing.three) }]}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cerrar código QR"
          >
            <Icon name="close" size={30} color={theme.text} />
          </Pressable>
        </View>

        {value !== null && (
          <View style={styles.body}>
            <ThemedText type="subtitle" style={styles.center}>
              {value}
            </ThemedText>
            <View style={styles.qrBox} accessibilityLabel={`Código QR del reporte ${value}`}>
              <QRCode value={value} size={240} color={coloresOficiales.tinta} backgroundColor="#FFFFFF" />
            </View>
            <ThemedText themeColor="textSecondary" style={styles.center}>
              Con este Qr en la municipalidad encuentran tu reporte más fácil
            </ThemedText>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: Spacing.three },
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: Spacing.four, padding: Spacing.four },
  qrBox: { backgroundColor: "#FFFFFF", padding: Spacing.three, borderRadius: 16 },
  center: { textAlign: "center" },
});
