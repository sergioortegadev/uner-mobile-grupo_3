import { MyReportCard } from "@/components/reportes/my-report-card";
import { QrModal } from "@/components/reportes/qr-modal";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { useMyReports } from "@/hooks/use-my-reports";
import { useQrModal } from "@/hooks/use-qr-modal";
import { getReportTitle } from "@/utils/report-format";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MisReportesScreen = () => {
  const router = useRouter();
  const myReports = useMyReports();
  const qr = useQrModal();

  const renderContent = () => {
    if (myReports.isLoading) {
      return <LoadingState message="Cargando tus reportes..." />;
    }

    if (myReports.errorMessage && myReports.items.length === 0) {
      return <ErrorState message={myReports.errorMessage} onRetry={myReports.retry} />;
    }

    return (
      <FlatList
        data={myReports.items}
        keyExtractor={(item) => item.routeId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={myReports.isRefreshing} onRefresh={myReports.refresh} />}
        renderItem={({ item }) => (
          <MyReportCard
            reporte={item.reporte}
            titulo={getReportTitle(item.reporte, myReports.tipos)}
            displayId={item.displayId}
            pending={item.pending}
            onPress={() => router.push({ pathname: "/(vecino)/reporte/[id]", params: { id: item.routeId } })}
            onShowQr={() => qr.open(item.displayId)}
          />
        )}
        ListEmptyComponent={<EmptyState icon="file-tray-outline" message="Todavía no tenés reportes" />}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <ThemedText type="subtitle" accessibilityRole="header">
            Mis reportes
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
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two },
  list: { flexGrow: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
});

export default MisReportesScreen;
