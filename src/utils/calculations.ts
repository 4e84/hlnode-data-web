import type { OrderBookLevel } from '../types/orderbook';

/**
 * Calculate spread between best bid and ask
 */
export function calculateSpread(bestBid: number, bestAsk: number): number {
  return bestAsk - bestBid;
}

/**
 * Calculate spread as percentage of mid price
 */
export function calculateSpreadPercent(bestBid: number, bestAsk: number): number {
  const spread = calculateSpread(bestBid, bestAsk);
  const midPrice = (bestBid + bestAsk) / 2;
  return midPrice > 0 ? (spread / midPrice) * 100 : 0;
}

/**
 * Calculate mid price
 */
export function calculateMidPrice(bestBid: number, bestAsk: number): number {
  return (bestBid + bestAsk) / 2;
}

/**
 * Parse order book level price to number
 */
export function parseLevelPrice(level: OrderBookLevel): number {
  return parseFloat(level.px);
}

/**
 * Parse order book level size to number
 */
export function parseLevelSize(level: OrderBookLevel): number {
  return parseFloat(level.sz);
}

/**
 * Calculate the maximum size across all levels (for depth bar visualization)
 */
export function calculateMaxSize(bids: OrderBookLevel[], asks: OrderBookLevel[]): number {
  const allLevels = [...bids, ...asks];
  if (allLevels.length === 0) return 1;

  const sizes = allLevels.map(parseLevelSize);
  return Math.max(...sizes, 1);
}

/**
 * Calculate the maximum cumulative total across all levels with totals
 */
export function calculateMaxTotal(
  bidsWithTotal: Array<{ total: number }>,
  asksWithTotal: Array<{ total: number }>
): number {
  const allTotals = [
    ...bidsWithTotal.map(level => level.total),
    ...asksWithTotal.map(level => level.total)
  ];

  if (allTotals.length === 0) return 1;
  return Math.max(...allTotals, 1);
}

/**
 * Calculate depth bar width as percentage
 */
export function calculateDepthBarWidth(size: number, maxSize: number): number {
  if (maxSize === 0) return 0;
  return Math.min((size / maxSize) * 100, 100);
}

/**
 * Calculate total depth (cumulative size) for orderbook levels
 */
export function calculateTotalDepth(levels: OrderBookLevel[]): number {
  return levels.reduce((sum, level) => sum + parseLevelSize(level), 0);
}
