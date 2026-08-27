import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { cn } from "@/lib/utils";
import { LogoIcon } from "@/components/brand/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/settings/UserAvatar";
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

const MAIN_MENU: NavLink[] = [
  { href: "/dashboard", labelKey: "dashboard.overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/trading-room", labelKey: "dashboard.tradingRoom", icon: CandlestickChart },
  { href: "/dashboard/trades", labelKey: "dashboard.trades", icon: TrendingUp },
  { href: "/dashboard/deposits", labelKey: "dashboard.deposits", icon: ArrowDownToLine },
  { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
  { href: "/dashboard/transactions", labelKey: "dashboard.transactions", icon: History },
  { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
  { href: "/dashboard/copy-trading", labelKey: "dashboard.copyTrading", icon: Copy },
  { href: "/dashboard/mining", labelKey: "dashboard.mining", icon: Pickaxe },
  { href: "/dashboard/signals", labelKey: "dashboard.signals", icon: Radio },
];

const ACCOUNT_MENU: NavLink[] = [
  { href: "/dashboard/notifications", labelKey: "dashboard.notifications", icon: Bell },
  { href: "/dashboard/kyc", labelKey: "dashboard.kyc", icon: FileCheck },
  { href: "/dashboard/support", labelKey: "dashboard.support", icon: MessageCircle },
  { href: "/dashboard/settings", labelKey: "dashboard.settings", icon: Settings },
];

function isLinkActive(pathname: string, href: string, exact?: boolean) {
  if (exact || href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/trading-room") {
    return pathname.startsWith("/dashboard/trading") && !pathname.startsWith("/dashboard/trades");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  item,
  onClose,
}: {
  item: NavLink;
  onClose?: () => void;
}) {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const Icon = item.icon;
  const active = isLinkActive(pathname, item.href, item.exact);

  return (
    <Link
      to={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[var(--decko-accent)] text-[var(--decko-accent-text)] shadow-[0_8px_20px_rgba(226,255,76,0.22)]"
          : "text-[var(--decko-sidebar-muted)] hover:bg-[var(--decko-sidebar-hover)] hover:text-[var(--decko-sidebar-text)]"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

type DeckoSidebarProps = {
  mobileOpen?: boolean;
  onClose?: () => void;
};

function SidebarChrome({
  onClose,
  showClose,
}: {
  onClose?: () => void;
  showClose?: boolean;
}) {
  const { t } = useTranslation();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;
      if (q.includes("transaction") || q.includes("history")) navigate("/dashboard/transactions");
      else if (q.includes("deposit") || q.includes("fund")) navigate("/dashboard/deposits");
      else if (q.includes("withdraw")) navigate("/dashboard/withdrawals");
      else if (q.includes("ai") || q.includes("bot")) navigate("/dashboard/ai-trading");
      else if (q.includes("room") || q.includes("chart")) navigate("/dashboard/trading-room");
      else if (q.includes("trade")) navigate("/dashboard/trades");
      else if (q.includes("copy")) navigate("/dashboard/copy-trading");
      else if (q.includes("min")) navigate("/dashboard/mining");
      else if (q.includes("signal")) navigate("/dashboard/signals");
      else if (q.includes("kyc") || q.includes("verify")) navigate("/dashboard/kyc");
      else if (q.includes("support") || q.includes("help")) navigate("/dashboard/support");
      else if (q.includes("setting") || q.includes("profile")) navigate("/dashboard/settings");
      else navigate("/dashboard");
      setSearchQuery("");
      onClose?.();
    },
    [searchQuery, navigate, onClose]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-5 flex items-center justify-between gap-2 px-1 pt-[max(0px,env(safe-area-inset-top))] lg:pt-0">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-2.5" onClick={onClose}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--decko-accent)] text-[var(--decko-accent-text)]">
            <LogoIcon className="h-5 w-5" />
          </span>
          <span className="truncate text-[15px] font-bold tracking-wide text-[var(--decko-sidebar-text)]">
            {BRAND.shortName}
          </span>
        </Link>
        {showClose ? (
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--decko-sidebar-muted)] hover:bg-[var(--decko-sidebar-hover)] hover:text-[var(--decko-sidebar-text)]"
            onClick={onClose}
            aria-label={t("dashboard.closeSidebar")}
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <form onSubmit={handleSearch} className="relative mb-5">
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--decko-sidebar-muted)]">
          {t("dashboard.navGroupTrade")}
        </p>
        <nav className="space-y-0.5">
          {MAIN_MENU.map((item) => (
            <NavItem key={item.href} item={item} onClose={onClose} />
          ))}
        </nav>

        <p className="mb-2 mt-5 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--decko-sidebar-muted)]">
          {t("dashboard.navGroupAccount")}
        </p>
        <nav className="space-y-0.5">
          {ACCOUNT_MENU.map((item) => (
            <NavItem key={item.href} item={item} onClose={onClose} />
          ))}
          {profile?.role === "admin" && (
            <Link
              to="/dashboard/admin"
              onClick={onClose}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gold hover:bg-[var(--decko-sidebar-hover)]"
            >
              <Shield className="h-4 w-4" />
              {t("nav.adminPanel")}
            </Link>
          )}
        </nav>
      </div>

      <div className="mt-4 shrink-0 space-y-2.5 border-t border-[var(--decko-sidebar-border)] pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]">
        <Link
          to="/dashboard/deposits"
          onClick={onClose}
          className="block rounded-2xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)] p-3.5 transition-colors hover:border-[var(--decko-accent)]/30"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--decko-sidebar-muted)]">
                {t("dashboard.deposits")}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-[var(--decko-sidebar-text)]">
                {t("dashboard.fundAccount")}
              </p>
            </div>
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--decko-accent)] text-[var(--decko-accent-text)]">
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Link>

        <ThemeToggle
          showLabel
          className="w-full justify-start rounded-xl border border-[var(--decko-sidebar-border)] bg-[var(--decko-sidebar-surface)] px-3 text-[var(--decko-sidebar-text)] hover:bg-[var(--decko-sidebar-hover)]"
        />

        <button
          type="button"
          onClick={() => void signOut()}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#f87171] transition-colors hover:bg-[var(--decko-sidebar-hover)]"
        >
          <LogOut className="h-4 w-4" />
          {t("common.signOut")}
        </button>
      </div>
    </div>
  );
}

export function DeckoSidebar({ mobileOpen = false, onClose }: DeckoSidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      <aside
        className="decko-sidebar decko-sidebar-desktop z-30 h-dvh w-[240px] shrink-0 flex-col overflow-hidden px-3.5 py-5"
        aria-label={t("dashboard.navLabel")}
      >
        <SidebarChrome />
      </aside>

      <aside
        className={cn(
          "decko-sidebar decko-sidebar-mobile fixed inset-y-0 left-0 z-50 h-dvh w-[min(17.5rem,86vw)] flex-col overflow-hidden px-3.5 py-5 shadow-2xl transition-transform duration-300 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-label={t("dashboard.navLabel")}
        aria-hidden={!mobileOpen}
      >
        <SidebarChrome onClose={onClose} showClose />
      </aside>
    </>
  );
}

export function DeckoMobileTopBar({
  onMenuOpen,
  notificationSlot,
}: {
  onMenuOpen: () => void;
  notificationSlot?: ReactNode;
}) {
  const { t } = useTranslation();
  const { profile } = useAuth();

  return (
    <div className="decko-mobile-bar decko-mobile-only flex items-center gap-3 border-b px-4 py-3 safe-area-top safe-area-x">
      <button
        type="button"
        onClick={onMenuOpen}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--decko-accent)] text-[var(--decko-accent-text)]"
        aria-label={t("dashboard.openSidebar")}
      >
        <LogoIcon className="h-4 w-4" />
      </button>

      <Link to="/dashboard" className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-bold tracking-wide text-text-primary">
          {BRAND.shortName}
        </span>
      </Link>

      <div className="flex shrink-0 items-center gap-2">
        {notificationSlot}
        <Link
          to="/dashboard/settings"
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-tertiary"
          aria-label={t("dashboard.settings")}
        >
          <UserAvatar size="sm" name={profile?.full_name} avatarUrl={profile?.avatar_url} />
        </Link>
      </div>
    </div>
  );
}
