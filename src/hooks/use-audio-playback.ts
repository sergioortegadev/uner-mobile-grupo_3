import { logDevError } from "@/helpers/log";
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

const PLAYBACK_AUDIO_MODE = { playsInSilentMode: true, allowsRecording: false } as const;
const NEAR_END_THRESHOLD_SECONDS = 0.2;

const secondsToMillis = (seconds?: number | null): number => Math.round((seconds || 0) * 1000);

/** Reproducción de un audio existente (solo lectura), por ejemplo el del vecino. */
export function useAudioPlayback(uri: string) {
  const [error, setError] = useState<string | null>(null);
  const player = useAudioPlayer({ uri }, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const playerRef = useRef(player);

  useEffect(() => {
    playerRef.current = player;
  }, [player]);

  // Al terminar, volver al inicio para poder reproducir de nuevo
  useEffect(() => {
    if (!status.playing && status.didJustFinish) {
      player.seekTo(0).catch(() => {});
    }
  }, [player, status.didJustFinish, status.playing]);

  // Pausar al salir de la pantalla (cambio de tab o navegación)
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          playerRef.current.pause();
        } catch {
          // El player ya pudo haberse liberado
        }
      };
    }, []),
  );

  const toggle = async () => {
    try {
      setError(null);
      if (status.playing) {
        player.pause();
        return;
      }

      await setAudioModeAsync(PLAYBACK_AUDIO_MODE);
      const isNearEnd =
        status.duration > 0 && Math.abs(status.currentTime - status.duration) < NEAR_END_THRESHOLD_SECONDS;
      if (status.didJustFinish || isNearEnd) {
        await player.seekTo(0);
      }
      player.play();
    } catch (err) {
      logDevError("useAudioPlayback.toggle error:", err);
      setError("No se pudo reproducir el audio.");
    }
  };

  return {
    isPlaying: status.playing,
    positionMillis: secondsToMillis(status.currentTime),
    durationMillis: secondsToMillis(status.duration),
    error,
    toggle,
  };
}
