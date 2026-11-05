import type { NetworkState } from 'expo-network';

export interface AppNetworkStatus {
  isOnline: boolean;
  isConnected: boolean;
  isChecking: boolean;
  rawState?: NetworkState;
}
