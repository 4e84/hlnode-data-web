/**
 * Hook for subscribing to TWAP order statuses
 *
 * Subscribes to both TWAP channel (status updates) and trades channel (fills).
 * Uses Zustand store for complex state accumulation and localStorage persistence.
 */

import { useEffect, useRef, useCallback } from "react";
import { useConnectionStatus } from "./useConnectionStatus";
import { wsManager } from "../services/websocketManager";
import { useTwapStore } from "../stores";
import { cleanupExpiredTwaps } from "../utils/twapStorage";
import type { TwapItem, TwapData } from "../types/twap";
import type { TradeData } from "../types/trades";

interface UseTwapResult {
  twapStatuses: TwapItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Subscribe to TWAP order statuses for a specific coin
 *
 * @param coin - The coin symbol to subscribe to
 * @returns TWAP statuses with fills, loading and error states
 *
 * @example
 * ```tsx
 * function TwapFeed({ coin }: { coin: string }) {
 *   const { twapStatuses, isLoading, error } = useTwap(coin);
 *
 *   if (isLoading) return <Loading />;
 *   if (error) return <Error message={error} />;
 *
 *   return <TwapList statuses={twapStatuses} />;
 * }
 * ```
 */
export function useTwap(coin: string): UseTwapResult {
  const { isConnected } = useConnectionStatus();

  // Store selectors
  const twapStatuses = useTwapStore((s) => s.twapStatuses);
  const isLoading = useTwapStore((s) => s.isLoading);
  const error = useTwapStore((s) => s.error);
  const reset = useTwapStore((s) => s.reset);
  const updateFromTwapMessage = useTwapStore((s) => s.updateFromTwapMessage);
  const updateFromTradesMessage = useTwapStore((s) => s.updateFromTradesMessage);

  // Track current coin for filtering
  const currentCoinRef = useRef(coin);

  // Reset store when coin changes
  useEffect(() => {
    currentCoinRef.current = coin;
    reset(coin);
  }, [coin, reset]);

  // Periodic cleanup of expired TWAPs
  useEffect(() => {
    cleanupExpiredTwaps();
    const interval = setInterval(cleanupExpiredTwaps, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // TWAP message handler
  const handleTwapMessage = useCallback(
    (data: unknown) => {
      const twapData = data as TwapData[];
      // Filter for current coin
      const filtered = twapData.filter((t) => t.coin === currentCoinRef.current);
      if (filtered.length > 0) {
        updateFromTwapMessage(filtered);
      }
    },
    [updateFromTwapMessage],
  );

  // Trades message handler (for fills)
  const handleTradesMessage = useCallback(
    (data: unknown) => {
      const tradesData = data as TradeData[];
      // Filter for current coin and trades with twapId
      const filtered = tradesData.filter(
        (t) => t.coin === currentCoinRef.current && t.twapId !== undefined,
      );
      if (filtered.length > 0) {
        updateFromTradesMessage(filtered);
      }
    },
    [updateFromTradesMessage],
  );

  // Subscribe to TWAP channel
  useEffect(() => {
    const unsubscribe = wsManager.subscribe("twap", { coin }, handleTwapMessage);
    return unsubscribe;
  }, [coin, handleTwapMessage]);

  // Subscribe to trades channel (for fills)
  useEffect(() => {
    const unsubscribe = wsManager.subscribe("trades", { coin }, handleTradesMessage);
    return unsubscribe;
  }, [coin, handleTradesMessage]);

  return {
    twapStatuses,
    isLoading: isLoading && !isConnected,
    error,
  };
}
