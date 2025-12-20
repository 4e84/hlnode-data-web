import type { TwapItem } from "../types/twap";

const STORAGE_KEY = "twap_statuses";
const EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minute grace period after TWAP should complete

interface StoredTwapData {
  [coin: string]: TwapItem[];
}

function calculateExpiry(twap: TwapItem): number {
  return twap.timestamp + twap.minutes * 60 * 1000 + EXPIRY_BUFFER_MS;
}

function isExpired(twap: TwapItem): boolean {
  return Date.now() > calculateExpiry(twap);
}

export function loadTwapStatuses(coin: string): TwapItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const data: StoredTwapData = JSON.parse(stored);
    const coinStatuses = data[coin] || [];

    // Filter out expired TWAPs
    return coinStatuses.filter((twap) => !isExpired(twap));
  } catch {
    return [];
  }
}

export function saveTwapStatuses(coin: string, statuses: TwapItem[]): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const data: StoredTwapData = stored ? JSON.parse(stored) : {};

    // Filter out expired before saving
    data[coin] = statuses.filter((twap) => !isExpired(twap));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage errors (quota, etc.)
  }
}

export function cleanupExpiredTwaps(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const data: StoredTwapData = JSON.parse(stored);
    let changed = false;

    for (const coin of Object.keys(data)) {
      const filtered = data[coin].filter((twap) => !isExpired(twap));
      if (filtered.length !== data[coin].length) {
        data[coin] = filtered;
        changed = true;
      }
      // Remove empty coin entries
      if (data[coin].length === 0) {
        delete data[coin];
        changed = true;
      }
    }

    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  } catch {
    // Ignore errors
  }
}
