import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useUrlParams } from '../hooks/useUrlParams';
import type { OrderBookConfig } from '../types/orderbook';

interface CoinContextValue {
  coin: string;
  setCoin: (coin: string) => void;
  config: OrderBookConfig;
  updateConfig: (config: OrderBookConfig) => void;
}

const CoinContext = createContext<CoinContextValue | null>(null);

export function useCoinContext(): CoinContextValue {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoinContext must be used within CoinProvider');
  }
  return context;
}

interface CoinProviderProps {
  children: React.ReactNode;
}

export function CoinProvider({ children }: CoinProviderProps) {
  const { config: urlConfig, updateUrl } = useUrlParams();
  const [config, setConfig] = useState<OrderBookConfig>(urlConfig);

  // Sync with URL changes (browser back/forward)
  useEffect(() => {
    setConfig(urlConfig);
  }, [urlConfig]);

  const setCoin = useCallback((coin: string) => {
    const newConfig: OrderBookConfig = {
      ...config,
      coin,
      // Reset bucket to trigger auto-calculation for new price
      bucketSize: undefined,
      nSigFigs: undefined,
      mantissa: undefined,
    };
    setConfig(newConfig);
    updateUrl(newConfig);
  }, [config, updateUrl]);

  const updateConfig = useCallback((newConfig: OrderBookConfig) => {
    setConfig(newConfig);
    updateUrl(newConfig);
  }, [updateUrl]);

  const value = useMemo<CoinContextValue>(() => ({
    coin: config.coin,
    setCoin,
    config,
    updateConfig,
  }), [config, setCoin, updateConfig]);

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}
