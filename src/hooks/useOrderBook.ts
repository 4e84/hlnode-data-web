/**
 * Hook for subscribing to L2 order book data
 *
 * Pure topic-based subscription with auto bucket size calculation
 */

import { useEffect, useCallback, useState, useMemo } from 'react';
import { useTopicSubscription } from './useTopicSubscription';
import { useConnectionStatus } from './useConnectionStatus';
import { findBestBucketConfig } from '../utils/bucketSizeUtils';
import { transformL2BookData } from '../utils/orderBookTransform';
import type { OrderBookConfig, OrderBookState } from '../types/orderbook';

interface UseOrderBookResult {
  orderBook: OrderBookState | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (config: OrderBookConfig) => void;
}

/**
 * Subscribe to L2 order book for a specific coin
 *
 * @param initialConfig - Order book configuration (coin, levels, sig figs)
 * @returns Order book data with loading and error states
 *
 * @example
 * ```tsx
 * function OrderBookView() {
 *   const { orderBook, isLoading, error, updateConfig } = useOrderBook({
 *     coin: 'BTC',
 *     nLevels: 50,
 *     nSigFigs: 4,
 *   });
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return <OrderBookDisplay data={orderBook} />;
 * }
 * ```
 */
export function useOrderBook(initialConfig: OrderBookConfig): UseOrderBookResult {
  const [config, setConfig] = useState(initialConfig);
  const { isConnected } = useConnectionStatus();

  const updateConfig = useCallback((newConfig: OrderBookConfig) => {
    setConfig(newConfig);
  }, []);

  // Build subscription params
  const subscriptionParams = useMemo(() => {
    const params: Record<string, unknown> = {
      coin: config.coin,
      nLevels: config.nLevels,
    };

    if (config.nSigFigs !== undefined) {
      params.nSigFigs = config.nSigFigs;
    }
    if (config.mantissa !== undefined && config.nSigFigs === 5) {
      params.mantissa = config.mantissa;
    }

    return params;
  }, [config.coin, config.nLevels, config.nSigFigs, config.mantissa]);

  const { data, error, isLoading } = useTopicSubscription<OrderBookState>(
    { type: 'l2Book', params: subscriptionParams },
    { transform: transformL2BookData }
  );

  // Auto-calculate nSigFigs from bucketSize when we get first price
  useEffect(() => {
    if (
      config.bucketSize !== undefined &&
      config.bucketSize > 0 &&
      config.nSigFigs === undefined &&
      data?.midPrice &&
      data.midPrice > 0
    ) {
      const bucketConfig = findBestBucketConfig(data.midPrice, config.bucketSize);
      setConfig((prev) => ({
        ...prev,
        nSigFigs: bucketConfig.nSigFigs,
        mantissa: bucketConfig.mantissa,
      }));
    }
  }, [config.bucketSize, config.nSigFigs, data?.midPrice]);

  return {
    orderBook: data ?? null,
    isLoading: isLoading && !isConnected,
    error: error?.message ?? null,
    updateConfig,
  };
}
