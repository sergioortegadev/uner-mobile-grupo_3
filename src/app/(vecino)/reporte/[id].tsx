import { MyReportDetail } from "@/components/reportes/my-report-detail";
import { QrModal } from "@/components/reportes/qr-modal";
import { StatusTimeline } from "@/components/reportes/status-timeline";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Icon } from "@/components/ui/icon";
import { ErrorState, LoadingState } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { useMyReportDetail } from "@/hooks/use-my-report-detail";
import { useQrModal } from "@/hooks/use-qr-modal";
import { useTheme } from "@/hooks/use-theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const DetalleReporteVecinoScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const detail = useMyReportDetail(id);
  const qr = useQrModal();

  const goBack = () => router.replace("/(vecino)/mis-reportes");

  const renderContent = () => {
    if (detail.isLoading) {
      return <LoadingState message="Cargando reporte..." />;
    }

    if (detail.errorMessage || !detail.reporte) {
      return <ErrorState message={detail.errorMessage || "No encontramos el reporte."} onRetry={detail.retry} />;
    }

    return (
      <ScrollView contentContainerStyle={styles.content}>
        <MyReportDetail
          reporte={detail.reporte}
          titulo={detail.titulo}
          zona={detail.zona}
          pending={detail.pending}
          onShowQr={() => qr.open(detail.reporte?.id ?? "")}
        />
        <StatusTimeline historial={detail.historial} />
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable onPress={goBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Volver a mis reportes">
            <Icon name="chevron-back" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" accessibilityRole="header">
            Detalle del reporte
          </ThemedText>
        </View>
        {renderContent()}
      </SafeAreaView>
      <QrModal {...qr.modalProps} />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  content: { padding: Spacing.three, paddingBottom: Spacing.five, gap: Spacing.three },
});

export default DetalleReporteVecinoScreen;
