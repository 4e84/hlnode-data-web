/**
 * Utility functions for converting between user-friendly USD bucket sizes
 * and the technical nSigFigs/mantissa parameters used by the Hyperliquid API.
 *
 * Based on the exact algorithm from the Rust order book server implementation.
 */

export interface BucketConfig {
  nSigFigs: number | undefined;
  mantissa: 2 | 5 | undefined;
  actualBucketSize: number;
}

/**
 * Calculate nSigFigs and mantissa from a desired bucket size.
 *
 * Formula (from Rust implementation):
 * nSigFigs = clamp(floor(log10(currentPrice / desiredBucket)) + 1, 2, 5)
 *
 * @param currentPrice Current mid price of the asset
 * @param desiredBucketSize Desired USD bucket size
 * @param preferredMantissa Preferred mantissa value (1, 2, or 5)
 * @returns Configuration with nSigFigs, mantissa, and actual bucket size
 */
export function calculateBucketConfig(
  currentPrice: number,
  desiredBucketSize: number,
  preferredMantissa: number = 1
): BucketConfig {
  // Handle full precision request (no bucketing)
  if (desiredBucketSize <= 0 || currentPrice <= 0) {
    return {
      nSigFigs: undefined,
      mantissa: undefined,
      actualBucketSize: 0,
    };
  }

  // Calculate required sig figs based on desired bucket
  const priceDigits = Math.floor(Math.log10(currentPrice)) + 1;
  const bucketDigits = Math.floor(Math.log10(desiredBucketSize / preferredMantissa));
  const calculatedSigFigs = priceDigits - bucketDigits;

  // Clamp to valid range (2-5)
  const nSigFigs = Math.max(2, Math.min(5, calculatedSigFigs));

  // Calculate actual bucket size with the clamped value
  const actualBucketSize = preferredMantissa * Math.pow(10, priceDigits - nSigFigs);

  // Validate mantissa usage (only allowed when nSigFigs = 5)
  let mantissa: 2 | 5 | undefined = undefined;
  if (nSigFigs === 5 && (preferredMantissa === 2 || preferredMantissa === 5)) {
    mantissa = preferredMantissa as 2 | 5;
  }

  return {
    nSigFigs,
    mantissa,
    actualBucketSize,
  };
}

/**
 * Find the best bucket configuration for a desired size.
 * Tries mantissa values 1, 2, and 5 to find the closest match.
 *
 * @param currentPrice Current mid price
 * @param desiredBucketSize Desired bucket size in USD
 * @returns Best matching bucket configuration
 */
export function findBestBucketConfig(
  currentPrice: number,
  desiredBucketSize: number
): BucketConfig {
  const candidates = [1, 2, 5].map(mantissa =>
    calculateBucketConfig(currentPrice, desiredBucketSize, mantissa)
  );

  // Find the candidate with bucket size closest to desired
  return candidates.reduce((best, current) => {
    const bestDiff = Math.abs(best.actualBucketSize - desiredBucketSize);
    const currentDiff = Math.abs(current.actualBucketSize - desiredBucketSize);
    return currentDiff < bestDiff ? current : best;
  });
}

/**
 * Generate exactly 5 bucket size options for the current price.
 * Options are based on nSigFigs values (5, 4, 3, 2) with mantissa variations
 * to provide evenly-distributed choices from finest to coarsest granularity.
 *
 * @param currentPrice Current mid price
 * @returns Array of exactly 5 bucket size options in USD, sorted ascending
 */
export function generateBucketOptions(currentPrice: number): number[] {
  if (currentPrice <= 0) return [];

  const priceDigits = Math.floor(Math.log10(currentPrice)) + 1;

  // Generate exactly 5 options based on nSigFigs values
  const options = [
    { nSigFigs: 5, mantissa: 5 }, // Finest
    { nSigFigs: 5, mantissa: 2 }, // Fine
    { nSigFigs: 4, mantissa: 1 }, // Medium (default)
    { nSigFigs: 3, mantissa: 1 }, // Coarse
    { nSigFigs: 2, mantissa: 1 }, // Coarsest
  ];

  return options.map(({ nSigFigs, mantissa }) => {
    return mantissa * Math.pow(10, priceDigits - nSigFigs);
  });
}

/**
 * Select a default bucket size based on current price.
 * Uses nSigFigs=4 as the default (matches current application default).
 *
 * @param currentPrice Current mid price
 * @returns Optimal default bucket size
 */
export function selectDefaultBucket(currentPrice: number): number {
  if (currentPrice <= 0) return 0;

  // Default to nSigFigs=4 (current app default)
  const nSigFigs = 4;
  const priceDigits = Math.floor(Math.log10(currentPrice)) + 1;
  const bucketSize = Math.pow(10, priceDigits - nSigFigs);

  // Round to nearest "nice" number (1, 2, or 5 pattern)
  const magnitude = Math.pow(10, Math.floor(Math.log10(bucketSize)));
  const normalized = bucketSize / magnitude;

  if (normalized <= 1.5) return magnitude * 1;
  if (normalized <= 3.5) return magnitude * 2;
  return magnitude * 5;
}

/**
 * Format a bucket size for display.
 *
 * @param bucketSize Bucket size in USD
 * @returns Formatted string (e.g., "$10", "$0.01", "$1,000")
 */
export function formatBucketSize(bucketSize: number): string {
  if (bucketSize >= 1000) {
    return '$' + bucketSize.toLocaleString('en-US', {
      maximumFractionDigits: 0,
    });
  }
  if (bucketSize >= 1) {
    return '$' + bucketSize.toFixed(0);
  }
  // For values < $1, show appropriate decimal places
  const decimals = Math.max(2, Math.ceil(-Math.log10(bucketSize)));
  return '$' + bucketSize.toFixed(decimals);
}
