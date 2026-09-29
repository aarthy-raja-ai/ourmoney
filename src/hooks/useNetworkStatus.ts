// OurMoney — Network Status Hook

import { useState, useEffect } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
  const [state, setState] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      const connected = netState.isConnected ?? true;
      const reachable = netState.isInternetReachable ?? null;
      setState({
        isConnected: connected,
        isInternetReachable: reachable,
        isOffline: !connected || reachable === false,
      });
    });

    // Fetch initial state
    NetInfo.fetch().then((netState) => {
      const connected = netState.isConnected ?? true;
      const reachable = netState.isInternetReachable ?? null;
      setState({
        isConnected: connected,
        isInternetReachable: reachable,
        isOffline: !connected || reachable === false,
      });
    });

    return unsubscribe;
  }, []);

  return state;
}
