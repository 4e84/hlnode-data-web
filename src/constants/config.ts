export const DEFAULT_WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export const DEFAULT_COIN = "BTC";

export const DEFAULT_N_SIG_FIGS = 4;

export const DEFAULT_N_LEVELS = 100;

export const DEFAULT_MANTISSA: 2 | 5 = 5;

export const DEFAULT_DISPLAY_UNIT: "coin" | "usd" = "coin";

export const DEFAULT_LAYOUT: "vertical" | "horizontal" = "horizontal";

/**
 * Fallback list of available perpetual symbols.
 * The app fetches the real list from Hyperliquid API on startup.
 * This is used as a fallback if the API call fails.
 *
 * Note: Hyperliquid has 200+ perpetuals available. This list is limited
 * for backwards compatibility and offline fallback.
 */
export const AVAILABLE_COINS = [
  "BTC",
  "ETH",
  "SOL",
  "ARB",
  "MATIC",
  "AVAX",
  "OP",
  "APE",
  "DOGE",
  "SHIB",
  "LINK",
  "UNI",
  "AAVE",
  "CRV",
  "LDO",
  "MKR",
  "SNX",
  "BLUR",
] as const;

export const SIG_FIGS_MIN = 2;
export const SIG_FIGS_MAX = 5;

export const LEVELS_MIN = 1;
export const LEVELS_MAX = 100;

export const MANTISSA_OPTIONS = [2, 5] as const;

export const RECONNECT_DELAY_MS = 2000;
export const MAX_RECONNECT_DELAY_MS = 30000;

export const MAX_TRADES_HISTORY = 100;
