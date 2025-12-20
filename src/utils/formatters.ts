/**
 * Format price with appropriate decimal places and comma separators
 */
export function formatPrice(price: number): string {
  if (price >= 1000) {
    return "$" + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (price >= 1) {
    return "$" + price.toFixed(4);
  }
  return "$" + price.toFixed(6);
}

/**
 * Format size with appropriate decimal places
 */
export function formatSize(size: number, displayUnit?: "coin" | "usd", price?: number): string {
  // Convert to USD if requested and price is provided
  const value = displayUnit === "usd" && price ? size * price : size;

  // Quote currency display: no decimals, no symbol
  if (displayUnit === "usd") {
    return Math.round(value).toLocaleString("en-US");
  }

  // Coin display: variable decimals based on value
  if (value >= 1000) {
    return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  if (value >= 1) {
    return value.toFixed(3);
  }
  return value.toFixed(6);
}

/**
 * Format percentage with 2-4 decimal places
 */
export function formatPercent(percent: number): string {
  if (Math.abs(percent) >= 1) {
    return percent.toFixed(2) + "%";
  }
  return percent.toFixed(4) + "%";
}

/**
 * Format timestamp to readable time
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format timestamp to readable date and time
 */
export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

/**
 * Format relative time (e.g., "2s ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 1000) {
    return "just now";
  }
  if (diff < 60000) {
    return Math.floor(diff / 1000) + "s ago";
  }
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + "m ago";
  }
  return Math.floor(diff / 3600000) + "h ago";
}

/**
 * Format number with K/M/B suffixes
 */
export function formatCompact(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(2) + "B";
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(2) + "M";
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(2) + "K";
  }
  return value.toFixed(2);
}

/**
 * Format time remaining (e.g., "12m left", "45s left", "done")
 */
export function formatTimeRemaining(endTimestamp: number, now: number = Date.now()): string {
  const remaining = endTimestamp - now;

  if (remaining <= 0) {
    return "done";
  }

  const seconds = Math.floor(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${seconds}s`;
}

/**
 * Format duration in minutes to human readable
 */
export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${minutes}m`;
}
