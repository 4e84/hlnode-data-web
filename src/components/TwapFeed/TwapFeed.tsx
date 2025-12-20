import { useEffect, useRef } from "react";
import { useCoinContext } from "../../context/CoinContext";
import { useTwap } from "../../hooks/useTwap";
import { TwapItem } from "./TwapItem";
import styles from "./TwapFeed.module.css";

export function TwapFeed() {
  const { coin } = useCoinContext();
  const { twapStatuses, isLoading, error } = useTwap(coin);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStatusesLengthRef = useRef(0);

  // Auto-scroll to top when new statuses arrive
  useEffect(() => {
    if (twapStatuses.length > prevStatusesLengthRef.current && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
    prevStatusesLengthRef.current = twapStatuses.length;
  }, [twapStatuses.length]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  if (isLoading && twapStatuses.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLabels}>
          <span>SIDE</span>
          <span>STATUS</span>
          <span>SIZE</span>
          <span>EXEC</span>
          <span>PROG</span>
          <span>AVG</span>
          <span>TIME</span>
        </div>
      </div>

      <div className={styles.statuses} ref={containerRef}>
        {twapStatuses.length === 0 ? (
          <div className={styles.empty}>
            <p>No TWAP orders yet</p>
          </div>
        ) : (
          twapStatuses.map((twap) => <TwapItem key={twap.id} twap={twap} />)
        )}
      </div>
    </div>
  );
}
