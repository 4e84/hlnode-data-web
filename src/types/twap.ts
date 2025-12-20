export type TwapSide = "A" | "B"; // A = Ask/Sell, B = Bid/Buy

export type TwapStatusType = "running" | "finished" | "cancelled" | "error";

export interface TwapData {
  coin: string;
  time: number; // Block time in milliseconds
  twapId: number; // Unique TWAP order ID
  user: string; // User address (0x...)
  side: TwapSide;
  sz: string; // Total order size
  executedSz: string; // Executed size so far
  executedNtl: string; // Executed notional value
  minutes: number; // TWAP duration in minutes
  reduceOnly: boolean;
  randomize: boolean;
  timestamp: number; // Order creation timestamp
  status: string; // 'running', 'finished', 'cancelled', etc.
}

export interface TwapMessage {
  channel: "twap";
  data: TwapData[];
}

export interface TwapFill {
  px: string;
  sz: string;
  time: number;
  tid: number;
}

export interface TwapItem extends TwapData {
  id: string; // Unique identifier for React keys
  fills: TwapFill[]; // Individual executions for this TWAP
}
