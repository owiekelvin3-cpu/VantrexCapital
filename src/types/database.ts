export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type KycStatus = "none" | "pending" | "approved" | "rejected";
export type TransactionStatus = "pending" | "approved" | "rejected" | "completed";
export type UserFeeStatus = "pending" | "paid" | "waived" | "cancelled";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: UserRole;
          kyc_status: KycStatus;
          avatar_url: string | null;
          wallet_address: string | null;
          wallet_label: string | null;
          phone: string | null;
          bio: string | null;
          country: string | null;
          city: string | null;
          region: string | null;
          timezone: string | null;
          last_known_ip: string | null;
          last_known_location: string | null;
          location_updated_at: string | null;
          is_suspended: boolean;
          suspended_at: string | null;
          suspended_by: string | null;
          suspension_reason: string | null;
          admin_notes: string | null;
          preferred_currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: UserRole;
          kyc_status?: KycStatus;
          avatar_url?: string | null;
          wallet_address?: string | null;
          wallet_label?: string | null;
          phone?: string | null;
          bio?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          timezone?: string | null;
          last_known_ip?: string | null;
          last_known_location?: string | null;
          location_updated_at?: string | null;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          admin_notes?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: UserRole;
          kyc_status?: KycStatus;
          avatar_url?: string | null;
          wallet_address?: string | null;
          wallet_label?: string | null;
          phone?: string | null;
          bio?: string | null;
          country?: string | null;
          city?: string | null;
          region?: string | null;
          timezone?: string | null;
          last_known_ip?: string | null;
          last_known_location?: string | null;
          location_updated_at?: string | null;
          is_suspended?: boolean;
          suspended_at?: string | null;
          suspended_by?: string | null;
          suspension_reason?: string | null;
          admin_notes?: string | null;
          preferred_currency?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      kyc_submissions: {
        Row: {
          id: string;
          user_id: string;
          document_type: string;
          document_url: string | null;
          selfie_url: string | null;
          face_captured_at: string | null;
          status: KycStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_type: string;
          document_url?: string | null;
          selfie_url?: string | null;
          face_captured_at?: string | null;
          status?: KycStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          document_type?: string;
          document_url?: string | null;
          selfie_url?: string | null;
          face_captured_at?: string | null;
          status?: KycStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      balances: {
        Row: {
          id: string;
          user_id: string;
          currency: string;
          amount: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          currency?: string;
          amount?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          currency?: string;
          amount?: number;
          updated_at?: string;
        };
      };
      deposits: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          method: string;
          status: TransactionStatus;
          notes: string | null;
          related_fee_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          method: string;
          status?: TransactionStatus;
          notes?: string | null;
          related_fee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          method?: string;
          status?: TransactionStatus;
          notes?: string | null;
          related_fee_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      withdrawals: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          currency: string;
          method: string;
          wallet_address: string | null;
          status: TransactionStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          currency?: string;
          method: string;
          wallet_address?: string | null;
          status?: TransactionStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          currency?: string;
          method?: string;
          wallet_address?: string | null;
          status?: TransactionStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      trades: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          type: "buy" | "sell";
          amount: number;
          price: number;
          status: TransactionStatus;
          profit: number;
          profit_note: string | null;
          profit_updated_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset: string;
          type: "buy" | "sell";
          amount: number;
          price: number;
          status?: TransactionStatus;
          profit?: number;
          profit_note?: string | null;
          profit_updated_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          type?: "buy" | "sell";
          amount?: number;
          price?: number;
          status?: TransactionStatus;
          profit?: number;
          profit_note?: string | null;
          profit_updated_at?: string | null;
          created_at?: string;
        };
      };
      trade_profit_credits: {
        Row: {
          id: string;
          trade_id: string;
          user_id: string;
          admin_id: string;
          amount: number;
          note: string | null;
          balance_before: number;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trade_id: string;
          user_id: string;
          admin_id: string;
          amount: number;
          note?: string | null;
          balance_before: number;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          trade_id?: string;
          user_id?: string;
          admin_id?: string;
          amount?: number;
          note?: string | null;
          balance_before?: number;
          balance_after?: number;
          created_at?: string;
        };
      };
      holdings: {
        Row: {
          id: string;
          user_id: string;
          asset: string;
          quantity: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          asset: string;
          quantity?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          asset?: string;
          quantity?: number;
          updated_at?: string;
        };
      };
      plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price: number;
          features: string[];
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price: number;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          price?: number;
          features?: string[];
          is_active?: boolean;
          created_at?: string;
        };
      };
      copy_trading_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          trader_name: string;
          allocation: number;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          trader_name: string;
          allocation: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          trader_name?: string;
          allocation?: number;
          status?: string;
          created_at?: string;
        };
      };
      mining_packages: {
        Row: {
          id: string;
          user_id: string;
          package_id: string | null;
          package_name: string;
          investment: number;
          daily_return: number;
          hashrate: string | null;
          term_days: number | null;
          expires_at: string | null;
          accrued_profit: number;
          last_accrual_at: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id?: string | null;
          package_name: string;
          investment: number;
          daily_return: number;
          hashrate?: string | null;
          term_days?: number | null;
          expires_at?: string | null;
          accrued_profit?: number;
          last_accrual_at?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string | null;
          package_name?: string;
          investment?: number;
          daily_return?: number;
          hashrate?: string | null;
          term_days?: number | null;
          expires_at?: string | null;
          accrued_profit?: number;
          last_accrual_at?: string;
          status?: string;
          created_at?: string;
        };
      };
      signal_packages: {
        Row: {
          id: string;
          user_id: string;
          package_id: string | null;
          package_name: string;
          price: number;
          status: string;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id?: string | null;
          package_name: string;
          price: number;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string | null;
          package_name?: string;
          price?: number;
          status?: string;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      trading_signals: {
        Row: {
          id: string;
          symbol: string;
          direction: string;
          entry_price: string;
          target_price: string;
          stop_price: string;
          status: string;
          min_tier: string;
          confidence: number;
          outcome: string | null;
          notes: string | null;
          published_at: string;
          closed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          symbol: string;
          direction: string;
          entry_price: string;
          target_price: string;
          stop_price: string;
          status?: string;
          min_tier?: string;
          confidence?: number;
          outcome?: string | null;
          notes?: string | null;
          published_at?: string;
          closed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          symbol?: string;
          direction?: string;
          entry_price?: string;
          target_price?: string;
          stop_price?: string;
          status?: string;
          min_tier?: string;
          confidence?: number;
          outcome?: string | null;
          notes?: string | null;
          published_at?: string;
          closed_at?: string | null;
          created_at?: string;
        };
      };
      ai_trading_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          bot_id: string | null;
          bot_name: string;
          allocation: number;
          duration_hours: number;
          expires_at: string | null;
          crypto_asset: string;
          profit_earned: number;
          last_sync_at: string | null;
          purchase_cost: number | null;
          market: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          bot_id?: string | null;
          bot_name: string;
          allocation: number;
          duration_hours?: number;
          expires_at?: string | null;
          crypto_asset?: string;
          profit_earned?: number;
          last_sync_at?: string | null;
          purchase_cost?: number | null;
          market?: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          bot_id?: string | null;
          bot_name?: string;
          allocation?: number;
          duration_hours?: number;
          expires_at?: string | null;
          crypto_asset?: string;
          profit_earned?: number;
          last_sync_at?: string | null;
          purchase_cost?: number | null;
          market?: string;
          status?: string;
          created_at?: string;
        };
      };
      ai_bot_trades: {
        Row: {
          id: string;
          subscription_id: string;
          user_id: string;
          crypto_asset: string;
          trade_amount: number;
          profit: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          subscription_id: string;
          user_id: string;
          crypto_asset: string;
          trade_amount: number;
          profit: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          subscription_id?: string;
          user_id?: string;
          crypto_asset?: string;
          trade_amount?: number;
          profit?: number;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          read?: boolean;
          created_at?: string;
        };
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          endpoint?: string;
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      platform_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          updated_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          certificate_id: string;
          holder_name: string;
          issue_date: string;
          type: string;
          verified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          certificate_id: string;
          holder_name: string;
          issue_date: string;
          type: string;
          verified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          certificate_id?: string;
          holder_name?: string;
          issue_date?: string;
          type?: string;
          verified?: boolean;
          created_at?: string;
        };
      };
      support_conversations: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          status: SupportConversationStatus;
          priority: SupportPriority;
          assigned_admin_id: string | null;
          pinned: boolean;
          archived: boolean;
          last_message_at: string;
          last_message_preview: string | null;
          user_last_read_at: string | null;
          admin_last_read_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject?: string;
          status?: SupportConversationStatus;
          priority?: SupportPriority;
          assigned_admin_id?: string | null;
          pinned?: boolean;
          archived?: boolean;
          last_message_at?: string;
          last_message_preview?: string | null;
          user_last_read_at?: string | null;
          admin_last_read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          status?: SupportConversationStatus;
          priority?: SupportPriority;
          assigned_admin_id?: string | null;
          pinned?: boolean;
          archived?: boolean;
          last_message_at?: string;
          last_message_preview?: string | null;
          user_last_read_at?: string | null;
          admin_last_read_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      support_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          sender_role: SupportSenderRole;
          body: string;
          is_internal: boolean;
          delivered_at: string | null;
          read_at: string | null;
          client_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          sender_role: SupportSenderRole;
          body?: string;
          is_internal?: boolean;
          delivered_at?: string | null;
          read_at?: string | null;
          client_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          sender_role?: SupportSenderRole;
          body?: string;
          is_internal?: boolean;
          delivered_at?: string | null;
          read_at?: string | null;
          client_id?: string | null;
          created_at?: string;
        };
      };
      support_attachments: {
        Row: {
          id: string;
          message_id: string;
          conversation_id: string;
          file_name: string;
          file_path: string;
          file_size: number;
          mime_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          conversation_id: string;
          file_name: string;
          file_path: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          conversation_id?: string;
          file_name?: string;
          file_path?: string;
          file_size?: number;
          mime_type?: string;
          created_at?: string;
        };
      };
      support_internal_notes: {
        Row: {
          id: string;
          conversation_id: string;
          admin_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          admin_id: string;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          admin_id?: string;
          body?: string;
          created_at?: string;
        };
      };
      user_fees: {
        Row: {
          id: string;
          user_id: string;
          fee_type: string;
          label: string;
          amount: number;
          currency: string;
          status: UserFeeStatus;
          notes: string | null;
          assigned_by: string | null;
          paid_at: string | null;
          paid_via_deposit_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fee_type: string;
          label: string;
          amount: number;
          currency?: string;
          status?: UserFeeStatus;
          notes?: string | null;
          assigned_by?: string | null;
          paid_at?: string | null;
          paid_via_deposit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fee_type?: string;
          label?: string;
          amount?: number;
          currency?: string;
          status?: UserFeeStatus;
          notes?: string | null;
          assigned_by?: string | null;
          paid_at?: string | null;
          paid_via_deposit_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type SupportConversationStatus = "open" | "pending" | "resolved" | "archived";
export type SupportPriority = "normal" | "high";
export type SupportSenderRole = "user" | "admin" | "system";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Deposit = Database["public"]["Tables"]["deposits"]["Row"];
export type Withdrawal = Database["public"]["Tables"]["withdrawals"]["Row"];
export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type TradeProfitCredit = Database["public"]["Tables"]["trade_profit_credits"]["Row"];
export type Holding = Database["public"]["Tables"]["holdings"]["Row"];
export type Plan = Database["public"]["Tables"]["plans"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type SupportConversation = Database["public"]["Tables"]["support_conversations"]["Row"];
export type SupportMessage = Database["public"]["Tables"]["support_messages"]["Row"];
export type SupportAttachment = Database["public"]["Tables"]["support_attachments"]["Row"];
export type SupportInternalNote = Database["public"]["Tables"]["support_internal_notes"]["Row"];
export type UserFee = Database["public"]["Tables"]["user_fees"]["Row"];
