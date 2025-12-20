export interface OrderBookLevel {
  px: string; // Price as decimal string
  sz: string; // Size as decimal string
  n: number; // Number of orders
}

export interface L2BookData {
  coin: string;
  time: number; // Unix timestamp in milliseconds
  levels: [OrderBookLevel[], OrderBookLevel[]]; // [bids, asks]
}

export interface L2BookMessage {
  channel: "l2Book";
  data: L2BookData;
}

export interface OrderBookState {
  coin: string;
  quoteCurrency: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
}

export interface OrderBookConfig {
  coin: string;
  nSigFigs?: number;
  nLevels: number;
  mantissa?: 2 | 5;
  bucketSize?: number; // User-facing bucket size in USD (for UI state)
}
