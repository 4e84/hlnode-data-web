import { useState, useEffect } from "react";
import type { OrderBookConfig } from "../../types/orderbook";
import { Button } from "../Button";
import { Select } from "../Select";
import {
  AVAILABLE_COINS,
  SIG_FIGS_MIN,
  SIG_FIGS_MAX,
  LEVELS_MIN,
  LEVELS_MAX,
  MANTISSA_OPTIONS,
  DEFAULT_COIN,
  DEFAULT_N_SIG_FIGS,
  DEFAULT_N_LEVELS,
  DEFAULT_MANTISSA,
} from "../../constants/config";
import styles from "./ConfigPanel.module.css";

interface ConfigPanelProps {
  config: OrderBookConfig;
  onConfigChange: (config: OrderBookConfig) => void;
}

export function ConfigPanel({ config, onConfigChange }: ConfigPanelProps) {
  const [localCoin, setLocalCoin] = useState(config.coin);
  const [localNSigFigs, setLocalNSigFigs] = useState<number | undefined>(config.nSigFigs);
  const [localNLevels, setLocalNLevels] = useState(config.nLevels);
  const [localMantissa, setLocalMantissa] = useState<2 | 5 | undefined>(config.mantissa);
  const [isExpanded, setIsExpanded] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalCoin(config.coin);
    setLocalNSigFigs(config.nSigFigs);
    setLocalNLevels(config.nLevels);
    setLocalMantissa(config.mantissa);
  }, [config]);

  const handleApply = () => {
    onConfigChange({
      coin: localCoin,
      nSigFigs: localNSigFigs,
      nLevels: localNLevels,
      mantissa: localNSigFigs === 5 ? localMantissa : undefined,
    });
  };

  const handleReset = () => {
    const defaultConfig: OrderBookConfig = {
      coin: DEFAULT_COIN,
      nSigFigs: DEFAULT_N_SIG_FIGS,
      nLevels: DEFAULT_N_LEVELS,
      mantissa: DEFAULT_MANTISSA,
    };
    setLocalCoin(defaultConfig.coin);
    setLocalNSigFigs(defaultConfig.nSigFigs);
    setLocalNLevels(defaultConfig.nLevels);
    setLocalMantissa(defaultConfig.mantissa);
    onConfigChange(defaultConfig);
  };

  const hasChanges =
    localCoin !== config.coin ||
    localNSigFigs !== config.nSigFigs ||
    localNLevels !== config.nLevels ||
    localMantissa !== config.mantissa;

  return (
    <div className={styles.container}>
      <Button
        variant="ghost"
        fullWidth
        className={styles.toggleButton}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className={styles.toggleIcon}>{isExpanded ? "▼" : "▶"}</span>
        <span className={styles.toggleLabel}>Configuration</span>
        {!isExpanded && (
          <span className={styles.currentConfig}>
            {config.coin} | {config.nSigFigs ? `${config.nSigFigs} figs` : "full precision"} |{" "}
            {config.nLevels} levels
          </span>
        )}
      </Button>

      {isExpanded && (
        <div className={styles.panel}>
          <div className={styles.section}>
            <label className={styles.label}>
              <span className={styles.labelText}>Coin</span>
              <Select fullWidth value={localCoin} onChange={(e) => setLocalCoin(e.target.value)}>
                {AVAILABLE_COINS.map((coin) => (
                  <option key={coin} value={coin}>
                    {coin}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <div className={styles.section}>
            <label className={styles.label}>
              <span className={styles.labelText}>
                Significant Figures ({SIG_FIGS_MIN}-{SIG_FIGS_MAX})
              </span>
              <div className={styles.inputGroup}>
                <input
                  type="range"
                  className={styles.slider}
                  min={SIG_FIGS_MIN}
                  max={SIG_FIGS_MAX}
                  value={localNSigFigs ?? SIG_FIGS_MAX + 1}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setLocalNSigFigs(value > SIG_FIGS_MAX ? undefined : value);
                  }}
                />
                <input
                  type="number"
                  className={styles.numberInput}
                  min={SIG_FIGS_MIN}
                  max={SIG_FIGS_MAX}
                  value={localNSigFigs ?? ""}
                  placeholder="Auto"
                  onChange={(e) => {
                    const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                    setLocalNSigFigs(value);
                  }}
                />
              </div>
              <span className={styles.hint}>
                {localNSigFigs === undefined
                  ? "Full precision (no bucketing)"
                  : `${localNSigFigs} significant figures`}
              </span>
            </label>
          </div>

          {localNSigFigs === 5 && (
            <div className={styles.section}>
              <label className={styles.label}>
                <span className={styles.labelText}>Mantissa (rounding)</span>
                <div className={styles.radioGroup}>
                  {MANTISSA_OPTIONS.map((value) => (
                    <label key={value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="mantissa"
                        value={value}
                        checked={localMantissa === value}
                        onChange={(e) => setLocalMantissa(parseInt(e.target.value) as 2 | 5)}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
                <span className={styles.hint}>Only applies when nSigFigs = 5</span>
              </label>
            </div>
          )}

          <div className={styles.section}>
            <label className={styles.label}>
              <span className={styles.labelText}>
                Number of Levels ({LEVELS_MIN}-{LEVELS_MAX})
              </span>
              <div className={styles.inputGroup}>
                <input
                  type="range"
                  className={styles.slider}
                  min={LEVELS_MIN}
                  max={LEVELS_MAX}
                  value={localNLevels}
                  onChange={(e) => setLocalNLevels(parseInt(e.target.value))}
                />
                <input
                  type="number"
                  className={styles.numberInput}
                  min={LEVELS_MIN}
                  max={LEVELS_MAX}
                  value={localNLevels}
                  onChange={(e) => setLocalNLevels(parseInt(e.target.value))}
                />
              </div>
              <span className={styles.hint}>{localNLevels} levels per side (bids/asks)</span>
            </label>
          </div>

          <div className={styles.actions}>
            <Button variant="secondary" onClick={handleReset}>
              Reset to Defaults
            </Button>
            <Button variant="primary" onClick={handleApply} disabled={!hasChanges}>
              Apply Changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
