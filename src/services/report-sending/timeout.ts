/** Tiempo máximo que esperamos la confirmación del servicio antes de encolar. */
export const SEND_TIMEOUT_MS = 10_000;

/** Resultado de una llamada con tiempo máximo: valor recibido o espera agotada. */
export type TimedResult<T> = { timedOut: false; value: T } | { timedOut: true };


export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = SEND_TIMEOUT_MS,
): Promise<TimedResult<T>> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const deadline = new Promise<TimedResult<T>>((resolve) => {
    timer = setTimeout(() => resolve({ timedOut: true }), ms);
  });
  const settled = promise.then(
    (value): TimedResult<T> => ({ timedOut: false, value }),
  );

  return Promise.race([settled, deadline]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}
