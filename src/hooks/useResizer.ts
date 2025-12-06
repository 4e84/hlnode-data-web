import { useState, useRef, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'orderbook-split-ratio';

interface UseResizerOptions {
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}

interface UseResizerResult {
  ratio: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
}

/**
 * Hook for managing a resizable split pane.
 * Returns ratio (0-1) representing the left panel's width proportion.
 */
export function useResizer({
  initialRatio = 0.5,
  minRatio = 0.2,
  maxRatio = 0.8,
}: UseResizerOptions = {}): UseResizerResult {
  // Initialize from localStorage, fall back to initialRatio
  const [ratio, setRatio] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= minRatio && parsed <= maxRatio) {
          return parsed;
        }
      }
    } catch {
      // localStorage not available
    }
    return initialRatio;
  });

  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isResizingRef = useRef(false);
  const ratioRef = useRef(ratio);

  // Keep ratioRef in sync with ratio
  ratioRef.current = ratio;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setRatio(Math.max(minRatio, Math.min(maxRatio, newRatio)));
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // Save to localStorage
        try {
          localStorage.setItem(STORAGE_KEY, ratioRef.current.toString());
        } catch {
          // localStorage not available
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minRatio, maxRatio]);

  return { ratio, containerRef, handleMouseDown, isResizing };
}
