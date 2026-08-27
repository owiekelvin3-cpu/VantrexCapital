import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, X } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { pathForNotification } from "@/lib/notification-routing";
import { brandNotificationText } from "@/lib/notification-brand";
import type { Notification } from "@/types/database";

const EVENT_NAME = "vantrex:notification";

export function dispatchNotificationToast(notification: Notification) {
  window.dispatchEvent(
    new CustomEvent<Notification>(EVENT_NAME, {
      detail: {
        ...notification,
        title: brandNotificationText(notification.title),
        message: brandNotificationText(notification.message),
      },
    })
  );
}

/** Top banner alert for new notifications — tap to open the related page. */
export function NotificationToast() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [toast, setToast] = useState<Notification | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const onNotify = (event: Event) => {
      const detail = (event as CustomEvent<Notification>).detail;
      if (!detail?.id) return;
      setToast(detail);
      clearTimeout(timer);
      timer = setTimeout(() => setToast(null), 6000);
    };

    window.addEventListener(EVENT_NAME, onNotify);
    return () => {
      window.removeEventListener(EVENT_NAME, onNotify);
      clearTimeout(timer);
    };
  }, []);

  const dismiss = () => setToast(null);

  const openToast = () => {
    if (!toast) return;
    const path = pathForNotification(toast.title, profile?.role === "admin");
    dismiss();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {toast && (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[130] flex justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4"
          role="status"
          aria-live="polite"
        >
          <motion.div
            key={toast.id}
            initial={{ y: -120, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="pointer-events-auto w-full max-w-md"
          >
            <div className="flex gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-[0_16px_48px_rgba(0,0,0,0.28)] ring-1 ring-black/5 dark:ring-white/10">
              <button
                type="button"
                onClick={openToast}
                className="flex min-w-0 flex-1 gap-3 text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald/30 bg-emerald text-black shadow-sm">
                  <Bell className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-semibold text-foreground">{toast.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted">{toast.message}</p>
                </div>
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-secondary hover:text-foreground"
                aria-label={t("notifications.dismissToast")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
