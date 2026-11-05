/**
 * M04: la pantalla de cercanos le avisa al formulario qué decidió el vecino
 * - "continuar": "No es ninguno, seguir" -> el formulario envía el reporte
 * - "adherido": se sumó a un reporte existente -> el formulario se limpia
 */
export type NearbyDecision = "continuar" | "adherido";

let decision: NearbyDecision | null = null;

export const setNearbyDecision = (value: NearbyDecision) => {
  decision = value;
};

export const takeNearbyDecision = (): NearbyDecision | null => {
  const value = decision;
  decision = null;
  return value;
};
