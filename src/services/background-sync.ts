import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { logDevError } from '@/helpers/log';
import { syncPendingReports } from '@/services/report-sending';

export const BACKGROUND_SYNC_TASK = 'sync-pending-reports';

/** Intervalo mínimo entre corridas; el sistema puede demorarla más. 15 minutos es el mínimo aceptado. */
export const BACKGROUND_SYNC_INTERVAL_MINUTES = 15;

/**
 * Vacía la cola de reportes pendientes desde el trabajo en segundo plano.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    await syncPendingReports();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    logDevError('No se pudo sincronizar los reportes pendientes en segundo plano.', error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

if (__DEV__) {
  console.log(
    `[background-sync] módulo evaluado: tarea "${BACKGROUND_SYNC_TASK}" definida.`
  );
}

/**
 * Registra la sincronización periódica en segundo plano cuando el sistema la permite.
 * un registro fallido solo se registra en el log de desarrollo.
 */
export async function registerBackgroundSyncAsync(): Promise<void> {
  try {
    if (!(await TaskManager.isAvailableAsync())) {
      if (__DEV__) {
        console.log('[background-sync] TaskManager no disponible: la tarea no se registra.');
      }
      return;
    }

    const status = await BackgroundTask.getStatusAsync();

    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      if (__DEV__) {
        console.log(
          `[background-sync] Estado de segundo plano ${status} (no Available): la tarea no se registra.`
        );
      }
      return;
    }

    await BackgroundTask.registerTaskAsync(BACKGROUND_SYNC_TASK, {
      minimumInterval: BACKGROUND_SYNC_INTERVAL_MINUTES,
    });

    if (__DEV__) {
      console.log(`[background-sync] Tarea "${BACKGROUND_SYNC_TASK}" registrada.`);
    }
      return;
    }
  catch (error) {
    logDevError('No se pudo registrar la sincronización en segundo plano.', error);
  }
}
