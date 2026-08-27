import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ensureValidSession } from "@/lib/auth-session";
import { deliverNotification } from "@/lib/notification-delivery";
import { brandNotificationText } from "@/lib/notification-brand";
import type { Notification } from "@/types/database";

interface UseNotificationsOptions {
  /** Where browser push / notification click should open */
  pushTargetPath?: string;
  /**
   * When false, only syncs the list (no toast/sound/browser alert).
   * Use on pages that share the layout bell, which already delivers alerts.
   */
  enableDelivery?: boolean;
}

const POLL_MS = 30_000;

function rebrandNotification(row: Notification): Notification {
  return {
    ...row,
    title: brandNotificationText(row.title),
    message: brandNotificationText(row.message),
  };
}

async function persistRebrand(rows: Notification[]) {
  const stale = rows.filter(
    (n) =>
      /velion|valion|harborline/i.test(n.title) ||
      /velion|valion|harborline/i.test(n.message)
  );
  await Promise.all(
    stale.map((n) =>
      supabase
        .from("notifications")
        .update({
          title: brandNotificationText(n.title),
          message: brandNotificationText(n.message),
        })
        .eq("id", n.id)
    )
  );
}

export function useNotifications(userId: string | undefined, options?: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pushTargetPath = options?.pushTargetPath ?? "/dashboard";
  const enableDelivery = options?.enableDelivery !== false;
  const knownIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const pushTargetPathRef = useRef(pushTargetPath);
  const enableDeliveryRef = useRef(enableDelivery);
  const refreshRef = useRef<() => Promise<void>>(async () => undefined);

  pushTargetPathRef.current = pushTargetPath;
  enableDeliveryRef.current = enableDelivery;

  const handleIncoming = useCallback((notification: Notification, isNew: boolean) => {
    if (!isNew) return;
    if (knownIdsRef.current.has(notification.id)) return;
    knownIdsRef.current.add(notification.id);
    if (enableDeliveryRef.current) {
      deliverNotification(rebrandNotification(notification), { url: pushTargetPathRef.current });
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    await ensureValidSession();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    const raw = (data ?? []) as Notification[];
    void persistRebrand(raw);
    const rows = raw.map(rebrandNotification);

    if (!initializedRef.current) {
      rows.forEach((n) => knownIdsRef.current.add(n.id));
      initializedRef.current = true;
    } else {
      for (const n of rows) {
        if (!knownIdsRef.current.has(n.id)) {
          handleIncoming(n, true);
        }
      }
    }

    setNotifications(rows);
    setLoading(false);
  }, [userId, handleIncoming]);

  refreshRef.current = refresh;

  useEffect(() => {
    initializedRef.current = false;
    knownIdsRef.current = new Set();
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!userId) return;

    const topic = `notifications:${userId}:${enableDelivery ? "live" : "list"}:${crypto.randomUUID().slice(0, 8)}`;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    try {
      channel = supabase
        .channel(topic)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
          (payload) => {
            const raw = payload.new as Notification;
            void persistRebrand([raw]);
            const notification = rebrandNotification(raw);
            setNotifications((prev) => {
              if (prev.some((n) => n.id === notification.id)) return prev;
              return [notification, ...prev];
            });
            handleIncoming(notification, true);
          }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.warn("[notifications] Realtime channel issue:", status);
          }
        });
    } catch (err) {
      console.warn("[notifications] Failed to subscribe realtime:", err);
      channel = null;
    }

    const pollTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshRef.current();
      }
    }, POLL_MS);

    return () => {
      clearInterval(pollTimer);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [userId, enableDelivery, handleIncoming]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    if (!userId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return { notifications, unreadCount, loading, refresh, markRead, markAllRead };
}
