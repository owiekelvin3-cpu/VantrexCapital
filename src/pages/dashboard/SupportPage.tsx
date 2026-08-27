import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { MessageCircle, Plus, Search } from "@/lib/icons";
import { useAuth } from "@/hooks/useAuth";
import { useUserSupport } from "@/hooks/useSupport";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SupportComposer,
  SupportEmptyState,
  SupportMessageList,
  SupportMobileChatOverlay,
  SupportStatusBadge,
  SupportThreadFrame,
} from "@/components/support/SupportChat";
import { isConversationUnreadForUser } from "@/lib/support";
import { cn, formatDate } from "@/lib/utils";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const support = useUserSupport(user?.id);
  const [search, setSearch] = useState("");
  const [composing, setComposing] = useState(false);
  const [subject, setSubject] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return support.conversations;
    return support.conversations.filter(
      (c) => c.subject.toLowerCase().includes(q) || (c.last_message_preview ?? "").toLowerCase().includes(q)
    );
  }, [support.conversations, search]);

  const active = support.conversations.find((c) => c.id === support.activeId) ?? null;
  const showThread = composing || !!active;

  const backToList = () => {
    setComposing(false);
    support.setActiveId(null);
  };

  const handleCreate = async () => {
    if (!firstMessage.trim()) return;
    setCreating(true);
    try {
      await support.startNew(subject || t("support.defaultSubject"), firstMessage);
      setComposing(false);
      setSubject("");
      setFirstMessage("");
    } finally {
      setCreating(false);
    }
  };

  const threadBody = composing ? (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-4 sm:p-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-lg space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald/30 bg-emerald text-black shadow-sm">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold">{t("support.startConversation")}</h2>
            <p className="text-sm text-muted">{t("support.startHint")}</p>
          </div>
        </div>
        <div>
          <Label htmlFor="support-subject">{t("support.subject")}</Label>
          <Input
            id="support-subject"
            className="mt-1.5 text-base"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t("support.subjectPlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor="support-first">{t("support.firstMessage")}</Label>
          <textarea
            id="support-first"
            className="mt-1.5 min-h-[120px] w-full rounded-xl border border-border bg-secondary/40 px-4 py-3 text-base outline-none focus:ring-1 focus:ring-emerald/20"
            value={firstMessage}
            onChange={(e) => setFirstMessage(e.target.value)}
            placeholder={t("support.firstMessagePlaceholder")}
          />
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto" onClick={backToList}>{t("common.cancel")}</Button>
          <Button className="w-full sm:w-auto" onClick={() => void handleCreate()} disabled={creating || !firstMessage.trim()}>
            {creating ? t("common.loading") : t("support.send")}
          </Button>
        </div>
      </motion.div>
    </div>
  ) : active ? (
    <>
      <SupportMessageList
        messages={support.messages}
        currentUserId={user?.id ?? ""}
        loading={support.loadingMessages}
        hasMore={support.hasMore}
        onLoadMore={support.loadOlder}
      />
      {active.status === "resolved" ? (
        <div className="shrink-0 border-t border-[#e8eaed] bg-[#f7f8fa] p-4 text-center text-sm text-[#5f6368]">
          {t("support.resolvedHint")}{" "}
          <button type="button" className="font-medium text-[#1a73e8] hover:underline" onClick={() => void support.reopen(active.id)}>
            {t("support.reopen")}
          </button>
        </div>
      ) : (
        <SupportComposer onSend={support.send} compact />
      )}
    </>
  ) : null;

  const threadTitle = t("support.liveTitle");
  const threadSubtitle = t("support.liveSubtitle");

  return (
    <div className="flex min-h-0 flex-col gap-4 lg:h-[calc(100dvh-8.5rem)] lg:min-h-[520px]">
      <div className={cn("shrink-0", showThread && "hidden lg:block")}>
        <PageHeader
          eyebrow={t("dashboard.navGroupAccount")}
          title={t("support.title")}
          subtitle={t("support.subtitle")}
          actions={
            <Button
              size="sm"
              className="w-full rounded-full sm:w-auto"
              onClick={() => { setComposing(true); support.setActiveId(null); }}
            >
              <Plus className="h-3.5 w-3.5" />
              {t("support.newConversation")}
            </Button>
          }
        />
      </div>

      {support.error && (
        <p className="shrink-0 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-400">{support.error}</p>
      )}

      {/* Mobile inbox list */}
      <div className={cn("min-h-0 flex-1 lg:hidden", showThread && "hidden")}>
        <div className="flex h-full min-h-[calc(100dvh-11rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface-elevated">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("support.searchConversations")}
                className="h-10 w-full rounded-full border border-border bg-secondary/40 pl-9 pr-3 text-base outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {support.loadingList ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <SupportEmptyState onNew={() => setComposing(true)} />
            ) : (
              filtered.map((c) => {
                const unread = isConversationUnreadForUser(c);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setComposing(false); support.setActiveId(c.id); }}
                    className="flex w-full flex-col gap-1.5 border-b border-border px-4 py-3.5 text-left active:bg-secondary/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("min-w-0 flex-1 truncate text-[15px]", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                        {c.subject}
                      </p>
                      <SupportStatusBadge status={c.status} />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-[13px] text-muted">{c.last_message_preview || t("support.noMessagesYet")}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[11px] text-muted">{formatDate(c.last_message_at)}</span>
                        {unread && <span className="h-2.5 w-2.5 rounded-full bg-emerald" />}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Mobile full-screen live chat overlay */}
      <SupportMobileChatOverlay open={showThread}>
        <SupportThreadFrame
          variant="live"
          title={threadTitle}
          subtitle={threadSubtitle}
          onBack={backToList}
          safeAreaTop
        >
          {threadBody}
        </SupportThreadFrame>
      </SupportMobileChatOverlay>

      {/* Desktop / laptop split pane */}
      <div className="hidden min-h-0 flex-1 overflow-hidden rounded-2xl border border-border bg-surface-elevated lg:grid lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="flex min-h-0 flex-col border-r border-border">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("support.searchConversations")}
                className="h-10 w-full rounded-xl border border-border bg-secondary/40 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-emerald/20"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {support.loadingList ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <p className="p-4 text-sm text-muted">{t("support.noConversations")}</p>
            ) : (
              filtered.map((c) => {
                const unread = isConversationUnreadForUser(c);
                const selected = c.id === support.activeId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => { setComposing(false); support.setActiveId(c.id); }}
                    className={cn(
                      "flex w-full flex-col gap-1 border-b border-border px-4 py-3 text-left transition-colors",
                      selected ? "bg-secondary/70" : "hover:bg-secondary/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("min-w-0 truncate text-sm", unread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                        {c.subject}
                      </p>
                      <SupportStatusBadge status={c.status} />
                    </div>
                    <p className="truncate text-xs text-muted">{c.last_message_preview || t("support.noMessagesYet")}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted">{formatDate(c.last_message_at)}</span>
                      {unread && <span className="h-2 w-2 rounded-full bg-emerald" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          {composing || active ? (
            <SupportThreadFrame
              variant="live"
              title={threadTitle}
              subtitle={threadSubtitle}
              trailing={
                active?.status === "resolved" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mr-1 border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                    onClick={() => void support.reopen(active.id)}
                  >
                    {t("support.reopen")}
                  </Button>
                ) : undefined
              }
            >
              {threadBody}
            </SupportThreadFrame>
          ) : (
            <SupportEmptyState onNew={() => setComposing(true)} />
          )}
        </section>
      </div>
    </div>
  );
}
