import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import { getLocalReportById } from "@/services/storage/pending-reports-storage";
import { REPORT_TYPES } from "@/constants/report-types-static";
import type { CambioDeEstado, Reporte, Zona } from "@/types";
import { getReportTitle } from "@/utils/report-format";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

/** R02 + R03: detalle de solo lectura de un reporte propio (enviado o pendiente) con su historial. */
export function useMyReportDetail(routeId: string) {
  const [reporte, setReporte] = useState<Reporte | null>(null);
  const [pending, setPending] = useState(false);
  const tipos = REPORT_TYPES;
  const [zona, setZona] = useState<Zona | null>(null);
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const local = await getLocalReportById(routeId);
      const zonasRes = await reportService.getZones();

      if (local && !local.reporte.sincronizado) {
        setReporte(local.reporte);
        setPending(true);
        setHistorial([]);
        setZona(zonasRes.find((z) => z.id === local.reporte.zonaId) ?? null);
        setErrorMessage("");
        return;
      }

      const actual = await reportService.getReportById(routeId);
      if (!actual) {
        setErrorMessage("No encontramos el reporte.");
        return;
      }
      const historyRes = await reportService.getStatusHistory(routeId);

      setReporte(actual);
      setPending(false);
      setZona(zonasRes.find((z) => z.id === actual.zonaId) ?? null);
      setHistorial(historyRes);
      setErrorMessage("");
    } catch (error) {
      logDevError("Error al cargar el detalle del reporte:", error);
      setErrorMessage("No pudimos cargar el reporte. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [routeId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const retry = () => {
    setIsLoading(true);
    setErrorMessage("");
    void load();
  };

  return {
    reporte,
    pending,
    titulo: reporte ? getReportTitle(reporte, tipos) : "",
    zona,
    historial,
    isLoading,
    errorMessage,
    retry,
  };
}
