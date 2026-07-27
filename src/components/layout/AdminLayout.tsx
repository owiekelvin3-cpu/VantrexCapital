import { Link, useLocation, Outlet } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { BRAND } from "@/constants/brand";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import {
  Users, FileCheck, ArrowDownToLine, ArrowUpFromLine, TrendingUp,
  Settings, Bell, Mail, LogOut, Menu, LayoutDashboard, LayoutGrid, Coins, MessageCircle, X, Bot,
  AlertTriangle,
} from "@/lib/icons";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PushNotificationInit } from "@/components/notifications/PushNotificationInit";
import { PageEnter } from "@/components/motion/Motion";

const adminLinks = [
  { href: "/dashboard/admin", labelKey: "admin.overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users },
  { href: "/dashboard/admin/kyc", labelKey: "admin.kycReview", icon: FileCheck },
  { href: "/dashboard/admin/deposits", labelKey: "admin.deposits", icon: ArrowDownToLine },
  { href: "/dashboard/admin/deposit-config", labelKey: "admin.depositConfig", icon: Coins },
  { href: "/dashboard/admin/withdrawals", labelKey: "admin.withdrawals", icon: ArrowUpFromLine },
  { href: "/dashboard/admin/fees", labelKey: "admin.withdrawalFees", icon: AlertTriangle },
  { href: "/dashboard/admin/trades", labelKey: "admin.trades", icon: TrendingUp },
  { href: "/dashboard/admin/ai-trading", labelKey: "admin.aiTrading", icon: Bot },
  { href: "/dashboard/admin/notifications", labelKey: "admin.notifications", icon: Bell },
  { href: "/dashboard/admin/support", labelKey: "admin.support", icon: MessageCircle },
  { href: "/dashboard/admin/email", labelKey: "admin.emailCenter", icon: Mail },
  { href: "/dashboard/admin/settings", labelKey: "admin.settings", icon: Settings },
] as const;

const mobileTabs = [
  { href: "/dashboard/admin", labelKey: "admin.overview", icon: LayoutGrid, exact: true },
  { href: "/dashboard/admin/users", labelKey: "admin.users", icon: Users },
  { href: "/dashboard/admin/deposits", labelKey: "admin.deposits", icon: ArrowDownToLine },
  { href: "/dashboard/admin/withdrawals", labelKey: "admin.withdrawals", icon: ArrowUpFromLine },
] as const;

export function AdminLayout() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

  const isActive = (href: string, exact?: boolean) =>
    exact ? location.pathname === href : location.pathname === href || location.pathname.startsWith(`${href}/`);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen) return;
    const scrollY = window.scrollY;
    const { style } = document.body;
    const prev = {
      overflow: style.overflow,
      position: style.position,
      top: style.top,
      left: style.left,
      right: style.right,
      width: style.width,
    };
    style.overflow = "hidden";
    style.position = "fixed";
    style.top = `-${scrollY}px`;
    style.left = "0";
    style.right = "0";
    style.width = "100%";
    return () => {
      style.overflow = prev.overflow;
      style.position = prev.position;
      style.top = prev.top;
      style.left = prev.left;
      style.right = prev.right;
      style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [sidebarOpen]);

  return (
    <div className="relative flex min-h-dvh w-full max-w-[100vw] overflow-x-hidden bg-background">
      <div className="admin-atmosphere" aria-hidden="true" />

      <aside
        className={cn(
          "admin-sidebar fixed inset-y-0 left-0 z-40 flex w-[min(19rem,90vw)] flex-col border-r border-border transition-transform duration-300 ease-out lg:static lg:w-64 lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label={t("admin.navLabel")}
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/80 px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to="/dashboard/admin" className="flex min-w-0 items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <Logo size="sm" wordmarkClassName="text-sm" />
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-gold ring-1 ring-gold/25">
              {t("admin.badge")}
            </span>
          </Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label={t("dashboard.closeSidebar")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 [-webkit-overflow-scrolling:touch]">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold/80">
            {t("admin.title")}
          </p>
          {adminLinks.map((link) => {
            const active = isActive(link.href, "exact" in link ? link.exact : false);
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "admin-nav-active"
                    : "text-muted hover:bg-secondary/70 hover:text-foreground"
                )}
              >
                <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{t(link.labelKey)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Link
            to="/dashboard"
            onClick={() => setSidebarOpen(false)}
            className="mb-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted transition-colors hover:bg-secondary/70 hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("admin.backToDashboard")}
          </Link>
          <div className="mb-3 flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 px-3 py-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold ring-1 ring-gold/25">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{profile?.full_name || t("admin.badge")}</p>
              <p className="truncate text-xs text-muted">{profile?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full rounded-xl border-border bg-transparent" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            {t("common.signOut")}
          </Button>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/65 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label={t("dashboard.closeSidebar")}
        />
      )}

      <div className="relative z-[1] flex min-w-0 w-full flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-2 border-b border-border/80 bg-background/80 px-3 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:gap-3 sm:px-4 md:px-6">
          <button
            type="button"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-secondary lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t("dashboard.openSidebar")}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-semibold tracking-tight text-foreground">{BRAND.name}</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-gold/90">{t("admin.portalLabel")}</p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <ThemeToggle />
            <LanguageSelector />
            <NotificationBell />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-x-hidden p-3 pb-[calc(4.75rem+env(safe-area-inset-bottom))] sm:p-4 md:p-6 lg:p-8 lg:pb-8">
          <div className="admin-shell">
            <PageEnter key={location.pathname}>
              <Outlet />
            </PageEnter>
          </div>
        </main>

        {/* Mobile command bar */}
        <nav
          className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden"
          aria-label={t("admin.navLabel")}
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
            {mobileTabs.map((tab) => {
              const active = isActive(tab.href, "exact" in tab ? tab.exact : false);
              return (
                <Link
                  key={tab.href}
                  to={tab.href}
                  className={cn(
                    "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold transition-colors",
                    active ? "text-gold" : "text-muted hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                      active ? "bg-gold/15 text-gold ring-1 ring-gold/25" : "bg-transparent"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                  </span>
                  <span className="truncate">{t(tab.labelKey)}</span>
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-semibold text-muted hover:text-foreground"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl">
                <Menu className="h-4 w-4" />
              </span>
              <span className="truncate">{t("dashboard.menu")}</span>
            </button>
          </div>
        </nav>
      </div>

      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
