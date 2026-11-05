import * as Haptics from "expo-haptics";

export type HapticEvent = "envioConfirmado" | "reporteCercano";

const PATRONES: Record<HapticEvent, () => Promise<void>> = {
  envioConfirmado: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  reporteCercano: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

export const vibrar = (evento: HapticEvent) => {
  PATRONES[evento]().catch(() => {});
};
