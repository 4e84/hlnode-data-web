/**
 * Generic topic subscription hook using SWR
 *
 * Provides a declarative way to subscribe to WebSocket topics.
 * Handles automatic subscription/unsubscription, deduplication, and caching.
 */

import useSWRSubscription from 'swr/subscription';
import type { SWRSubscriptionOptions } from 'swr/subscription';
import { wsManager } from '../services/websocketManager';

export interface SubscriptionConfig {
  type: string;
  params?: Record<string, unknown>;
}

export interface UseTopicSubscriptionOptions<T> {
  /** Transform raw data before storing */
  transform?: (data: unknown) => T;
}

export interface UseTopicSubscriptionResult<T> {
  data: T | undefined;
  error: Error | undefined;
  isLoading: boolean;
}

/**
 * Subscribe to a WebSocket topic and receive data updates
 *
 * @param config - Subscription configuration (type and params), or null to disable
 * @param options - Optional transform function
 * @returns Subscription result with data, error, and loading state
 *
 * @example
 * ```tsx
 * // Simple subscription
 * const { data: trades } = useTopicSubscription<TradeItem[]>({
 *   type: 'trades',
 *   params: { coin: 'BTC' },
 * });
 *
 * // With transform
 * const { data: orderBook } = useTopicSubscription<OrderBookState>({
 *   type: 'l2Book',
 *   params: { coin, nLevels: 50 },
 * }, {
 *   transform: transformL2BookData,
 * });
 *
 * // Conditional subscription (pass null to disable)
 * const { data } = useTopicSubscription(isEnabled ? config : null);
 * ```
 */
export function useTopicSubscription<T>(
  config: SubscriptionConfig | null,
  options?: UseTopicSubscriptionOptions<T>
): UseTopicSubscriptionResult<T> {
  // Build SWR key from config (null disables subscription)
  const key = config ? [config.type, config.params ?? {}] as const : null;

  const { data, error } = useSWRSubscription(
    key,
    (keyArg, { next }: SWRSubscriptionOptions<T, Error>) => {
      const [type, params] = keyArg;

      const unsubscribe = wsManager.subscribe(
        type,
        params,
        (rawData) => {
          try {
            const transformed = options?.transform
              ? options.transform(rawData)
              : (rawData as T);
            next(null, transformed);
          } catch (e) {
            next(e instanceof Error ? e : new Error(String(e)));
          }
        }
      );

      // Return cleanup function
      return () => unsubscribe();
    }
  );

  return {
    data,
    error,
    isLoading: data === undefined && error === undefined,
  };
}
