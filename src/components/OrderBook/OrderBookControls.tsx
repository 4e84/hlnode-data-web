import { useMemo } from "react";
import type { OrderBookConfig } from "../../types/orderbook";
import { useDisplayConfig } from "../../context/DisplayConfigContext";
import { Button } from "../Button";
import { Select } from "../Select";
import {
  generateBucketOptions,
  findBestBucketConfig,
  formatBucketSize,
  selectDefaultBucket,
} from "../../utils/bucketSizeUtils";
import styles from "./OrderBookControls.module.css";

interface OrderBookControlsProps {
  config: OrderBookConfig;
  onConfigChange: (config: OrderBookConfig) => void;
  currentPrice: number;
}

export function OrderBookControls({
  config,
  onConfigChange,
  currentPrice,
}: OrderBookControlsProps) {
  const { layout, setLayout } = useDisplayConfig();

  // Generate available bucket options based on current price
  const bucketOptions = useMemo(() => {
    if (!currentPrice || currentPrice <= 0) return [];
    return generateBucketOptions(currentPrice);
  }, [currentPrice]);

  // Get current bucket size or calculate default
  const currentBucket = useMemo(() => {
    if (config.bucketSize !== undefined && config.bucketSize > 0) {
      return config.bucketSize;
    }
    // If no bucket is set, use default (middle option: nSigFigs=4)
    return selectDefaultBucket(currentPrice);
  }, [config.bucketSize, currentPrice]);

  const handleBucketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const desiredBucket = parseFloat(e.target.value);
    const bucketConfig = findBestBucketConfig(currentPrice, desiredBucket);
    onConfigChange({
      ...config,
      nSigFigs: bucketConfig.nSigFigs,
      mantissa: bucketConfig.mantissa,
      bucketSize: desiredBucket,
    });
  };

  const handleLevelsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onConfigChange({ ...config, nLevels: parseInt(e.target.value, 10) });
  };

  const handleLayoutToggle = () => {
    setLayout(layout === "horizontal" ? "vertical" : "horizontal");
  };

  return (
    <div className={styles.controls}>
      <div className={styles.leftGroup}>
        <Select value={currentBucket.toString()} onChange={handleBucketChange} title="Bucket size">
          {bucketOptions.map((bucket) => (
            <option key={bucket} value={bucket.toString()}>
              {formatBucketSize(bucket)}
            </option>
          ))}
        </Select>

        <Select value={config.nLevels} onChange={handleLevelsChange} title="Number of levels">
          <option value="10">10 levels</option>
          <option value="20">20 levels</option>
          <option value="50">50 levels</option>
          <option value="100">100 levels</option>
        </Select>
      </div>

      <div className={styles.rightGroup}>
        <Button variant="secondary" onClick={handleLayoutToggle} title="Toggle layout">
          {layout === "horizontal" ? "Horizontal" : "Vertical"}
        </Button>
      </div>
    </div>
  );
}
