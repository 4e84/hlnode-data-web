/**
 * Custom hook for synchronizing orderbook configuration with URL parameters.
 *
 * Features:
 * - Reads config from URL on initial load
 * - Updates URL when config changes (without creating history entries)
 * - Listens to browser back/forward navigation
 * - Validates and sanitizes all parameters
 */

import { useState, useEffect, useCallback } from "react";
import type { OrderBookConfig } from "../types/orderbook";
import { parseUrlParams, validateUrlParams, serializeConfig } from "../utils/urlParamValidation";

interface UseUrlParamsResult {
  config: OrderBookConfig;
  updateUrl: (config: OrderBookConfig) => void;
}

/**
 * Hook for managing URL parameters as global state.
 *
 * @returns Object with current config from URL and updateUrl function
 */
export function useUrlParams(): UseUrlParamsResult {
  // Parse and validate URL parameters
  const loadConfigFromUrl = useCallback((): OrderBookConfig => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawParams = parseUrlParams(searchParams);
    const validatedConfig = validateUrlParams(rawParams);
    return validatedConfig;
  }, []);

  // Load config synchronously on mount - ensures config is available on first render
  const [config, setConfig] = useState<OrderBookConfig>(loadConfigFromUrl);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const newConfig = loadConfigFromUrl();
      setConfig(newConfig);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [loadConfigFromUrl]);

  /**
   * Update URL with new configuration.
   * Uses history.replaceState to avoid creating new history entries.
   *
   * @param newConfig OrderBookConfig to serialize to URL
   */
  const updateUrl = useCallback((newConfig: OrderBookConfig) => {
    const params = serializeConfig(newConfig);
    const queryString = params.toString();

    const newUrl = queryString
      ? `${window.location.pathname}?${queryString}`
      : window.location.pathname;

    // Use replaceState to update URL without adding history entry
    window.history.replaceState(null, "", newUrl);
  }, []);

  return {
    config,
    updateUrl,
  };
}
