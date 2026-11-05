import { useAuth } from "@/context/auth-context";
import { registerPushDevice, routeForNotification } from "@/services/notifications";
import { updatePreferences } from "@/services/storage/preferences";
import * as Notifications from "expo-notifications";
import { Href, useRouter, useSegments } from "expo-router";
import { useEffect, useRef } from "react";

/**
 * Push (Android): registra el token Expo tras el ingreso y abre el detalle del reporte cuando el
 * usuario toca una notificación (app abierta, en segundo plano o cerrada).
 * Va dentro de `AuthProvider`.
 */
export function usePushNotifications() {
  const { user, isLocked } = useAuth();
  const router = useRouter();
  const segments = useSegments() as string[];
  // `undefined` mientras carga; `null` si la app no se abrió desde una notificación.
  const response = Notifications.useLastNotificationResponse();
  const pendingData = useRef<Record<string, unknown> | null>(null);
  const handledIds = useRef(new Set<string>());

  const userId = user?.id;
  const avisosActivos = user?.avisosActivos;

  useEffect(() => {
    if (!userId) return;
    void registerPushDevice();
  }, [userId]);

  // El interruptor local sigue lo que quedó guardado en la API (fuente de verdad: avisosActivos).
  useEffect(() => {
    if (avisosActivos === undefined) return;
    void updatePreferences({ notificacionesActivas: avisosActivos }).catch(() => undefined);
  }, [avisosActivos]);

  useEffect(() => {
    if (response && response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      const id = response.notification.request.identifier;
      if (!handledIds.current.has(id)) {
        handledIds.current.add(id);
        pendingData.current = response.notification.request.content.data ?? {};
        Notifications.clearLastNotificationResponse();
      }
    }

    // Se navega recién con sesión liberada (biometría) y dentro del grupo de su rol, para que la
    // redirección de NavigationGuard no pise la apertura del detalle.
    if (!pendingData.current || !user || isLocked) return;
    const grupo = user.rol === "operador" ? "(operador)" : "(vecino)";
    if (segments[0] !== grupo) return;
    const route = routeForNotification(pendingData.current, user.rol);
    pendingData.current = null;
    if (route) router.push(route as Href);
  }, [response, user, isLocked, segments, router]);
}
