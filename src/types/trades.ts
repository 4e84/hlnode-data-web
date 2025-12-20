export type TradeSide = "A" | "B"; // A = Ask/Sell (taker), B = Bid/Buy (taker)

export interface TradeData {
  coin: string;
  side: TradeSide;
  px: string; // Execution price
  sz: string; // Execution size
  time: number; // Unix timestamp in milliseconds
  hash: string; // Transaction hash
  tid: number; // Trade ID
  users: [string, string]; // [buyer, seller] addresses
  twapId?: number; // Present if this trade is from a TWAP order
}

export interface TradesMessage {
  channel: "trades";
  data: TradeData[];
}

export interface TradeItem extends TradeData {
  id: string; // Unique identifier for React keys
}
