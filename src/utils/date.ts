const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Días de calendario transcurridos desde `iso` hasta `now` (nunca negativo). */
export const daysSince = (iso: string, now: Date = new Date()): number => {
  const diff = startOfDay(now) - startOfDay(new Date(iso));
  return Math.max(0, Math.round(diff / MS_PER_DAY));
};

/** "hoy" / "hace 1 día" / "hace N días". */
export const formatDaysAgo = (days: number): string => {
  if (days === 0) return "hoy";
  if (days === 1) return "hace 1 día";
  return `hace ${days} días`;
};

/** Milisegundos -> "m:ss". */
export const formatDurationMillis = (millis: number): string => {
  const totalSeconds = Math.floor(millis / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};
