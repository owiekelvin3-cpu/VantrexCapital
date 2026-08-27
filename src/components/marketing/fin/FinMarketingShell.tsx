import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BRAND } from "@/constants/brand";
import { LogoIcon } from "@/components/brand/Logo";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bot,
  FileCheck,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Shield,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

const SIDEBAR = [
  { href: "/", icon: LayoutDashboard, label: "Overview" },
  { href: "/about", icon: Star, label: "About" },
  { href: "/services", icon: Wallet, label: "Services" },
  { href: "/trading-signals", icon: TrendingUp, label: "Signals" },
  { href: "/reviews", icon: Users, label: "Reviews" },
  { href: "/faqs", icon: HelpCircle, label: "FAQs" },
  { href: "/security", icon: Shield, label: "Security" },
  { href: "/auth", icon: Bot, label: "Open account" },
] as const;

const MOBILE_PRIMARY = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/services", icon: Wallet, label: "Services" },
  { href: "/trading-signals", icon: TrendingUp, label: "Signals" },
  { href: "/reviews", icon: Users, label: "Reviews" },
  { href: "/about", icon: Star, label: "About" },
] as const;

const MOBILE_MORE = [
  { href: "/faqs", icon: HelpCircle, label: "FAQs" },
  { href: "/security", icon: Shield, label: "Security" },
  { href: "/trading-room", icon: Globe, label: "Trading room" },
  { href: "/holdings", icon: FileCheck, label: "Holdings" },
  { href: "/auth", icon: Bot, label: "Sign in" },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
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
  }, [locked]);
}

export function FinMarketingSidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="fin-sidebar hidden w-[72px] shrink-0 flex-col items-center gap-2 border-r py-5 lg:flex">
      <Link
        to="/"
        className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-bg-secondary shadow-sm"
        title={BRAND.name}
      >
        <LogoIcon className="h-6 w-6" />
      </Link>
      <nav className="flex flex-1 flex-col items-center gap-2">
        {SIDEBAR.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              title={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-300",
                active
                  ? "scale-105 bg-[var(--nav-active-bg)] text-[var(--nav-active-text)] shadow-lg"
                  : "text-text-tertiary hover:scale-105 hover:bg-bg-secondary hover:text-text-primary"
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </Link>
          );
        })}
      </nav>
      <ThemeToggle className="rounded-xl border border-border bg-bg-secondary" />
    </aside>
  );
}

export function FinMarketingMobileBar() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  useBodyScrollLock(menuOpen);

  return (
    <>
      <header className="fin-mobile-bar sticky top-0 z-50 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md safe-area-top safe-area-x lg:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-bg-secondary shadow-sm">
            <LogoIcon className="h-5 w-5" />
          </span>
          <span className="truncate font-bold text-text-primary">{BRAND.name}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1.5">
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button size="sm" className="fin-btn-primary h-8 rounded-full px-3 text-xs">
              Join
            </Button>
          </Link>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((open) => !open)}
            className="fin-mobile-menu-btn flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-bg-secondary text-text-primary"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="fixed inset-0 z-[70] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
              className="fin-mobile-drawer absolute inset-y-0 right-0 flex w-[min(320px,92vw)] flex-col safe-area-top safe-area-bottom"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
            >
              <div className="flex items-center justify-between border-b border-border/80 px-5 py-4">
                <div className="flex items-center gap-2">
                  <LogoIcon className="h-5 w-5" />
                  <div>
                    <p className="text-sm font-bold text-text-primary">{BRAND.name}</p>
                    <p className="text-[11px] text-text-tertiary">{BRAND.tagline}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-bg-primary text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-4 py-4">
                <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
                  Explore
                </p>
                <ul className="space-y-1">
                  {MOBILE_PRIMARY.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "fin-mobile-nav-link flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors",
                            active
                              ? "bg-[var(--nav-active-bg)] text-[var(--nav-active-text)]"
                              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-80" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>

                <p className="mb-2 mt-5 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
                  More
                </p>
                <ul className="space-y-1">
                  {MOBILE_MORE.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(pathname, item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          to={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "fin-mobile-nav-link flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors",
                            active
                              ? "bg-[var(--nav-active-bg)] font-medium text-[var(--nav-active-text)]"
                              : "text-text-secondary hover:bg-bg-hover hover:text-text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 opacity-70" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="space-y-3 border-t border-border/80 p-4">
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="fin-btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold"
                >
                  Open free account
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <div className="flex items-center gap-2">
                  <LanguageSelector />
                  <ThemeToggle showLabel className="flex-1 justify-center rounded-xl border border-border px-2" />
                </div>
                <Link
                  to="/auth"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center text-sm text-text-secondary hover:text-text-primary"
                >
                  {t("auth.login", { defaultValue: "Sign in" })}
                </Link>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function FinPageActions() {
  return (
    <div className="flex items-center gap-2">
      <Link
        to="/auth"
        className="fin-btn-primary flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-105"
        aria-label="Get started"
      >
        +
      </Link>
      <Link
        to="/dashboard"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg-secondary text-text-primary shadow-md transition-transform hover:scale-105"
        aria-label="Open dashboard"
      >
        ↑
      </Link>
    </div>
  );
}

/** Optional wrapper when not using MarketingLayout Outlet. */
export function FinMarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="fin-marketing flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip lg:flex-row">
      <FinMarketingSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <FinMarketingMobileBar />
        <main className="flex-1 px-4 py-5 safe-area-x sm:px-6 sm:py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
