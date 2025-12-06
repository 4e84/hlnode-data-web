/**
 * Hook for subscribing to trades feed
 *
 * Pure topic-based subscription - no WebSocket management boilerplate
 */

import { useRef, useCallback } from 'react';
import { useTopicSubscription } from './useTopicSubscription';
import { useConnectionStatus } from './useConnectionStatus';
import type { TradeItem, TradeData } from '../types/trades';
import { MAX_TRADES_HISTORY } from '../constants/config';

interface UseTradesResult {
  trades: TradeItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Subscribe to trades for a specific coin
 *
 * @param coin - The coin symbol to subscribe to (e.g., 'BTC', 'ETH')
 * @returns Trades feed data with loading and error states
 *
 * @example
 * ```tsx
 * function TradesFeed({ coin }: { coin: string }) {
 *   const { trades, isLoading, error } = useTrades(coin);
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return <TradesList trades={trades} />;
 * }
 * ```
 */
export function useTrades(coin: string): UseTradesResult {
  const { isConnected } = useConnectionStatus();

  // Accumulate trades across updates (SWR replaces data each time)
  const accumulatedTradesRef = useRef<TradeItem[]>([]);
  const currentCoinRef = useRef<string>(coin);

  // Reset accumulated trades when coin changes
  if (currentCoinRef.current !== coin) {
    accumulatedTradesRef.current = [];
    currentCoinRef.current = coin;
  }

  // Transform incoming trades and accumulate
  const transform = useCallback(
    (data: unknown): TradeItem[] => {
      const tradesData = data as TradeData[];

      // Filter trades for current coin and add unique id
      const newTrades = tradesData
        .filter((trade) => trade.coin === coin)
        .map((trade) => ({
          ...trade,
          id: `${trade.tid}-${trade.time}`,
        }));

      if (newTrades.length > 0) {
        // Prepend new trades and limit history
        accumulatedTradesRef.current = [
          ...newTrades,
          ...accumulatedTradesRef.current,
        ].slice(0, MAX_TRADES_HISTORY);
      }

      return accumulatedTradesRef.current;
    },
    [coin]
  );

  const { data, error, isLoading } = useTopicSubscription<TradeItem[]>(
    { type: 'trades', params: { coin } },
    { transform }
  );

  return {
    trades: data ?? accumulatedTradesRef.current,
    isLoading: isLoading && !isConnected,
    error: error?.message ?? null,
  };
}
