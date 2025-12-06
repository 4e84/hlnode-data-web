import { useState, useRef, useEffect } from 'react';
import type { OrderBookState } from '../../types/orderbook';
import { useAvailableSymbols } from '../../hooks/useAvailableSymbols';
import { useDisplayConfig } from '../../context/DisplayConfigContext';
import { Button } from '../Button';
import { Select } from '../Select';
import { SymbolSelector } from './SymbolSelector';
import styles from './Header.module.css';

interface HeaderProps {
  orderBook: OrderBookState | null;
  currentCoin: string;
  onCoinChange: (coin: string) => void;
}

export function Header({ orderBook, currentCoin, onCoinChange }: HeaderProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [initialSearch, setInitialSearch] = useState('');
  const { symbols: availableSymbols } = useAvailableSymbols();
  const { displayUnit, setDisplayUnit } = useDisplayConfig();
  const triggerRef = useRef<HTMLButtonElement>(null);

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDisplayUnit(e.target.value as 'coin' | 'usd');
  };

  // Type-to-open: open selector when user types alphanumeric
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only when selector is closed, no modifier keys, single alphanumeric character
      if (!isSelectorOpen && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          setInitialSearch(e.key);
          setIsSelectorOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSelectorOpen]);

  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <img src="https://hyperliquid.gitbook.io/hyperliquid-docs/~gitbook/image?url=https%3A%2F%2F2356094849-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FyUdp569E6w18GdfqlGvJ%252Ficon%252FsIAjqhKKIUysM08ahKPh%252FHL-logoSwitchDISliStat.png%3Falt%3Dmedia%26token%3Da81fa25c-0510-4d97-87ff-3fb8944935b1&width=32&dpr=1&quality=100&sign=3e1219e3&sv=2" />

        {orderBook ? <>
          <Button
            ref={triggerRef}
            variant="ghost"
            className={styles.symbolButton}
            onClick={() => setIsSelectorOpen(prev => !prev)}
            aria-label="Select symbol"
            aria-expanded={isSelectorOpen}
          >
            {currentCoin}/{orderBook.quoteCurrency} <span className={styles.arrow}>▼</span>
          </Button>
          <span className={styles.subtitle}>Perpetual Futures</span>
        </> : <></>}
        
      </div>

      <SymbolSelector
        symbols={availableSymbols}
        currentSymbol={currentCoin}
        quoteCurrency={orderBook?.quoteCurrency ?? ''}
        onSelect={onCoinChange}
        onClose={() => {
          setIsSelectorOpen(false);
          setInitialSearch('');
        }}
        isOpen={isSelectorOpen}
        triggerRef={triggerRef}
        initialSearch={initialSearch}
      />

      <div className={styles.stats}>
        <Select
          value={displayUnit}
          onChange={handleUnitChange}
          title="Display unit"
        >
          <option value="coin">Coin</option>
          <option value="usd">USD</option>
        </Select>
      </div>
    </div>
  );
}
