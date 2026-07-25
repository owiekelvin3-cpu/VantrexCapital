export interface AISubscription {
  id: string;
  bot_id: string | null;
  bot_name: string;
  allocation: number;
  duration_hours: number;
  expires_at: string | null;
  crypto_asset: string;
  profit_earned: number;
  entry_price?: number | null;
  last_mark_price?: number | null;
  admin_pnl?: number | null;
  last_sync_at: string | null;
  status: string;
  created_at: string;
}

export interface AIBotTrade {
  id: string;
  subscription_id: string;
  crypto_asset: string;
  trade_amount: number;
  profit: number;
  created_at: string;
}

export type AITradingView = "start" | "running" | "past";
export type StartStep = 1 | 2;
