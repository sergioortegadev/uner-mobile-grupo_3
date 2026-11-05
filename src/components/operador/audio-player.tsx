import { ThemedText } from "@/components/themed-text";
import { Icon } from "@/components/ui/icon";
import { useAudioPlayback } from "@/hooks/use-audio-playback";
import { useTheme } from "@/hooks/use-theme";
import { coloresOficiales } from "@/constants/theme";
import { formatDurationMillis } from "@/utils/date";
import { Pressable, StyleSheet, View } from "react-native";

/** Reproductor de solo lectura del audio grabado por el vecino. */
export const AudioPlayer = ({ uri }: { uri: string }) => {
  const theme = useTheme();
  const { isPlaying, positionMillis, durationMillis, error, toggle } = useAudioPlayback(uri);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggle}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? "Pausar audio del vecino" : "Escuchar audio del vecino"}
        style={[styles.row, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
      >
        <Icon
          name={isPlaying ? "pause-circle-outline" : "play-circle-outline"}
          size={36}
          color={coloresOficiales.primario}
        />
        <View style={styles.texts}>
          <ThemedText type="smallBold">{isPlaying ? "Reproduciendo…" : "Escuchar audio del vecino"}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {formatDurationMillis(positionMillis)} / {formatDurationMillis(durationMillis)}
          </ThemedText>
        </View>
      </Pressable>
      {error && (
        <ThemedText type="small" style={{ color: coloresOficiales.rechazado }}>
          {error}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  texts: { flex: 1 },
});
