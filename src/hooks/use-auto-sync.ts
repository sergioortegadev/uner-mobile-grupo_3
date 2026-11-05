import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { logDevError } from "@/helpers/log";
import { registerBackgroundSyncAsync } from "@/services/background-sync";
import { isOnline, subscribeToNetworkChanges } from "@/services/network";
import { syncPendingReports } from "@/services/report-sending";

function runSync(): void {
  syncPendingReports().catch((error) => {
    logDevError("No se pudo sincronizar los reportes pendientes.", error);
  });
}

export function useAutoSync(): void {
  const wasOnlineRef = useRef<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    registerBackgroundSyncAsync();

    isOnline().then((online) => {
      if (cancelled) return;

      wasOnlineRef.current = online;

      if (online) {
        runSync();
      }
    });

    const unsubscribe = subscribeToNetworkChanges((online) => {
      if (cancelled) return;

      const wasOnline = wasOnlineRef.current;
      wasOnlineRef.current = online;

      if (online && wasOnline === false) {
        runSync();
      }
    });

    const appStateSubscription = AppState.addEventListener(
      "change",
      (nextState) => {
        if (cancelled) return;
        if (nextState === "active") {
          runSync();
        }
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
      appStateSubscription.remove();
    };
  }, []);
}
