/**
 * Hook for subscribing to WebSocket connection status
 *
 * Uses React 18's useSyncExternalStore for tear-safe subscriptions
 */

import { useSyncExternalStore } from 'react';
import { wsManager, type ConnectionStatus } from '../services/websocketManager';

export interface UseConnectionStatusResult {
  status: ConnectionStatus;
  url: string;
  isConnected: boolean;
  reconnect: () => void;
}

/**
 * Subscribe to WebSocket connection status
 *
 * @returns Connection status, URL, and control functions
 *
 * @example
 * ```tsx
 * function StatusBar() {
 *   const { status, url, isConnected, reconnect } = useConnectionStatus();
 *
 *   return (
 *     <div>
 *       <span>{status}</span>
 *       {!isConnected && <button onClick={reconnect}>Reconnect</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useConnectionStatus(): UseConnectionStatusResult {
  const status = useSyncExternalStore(
    wsManager.subscribeToStatus,
    wsManager.getStatus,
    wsManager.getStatus // Server snapshot (same as client for WebSocket)
  );

  return {
    status,
    url: wsManager.getUrl(),
    isConnected: status === 'connected',
    reconnect: () => wsManager.reconnect(),
  };
}
