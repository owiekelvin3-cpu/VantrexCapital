import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  ArrowDownToLine,
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
  MoreHorizontal,
  Pickaxe,
  Radio,
  Settings,
  TrendingUp,
  X,
} from "@/lib/icons";

const MOBILE_TABS = [
  { labelKey: "dashboard.dock.home", href: "/dashboard", icon: LayoutDashboard },
  {
    labelKey: "dashboard.dock.trade",
    href: "/dashboard/trading-room",
    icon: CandlestickChart,
    featured: true,
  },
  { labelKey: "dashboard.dock.cash", href: "/dashboard/deposits", icon: ArrowDownToLine },
  { labelKey: "nav.more", href: null, icon: MoreHorizontal },
] as const;

const MORE_MENU_ITEMS = [
  { href: "/dashboard/withdrawals", labelKey: "dashboard.withdrawals", icon: ArrowUpFromLine },
  { href: "/dashboard/transactions", labelKey: "dashboard.transactions", icon: History },
  { href: "/dashboard/trades", labelKey: "dashboard.trades", icon: TrendingUp },
  { href: "/dashboard/ai-trading", labelKey: "dashboard.aiTrading", icon: Bot },
  { href: "/dashboard/copy-trading", labelKey: "dashboard.copyTrading", icon: Copy },
  { href: "/dashboard/mining", labelKey: "dashboard.mining", icon: Pickaxe },
  { href: "/dashboard/signals", labelKey: "dashboard.signals", icon: Radio },
  { href: "/dashboard/notifications", labelKey: "dashboard.notifications", icon: Bell },
  { href: "/dashboard/kyc", labelKey: "dashboard.kyc", icon: FileCheck },
  { href: "/dashboard/support", labelKey: "dashboard.support", icon: MessageCircle },
  { href: "/dashboard/settings", labelKey: "dashboard.settings", icon: Settings },
] as const;

const MORE_MENU_PATHS = MORE_MENU_ITEMS.map((item) => item.href);

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  if (href === "/dashboard/trading-room") {
    return (
      pathname.startsWith("/dashboard/trading") ||
      pathname.startsWith("/dashboard/ai-trading") ||
      pathname.startsWith("/dashboard/trades")
    );
  }
  if (href === "/dashboard/deposits") {
    return (
      pathname.startsWith("/dashboard/deposits") ||
      pathname.startsWith("/dashboard/withdrawals") ||
      pathname.startsWith("/dashboard/transactions")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isMoreMenuActive(pathname: string) {
  return MORE_MENU_PATHS.some(
    (href) => pathname === href || pathname.startsWith(`${href}/`)
  );
}

type DeckoMobileDockProps = {
  menuOpen: boolean;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onLogout: () => void;
};

export function DeckoMobileDock({
  menuOpen,
  onMenuOpen,
  onMenuClose,
  onLogout,
}: DeckoMobileDockProps) {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  return (
    <>
      <div className="decko-mobile-dock decko-mobile-only pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[max(0.65rem,var(--safe-bottom))]">
        <nav
          className="decko-dock-bar pointer-events-auto mx-auto grid max-w-[440px] grid-cols-4 items-end gap-1 rounded-[22px] border px-1.5 pb-1.5 pt-1.5 shadow-[0_10px_36px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          aria-label={t("dashboard.navLabel")}
        >
          {MOBILE_TABS.map((item) => {
            const Icon = item.icon;
            const isMore = item.href === null;
            const featured = "featured" in item && item.featured;
            const active = isMore
              ? menuOpen || isMoreMenuActive(pathname)
              : isActive(pathname, item.href!);

            const content = featured ? (
              <span className="flex flex-col items-center justify-end gap-1">
                <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--decko-accent)] text-[var(--decko-accent-text)] shadow-[0_8px_22px_rgba(226,255,76,0.35)] ring-4 ring-[var(--decko-dock-ring)]">
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-none",
                    active ? "text-text-primary" : "text-text-tertiary"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </span>
            ) : (
              <span className="flex flex-col items-center justify-center gap-1">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-colors",
                    active
                      ? "bg-[var(--decko-accent)]/18 text-[var(--decko-accent-ink)]"
                      : "text-text-tertiary"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium leading-none",
                    active ? "text-text-primary" : "text-text-tertiary"
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </span>
            );

            const className = "relative flex min-h-[56px] items-end justify-center px-1";

            if (isMore) {
              return (
                <button
                  key={item.labelKey}
                  type="button"
                  onClick={onMenuOpen}
                  className={className}
                  aria-label={t("nav.more")}
                  aria-expanded={menuOpen}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.href} to={item.href!} className={className}>
                {content}
              </Link>
            );
          })}
        </nav>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
              onClick={onMenuClose}
              aria-label={t("common.close", { defaultValue: "Close" })}
            />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-t-[24px] border-t border-border bg-bg-secondary pb-[max(0.75rem,var(--safe-bottom))] shadow-[0_-16px_48px_rgba(0,0,0,0.16)]"
            >
              <div className="flex justify-center pt-2.5">
                <span className="h-1 w-9 rounded-full bg-border" aria-hidden />
              </div>

              <div className="flex items-center justify-between px-4 pb-2 pt-1.5">
                <p className="text-sm font-bold text-text-primary">{t("nav.more")}</p>
                <button
                  type="button"
                  onClick={onMenuClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary"
                  aria-label={t("common.close", { defaultValue: "Close" })}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="px-3 pb-3">
                <div className="grid grid-cols-4 gap-2">
                  {MORE_MENU_ITEMS.map((item, i) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.02 + i * 0.02 }}
                      >
                        <Link
                          to={item.href}
                          onClick={onMenuClose}
                          className="flex flex-col items-center gap-1.5 rounded-xl p-1 text-center"
                        >
                          <span
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-2xl transition-colors",
                              active
                                ? "bg-[var(--decko-accent)] text-[var(--decko-accent-text)]"
                                : "bg-bg-tertiary text-text-primary"
                            )}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="line-clamp-2 min-h-[2rem] w-full text-[10px] font-medium leading-tight text-text-secondary">
                            {t(item.labelKey)}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    onMenuClose();
                    onLogout();
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/8 px-3 py-2.5 text-xs font-semibold text-red-500"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {t("common.signOut")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export { isMoreMenuActive, isActive as isDockActive };
