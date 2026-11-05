import { requiresComment, isOpenStatus } from "@/constants/report";
import { REPORT_TYPES } from "@/constants/report-types-static";
import { useAuth } from "@/context/auth-context";
import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import type { CambioDeEstado, Cuadrilla, EstadoReporte, Reporte, Zona } from "@/types";
import { buildDuplicateComment, getReportTitle } from "@/utils/report-format";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

export interface ChangeStatusInput {
  estado: EstadoReporte;
  comentario: string;
  cuadrillaId: string | null;
  fotoUri: string | null;
}

export interface DuplicateCandidate {
  reporte: Reporte;
  titulo: string;
}

/** OP05–OP09: carga el reporte y expone las acciones del operador sobre él. */
export function useOperatorReport(reportId: string) {
  const { user } = useAuth();
  const operatorId = user?.id ?? null;

  const [reporte, setReporte] = useState<Reporte | null>(null);
  const tipos = REPORT_TYPES;
  const [zona, setZona] = useState<Zona | null>(null);
  const [cuadrillas, setCuadrillas] = useState<Cuadrilla[]>([]);
  const [historial, setHistorial] = useState<CambioDeEstado[]>([]);
  const [candidatos, setCandidatos] = useState<DuplicateCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const actual = await reportService.getReportById(reportId);
      if (!actual) {
        setErrorMessage("No encontramos el reporte.");
        return;
      }

      const [zonasRes, crewsRes, historyRes, sameZoneAndType] = await Promise.all([
        reportService.getZones(),
        reportService.getCrews(actual.zonaId),
        reportService.getStatusHistory(reportId),
        reportService.getReports({ tipoId: actual.tipoId, zonaId: actual.zonaId }),
      ]);

      setReporte(actual);
      setZona(zonasRes.find((z) => z.id === actual.zonaId) ?? null);
      setCuadrillas(crewsRes);
      setHistorial(historyRes);
      // Duplicados posibles: mismo tipo y zona, aún abiertos, y distintos del reporte actual
      setCandidatos(
        sameZoneAndType
          .filter((r) => r.id !== actual.id && isOpenStatus(r.estado))
          .map((r) => ({ reporte: r, titulo: getReportTitle(r, tipos) })),
      );
      setErrorMessage("");
    } catch (error) {
      logDevError("Error al cargar el reporte:", error);
      setErrorMessage("No pudimos cargar el reporte. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, [reportId, tipos]);

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

  const run = async (action: () => Promise<unknown>, successMessage: string): Promise<ActionResult> => {
    setIsSubmitting(true);
    try {
      await action();
      await load();
      return { ok: true, message: successMessage };
    } catch (error) {
      logDevError("Error en la acción del operador:", error);
      return { ok: false, message: error instanceof Error ? error.message : "No se pudo completar la acción." };
    } finally {
      setIsSubmitting(false);
    }
  };

  /** OP05 + OP06 (+ OP09 al resolver): cambia el estado con su comentario. */
  const cambiarEstado = async ({ estado, comentario, cuadrillaId, fotoUri }: ChangeStatusInput): Promise<ActionResult> => {
    const comment = comentario.trim();

    if (requiresComment(estado) && !comment) {
      return { ok: false, message: "El comentario es obligatorio para resolver o rechazar un reporte." };
    }

    if (estado === "resuelto" && !fotoUri) {
      return { ok: false, message: "La foto del arreglo es obligatoria para resolver un reporte." };
    }

    if (estado === "asignado") {
      if (!cuadrillaId) {
        return { ok: false, message: "Elegí una cuadrilla para asignar el reporte." };
      }
      return run(
        () => reportService.assignCrew(reportId, cuadrillaId, operatorId, comment || null),
        "Se asignó la cuadrilla y el reporte quedó asignado.",
      );
    }

    return run(
      () => reportService.updateReportStatus(reportId, estado, comment || null, operatorId, estado === "resuelto" ? fotoUri : null),
      "Se actualizó el estado del reporte.",
    );
  };

  /** OP07: asignar cuadrilla (el reporte pasa a 'asignado'). */
  const asignarCuadrilla = (cuadrillaId: string): Promise<ActionResult> =>
    run(() => reportService.assignCrew(reportId, cuadrillaId, operatorId), "Se asignó la cuadrilla al reporte.");

  /** OP08: marcar como duplicado de otro reclamo (el reporte pasa a 'rechazado'). */
  const marcarDuplicado = async (originalId: string): Promise<ActionResult> => {
    const original = candidatos.find((c) => c.reporte.id === originalId);
    if (!original) {
      return { ok: false, message: "El reclamo seleccionado ya no está disponible." };
    }
    return run(
      () =>
        reportService.markAsDuplicate(
          reportId,
          original.reporte.id,
          buildDuplicateComment(original.reporte.id, original.titulo),
          operatorId,
        ),
      "El reclamo quedó marcado como duplicado y rechazado.",
    );
  };

  return {
    reporte,
    titulo: reporte ? getReportTitle(reporte, tipos) : "",
    zona,
    cuadrillas,
    historial,
    candidatos,
    isLoading,
    isSubmitting,
    errorMessage,
    retry,
    cambiarEstado,
    asignarCuadrilla,
    marcarDuplicado,
  };
}
