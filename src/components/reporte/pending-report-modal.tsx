import { ThemedText } from "@/components/themed-text";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { coloresOficiales, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Image } from "expo-image";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedView } from "../themed-view";

/** Datos que la pantalla Reportar ya resolvió para el aviso de reporte pendiente. */
export interface PendingReportSummary {
  codigo: string;
  tipoNombre: string;
  direccion: string;
  fotoUri?: string | null;
}

export interface PendingReportModalProps {
  data: PendingReportSummary | null;
  onGoToMap: () => void;
  onGoToMyReports: () => void;
}

export const PendingReportModal = ({
  data,
  onGoToMap,
  onGoToMyReports,
}: PendingReportModalProps) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [photoFailed, setPhotoFailed] = useState(false);

  if (!data) return null;

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onGoToMap}
    >
      <View
        style={[styles.screen, { backgroundColor: theme.background }]}
        accessibilityViewIsModal
      >
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: coloresOficiales.primario,
              paddingTop: Math.max(insets.top, Spacing.three) + Spacing.one,
            },
          ]}
        >
          <ThemedText
            type="subtitle"
            style={styles.headerTitle}
            accessibilityRole="header"
          >
            Reporte pendiente
          </ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                Math.max(insets.bottom, Spacing.three) + Spacing.two,
            },
          ]}
        >
          <View style={styles.cards}>
            <Card style={styles.cardContent}>
              {data.fotoUri && !photoFailed ? (
                <Image
                  source={{ uri: data.fotoUri }}
                  style={styles.thumbnail}
                  contentFit="cover"
                  transition={200}
                  onError={() => setPhotoFailed(true)}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`Foto del reporte de ${data.tipoNombre}`}
                />
              ) : (
                <View
                  style={[
                    styles.thumbnailPlaceholder,
                    { backgroundColor: theme.background },
                  ]}
                >
                  <Icon
                    name="image-outline"
                    size={36}
                    color={theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Sin foto adjunta
                  </ThemedText>
                </View>
              )}

              <ThemedText type="default" style={styles.cardTitle}>
                {data.tipoNombre} · {data.direccion}
              </ThemedText>

              <View style={styles.statusRow}>
                <ThemedView style={styles.statusBox}>
                  <Icon
                    name="time-outline"
                    size={16}
                    color={theme.textSecondary}
                  />
                  <ThemedText type="small" themeColor="textSecondary">
                    Pendiente de envío
                  </ThemedText>
                </ThemedView>
              </View>
            </Card>

            <Card style={styles.cardContent}>
              <ThemedText
                type="default"
                style={styles.cardTitle}
                accessibilityRole="header"
              >
                Guardado en el teléfono
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Se enviará solo. No hace falta que hagas nada.
              </ThemedText>
            </Card>

            <Card style={styles.cardContent}>
              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  Código provisorio
                </ThemedText>
                <ThemedText type="code" style={styles.codeValue} selectable>
                  {data.codigo}
                </ThemedText>
              </View>

              <View>
                <ThemedText type="small" themeColor="textSecondary">
                  Número de seguimiento
                </ThemedText>
                <ThemedText type="default" themeColor="textSecondary">
                  Se asigna al enviarse
                </ThemedText>
              </View>
            </Card>
          </View>

          <View style={styles.actions}>
            <Button
              title="Volver al mapa"
              variant="accion"
              size="grande"
              onPress={onGoToMap}
            />
            <Button
              title="Ver mis reportes"
              variant="contorno"
              size="grande"
              onPress={onGoToMyReports}
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  headerBar: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  headerTitle: {
    color: coloresOficiales.superficie,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: Spacing.three,
  },
  cards: {
    flexGrow: 1,
  },
  cardContent: {
    gap: Spacing.two,
  },
  thumbnail: {
    width: "100%",
    height: 140,
    borderRadius: Spacing.two,
  },
  thumbnailPlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: Spacing.two,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.one,
  },
  cardTitle: {
    fontWeight: "700",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
  statusBox: {
    borderStyle: "dashed",
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
  },
  codeValue: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
});
