-- Fix signup welcome branding: VELION MARKETS -> Vantrex Capital

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_currency text := public.normalize_account_currency(NEW.raw_user_meta_data->>'preferred_currency');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, kyc_status, preferred_currency)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    'none',
    v_currency
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    preferred_currency = COALESCE(profiles.preferred_currency, EXCLUDED.preferred_currency),
    updated_at = NOW();

  INSERT INTO public.balances (user_id, currency, amount)
  VALUES (NEW.id, v_currency, 0)
  ON CONFLICT (user_id) DO NOTHING;

  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      NEW.id,
      'Welcome to Vantrex Capital',
      'Your account is ready. Notifications are enabled so you will be alerted about deposits, withdrawals, trades, and AI bot activity.'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Rewrite existing Velion welcome notifications already stored.
UPDATE public.notifications
SET
  title = replace(replace(title, 'VELION MARKETS', 'Vantrex Capital'), 'Velion', 'Vantrex'),
  message = replace(replace(message, 'VELION MARKETS', 'Vantrex Capital'), 'Velion', 'Vantrex')
WHERE title ILIKE '%VELION%'
   OR title ILIKE '%Velion%'
   OR title ILIKE '%valion%'
   OR message ILIKE '%VELION%'
   OR message ILIKE '%Velion%';
