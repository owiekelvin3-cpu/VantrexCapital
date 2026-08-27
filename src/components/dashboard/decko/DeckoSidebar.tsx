import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";
import { Logo, LogoIcon } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/settings/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  Bell,
  Bot,
  CandlestickChart,
  Copy,
  FileCheck,
  History,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Pickaxe,
  Radio,
  Search,
  Settings,
  Shield,
  TrendingUp,
  X,
} from "@/lib/icons";

type NavLink = {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const navGroups: { labelKey: string; links: NavLink[] }[] = [
  {
    labelKey: "dashboard.navGroupTrade",
    links: [
      { href: "/dashboard", labelKey: "dashboard.overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/trading-room", labelKey: "dashboard.tradingRoom", icon: CandlestickChart },
      { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
    ],
  },
  {
    labelKey: "dashboard.navGroupCash",
    links: [
      { href: "/dashboard/deposits", labelKey: "dashboard.deposits", icon: ArrowDownToLine },
      { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
      { href: "/dashboard/transactions", labelKey: "dashboard.transactions", icon: History },
    ],
  },
  {
    labelKey: "dashboard.navGroupProducts",
    links: [
      { href: "/dashboard/trades", labelKey: "dashboard.trades", icon: TrendingUp },
      { href: "/dashboard/copy-trading", labelKey: "dashboard.copyTrading", icon: Copy },
      { href: "/dashboard/mining", labelKey: "dashboard.mining", icon: Pickaxe },
      { href: "/dashboard/signals", labelKey: "dashboard.signals", icon: Radio },
    ],
  },
  {
    labelKey: "dashboard.navGroupAccount",
    links: [
      { href: "/dashboard/notifications", labelKey: "dashboard.notifications", icon: Bell },
      { href: "/dashboard/support", labelKey: "dashboard.support", icon: MessageCircle },
      { href: "/dashboard/kyc", labelKey: "dashboard.kyc", icon: FileCheck },
    ],
  },
];

function isLinkActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/trading-room") {
    return pathname.startsWith("/dashboard/trading");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type DeckoSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

export function DeckoSidebar({ mobileOpen = false, onClose }: DeckoSidebarProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const settingsActive = pathname === "/dashboard/settings";

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;
      if (q.includes("transaction") || q.includes("history")) navigate("/dashboard/transactions");
      else if (q.includes("deposit") || q.includes("fund")) navigate("/dashboard/deposits");
      else if (q.includes("withdraw") || q.includes("cash out")) navigate("/dashboard/withdrawals");
      else if (q.includes("ai") || q.includes("bot")) navigate("/dashboard/ai-trading");
      else if (q.includes("room") || q.includes("chart") || q.includes("live")) navigate("/dashboard/trading-room");
      else if (q.includes("trade") || q.includes("order")) navigate("/dashboard/trades");
      else if (q.includes("copy")) navigate("/dashboard/copy-trading");
      else if (q.includes("min")) navigate("/dashboard/mining");
      else if (q.includes("signal")) navigate("/dashboard/signals");
      else if (q.includes("kyc") || q.includes("verify")) navigate("/dashboard/kyc");
      else if (q.includes("support") || q.includes("help") || q.includes("ticket") || q.includes("chat")) {
        navigate("/dashboard/support");
      } else if (q.includes("setting") || q.includes("profile")) navigate("/dashboard/settings");
      else navigate("/dashboard");
      setSearchQuery("");
      onClose?.();
    },
    [searchQuery, navigate, onClose]
  );

  const aside = (
    <aside
      className={cn(
        "decko-sidebar flex h-dvh w-[min(18rem,88vw)] shrink-0 flex-col overflow-hidden px-4 py-5 lg:w-[248px]",
        "fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out lg:relative lg:z-auto lg:translate-x-0",
        mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"
      )}
      aria-label={t("dashboard.navLabel")}
    >
      <div className="mb-4 flex items-start justify-between gap-2 px-2 pt-[max(0px,env(safe-area-inset-top))] lg:mb-6 lg:pt-0">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--decko-accent)]">
            <LogoIcon className="h-5 w-5" />
          </span>
          <span className="truncate text-lg font-bold text-[var(--decko-sidebar-text)]">{BRAND.name}</span>
        </Link>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--decko-sidebar-muted)] hover:bg-[var(--decko-sidebar-hover)] lg:hidden"
          onClick={onClose}
          aria-label={t("dashboard.closeSidebar")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSearch} className="relative mb-6">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--decko-sidebar-muted)]" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("dashboard.searchPlaceholder")}
          aria-label={t("dashboard.searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-input)] pl-10 pr-3 text-sm text-[var(--decko-sidebar-text)] placeholder:text-[var(--decko-sidebar-muted)] outline-none focus:border-[var(--decko-accent)]/40"
        />
      </form>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {navGroups.map((group) => (
          <div key={group.labelKey} className="mb-5">
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--decko-sidebar-muted)]">
              {t(group.labelKey)}
            </p>
            <nav className="space-y-1">
              {group.links.map((item) => {
                const Icon = item.icon;
                const active = isLinkActive(pathname, item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      active
                        ? "bg-[var(--decko-accent)] text-[var(--decko-accent-text)] shadow-[0_8px_24px_rgba(212,255,66,0.25)]"
                        : "text-[var(--decko-sidebar-muted)] hover:bg-[var(--decko-sidebar-hover)] hover:text-[var(--decko-sidebar-text)]"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        {profile?.role === "admin" && (
          <Link
            to="/dashboard/admin"
            onClick={onClose}
            className="mb-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gold hover:bg-[var(--decko-sidebar-hover)]"
          >
            <Shield className="h-4 w-4" />
            {t("nav.adminPanel")}
          </Link>
        )}
      </div>

      <div className="mt-auto shrink-0 space-y-3 pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <Link
          to="/dashboard/deposits"
          onClick={onClose}
          className="block rounded-2xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)] p-4 transition-transform hover:scale-[1.02]"
        >
          <p className="text-[11px] uppercase tracking-wide text-[var(--decko-sidebar-muted)]">Upcoming Event</p>
          <p className="mt-1 text-sm font-semibold text-[var(--decko-sidebar-text)]">Fund your account</p>
          <span className="mt-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--decko-accent)] text-[var(--decko-accent-text)]">
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>

        <Link
          to="/dashboard/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            settingsActive
              ? "bg-[var(--decko-sidebar-hover)] text-[var(--decko-sidebar-text)]"
              : "text-[var(--decko-sidebar-muted)] hover:bg-[var(--decko-sidebar-hover)] hover:text-[var(--decko-sidebar-text)]"
          )}
        >
          <Settings className="h-4 w-4 shrink-0" />
          {t("dashboard.settings")}
        </Link>

        <div className="flex items-center gap-2.5 rounded-xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)] px-2.5 py-2.5">
          <UserAvatar size="sm" name={profile?.full_name} avatarUrl={profile?.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--decko-sidebar-text)]">
              {profile?.full_name || t("common.investor")}
            </p>
            <p className="truncate text-[11px] text-[var(--decko-sidebar-muted)]">{profile?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle className="rounded-xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)]" />
          <LanguageSelector />
        </div>

        <ThemeToggle
          showLabel
          className="hidden w-full justify-start rounded-xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)] px-3 text-[var(--decko-sidebar-text)] hover:bg-[var(--decko-sidebar-hover)] lg:inline-flex"
        />

        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xl border-[var(--decko-sidebar-border)] bg-transparent text-[var(--decko-sidebar-text)] hover:bg-[var(--decko-sidebar-hover)]"
          onClick={() => void signOut()}
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          {t("common.signOut")}
        </Button>
      </div>
    </aside>
  );

  return aside;
}

export function DeckoMobileTopBar({
  onMenuOpen,
  notificationSlot,
}: {
  onMenuOpen: () => void;
  notificationSlot?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;
      if (q.includes("deposit")) navigate("/dashboard/deposits");
      else if (q.includes("withdraw")) navigate("/dashboard/withdrawals");
      else if (q.includes("ai")) navigate("/dashboard/ai-trading");
      else if (q.includes("trade")) navigate("/dashboard/trades");
      else navigate("/dashboard");
      setSearchQuery("");
    },
    [searchQuery, navigate]
  );

  return (
    <div className="decko-mobile-bar flex items-center justify-between gap-2 border-b px-3 py-3 safe-area-top safe-area-x lg:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-tertiary text-text-secondary"
        aria-label={t("dashboard.openSidebar")}
      >
        <LogoIcon className="h-4 w-4" />
      </button>
      <Link to="/dashboard" className="min-w-0 flex-1">
        <Logo size="sm" wordmarkClassName="text-sm" />
      </Link>
      <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 sm:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-tertiary" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("dashboard.searchPlaceholder")}
          className="h-9 w-full max-w-[10rem] rounded-lg border border-border bg-bg-tertiary pl-8 pr-2 text-sm text-text-primary outline-none"
        />
      </form>
      <div className="flex shrink-0 items-center gap-1.5">
        <ThemeToggle className="rounded-lg border border-border bg-bg-tertiary" />
        {notificationSlot}
        <Link
          to="/dashboard/settings"
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border"
          aria-label={t("dashboard.settings")}
        >
          <UserAvatar size="sm" name={profile?.full_name} avatarUrl={profile?.avatar_url} />
        </Link>
      </div>
    </div>
  );
}
