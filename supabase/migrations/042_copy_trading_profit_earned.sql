-- Copy trading UI / admin PnL expect profit_earned on subscriptions.
ALTER TABLE public.copy_trading_subscriptions
  ADD COLUMN IF NOT EXISTS profit_earned NUMERIC(18, 2) NOT NULL DEFAULT 0;

-- Admin profit adjustment (mirrors AI trading admin PnL helper).
CREATE OR REPLACE FUNCTION public.admin_adjust_copy_trading_profit(
  p_subscription_id uuid,
  p_amount numeric,
  p_note text DEFAULT NULL
)
RETURNS public.copy_trading_subscriptions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub public.copy_trading_subscriptions;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_amount IS NULL OR p_amount = 0 THEN
    RAISE EXCEPTION 'Amount must be non-zero';
  END IF;

  UPDATE public.copy_trading_subscriptions
  SET profit_earned = ROUND(COALESCE(profit_earned, 0) + p_amount, 2)
  WHERE id = p_subscription_id
  RETURNING * INTO v_sub;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  RETURN v_sub;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_adjust_copy_trading_profit(uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_adjust_copy_trading_profit(uuid, numeric, text) TO authenticated;
