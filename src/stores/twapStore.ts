import { create } from "zustand";
import type { TwapItem, TwapFill, TwapData } from "../types/twap";
import type { TradeData } from "../types/trades";
import { MAX_TRADES_HISTORY } from "../constants/config";
import { loadTwapStatuses, saveTwapStatuses } from "../utils/twapStorage";

interface TwapStore {
  twapStatuses: TwapItem[];
  isLoading: boolean;
  error: string | null;
  currentCoin: string | null;
  knownTwapIds: Set<number>;

  // Actions
  updateFromTwapMessage: (data: TwapData[]) => void;
  updateFromTradesMessage: (data: TradeData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: (coin: string) => void;
}

export const useTwapStore = create<TwapStore>((set, get) => ({
  twapStatuses: [],
  isLoading: true,
  error: null,
  currentCoin: null,
  knownTwapIds: new Set(),

  updateFromTwapMessage: (twapData) => {
    const currentCoin = get().currentCoin;

    // Filter TWAP statuses for the current coin
    const newStatuses = twapData
      .filter((twap) => !currentCoin || twap.coin === currentCoin)
      .map((twap) => ({
        ...twap,
        id: `${twap.twapId}-${twap.time}`,
        fills: [] as TwapFill[],
      }));

    if (newStatuses.length > 0) {
      set((state) => {
        // Create map keyed by twapId, keeping most recent
        const statusMap = new Map<number, TwapItem>();

        // Add previous statuses (preserve fills)
        for (const s of state.twapStatuses) {
          statusMap.set(s.twapId, s);
        }

        // Merge new statuses (preserve existing fills)
        for (const s of newStatuses) {
          const existing = statusMap.get(s.twapId);
          statusMap.set(s.twapId, {
            ...s,
            fills: existing?.fills || [],
          });
        }

        // Convert back to array, sorted by time descending
        const merged = Array.from(statusMap.values())
          .sort((a, b) => b.time - a.time)
          .slice(0, MAX_TRADES_HISTORY);

        // Update known twapIds
        const knownTwapIds = new Set(merged.map((t) => t.twapId));

        // Save to localStorage
        if (currentCoin) {
          saveTwapStatuses(currentCoin, merged);
        }

        return {
          twapStatuses: merged,
          knownTwapIds,
          isLoading: false,
          error: null,
        };
      });
    }
  },

  updateFromTradesMessage: (tradesData) => {
    const knownTwapIds = get().knownTwapIds;

    // Filter trades that belong to known TWAPs
    const twapFills = tradesData.filter((trade) => trade.twapId && knownTwapIds.has(trade.twapId));

    if (twapFills.length > 0) {
      set((state) => {
        // Group fills by twapId
        const fillsByTwapId = new Map<number, TwapFill[]>();
        for (const trade of twapFills) {
          if (!trade.twapId) continue;
          const fills = fillsByTwapId.get(trade.twapId) || [];
          fills.push({
            px: trade.px,
            sz: trade.sz,
            time: trade.time,
            tid: trade.tid,
          });
          fillsByTwapId.set(trade.twapId, fills);
        }

        // Attach fills to corresponding TWAPs
        const updatedStatuses = state.twapStatuses.map((twap) => {
          const newFills = fillsByTwapId.get(twap.twapId);
          if (newFills) {
            // Deduplicate fills by tid
            const existingTids = new Set(twap.fills.map((f) => f.tid));
            const uniqueNewFills = newFills.filter((f) => !existingTids.has(f.tid));
            return {
              ...twap,
              fills: [...twap.fills, ...uniqueNewFills].sort((a, b) => b.time - a.time),
            };
          }
          return twap;
        });

        // Save to localStorage
        const currentCoin = state.currentCoin;
        if (currentCoin) {
          saveTwapStatuses(currentCoin, updatedStatuses);
        }

        return { twapStatuses: updatedStatuses };
      });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: (coin) => {
    const loaded = loadTwapStatuses(coin);
    set({
      twapStatuses: loaded,
      isLoading: true,
      error: null,
      currentCoin: coin,
      knownTwapIds: new Set(loaded.map((t) => t.twapId)),
    });
  },
}));
