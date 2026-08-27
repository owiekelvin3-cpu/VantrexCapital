import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { formatAuthError } from "@/lib/auth-session";
import { completePushSetup } from "@/lib/push-notifications";
import { prepareNotificationsOnUserGesture } from "@/lib/notification-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { Logo } from "@/components/brand/Logo";
import { IMAGES } from "@/constants/images";
import {
  COUNTRIES,
  getCountryName,
  getRegionsForCountry,
  hasPresetRegions,
} from "@/constants/geo";
import { DEFAULT_CURRENCY, suggestCurrencyForCountry } from "@/constants/currencies";
import { CurrencySelectField } from "@/components/settings/CurrencySelector";
import { Mail, X, ChevronDown } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

function safeReturnPath(from: unknown): string {
  if (!from || typeof from !== "object") return "/dashboard";
  const pathname = (from as { pathname?: string }).pathname;
  if (typeof pathname !== "string" || !pathname.startsWith("/")) return "/dashboard";
  if (pathname.startsWith("/auth") || pathname.startsWith("/admin-auth")) return "/dashboard";
  return `${pathname}${(from as { search?: string }).search ?? ""}`;
}

const selectClass =
  "h-12 w-full appearance-none rounded-xl border border-border bg-secondary/40 px-3.5 pr-10 text-base text-foreground outline-none transition-colors focus-visible:border-emerald/50 focus-visible:ring-2 focus-visible:ring-emerald/20";

function authErrorMessage(
  error: unknown,
  t: (key: string) => string,
  fallbackKey: "auth.signInFailed" | "auth.signUpFailed"
) {
  const raw = formatAuthError(error, "").toLowerCase();
  if (!raw) return t(fallbackKey);
  if (raw.includes("already") || raw.includes("registered") || raw.includes("exists")) {
    return t("auth.emailAlreadyRegistered");
  }
  if (raw.includes("password") && (raw.includes("least") || raw.includes("short") || raw.includes("weak"))) {
    return t("settings.passwordTooShort");
  }
  if (raw.includes("rate") || raw.includes("too many")) {
    return t("auth.rateLimited");
  }
  if (raw.includes("invalid login") || raw.includes("invalid credentials")) {
    return t("auth.signInFailed");
  }
  const text = formatAuthError(error, t(fallbackKey));
  return text || t(fallbackKey);
}

export default function AuthPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const mode: Mode = searchParams.get("mode") === "register" ? "register" : "login";
  const { signIn, signUp, clearSessionExpired, user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired =
    (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true;
  const returnTo = safeReturnPath((location.state as { from?: unknown } | null)?.from);
  const [error, setError] = useState(sessionExpired ? t("auth.sessionExpired") : "");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const [region, setRegion] = useState("");
  const [preferredCurrency, setPreferredCurrency] = useState(DEFAULT_CURRENCY);

  useEffect(() => {
    if (sessionExpired) clearSessionExpired();
  }, [sessionExpired, clearSessionExpired]);

  useEffect(() => {
    setRegion("");
    if (countryCode) {
      setPreferredCurrency(suggestCurrencyForCountry(countryCode));
    }
  }, [countryCode]);

  useEffect(() => {
    if (!user || !profile) return;
    if (profile.role === "admin") {
      navigate(returnTo.startsWith("/dashboard/admin") ? returnTo : "/dashboard/admin", { replace: true });
      return;
    }
    navigate(returnTo.startsWith("/dashboard/admin") ? "/dashboard" : returnTo, { replace: true });
  }, [user, profile, navigate, returnTo]);

  function setMode(next: Mode) {
    setError("");
    setInfo("");
    setCountryCode("");
    setRegion("");
    setPreferredCurrency(DEFAULT_CURRENCY);
    setSearchParams(next === "register" ? { mode: "register" } : {}, { replace: true });
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    const permissionPromise = prepareNotificationsOnUserGesture();
    const form = new FormData(e.currentTarget);
    const { error } = await signIn(form.get("email") as string, form.get("password") as string);
    if (error) {
      setError(authErrorMessage(error, t, "auth.signInFailed"));
    } else {
      const {
        data: { user: signedIn },
      } = await supabase.auth.getUser();
      if (signedIn) {
        try {
          await completePushSetup(signedIn.id, permissionPromise);
        } catch {
          /* ignore */
        }
      }
      navigate(returnTo, { replace: true });
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (!countryCode) {
      setError(t("auth.countryRequired"));
      setLoading(false);
      return;
    }
    if (!region.trim()) {
      setError(t("auth.regionRequired"));
      setLoading(false);
      return;
    }

    const permissionPromise = prepareNotificationsOnUserGesture();
    const form = new FormData(e.currentTarget);
    const { error, user: created, session } = await signUp(
      form.get("email") as string,
      form.get("password") as string,
      form.get("fullName") as string,
      {
        country: getCountryName(countryCode),
        region: region.trim(),
        preferredCurrency,
      }
    );
    if (error) {
      setError(authErrorMessage(error, t, "auth.signUpFailed"));
    } else if (!session) {
      setInfo(t("auth.checkEmail"));
      setCountryCode("");
      setRegion("");
      setPreferredCurrency(DEFAULT_CURRENCY);
      setSearchParams({}, { replace: true });
    } else {
      if (created) {
        try {
          await completePushSetup(created.id, permissionPromise);
        } catch {
          /* ignore */
        }
      }
      navigate(returnTo, { replace: true });
    }
    setLoading(false);
  };

  const fieldClass =
    "h-12 rounded-xl border-border bg-secondary/40 text-foreground placeholder:text-muted focus-visible:border-emerald/50 focus-visible:ring-emerald/20";

  const presetRegions = countryCode ? getRegionsForCountry(countryCode) : [];
  const useRegionSelect = countryCode ? hasPresetRegions(countryCode) : false;

  return (
    <div className="flex min-h-screen min-h-dvh items-center justify-center bg-void px-3 py-6 sm:px-6 sm:py-10">
      <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
        <ThemeToggle />
        <LanguageSelector />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative flex w-full max-w-[980px] overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5"
      >
        <AuthBrandPanel />

        <div className="relative flex w-full flex-col bg-card text-foreground lg:w-1/2">
          <div className="relative h-36 overflow-hidden lg:hidden">
            <img src={IMAGES.auth.panel} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/50 to-void/30" />
            <p className="relative z-10 flex h-full items-end justify-center px-6 pb-4 text-center font-display text-xl font-bold leading-tight text-white">
              {t("auth.sloganLine1")} {t("auth.sloganLine2")}
            </p>
          </div>

          <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-6">
            <Logo size="md" />
            <Link
              to="/"
              aria-label={t("common.close")}
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>

          <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-12 sm:py-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="mx-auto w-full max-w-[360px]"
              >
                <h1 className="mb-2 text-center font-display text-2xl font-bold tracking-tight text-foreground sm:text-[1.75rem]">
                  {mode === "login" ? t("auth.signInTitle") : t("auth.signUpTitle")}
                </h1>
                {mode === "register" && (
                  <p className="mb-6 text-center text-sm text-muted">{t("auth.signUpLocationHint")}</p>
                )}
                {mode === "login" && <div className="mb-8" />}

                {info ? (
                  <p className="mb-4 rounded-xl border border-emerald/25 bg-emerald/10 px-3.5 py-3 text-sm text-emerald">
                    {info}
                  </p>
                ) : null}

                {mode === "login" ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("common.email")}
                        className={cn(fieldClass, "pl-10")}
                      />
                    </div>
                    <PasswordInput
                      id="login-password"
                      name="password"
                      required
                      minLength={6}
                      autoComplete="current-password"
                      placeholder={t("common.password")}
                      className={fieldClass}
                    />
                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="mt-2 h-12 w-full rounded-xl text-base"
                    >
                      {loading ? t("auth.signingIn") : t("auth.signInTitle")}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister} className="space-y-3.5">
                    <Input
                      id="reg-name"
                      name="fullName"
                      required
                      autoComplete="name"
                      placeholder={t("common.fullName")}
                      className={fieldClass}
                    />
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <Input
                        id="reg-email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t("common.email")}
                        className={cn(fieldClass, "pl-10")}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                      <div className="relative sm:col-span-2">
                        <label htmlFor="reg-country" className="sr-only">{t("auth.country")}</label>
                        <select
                          id="reg-country"
                          name="country"
                          required
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          autoComplete="country"
                          className={cn(selectClass, !countryCode && "text-muted")}
                        >
                          <option value="" disabled>
                            {t("auth.countryPlaceholder")}
                          </option>
                          {COUNTRIES.map((c) => (
                            <option key={c.code} value={c.code} className="bg-void text-foreground">
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      </div>

                      <div className="relative sm:col-span-2">
                        <label htmlFor="reg-region" className="sr-only">{t("auth.region")}</label>
                        {useRegionSelect ? (
                          <>
                            <select
                              id="reg-region"
                              name="region"
                              required
                              value={region}
                              onChange={(e) => setRegion(e.target.value)}
                              autoComplete="address-level1"
                              disabled={!countryCode}
                              className={cn(selectClass, !region && "text-muted", !countryCode && "opacity-60")}
                            >
                              <option value="" disabled>
                                {t("auth.regionPlaceholder")}
                              </option>
                              {presetRegions.map((r) => (
                                <option key={r} value={r} className="bg-void text-foreground">
                                  {r}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                          </>
                        ) : (
                          <Input
                            id="reg-region"
                            name="region"
                            required
                            value={region}
                            onChange={(e) => setRegion(e.target.value)}
                            autoComplete="address-level1"
                            disabled={!countryCode}
                            placeholder={t("auth.regionPlaceholder")}
                            className={cn(fieldClass, !countryCode && "opacity-60")}
                          />
                        )}
                      </div>
                    </div>

                    <div className="relative">
                      <label htmlFor="reg-currency" className="sr-only">{t("auth.accountCurrency")}</label>
                      <CurrencySelectField
                        id="reg-currency"
                        name="currency"
                        value={preferredCurrency}
                        onChange={setPreferredCurrency}
                        className={cn(selectClass, "text-foreground")}
                      />
                      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <p className="mt-1.5 text-xs text-muted">{t("auth.accountCurrencyHint")}</p>
                    </div>

                    <PasswordInput
                      id="reg-password"
                      name="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder={t("common.password")}
                      className={fieldClass}
                    />
                    {error ? <p className="text-sm text-red-500">{error}</p> : null}
                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="mt-2 h-12 w-full rounded-xl text-base"
                    >
                      {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
                    </Button>
                  </form>
                )}

                <p className="mt-5 text-center text-xs text-muted">{t("auth.emailOnlyNote")}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="border-t border-border px-6 py-5 text-center sm:px-8">
            {mode === "login" ? (
              <p className="text-sm text-muted">
                {t("auth.noAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="font-semibold text-emerald hover:underline"
                >
                  {t("auth.signUpLink")}
                </button>
              </p>
            ) : (
              <p className="text-sm text-muted">
                {t("auth.hasAccount")}{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="font-semibold text-emerald hover:underline"
                >
                  {t("auth.signInLink")}
                </button>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
