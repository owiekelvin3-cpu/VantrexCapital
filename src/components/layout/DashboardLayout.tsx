import { useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { NotificationToast } from "@/components/notifications/NotificationToast";
import { PushNotificationInit } from "@/components/notifications/PushNotificationInit";
import { PageEnter } from "@/components/motion/Motion";
import { DeckoSidebar, DeckoMobileTopBar } from "@/components/dashboard/decko/DeckoSidebar";
import { DeckoMobileDock } from "@/components/dashboard/decko/DeckoMobileDock";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
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

  useBodyScrollLock(sidebarOpen || menuOpen);

  useEffect(() => {
    setSidebarOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

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
    <div className="decko-shell flex min-h-dvh w-full min-w-0 overflow-x-clip">
      <DeckoSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[45] bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-x-clip">
        <DeckoMobileTopBar
          onMenuOpen={() => setSidebarOpen(true)}
          notificationSlot={<NotificationBell />}
        />

        <main
          className={cn(
            "decko-main relative z-[1] min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 safe-area-x sm:px-5 sm:py-6 lg:px-8",
            hideDock
              ? "pb-[max(0.75rem,var(--safe-bottom))]"
              : "pb-[calc(5.75rem+var(--safe-bottom))] lg:pb-8"
          )}
        >
          <PageEnter key={location.pathname}>
            <Outlet />
          </PageEnter>
        </main>

        {!hideDock && (
          <DeckoMobileDock
            menuOpen={menuOpen}
            onMenuOpen={() => setMenuOpen(true)}
            onMenuClose={() => setMenuOpen(false)}
            onLogout={() => void signOut()}
          />
        )}
      </div>

      <NotificationToast />
      <PushNotificationInit />
    </div>
  );
}
