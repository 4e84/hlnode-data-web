import { useOrderBook } from "./hooks/useOrderBook";
import { useConnectionStatus } from "./hooks/useConnectionStatus";
import { useCoinContext } from "./context/CoinContext";
import { useResizer } from "./hooks/useResizer";
import { OrderBook } from "./components/OrderBook/OrderBook";
import { TradesFeed } from "./components/TradesFeed/TradesFeed";
import { Header } from "./components/Header/Header";
import { StatusBar } from "./components/StatusBar/StatusBar";
import styles from "./App.module.css";

function App() {
  const { status, url, reconnect } = useConnectionStatus();
  const { coin, setCoin, config, updateConfig } = useCoinContext();

  const {
    orderBook,
    isLoading: isOrderBookLoading,
    error: orderBookError,
    updateConfig: updateOrderBookConfig,
  } = useOrderBook(config);
  const { ratio, containerRef, handleMouseDown } = useResizer({
    initialRatio: 0.5,
    minRatio: 0.25,
    maxRatio: 0.75,
  });

  const handleConfigChange = (newConfig: typeof config) => {
    updateConfig(newConfig);
    updateOrderBookConfig(newConfig);
  };

  const handleCoinChange = (newCoin: string) => {
    setCoin(newCoin);
  };

  return (
    <div className={styles.app}>
      <div className={styles.container}>
        <Header orderBook={orderBook} currentCoin={coin} onCoinChange={handleCoinChange} />

        <div
          ref={containerRef}
          className={styles.main}
          style={{ "--split-ratio": ratio } as React.CSSProperties}
        >
          <div className={styles.orderbook}>
            <OrderBook
              orderBook={orderBook}
              isLoading={isOrderBookLoading}
              error={orderBookError}
              config={config}
              onConfigChange={handleConfigChange}
            />
          </div>

          <div className={styles.resizer} onMouseDown={handleMouseDown} />

          <div className={styles.trades}>
            <TradesFeed />
          </div>
        </div>

        <StatusBar status={status} wsUrl={url} onReconnect={reconnect} />
      </div>
    </div>
  );
}

export default App;
