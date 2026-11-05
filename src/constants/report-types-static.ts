import type { TipoDeReporte } from "@/types";

/**
 * Catálogo de tipos de reporte embebido en la app.
 * Permite crear reportes sin conexión: no se descarga de la API y solo cambia
 * al publicar una nueva versión (o actualización) de la aplicación.
 * Los ids deben coincidir con los de la tabla de tipos del backend.
 */
export const REPORT_TYPES: readonly TipoDeReporte[] = [
  {
    id: "tip-agua",
    nombre: "Agua y Cloacas",
    icono: "water-outline",
    color: "#01579B",
    areaResponsable: "Obras Sanitarias",
  },
  {
    id: "tip-luminaria",
    nombre: "Alumbrado Público",
    icono: "bulb-outline",
    color: "#F57F17",
    areaResponsable: "Electrotecnia",
  },
  {
    id: "tip-bache",
    nombre: "Bacheo y Calzada",
    icono: "car-outline",
    color: "#E65100",
    areaResponsable: "Obras Públicas",
  },
  {
    id: "tip-higiene",
    nombre: "Higiene y Maleza",
    icono: "leaf-outline",
    color: "#33691E",
    areaResponsable: "Higiene Urbana",
  },
  {
    id: "tip-otro",
    nombre: "Otro",
    icono: "construct-outline",
    color: "#888888",
    areaResponsable: " ",
  },
  {
    id: "tip-semaforo",
    nombre: "Semaforo",
    icono: "radio-button-on-outline",
    color: "#14ca23",
    areaResponsable: "Red Semaforica",
  },
];

/** Nombre que se muestra si un reporte trae un tipo que esta versión de la app no conoce. */
export const UNKNOWN_REPORT_TYPE_NAME = "Otro";
