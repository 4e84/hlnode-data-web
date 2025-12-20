import React, { createContext, useContext, useState, useCallback } from "react";

const STORAGE_KEY = "orderbook-display-config";

export type Layout = "vertical" | "horizontal";
export type DisplayUnit = "coin" | "usd";

interface DisplayConfig {
  layout: Layout;
  displayUnit: DisplayUnit;
}

interface DisplayConfigContextValue {
  layout: Layout;
  displayUnit: DisplayUnit;
  setLayout: (layout: Layout) => void;
  setDisplayUnit: (unit: DisplayUnit) => void;
}

const defaultConfig: DisplayConfig = {
  layout: "vertical",
  displayUnit: "coin",
};

function loadFromStorage(): DisplayConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        layout: parsed.layout === "horizontal" ? "horizontal" : "vertical",
        displayUnit: parsed.displayUnit === "usd" ? "usd" : "coin",
      };
    }
  } catch {
    // localStorage not available or invalid data
  }
  return defaultConfig;
}

function saveToStorage(config: DisplayConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage not available
  }
}

const DisplayConfigContext = createContext<DisplayConfigContextValue | null>(null);

export function useDisplayConfig(): DisplayConfigContextValue {
  const context = useContext(DisplayConfigContext);
  if (!context) {
    throw new Error("useDisplayConfig must be used within DisplayConfigProvider");
  }
  return context;
}

interface DisplayConfigProviderProps {
  children: React.ReactNode;
}

export function DisplayConfigProvider({ children }: DisplayConfigProviderProps) {
  const [config, setConfig] = useState<DisplayConfig>(loadFromStorage);

  const setLayout = useCallback((layout: Layout) => {
    setConfig((prev) => {
      const newConfig = { ...prev, layout };
      saveToStorage(newConfig);
      return newConfig;
    });
  }, []);

  const setDisplayUnit = useCallback((displayUnit: DisplayUnit) => {
    setConfig((prev) => {
      const newConfig = { ...prev, displayUnit };
      saveToStorage(newConfig);
      return newConfig;
    });
  }, []);

  const value: DisplayConfigContextValue = {
    layout: config.layout,
    displayUnit: config.displayUnit,
    setLayout,
    setDisplayUnit,
  };

  return <DisplayConfigContext.Provider value={value}>{children}</DisplayConfigContext.Provider>;
}
