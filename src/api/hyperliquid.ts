/**
 * Hyperliquid API client for fetching metadata
 */

const HYPERLIQUID_API_URL = 'https://api.hyperliquid.xyz/info';

interface UniverseAsset {
  name: string;
  szDecimals: number;
  maxLeverage: number;
  marginTableId: number;
  isDelisted?: boolean;
  onlyIsolated?: boolean;
}

interface MetaResponse {
  universe: UniverseAsset[];
  marginTables: Array<[number, any]>;
  collateralToken: number;
}

/**
 * Fetches available perpetual symbols from Hyperliquid API
 * @returns Array of symbol names (e.g., ['BTC', 'ETH', 'SOL', ...])
 */
export async function fetchAvailableSymbols(): Promise<string[]> {
  try {
    const response = await fetch(HYPERLIQUID_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 'meta' }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: MetaResponse = await response.json();

    // Filter out delisted assets and extract names
    const symbols = data.universe
      .filter((asset) => !asset.isDelisted)
      .map((asset) => asset.name)
      .sort(); // Sort alphabetically

    return symbols;
  } catch (error) {
    console.error('Failed to fetch symbols from Hyperliquid API:', error);
    throw error;
  }
}
