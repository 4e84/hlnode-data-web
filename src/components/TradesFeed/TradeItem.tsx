import { memo } from "react";
import type { TradeItem as TradeItemType } from "../../types/trades";
import type { DisplayUnit } from "../../context/DisplayConfigContext";
import { formatPrice, formatSize, formatTime } from "../../utils/formatters";
import styles from "./TradesFeed.module.css";

interface TradeItemProps {
  trade: TradeItemType;
  displayUnit: DisplayUnit;
}

export const TradeItem = memo(function TradeItem({ trade, displayUnit }: TradeItemProps) {
  const price = parseFloat(trade.px);
  const size = parseFloat(trade.sz);
  const side = trade.side === "B" ? "buy" : "sell"; // B = bid/buy (taker), A = ask/sell (taker)

  return (
    <div className={`${styles.trade} ${styles[side]}`}>
      <span className={styles.price}>{formatPrice(price)}</span>
      <span className={styles.size}>{formatSize(size, displayUnit, price)}</span>
      <span className={styles.time}>{formatTime(trade.time)}</span>
    </div>
  );
});
