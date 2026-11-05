import { CrewAssignForm } from "@/components/operador/crew-assign-form";
import { DuplicateForm } from "@/components/operador/duplicate-form";
import { ReportSummary } from "@/components/operador/report-summary";
import { StatusChangeForm } from "@/components/operador/status-change-form";
import { StatusHistory } from "@/components/operador/status-history";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Icon } from "@/components/ui/icon";
import { ErrorState, LoadingState } from "@/components/ui/state-views";
import { Spacing } from "@/constants/theme";
import { useOperatorReport } from "@/hooks/use-operator-report";
import { useTheme } from "@/hooks/use-theme";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ReporteOperadorScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const detail = useOperatorReport(id);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/(operador)"));

  const renderContent = () => {
    if (detail.isLoading || (detail.reporte && detail.reporte.id !== id)) {
      return <LoadingState message="Cargando reporte..." />;
    }

    if (detail.errorMessage || !detail.reporte) {
      return <ErrorState message={detail.errorMessage || "No encontramos el reporte."} onRetry={detail.retry} />;
    }

    return (
      <ScrollView key={detail.reporte.id} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ReportSummary reporte={detail.reporte} titulo={detail.titulo} zona={detail.zona} />
        <StatusChangeForm
          estadoActual={detail.reporte.estado}
          cuadrillas={detail.cuadrillas}
          isSubmitting={detail.isSubmitting}
          onSubmit={detail.cambiarEstado}
        />
        <CrewAssignForm
          reporte={detail.reporte}
          cuadrillas={detail.cuadrillas}
          isSubmitting={detail.isSubmitting}
          onSubmit={detail.asignarCuadrilla}
        />
        <DuplicateForm
          candidatos={detail.candidatos}
          isSubmitting={detail.isSubmitting}
          onSubmit={detail.marcarDuplicado}
        />
        <StatusHistory historial={detail.historial} />
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            onPress={goBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Volver a la bandeja"
          >
            <Icon name="chevron-back" size={28} color={theme.text} />
          </Pressable>
          <ThemedText type="subtitle" accessibilityRole="header">
            Detalle del reporte
          </ThemedText>
        </View>
        <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          {renderContent()}
        </KeyboardAvoidingView>
      </SafeAreaView>
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

export default ReporteOperadorScreen;
