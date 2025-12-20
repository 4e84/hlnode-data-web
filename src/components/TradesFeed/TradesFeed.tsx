import { useEffect, useRef } from "react";
import { useCoinContext } from "../../context/CoinContext";
import { useDisplayConfig } from "../../context/DisplayConfigContext";
import { useTrades } from "../../hooks/useTrades";
import { TradeItem } from "./TradeItem";
import styles from "./TradesFeed.module.css";

export function TradesFeed() {
  const { coin } = useCoinContext();
  const { displayUnit } = useDisplayConfig();
  const { trades } = useTrades(coin);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevTradesLengthRef = useRef(0);

  // Auto-scroll to top when new trades arrive
  useEffect(() => {
    if (trades.length > prevTradesLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevTradesLengthRef.current = trades.length;
  }, [trades.length]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLabels}>
          <span>PRICE</span>
          <span>SIZE ({displayUnit === "usd" ? "USD" : coin.toUpperCase()})</span>
          <span>TIME</span>
        </div>
      </div>

      <div className={styles.trades} ref={containerRef}>
        {trades.length === 0 ? (
          <div className={styles.empty}></div>
        ) : (
          trades.map((trade) => (
            <TradeItem key={trade.id} trade={trade} displayUnit={displayUnit} />
          ))
        )}
      </div>
    </div>
  );
}
