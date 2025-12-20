/**
 * Transform functions for L2 order book data
 */

import type { L2BookData, OrderBookState } from "../types/orderbook";
import {
  parseLevelPrice,
  calculateSpread,
  calculateSpreadPercent,
  calculateMidPrice,
} from "./calculations";

/**
 * Transform raw L2BookData from WebSocket into OrderBookState
 */
export function transformL2BookData(data: unknown): OrderBookState {
  const l2Data = data as L2BookData;
  const [bids, asks] = l2Data.levels;

  const bestBid = bids.length > 0 ? parseLevelPrice(bids[0]) : 0;
  const bestAsk = asks.length > 0 ? parseLevelPrice(asks[0]) : 0;

  return {
    coin: l2Data.coin,
    quoteCurrency: "USD",
    bids,
    asks,
    timestamp: l2Data.time,
    bestBid,
    bestAsk,
    spread: calculateSpread(bestBid, bestAsk),
    spreadPercent: calculateSpreadPercent(bestBid, bestAsk),
    midPrice: calculateMidPrice(bestBid, bestAsk),
  };
}
