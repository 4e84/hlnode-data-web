import { useRef, useEffect } from "react";
import type { OrderBookState, OrderBookConfig } from "../../types/orderbook";
import { useDisplayConfig } from "../../context/DisplayConfigContext";
import { OrderBookLevel } from "./OrderBookLevel";
import { OrderBookControls } from "./OrderBookControls";
import { formatPrice } from "../../utils/formatters";
import { calculateMaxTotal, calculateMaxSize } from "../../utils/calculations";
import styles from "./OrderBook.module.css";

interface OrderBookProps {
  orderBook: OrderBookState | null;
  isLoading: boolean;
  error: string | null;
  config: OrderBookConfig;
  onConfigChange: (config: OrderBookConfig) => void;
}

export function OrderBook({ orderBook, isLoading, error, config, onConfigChange }: OrderBookProps) {
  const { layout, displayUnit } = useDisplayConfig();
  const asksRef = useRef<HTMLDivElement>(null);
  const hasInitializedScroll = useRef(false);

  // Initialize scroll position at bottom only once so best ask is visible
  useEffect(() => {
    if (asksRef.current && orderBook?.asks && !hasInitializedScroll.current) {
      asksRef.current.scrollTop = asksRef.current.scrollHeight;
      hasInitializedScroll.current = true;
    }
  }, [orderBook?.asks]);

  // Use placeholder values when orderBook is null
  const coin = orderBook?.coin || config.coin;
  const quoteCurrency = orderBook?.quoteCurrency || "USD";
  const bids = orderBook?.bids || [];
  const asks = orderBook?.asks || [];
  const midPrice = orderBook?.midPrice || 0;

  // Calculate cumulative totals for bids (from best bid down)
  const bidsWithTotal = bids.map((bid, index) => {
    const total = bids.slice(0, index + 1).reduce((sum, b) => sum + parseFloat(b.sz), 0);
    return { ...bid, total };
  });

  // Calculate cumulative totals for asks (from best ask up)
  const asksWithTotal = asks.map((ask, index) => {
    const total = asks.slice(0, index + 1).reduce((sum, a) => sum + parseFloat(a.sz), 0);
    return { ...ask, total };
  });

  // Calculate maximum cumulative total for depth bar scaling
  const maxTotal = calculateMaxTotal(bidsWithTotal, asksWithTotal);

  // Calculate maximum size for size bar scaling
  const maxSize = calculateMaxSize(bids, asks);

  // In horizontal layout, use asks as-is (best ask first, at top)
  // In vertical layout, column-reverse CSS will flip the display
  const asksToRender = asksWithTotal;

  return (
    <div className={styles.container}>
      <OrderBookControls config={config} onConfigChange={onConfigChange} currentPrice={midPrice} />

      {layout === "vertical" ? (
        <>
          <div className={styles.header}>
            <span className={styles.headerLabel}>PRICE</span>
            <span className={styles.headerLabel}>
              TOTAL ({displayUnit === "coin" ? coin : quoteCurrency})
            </span>
            <span className={styles.headerLabel}>
              SIZE ({displayUnit === "coin" ? coin : quoteCurrency})
            </span>
          </div>

          <div className={styles.levels}>
            {/* Asks (top, scroll to bottom to see best ask) */}
            <div className={styles.asks} ref={asksRef}>
              {asksWithTotal.length === 0 ? (
                <div className={styles.emptyState}>
                  {error ? `Error: ${error}` : isLoading ? "Connecting to orderbook..." : "No data"}
                </div>
              ) : (
                asksWithTotal.map((ask, index) => (
                  <OrderBookLevel
                    key={`ask-${ask.px}-${index}`}
                    level={ask}
                    side="ask"
                    maxTotal={maxTotal}
                    maxSize={maxSize}
                    total={ask.total}
                    displayUnit={displayUnit}
                    layout="vertical"
                  />
                ))
              )}
            </div>

            {/* Mid price indicator */}
            <div className={styles.midPriceBar}>
              <span className={styles.midValue}>{orderBook ? formatPrice(midPrice) : "---"}</span>
            </div>

            {/* Bids (bottom) */}
            <div className={styles.bids}>
              {bidsWithTotal.length === 0 ? (
                <div className={styles.emptyState}>
                  {error ? `Error: ${error}` : isLoading ? "Connecting to orderbook..." : "No data"}
                </div>
              ) : (
                bidsWithTotal.map((bid, index) => (
                  <OrderBookLevel
                    key={`bid-${bid.px}-${index}`}
                    level={bid}
                    side="bid"
                    maxTotal={maxTotal}
                    maxSize={maxSize}
                    total={bid.total}
                    displayUnit={displayUnit}
                    layout="vertical"
                  />
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Horizontal layout: mid price on top, asks left | bids right */}
          <div className={styles.midPriceBarHorizontal}>
            <span className={styles.midValue}>{orderBook ? formatPrice(midPrice) : "---"}</span>
          </div>

          <div className={styles.levelsHorizontal}>
            {/* Asks (left side) */}
            <div className={styles.asksHorizontal}>
              <div className={styles.headerHorizontal}>
                <span className={styles.headerLabel}>PRICE</span>
                <span className={styles.headerLabel}>
                  TOTAL ({displayUnit === "coin" ? coin : quoteCurrency})
                </span>
                <span className={styles.headerLabel}>
                  SIZE ({displayUnit === "coin" ? coin : quoteCurrency})
                </span>
              </div>
              <div className={styles.asksScroll}>
                {asksToRender.length === 0 ? (
                  <div className={styles.emptyState}>
                    {error
                      ? `Error: ${error}`
                      : isLoading
                        ? "Connecting to orderbook..."
                        : "No data"}
                  </div>
                ) : (
                  asksToRender.map((ask, index) => (
                    <OrderBookLevel
                      key={`ask-${ask.px}-${index}`}
                      level={ask}
                      side="ask"
                      maxTotal={maxTotal}
                      maxSize={maxSize}
                      total={ask.total}
                      displayUnit={displayUnit}
                      layout="horizontal"
                    />
                  ))
                )}
              </div>
            </div>

            {/* Bids (right side) */}
            <div className={styles.bidsHorizontal}>
              <div className={`${styles.headerHorizontal} ${styles.headerHorizontalMirrored}`}>
                <span className={styles.headerLabel}>
                  SIZE ({displayUnit === "coin" ? coin : quoteCurrency})
                </span>
                <span className={styles.headerLabel}>
                  TOTAL ({displayUnit === "coin" ? coin : quoteCurrency})
                </span>
                <span className={styles.headerLabel}>PRICE</span>
              </div>
              <div className={styles.bidsScroll}>
                {bidsWithTotal.length === 0 ? (
                  <div className={styles.emptyState}>
                    {error
                      ? `Error: ${error}`
                      : isLoading
                        ? "Connecting to orderbook..."
                        : "No data"}
                  </div>
                ) : (
                  bidsWithTotal.map((bid, index) => (
                    <OrderBookLevel
                      key={`bid-${bid.px}-${index}`}
                      level={bid}
                      side="bid"
                      maxTotal={maxTotal}
                      maxSize={maxSize}
                      total={bid.total}
                      displayUnit={displayUnit}
                      layout="horizontal"
                      reversed={true}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
