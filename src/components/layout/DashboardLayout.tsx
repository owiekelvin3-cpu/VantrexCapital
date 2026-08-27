import { useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { LanguageSelector } from "@/components/layout/LanguageSelector";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PushNotificationInit } from "@/components/notifications/PushNotificationInit";
import { PageEnter } from "@/components/motion/Motion";
import { DeckoSidebar, DeckoMobileTopBar } from "@/components/dashboard/decko/DeckoSidebar";
import { DeckoMobileDock } from "@/components/dashboard/decko/DeckoMobileDock";
import { syncUserLocation } from "@/lib/user-location";

function shouldHideMobileDock(pathname: string) {
  return pathname.startsWith("/dashboard/support");
}

export function DashboardLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const hideDock = shouldHideMobileDock(location.pathname);

  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!sidebarOpen && !menuOpen) return;
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
  }, [sidebarOpen, menuOpen]);

  useEffect(() => {
    if (!user?.id) return;
    void syncUserLocation(user.id);
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncUserLocation(user.id);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [user?.id]);

  return (
    <div className="decko-shell flex h-dvh max-h-dvh w-full min-w-0 max-w-[100vw] overflow-hidden">
      <DeckoSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="relative z-[1] flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden">
        <DeckoMobileTopBar
          onMenuOpen={() => setSidebarOpen(true)}
          notificationSlot={<NotificationBell />}
        />

        <header className="sticky top-0 z-20 hidden min-h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-bg-primary/95 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:flex lg:px-6">
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <ThemeToggle />
            <LanguageSelector />
            <NotificationBell />
          </div>
        </header>

        <main
          className={cn(
            "decko-main relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 safe-area-x sm:px-5 sm:py-6 lg:px-8",
            hideDock
              ? "pb-[max(0.75rem,var(--safe-bottom))]"
              : "pb-[calc(5.75rem+var(--safe-bottom))] lg:pb-8"
          )}
        >
          <div className="dashboard-shell">
            <PageEnter key={location.pathname}>
              <Outlet />
            </PageEnter>
          </div>
        </main>
      </div>

      {!hideDock && !sidebarOpen && (
        <DeckoMobileDock
          menuOpen={menuOpen}
          onMenuOpen={() => setMenuOpen(true)}
          onMenuClose={() => setMenuOpen(false)}
          onLogout={() => void signOut()}
        />
      )}
      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
