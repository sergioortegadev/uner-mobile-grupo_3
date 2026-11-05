import { REPORT_TYPES } from "@/constants/report-types-static";
import { logDevError } from "@/helpers/log";
import { reportService } from "@/services/reports";
import type { EstadoReporte, Reporte, Zona } from "@/types";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";

export interface InboxFilters {
  estado: EstadoReporte | null;
  tipoId: string | null;
  zonaId: string | null;
}

export const EMPTY_INBOX_FILTERS: InboxFilters = { estado: null, tipoId: null, zonaId: null };

/** OP01–OP04: lista de la bandeja con filtros por estado, tipo y zona. */
export function useOperatorInbox() {
  const [filters, setFilters] = useState<InboxFilters>(EMPTY_INBOX_FILTERS);
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const tipos = REPORT_TYPES;
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const requestRef = useRef(0);

  const hasActiveFilters = filters.estado !== null || filters.tipoId !== null || filters.zonaId !== null;

  // Catálogo de zonas para los filtros (los tipos están en el dispositivo)
  useEffect(() => {
    reportService
      .getZones()
      .then((zonasRes) => {
        setZonas(zonasRes);
      })
      .catch((error: unknown) => {
        logDevError("Error al cargar las zonas:", error);
        setErrorMessage("No pudimos cargar los filtros. Revisá tu conexión e intentá de nuevo.");
      });
  }, []);

  const fetchReports = useCallback(async (current: InboxFilters) => {
    const requestId = ++requestRef.current;
    try {
      const lista = await reportService.getReports({
        estado: current.estado ?? undefined,
        tipoId: current.tipoId ?? undefined,
        zonaId: current.zonaId ?? undefined,
      });
      // Ignorar respuestas viejas si el operador cambió los filtros mientras cargaba
      if (requestId !== requestRef.current) return;
      setReportes(lista);
      setErrorMessage("");
    } catch (error) {
      if (requestId !== requestRef.current) return;
      logDevError("Error al cargar la bandeja:", error);
      setErrorMessage("No pudimos cargar los reportes. Revisá tu conexión e intentá de nuevo.");
    } finally {
      if (requestId === requestRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Carga al entrar, al cambiar filtros y al volver del detalle (los datos pudieron cambiar)
  useFocusEffect(
    useCallback(() => {
      void fetchReports(filters);
    }, [fetchReports, filters]),
  );

  const setFilter = (key: keyof InboxFilters, value: string | null) => {
    setIsLoading(true);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    if (!hasActiveFilters) return;
    setIsLoading(true);
    setFilters(EMPTY_INBOX_FILTERS);
  };

  const refresh = () => {
    setIsRefreshing(true);
    void fetchReports(filters);
  };

  const retry = () => {
    setIsLoading(true);
    setErrorMessage("");
    void fetchReports(filters);
  };

  return {
    reportes,
    tipos,
    zonas,
    filters,
    hasActiveFilters,
    setFilter,
    clearFilters,
    isLoading,
    isRefreshing,
    errorMessage,
    refresh,
    retry,
  };
}
