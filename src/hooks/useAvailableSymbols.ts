import { useState, useEffect } from 'react';
import { fetchAvailableSymbols } from '../api/hyperliquid';
import { AVAILABLE_COINS } from '../constants/config';

interface UseAvailableSymbolsResult {
  symbols: string[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and manage available trading symbols from Hyperliquid
 * Falls back to hardcoded list if API fails
 */
export function useAvailableSymbols(): UseAvailableSymbolsResult {
  const [symbols, setSymbols] = useState<string[]>([...AVAILABLE_COINS]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSymbols() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedSymbols = await fetchAvailableSymbols();

        if (isMounted) {
          setSymbols(fetchedSymbols);
        }
      } catch (err) {
        console.warn('Failed to load symbols from Hyperliquid, using fallback list:', err);
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch symbols'));
          // Keep fallback symbols (already set in initial state)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSymbols();

    return () => {
      isMounted = false;
    };
  }, []);

  return { symbols, isLoading, error };
}
