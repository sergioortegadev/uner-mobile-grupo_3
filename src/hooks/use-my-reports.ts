import { REPORT_TYPES } from "@/constants/report-types-static";
import { useAuth } from "@/context/auth-context";
import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import { getPendingReports } from "@/services/storage/pending-reports-storage";
import type { Reporte } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export interface MyReportItem {
  /** Reporte tal cual lo cargó el usuario o lo devolvió el servicio. */
  reporte: Reporte;
  /** Pendiente de envío: no tiene id (se muestra vacío) ni QR. */
  pending: boolean;
  /** Id que viaja en la ruta del detalle (el id del servidor o el id local). */
  routeId: string;
  /** Id visible: string vacío si está pendiente. */
  displayId: string;
}

/** R01: reportes del usuario autenticado (pendientes arriba, luego el orden del servicio). */
export function useMyReports() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [items, setItems] = useState<MyReportItem[]>([]);
  const tipos = REPORT_TYPES;
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }
    try {
      const [remotos, locales] = await Promise.all([
        reportService.getReports({ autorId: userId }),
        getPendingReports(),
      ]);

      const pendientes: MyReportItem[] = locales
        .filter((p) => p.reporte.autorId === userId)
        .map((p) => ({ reporte: p.reporte, pending: true, routeId: p.localId, displayId: "" }));
      const enviados: MyReportItem[] = remotos.map((r) => ({
        reporte: r,
        pending: false,
        routeId: r.id,
        displayId: r.id,
      }));

      setItems([...pendientes, ...enviados]);
      setErrorMessage("");
    } catch (error) {
      logDevError("Error al cargar mis reportes:", error);
      setErrorMessage("No pudimos cargar tus reportes. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const refresh = () => {
    setIsRefreshing(true);
    void load();
  };

  const retry = () => {
    setIsLoading(true);
    setErrorMessage("");
    void load();
  };

  return { items, tipos, isLoading, isRefreshing, errorMessage, refresh, retry };
}
