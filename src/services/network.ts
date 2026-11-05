import * as Network from 'expo-network';

/**
 * Determina si un estado de red representa una conexión activa con acceso a internet.
 */
export function isOnlineFromState(
  state?: Pick<Network.NetworkState, 'isConnected' | 'isInternetReachable'> | null
): boolean {
  if (!state) return false;
  return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Consulta el estado actual de la conexión de red.
 */
export async function getNetworkState(): Promise<Network.NetworkState> {
  try {
    return await Network.getNetworkStateAsync();
  } catch {
    return {
      isConnected: false,
      isInternetReachable: false,
      type: Network.NetworkStateType.UNKNOWN,
    };
  }
}

/**
 * Determina si el dispositivo cuenta con conexión a internet activa.
 */
export async function isOnline(): Promise<boolean> {
  const state = await getNetworkState();
  return isOnlineFromState(state);
}

/**
 * Suscribe un listener a cambios en la conectividad del dispositivo.
 * Retorna la función para cancelar la suscripción.
 */
export function subscribeToNetworkChanges(
  listener: (isOnline: boolean, state: Network.NetworkState) => void
): () => void {
  try {
    const subscription = Network.addNetworkStateListener((state) => {
      listener(isOnlineFromState(state), state);
    });

    return () => {
      subscription?.remove?.();
    };
  } catch {
    return () => {};
  }
}
