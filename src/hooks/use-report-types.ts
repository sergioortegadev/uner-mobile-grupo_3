import { REPORT_TYPES } from "@/constants/report-types-static";

/** Tipos de reporte disponibles en el dispositivo (no requiere red). */
export function useReportTypes() {
    return { reportTypes: REPORT_TYPES };
}
