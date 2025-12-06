import { memo, useState } from 'react';
import type { TwapItem as TwapItemType } from '../../types/twap';
import { formatSize, formatTime, formatTimeRemaining, formatDuration } from '../../utils/formatters';
import { useNow } from '../../hooks/useNow';
import styles from './TwapFeed.module.css';

interface TwapItemProps {
  twap: TwapItemType;
  displayUnit?: 'coin' | 'usd';
}

export const TwapItem = memo(function TwapItem({ twap, displayUnit = 'coin' }: TwapItemProps) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = twap.status.toLowerCase() === 'running';

  // Real-time countdown - only tick when TWAP is running
  const now = useNow(1000, isRunning);

  const size = parseFloat(twap.sz);
  const side = twap.side === 'B' ? 'buy' : 'sell';
  const sideLabel = twap.side === 'B' ? 'BUY' : 'SELL';

  // Calculate executed from fills (more real-time than server data)
  const fills = twap.fills || [];
  const fillsExecutedSize = fills.reduce((sum, f) => sum + parseFloat(f.sz), 0);
  const fillsExecutedNtl = fills.reduce(
    (sum, f) => sum + parseFloat(f.sz) * parseFloat(f.px),
    0
  );

  // Use max of server value and fills sum (fills might be more up-to-date)
  const executedSize = Math.max(parseFloat(twap.executedSz), fillsExecutedSize);
  const executedNtl = Math.max(parseFloat(twap.executedNtl), fillsExecutedNtl);

  // Progress calculation
  const progress = size > 0 ? (executedSize / size) * 100 : 0;

  // Average execution price
  const avgPrice = executedSize > 0 ? executedNtl / executedSize : 0;

  // Time calculations
  const endTimestamp = twap.timestamp + twap.minutes * 60 * 1000;

  // Status class
  const statusClass = getStatusClass(twap.status);

  // Has fills to show
  const hasFills = fills.length > 0;

  return (
    <div className={styles.twapWrapper}>
      <div
        className={`${styles.twap} ${styles[side]} ${hasFills ? styles.expandable : ''}`}
        onClick={() => hasFills && setExpanded(!expanded)}
      >
        <span className={`${styles.side} ${styles[side]}`}>{sideLabel}</span>
        <span className={`${styles.status} ${styles[statusClass]}`}>{twap.status}</span>
        <span className={styles.size}>{formatSize(size, displayUnit, avgPrice)}</span>
        <span className={styles.executed}>{formatSize(executedSize, displayUnit, avgPrice)}</span>
        <div className={styles.progressCell}>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${styles[side]}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <span className={styles.progressText}>{progress.toFixed(0)}%</span>
        </div>
        <span className={styles.avgPrice}>
          {avgPrice > 0 ? `$${avgPrice.toFixed(2)}` : '-'}
        </span>
        <span className={styles.timeRemaining}>
          {isRunning ? formatTimeRemaining(endTimestamp, now) : formatDuration(twap.minutes)}
        </span>
        {hasFills && (
          <span className={styles.expandIcon}>{expanded ? '▼' : '▶'}</span>
        )}
      </div>

      {expanded && hasFills && (
        <div className={styles.fillsSection}>
          <div className={styles.fillsHeader}>
            <span>Price</span>
            <span>Size</span>
            <span>Time</span>
          </div>
          {fills.map((fill) => (
            <div key={fill.tid} className={`${styles.fillRow} ${styles[side]}`}>
              <span className={styles.fillPrice}>${parseFloat(fill.px).toFixed(2)}</span>
              <span className={styles.fillSize}>{formatSize(parseFloat(fill.sz))}</span>
              <span className={styles.fillTime}>{formatTime(fill.time)}</span>
            </div>
          ))}
          {fills.length > 1 && (
            <div className={styles.fillsSummary}>
              <span>VWAP: ${avgPrice.toFixed(2)}</span>
              <span>{fills.length} fills</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function getStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'running':
      return 'statusRunning';
    case 'finished':
      return 'statusFinished';
    case 'cancelled':
    case 'canceled':
    case 'error':
      return 'statusCancelled';
    default:
      return 'statusRunning';
  }
}
