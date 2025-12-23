/**
 * WebSocket Manager - Singleton service for WebSocket connection management
 *
 * Handles:
 * - Single WebSocket connection lifecycle
 * - Automatic reconnection with exponential backoff
 * - Subscription management with ref counting
 * - Message routing to registered callbacks
 */

import { DEFAULT_WS_URL, RECONNECT_DELAY_MS, MAX_RECONNECT_DELAY_MS } from "../constants/config";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

type MessageCallback = (data: unknown) => void;
type StatusCallback = (status: ConnectionStatus) => void;

interface Subscription {
  type: string;
  params: Record<string, unknown>;
  callbacks: Set<MessageCallback>;
}

interface WebSocketMessage {
  channel: string;
  data: unknown;
}

class WebSocketManager {
  private socket: WebSocket | null = null;
  private subscriptions = new Map<string, Subscription>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private url: string;
  private status: ConnectionStatus = "disconnected";
  private statusListeners = new Set<StatusCallback>();
  private paused = false;

  constructor(url: string) {
    this.url = url;
    this.setupVisibilityHandler();
  }

  /**
   * Setup Page Visibility API handler
   * Pauses subscriptions when tab is hidden, resumes when visible
   */
  private setupVisibilityHandler(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  /**
   * Pause all subscriptions (unsubscribe from server but keep local state)
   * Called automatically when tab becomes hidden
   */
  pause(): void {
    if (this.paused) return;
    this.paused = true;

    // Unsubscribe all topics from server
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach((sub) => {
        this.sendUnsubscribe(sub.type, sub.params);
      });
    }

    // Stop any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Resume all subscriptions (resubscribe to server)
   * Called automatically when tab becomes visible
   */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;

    // Resubscribe all topics to server
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.subscriptions.forEach((sub) => {
        this.sendSubscribe(sub.type, sub.params);
      });
    } else if (this.subscriptions.size > 0) {
      // Reconnect if we have active subscriptions but no connection
      this.connect();
    }
  }

  /**
   * Check if subscriptions are currently paused
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Initialize the WebSocket connection
   * Called lazily on first subscription
   */
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return;
    }

    this.setStatus("connecting");

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        // Re-subscribe all active subscriptions
        this.subscriptions.forEach((sub) => {
          this.sendSubscribe(sub.type, sub.params);
        });
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          this.routeMessage(message);
        } catch (e) {
          console.error("[WebSocketManager] Failed to parse message:", e);
        }
      };

      this.socket.onclose = () => {
        this.setStatus("disconnected");
        this.attemptReconnect();
      };

      this.socket.onerror = (error) => {
        console.error("[WebSocketManager] WebSocket error:", error);
        this.setStatus("error");
      };
    } catch (error) {
      console.error("[WebSocketManager] Failed to connect:", error);
      this.setStatus("error");
      this.attemptReconnect();
    }
  }

  /**
   * Subscribe to a topic with given parameters
   * Returns an unsubscribe function
   */
  subscribe(type: string, params: Record<string, unknown>, callback: MessageCallback): () => void {
    const key = this.buildKey(type, params);

    // Ensure connection is established
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      this.connect();
    }

    if (this.subscriptions.has(key)) {
      // Add callback to existing subscription (ref counting)
      this.subscriptions.get(key)!.callbacks.add(callback);
    } else {
      // Create new subscription
      this.subscriptions.set(key, {
        type,
        params,
        callbacks: new Set([callback]),
      });
      // Send subscribe message if connected and not paused
      if (this.socket?.readyState === WebSocket.OPEN && !this.paused) {
        this.sendSubscribe(type, params);
      }
    }

    // Return unsubscribe function
    return () => {
      const sub = this.subscriptions.get(key);
      if (sub) {
        sub.callbacks.delete(callback);
        // If no more callbacks, unsubscribe from server
        if (sub.callbacks.size === 0) {
          this.subscriptions.delete(key);
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.sendUnsubscribe(type, params);
          }
        }
      }
    };
  }

  /**
   * Subscribe to connection status changes
   * For use with React's useSyncExternalStore
   */
  subscribeToStatus = (callback: StatusCallback): (() => void) => {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  };

  /**
   * Get current connection status
   * For use with React's useSyncExternalStore
   */
  getStatus = (): ConnectionStatus => {
    return this.status;
  };

  /**
   * Get the WebSocket URL
   */
  getUrl(): string {
    return this.url;
  }

  /**
   * Force reconnect
   */
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  private buildKey(type: string, params: Record<string, unknown>): string {
    // Sort params for consistent key generation
    const sortedParams = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, unknown>,
      );
    return `${type}:${JSON.stringify(sortedParams)}`;
  }

  private routeMessage(message: WebSocketMessage): void {
    const { channel, data } = message;

    // Find matching subscriptions and notify callbacks
    this.subscriptions.forEach((sub) => {
      if (this.matchesChannel(sub, channel, data)) {
        sub.callbacks.forEach((cb) => cb(data));
      }
    });
  }

  private matchesChannel(sub: Subscription, channel: string, data: unknown): boolean {
    // Channel must match subscription type
    if (sub.type !== channel) {
      return false;
    }

    // For coin-specific subscriptions, check if coin matches
    if (sub.params.coin && typeof data === "object" && data !== null) {
      const dataObj = data as Record<string, unknown>;
      // Handle both single items and arrays
      if (Array.isArray(dataObj)) {
        // For arrays (like trades), check if any item matches the coin
        return dataObj.some((item) => item.coin === sub.params.coin);
      }
      return dataObj.coin === sub.params.coin;
    }

    return true;
  }

  private sendSubscribe(type: string, params: Record<string, unknown>): void {
    this.send({
      method: "subscribe",
      subscription: { type, ...params },
    });
  }

  private sendUnsubscribe(type: string, params: Record<string, unknown>): void {
    this.send({
      method: "unsubscribe",
      subscription: { type, ...params },
    });
  }

  private send(message: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusListeners.forEach((cb) => cb(status));
  }

  private attemptReconnect(): void {
    // Don't reconnect while paused
    if (this.paused) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocketManager] Max reconnect attempts reached");
      this.setStatus("error");
      return;
    }

    // Exponential backoff
    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, this.reconnectAttempts),
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempts++;
    console.log(
      `[WebSocketManager] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }
}

// Singleton instance
export const wsManager = new WebSocketManager(DEFAULT_WS_URL);
