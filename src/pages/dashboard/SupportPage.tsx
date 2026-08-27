import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { useUserSupport } from "@/hooks/useSupport";
import { Button } from "@/components/ui/button";
import {
  SupportComposer,
  SupportMessageList,
  SupportThreadFrame,
} from "@/components/support/SupportChat";
import { BRAND } from "@/constants/brand";
import { LogoIcon } from "@/components/brand/Logo";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const support = useUserSupport(user?.id);

  const active = support.conversations.find((c) => c.id === support.activeId) ?? null;
  const resolved = active?.status === "resolved";

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:h-[calc(100dvh-8.5rem)] lg:min-h-[560px]">
      {support.error && (
        <p className="mb-3 shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {support.error}
        </p>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-border bg-[#f2f2f7] shadow-sm dark:border-border dark:bg-[#000000]">
        <SupportThreadFrame
          variant="live"
          className="min-h-0"
          title={t("support.title")}
          subtitle={t("support.liveSubtitle")}
          trailing={
            resolved ? (
              <Button
                size="sm"
                variant="outline"
                className="mr-1 rounded-full border-black/10 bg-white/70 text-foreground hover:bg-white"
                onClick={() => void support.reopen(active.id)}
              >
                {t("support.reopen")}
              </Button>
            ) : undefined
          }
        >
          {support.messages.length === 0 && !support.loadingMessages ? (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
              <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#e5e5ea] text-[#3a3a3c] dark:bg-[#2c2c2e] dark:text-[#f5f5f7]">
                <LogoIcon className="h-7 w-7" />
              </span>
              <p className="text-[17px] font-semibold text-[#1c1c1e] dark:text-white">
                {BRAND.name}
              </p>
              <p className="mt-1 max-w-xs text-[14px] leading-relaxed text-[#8e8e93]">
                {t("support.chatEmptyHint")}
              </p>
            </div>
          ) : (
            <SupportMessageList
              messages={support.messages}
              currentUserId={user?.id ?? ""}
              loading={support.loadingMessages || support.loadingList}
              hasMore={support.hasMore}
              onLoadMore={support.loadOlder}
            />
          )}

          {resolved ? (
            <div className="shrink-0 border-t border-black/5 bg-white/80 px-4 py-3 text-center text-sm text-[#8e8e93] dark:border-white/10 dark:bg-[#1c1c1e]">
              {t("support.resolvedHint")}{" "}
              <button
                type="button"
                className="font-semibold text-[#007aff] hover:underline"
                onClick={() => active && void support.reopen(active.id)}
              >
                {t("support.reopen")}
              </button>
            </div>
          ) : (
            <SupportComposer
              onSend={support.send}
              compact
              placeholder={t("support.typeMessagePlaceholder")}
            />
          )}
        </SupportThreadFrame>
      </div>
    </div>
  );
}
