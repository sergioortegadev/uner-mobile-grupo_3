import { InboxFilterBar } from "@/components/operador/inbox-filter-bar";
import { ReportCard } from "@/components/operador/report-card";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { useOperatorInbox } from "@/hooks/use-operator-inbox";
import { getReportTitle } from "@/utils/report-format";
import { useRouter } from "expo-router";
import { FlatList, RefreshControl, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BandejaOperadorScreen = () => {
  const router = useRouter();
  const inbox = useOperatorInbox();

  const renderContent = () => {
    if (inbox.isLoading) {
      return <LoadingState message="Cargando reportes..." />;
    }

    if (inbox.errorMessage && inbox.reportes.length === 0) {
      return <ErrorState message={inbox.errorMessage} onRetry={inbox.retry} />;
    }

    return (
      <FlatList
        data={inbox.reportes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={inbox.isRefreshing} onRefresh={inbox.refresh} />}
        renderItem={({ item }) => (
          <ReportCard
            reporte={item}
            titulo={getReportTitle(item, inbox.tipos)}
            onPress={() => router.push({ pathname: "/(operador)/reporte/[id]", params: { id: item.id } })}
          />
        )}
        ListEmptyComponent={
          inbox.hasActiveFilters ? (
            <EmptyState
              icon="file-tray-outline"
              message="Ningún reporte coincide con los filtros."
              actionLabel="Quitar filtros"
              onAction={inbox.clearFilters}
            />
          ) : (
            <EmptyState icon="file-tray-outline" message="Todavía no hay reportes." />
          )
        }
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <ThemedText type="subtitle" accessibilityRole="header">
            Gestión de reportes
          </ThemedText>
          <InboxFilterBar
            filters={inbox.filters}
            tipos={inbox.tipos}
            zonas={inbox.zonas}
            onChange={inbox.setFilter}
            onClear={inbox.clearFilters}
          />
        </View>
        {renderContent()}
      </SafeAreaView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two, paddingBottom: Spacing.two, gap: Spacing.two },
  list: { flexGrow: 1, paddingHorizontal: Spacing.three, paddingBottom: Spacing.four },
});

export default BandejaOperadorScreen;
