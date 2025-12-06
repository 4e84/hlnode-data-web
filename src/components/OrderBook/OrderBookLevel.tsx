import { memo } from 'react';
import type { OrderBookLevel as OrderBookLevelType } from '../../types/orderbook';
import { formatPrice, formatSize } from '../../utils/formatters';
import { parseLevelPrice, parseLevelSize, calculateDepthBarWidth } from '../../utils/calculations';
import styles from './OrderBook.module.css';

interface OrderBookLevelProps {
  level: OrderBookLevelType;
  side: 'bid' | 'ask';
  maxTotal: number;
  maxSize: number;
  total: number;
  displayUnit?: 'coin' | 'usd';
  layout?: 'vertical' | 'horizontal';
  reversed?: boolean;
}

export const OrderBookLevel = memo(function OrderBookLevel({
  level,
  side,
  maxTotal,
  maxSize,
  total,
  displayUnit,
  layout,
  reversed,
}: OrderBookLevelProps) {
  const price = parseLevelPrice(level);
  const size = parseLevelSize(level);
  const totalBarWidth = calculateDepthBarWidth(total, maxTotal);
  const sizeBarWidth = calculateDepthBarWidth(size, maxSize);

  const depthBarClasses = layout === 'horizontal'
    ? `${styles.depthBarTotal} ${styles.horizontal}`
    : styles.depthBarTotal;
  const sizeBarClasses = layout === 'horizontal'
    ? `${styles.depthBarSize} ${styles.horizontal}`
    : styles.depthBarSize;

  const levelClasses = `${styles.level} ${styles[side]}${reversed ? ` ${styles.levelMirrored}` : ''}`;

  return (
    <div className={levelClasses}>
      <div
        className={depthBarClasses}
        style={{ transform: `scaleX(${totalBarWidth / 100})` }}
        data-side={side}
      />
      <div
        className={sizeBarClasses}
        style={{ transform: `scaleX(${sizeBarWidth / 100})` }}
        data-side={side}
      />

      <span className={styles.price}>{formatPrice(price)}</span>
      <span className={styles.total}>{formatSize(total, displayUnit, price)}</span>
      <span className={styles.size}>{formatSize(size, displayUnit, price)}</span>
    </div>
  );
});
