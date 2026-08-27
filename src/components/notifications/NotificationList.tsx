import { useTranslation } from "react-i18next";
import { formatDate, cn } from "@/lib/utils";
import { brandNotificationText } from "@/lib/notification-brand";
import type { Notification } from "@/types/database";

interface NotificationListProps {
  items: Notification[];
  loading?: boolean;
  emptyLabel?: string;
  selectedId?: string | null;
  onItemClick: (notification: Notification) => void;
  className?: string;
}

export function NotificationList({
  items,
  loading,
  emptyLabel,
  selectedId,
  onItemClick,
  className,
}: NotificationListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <p className={cn("px-4 py-10 text-center text-sm text-muted", className)}>
        {t("notifications.loading")}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className={cn("px-4 py-10 text-center text-sm text-muted", className)}>
        {emptyLabel ?? t("notifications.empty")}
      </p>
    );
  }

  return (
    <ul className={cn("divide-y divide-border/70", className)}>
      {items.map((n) => (
        <li key={n.id}>
          <button
            type="button"
            onClick={() => onItemClick(n)}
            className={cn(
              "flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-secondary",
              !n.read && "bg-emerald/10 dark:bg-emerald/15",
              selectedId === n.id && "bg-secondary"
            )}
          >
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                n.read ? "bg-border" : "bg-emerald"
              )}
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{brandNotificationText(n.title)}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted line-clamp-3">{brandNotificationText(n.message)}</p>
              <p className="mt-1.5 text-[10px] text-muted/80">{formatDate(n.created_at)}</p>
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
