/**
 * URL parameter validation utilities for orderbook configuration.
 * Validates and coerces URL parameters to valid OrderBookConfig values.
 */

import type { OrderBookConfig } from "../types/orderbook";
import {
  DEFAULT_COIN,
  DEFAULT_N_LEVELS,
  DEFAULT_N_SIG_FIGS,
  LEVELS_MIN,
  LEVELS_MAX,
} from "../constants/config";

interface UrlParams {
  symbol?: string | null;
  bucket?: string | null;
  levels?: string | null;
}

/**
 * Validate and parse URL parameters into a valid OrderBookConfig.
 *
 * @param params Raw URL parameters object
 * @returns Valid OrderBookConfig with validated values
 */
export function validateUrlParams(params: UrlParams): OrderBookConfig {
  const coin = validateSymbol(params.symbol);
  const nLevels = validateLevels(params.levels);
  const bucketConfig = validateBucket(params.bucket);

  return {
    coin,
    nLevels,
    ...bucketConfig,
  };
}

/**
 * Validate symbol parameter.
 * Allows any uppercase string (validated against API later).
 *
 * @param symbol Raw symbol parameter
 * @returns Validated symbol or default
 */
function validateSymbol(symbol?: string | null): string {
  if (!symbol || typeof symbol !== "string") {
    return DEFAULT_COIN;
  }

  // Convert to uppercase and trim whitespace
  const normalized = symbol.trim().toUpperCase();

  if (normalized.length === 0) {
    return DEFAULT_COIN;
  }

  // Allow any non-empty uppercase string
  // Will be validated against actual symbols list when it loads
  return normalized;
}

/**
 * Validate levels parameter.
 * Clamps to valid range (LEVELS_MIN to LEVELS_MAX).
 *
 * @param levels Raw levels parameter
 * @returns Validated levels or default
 */
function validateLevels(levels?: string | null): number {
  if (!levels || typeof levels !== "string") {
    return DEFAULT_N_LEVELS;
  }

  const parsed = parseInt(levels, 10);

  if (isNaN(parsed)) {
    return DEFAULT_N_LEVELS;
  }

  // Clamp to valid range
  return Math.max(LEVELS_MIN, Math.min(LEVELS_MAX, Math.floor(parsed)));
}

/**
 * Validate bucket parameter and convert to partial OrderBookConfig.
 *
 * Supported values:
 * - "auto": Use default bucket calculation
 * - "0" or "full": Full precision (no bucketing)
 * - Numeric string: Specific bucket size in USD (e.g., "10" for $10 buckets)
 *
 * Note: The actual nSigFigs and mantissa are calculated later in OrderBookControls
 * when the current price is available. This function only stores the user's intent.
 *
 * @param bucket Raw bucket parameter
 * @returns Partial config with bucket-related fields
 */
function validateBucket(bucket?: string | null): Partial<OrderBookConfig> {
  if (!bucket || typeof bucket !== "string") {
    // Default: auto bucket calculation (nSigFigs = 4)
    return {
      nSigFigs: DEFAULT_N_SIG_FIGS,
      mantissa: undefined,
      bucketSize: undefined,
    };
  }

  const normalized = bucket.toLowerCase().trim();

  // Handle "auto" - use default calculation
  if (normalized === "auto") {
    return {
      nSigFigs: DEFAULT_N_SIG_FIGS,
      mantissa: undefined,
      bucketSize: undefined,
    };
  }

  // Handle "full" or "0" - no bucketing
  if (normalized === "full" || normalized === "0") {
    return {
      nSigFigs: undefined,
      mantissa: undefined,
      bucketSize: 0,
    };
  }

  // Try to parse as numeric bucket size
  const parsed = parseFloat(normalized);

  if (isNaN(parsed) || parsed < 0) {
    // Invalid number - fallback to auto
    return {
      nSigFigs: DEFAULT_N_SIG_FIGS,
      mantissa: undefined,
      bucketSize: undefined,
    };
  }

  // Store the desired bucket size
  // The actual nSigFigs and mantissa will be calculated in OrderBookControls
  // when the current price is available
  return {
    bucketSize: parsed,
    nSigFigs: undefined, // Will be calculated from bucketSize and price
    mantissa: undefined, // Will be calculated if nSigFigs = 5
  };
}

/**
 * Parse URLSearchParams object into UrlParams.
 *
 * @param searchParams URLSearchParams from window.location.search
 * @returns Object with extracted parameters
 */
export function parseUrlParams(searchParams: URLSearchParams): UrlParams {
  return {
    symbol: searchParams.get("symbol"),
    bucket: searchParams.get("bucket"),
    levels: searchParams.get("levels"),
  };
}

/**
 * Serialize OrderBookConfig to URLSearchParams.
 * Only includes non-default values to keep URLs clean.
 *
 * @param config OrderBookConfig to serialize
 * @returns URLSearchParams object
 */
export function serializeConfig(config: OrderBookConfig): URLSearchParams {
  const params = new URLSearchParams();

  // Only add symbol if not default
  if (config.coin !== DEFAULT_COIN) {
    params.set("symbol", config.coin);
  }

  // Only add bucket if not auto/default
  if (config.bucketSize !== undefined) {
    if (config.bucketSize === 0) {
      params.set("bucket", "full");
    } else {
      params.set("bucket", config.bucketSize.toString());
    }
  } else if (config.nSigFigs !== DEFAULT_N_SIG_FIGS) {
    // If bucketSize not set but nSigFigs is non-default, use "auto"
    params.set("bucket", "auto");
  }

  // Only add levels if not default
  if (config.nLevels !== DEFAULT_N_LEVELS) {
    params.set("levels", config.nLevels.toString());
  }

  return params;
}
