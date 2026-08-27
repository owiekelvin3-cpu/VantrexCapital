import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { completePushSetup } from "@/lib/push-notifications";
import { prepareNotificationsOnUserGesture } from "@/lib/notification-preferences";
import { fetchAdminProfile } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { AdminBrandPanel } from "@/components/admin/AdminBrandPanel";
import { Logo } from "@/components/brand/Logo";
import { Lock } from "@/lib/icons";

export default function AdminAuthPage() {
  const { t } = useTranslation();
  const { signIn, signOut, profile, refreshProfile, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectedExpired =
    sessionExpired || (location.state as { sessionExpired?: boolean } | null)?.sessionExpired === true;
  const [error, setError] = useState(redirectedExpired ? t("auth.sessionExpired") : "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (redirectedExpired) clearSessionExpired();
  }, [redirectedExpired, clearSessionExpired]);

  useEffect(() => {
    if (profile?.role === "admin") {
      navigate("/dashboard/admin", { replace: true });
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const permissionPromise = prepareNotificationsOnUserGesture();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    const { error: signInError } = await signIn(email, password);
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setError(t("admin.authFailed"));
      setLoading(false);
      return;
    }

    try {
      const adminProfile = await fetchAdminProfile(session.user.id);
      if (adminProfile.role !== "admin") {
        await signOut();
        setError(t("admin.accessDenied"));
        setLoading(false);
        return;
      }
      const loaded = await refreshProfile(session.user.id);
      if (loaded?.role !== "admin") {
        await signOut();
        setError(t("admin.authFailed"));
        setLoading(false);
        return;
      }
      try {
        await completePushSetup(session.user.id, permissionPromise);
      } catch {
        // Push setup must not block admin access.
      }
      navigate("/dashboard/admin", { replace: true });
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : t("admin.authFailed");
      setError(message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen min-h-dvh bg-[#060608]">
      <AdminBrandPanel />

      <div className="relative flex flex-1 flex-col justify-center px-6 py-12 lg:px-16 xl:px-24">
        <div className="absolute right-6 top-6">
          <LanguageSelector />
        </div>

        <motion.div
          className="mx-auto w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-6 flex items-center gap-2 text-gold">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">{t("auth.restricted")}</span>
          </div>

          <h1 className="font-display text-2xl font-bold text-foreground">{t("auth.adminSignIn")}</h1>
          <p className="mt-2 text-sm text-muted">{t("auth.adminDesc")}</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="email">{t("common.email")}</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-2 h-12"
                placeholder="admin@vantrexcapital.com"
              />
            </div>
            <div>
              <Label htmlFor="password">{t("common.password")}</Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                required
                className="mt-2 h-12"
              />
            </div>
            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                {error}
              </p>
            )}
            <Button type="submit" variant="gold" className="h-12 w-full" disabled={loading}>
              {loading ? t("auth.adminSigningIn") : t("auth.adminSignIn")}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted">
            <Link to="/" className="text-emerald hover:underline">{t("common.backHome")}</Link>
            <span className="mx-2">·</span>
            <Link to="/auth" className="hover:text-foreground">{t("admin.clientLogin")}</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
