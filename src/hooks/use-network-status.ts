import { useEffect, useState } from 'react';
import type { NetworkState } from 'expo-network';

import {
  getNetworkState,
  isOnlineFromState,
  subscribeToNetworkChanges,
} from '@/services/network';
import type { AppNetworkStatus } from '@/types/network';

export function useNetworkStatus(): AppNetworkStatus {
  const [rawState, setRawState] = useState<NetworkState | null>(null);

  useEffect(() => {
    let isMounted = true;

    getNetworkState().then((initial) => {
      if (isMounted) {
        setRawState(initial);
      }
    });

    const unsubscribe = subscribeToNetworkChanges((_, nextState) => {
      if (isMounted) {
        setRawState(nextState);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return {
    isOnline: isOnlineFromState(rawState),
    isConnected: Boolean(rawState?.isConnected),
    isChecking: rawState === null,
    rawState: rawState ?? undefined,
  };
}
