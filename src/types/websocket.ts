export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export type SubscriptionType = "l2Book" | "l4Book" | "trades" | "twap";

export interface BaseSubscription {
  type: SubscriptionType;
  coin: string;
}

export interface L2BookSubscription extends BaseSubscription {
  type: "l2Book";
  nSigFigs?: number; // 2-5
  nLevels?: number; // 1-100, default 20
  mantissa?: 2 | 5; // Only valid when nSigFigs = 5
}

export interface L4BookSubscription extends BaseSubscription {
  type: "l4Book";
}

export interface TradesSubscription extends BaseSubscription {
  type: "trades";
}

export interface TwapSubscription extends BaseSubscription {
  type: "twap";
}

export type Subscription =
  | L2BookSubscription
  | L4BookSubscription
  | TradesSubscription
  | TwapSubscription;

export interface SubscribeMessage {
  method: "subscribe";
  subscription: Subscription;
}

export interface UnsubscribeMessage {
  method: "unsubscribe";
  subscription: Subscription;
}

export type OutgoingMessage = SubscribeMessage | UnsubscribeMessage;

export interface SubscriptionResponse {
  channel: "subscriptionResponse";
  data: {
    method: "subscribe" | "unsubscribe";
    subscription: Subscription;
  };
}

export interface ErrorMessage {
  channel: "error";
  data: string;
}

export type IncomingMessage = SubscriptionResponse | ErrorMessage;
