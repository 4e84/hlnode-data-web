import { useState, useEffect, useRef } from 'react';
import styles from './SymbolSelector.module.css';

interface SymbolSelectorProps {
  symbols: string[];
  currentSymbol: string;
  quoteCurrency: string;
  onSelect: (symbol: string) => void;
  onClose: () => void;
  isOpen: boolean;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  initialSearch?: string;
}

export function SymbolSelector({
  symbols,
  currentSymbol,
  quoteCurrency,
  onSelect,
  onClose,
  isOpen,
  triggerRef,
  initialSearch = '',
}: SymbolSelectorProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Filter symbols based on search (searches full pair string)
  const filteredSymbols = symbols.filter(symbol => {
    const pair = `${symbol}/${quoteCurrency}`.toLowerCase();
    const searchLower = search.toLowerCase();
    return pair.includes(searchLower);
  });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch(initialSearch);
      setSelectedIndex(0);
      // Focus input after a brief delay to ensure popover is rendered
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialSearch]);

  // Click-outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const isOutsidePopover = popoverRef.current && !popoverRef.current.contains(target);
      const isOutsideTrigger = !triggerRef?.current || !triggerRef.current.contains(target);

      if (isOutsidePopover && isOutsideTrigger) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredSymbols.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredSymbols[selectedIndex]) {
            onSelect(filteredSymbols[selectedIndex]);
            onClose();
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredSymbols, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && isOpen) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div ref={popoverRef} className={styles.popover} role="dialog" aria-label="Symbol selector">
        <div className={styles.searchContainer}>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search pairs..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
            aria-label="Search pairs"
          />
        </div>

        <div className={styles.symbolList} ref={listRef}>
          {filteredSymbols.length > 0 ? (
            filteredSymbols.map((symbol, index) => (
              <button
                key={symbol}
                className={`${styles.symbolItem} ${
                  index === selectedIndex ? styles.selected : ''
                } ${symbol === currentSymbol ? styles.current : ''}`}
                onClick={() => {
                  onSelect(symbol);
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {symbol}/{quoteCurrency}
              </button>
            ))
          ) : (
            <div className={styles.noResults}>No symbols found</div>
          )}
        </div>

        <div className={styles.hint}>
          Use ↑↓ to navigate, Enter to select, Esc to close
        </div>
      </div>
  );
}
