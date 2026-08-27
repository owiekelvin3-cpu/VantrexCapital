-- Disable KYC gating for all user-initiated transactions.
-- KYC remains available as optional verification UI.

CREATE OR REPLACE FUNCTION public.is_kyc_approved(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT uid IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.is_kyc_approved(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_kyc_approved(uuid) TO authenticated;

-- Restore insert policies without KYC dependency (auth.uid match only).
DROP POLICY IF EXISTS "Users can insert deposits" ON public.deposits;
CREATE POLICY "Users can insert deposits" ON public.deposits
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert withdrawals" ON public.withdrawals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trades" ON public.trades;
CREATE POLICY "Users can insert own trades" ON public.trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert copy subs" ON public.copy_trading_subscriptions;
CREATE POLICY "Users can insert copy subs" ON public.copy_trading_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert mining" ON public.mining_packages;
CREATE POLICY "Users can insert mining" ON public.mining_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert signals" ON public.signal_packages;
CREATE POLICY "Users can insert signals" ON public.signal_packages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert ai subs" ON public.ai_trading_subscriptions;
CREATE POLICY "Users can insert ai subs" ON public.ai_trading_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mark everyone approved so legacy policy/RPC checks pass immediately.
UPDATE public.profiles
SET kyc_status = 'approved', updated_at = now()
WHERE kyc_status IS DISTINCT FROM 'approved';

ALTER TABLE public.profiles
  ALTER COLUMN kyc_status SET DEFAULT 'approved';
