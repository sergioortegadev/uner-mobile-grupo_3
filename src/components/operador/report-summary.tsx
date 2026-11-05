import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import type { Reporte, Zona } from "@/types";
import { daysSince, formatDaysAgo } from "@/utils/date";
import { Image } from "expo-image";
import { ScrollView, StyleSheet, View } from "react-native";
import { AudioPlayer } from "./audio-player";

interface ReportSummaryProps {
  reporte: Reporte;
  titulo: string;
  zona: Zona | null;
}

/** Cabecera del detalle: datos del reporte, descripción, fotos y audio del vecino. */
export const ReportSummary = ({ reporte, titulo, zona }: ReportSummaryProps) => {
  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>{titulo}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {reporte.id}
      </ThemedText>

      <View style={styles.metaRow}>
        <StatusBadge status={reporte.estado} />
        {reporte.adhesiones > 0 && (
          <ThemedText type="small" themeColor="textSecondary">
            +{reporte.adhesiones} {reporte.adhesiones === 1 ? "vecino" : "vecinos"}
          </ThemedText>
        )}
        <ThemedText type="small" themeColor="textSecondary">
          {formatDaysAgo(daysSince(reporte.creadoEn))}
        </ThemedText>
      </View>

      <ThemedText type="small" themeColor="textSecondary">
        Zona: {zona?.nombre ?? reporte.zonaId}
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="smallBold">Descripción</ThemedText>
        <ThemedText type="small">{reporte.descripcion?.trim() || "El vecino no agregó una descripción."}</ThemedText>
      </View>

      {reporte.audioUrl && (
        <View style={styles.section}>
          <ThemedText type="smallBold">Audio del vecino</ThemedText>
          <AudioPlayer uri={reporte.audioUrl} />
        </View>
      )}

      {reporte.fotos.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="smallBold">Fotos</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
            {reporte.fotos.map((foto, index) => (
              <View key={foto.id} style={styles.photoItem}>
                <Image
                  source={{ uri: foto.url }}
                  style={styles.photo}
                  contentFit="cover"
                  transition={200}
                  accessibilityLabel={`Foto ${index + 1} ${foto.momento === "arreglo" ? "del arreglo" : "del problema"}`}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {foto.momento === "arreglo" ? "Arreglo" : "Problema"}
                </ThemedText>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 6 },
  title: { fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 4 },
  section: { gap: 4, marginTop: 8 },
  photos: { gap: 12 },
  photoItem: { gap: 4 },
  photo: { width: 200, aspectRatio: 4 / 3, borderRadius: 12 },
});
