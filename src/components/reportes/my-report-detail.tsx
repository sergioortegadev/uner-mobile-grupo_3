import { ThemedText } from "@/components/themed-text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { coloresOficiales } from "@/constants/theme";
import type { Foto, Reporte, Zona } from "@/types";
import { daysSince, formatDaysAgo } from "@/utils/date";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

interface MyReportDetailProps {
  reporte: Reporte;
  titulo: string;
  zona: Zona | null;
  pending: boolean;
  onShowQr: () => void;
}

const PhotoStrip = ({ title, fotos, label }: { title: string; fotos: Foto[]; label: string }) => {
  if (fotos.length === 0) return null;

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photos}>
        {fotos.map((foto, index) => (
          <Image
            key={foto.id}
            source={{ uri: foto.url }}
            style={styles.photo}
            contentFit="cover"
            transition={200}
            accessibilityLabel={`Foto ${index + 1} ${label}`}
          />
        ))}
      </ScrollView>
    </View>
  );
};

/** Detalle de solo lectura para el vecino (sin acciones del operador). */
export const MyReportDetail = ({ reporte, titulo, zona, pending, onShowQr }: MyReportDetailProps) => {
  const fotosProblema = reporte.fotos.filter((f) => f.momento !== "arreglo");
  const fotosArreglo = reporte.fotos.filter((f) => f.momento === "arreglo");

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>{titulo}</ThemedText>

      {pending ? (
        <ThemedText type="smallBold">Pendiente de envío</ThemedText>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {reporte.id}
          </ThemedText>
          <View style={styles.metaRow}>
            <StatusBadge status={reporte.estado} />
          </View>
        </>
      )}

      <ThemedText type="small" themeColor="textSecondary">
        {reporte.adhesiones} {reporte.adhesiones === 1 ? "vecino adherido" : "vecinos adheridos"}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {formatDaysAgo(daysSince(reporte.creadoEn))}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Zona: {zona?.nombre ?? reporte.zonaId}
      </ThemedText>

      {!pending && (
        <View style={styles.section}>
          <Pressable
            onPress={onShowQr}
            accessibilityRole="button"
            accessibilityLabel="Mostrar Qr"
            style={({ pressed }) => [styles.qrButton, pressed && styles.pressed]}
          >
            <Icon name="qr-code-outline" size={22} color={coloresOficiales.primario} />
            <ThemedText type="smallBold" style={{ color: coloresOficiales.primario }}>
              Mostrar Qr
            </ThemedText>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <ThemedText type="smallBold">Descripción</ThemedText>
        <ThemedText type="small">{reporte.descripcion?.trim() || "Sin descripción."}</ThemedText>
      </View>

      <PhotoStrip title="Fotos" fotos={fotosProblema} label="del problema" />
      <PhotoStrip title="Fotos reparado" fotos={fotosArreglo} label="del arreglo" />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { gap: 6 },
  title: { fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  section: { gap: 4, marginTop: 8 },
  photos: { gap: 12 },
  pressed: { opacity: 0.75 },
  qrButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: coloresOficiales.primario,
  },
  photo: { width: 200, aspectRatio: 4 / 3, borderRadius: 12 },
});
