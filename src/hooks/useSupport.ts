import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/lib/supabase";
import {
  createConversation,
  ensureSupportRealtimeAuth,
  fetchMessages,
  fetchNewerMessages,
  isConversationUnreadForUser,
  listUserConversations,
  markConversationRead,
  mergeSupportMessages,
  sendMessage,
  SUPPORT_PAGE_SIZE,
  updateConversationStatus,
  type SupportMessageWithAttachments,
} from "@/lib/support";
import type { SupportConversation } from "@/types/database";

const THREAD_POLL_MS = 4_000;

export function useUserSupport(userId: string | undefined) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SupportMessageWithAttachments[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const refreshList = useCallback(async (opts?: { soft?: boolean }) => {
    if (!userId) return;
    if (!opts?.soft) setLoadingList(true);
    setError("");
    try {
      const rows = await listUserConversations(userId);
      setConversations(rows);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("support.loadConversationsError"));
    } finally {
      if (!opts?.soft) setLoadingList(false);
    }
  }, [userId, t]);

  const syncLatestMessages = useCallback(async (conversationId: string) => {
    const current = messagesRef.current;
    const lastPersisted = [...current].reverse().find((m) => !m.id.startsWith("temp-"));
    try {
      if (!lastPersisted) {
        const rows = await fetchMessages(conversationId, { limit: SUPPORT_PAGE_SIZE });
        setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
        setMessages(rows);
        return;
      }
      const newer = await fetchNewerMessages(conversationId, lastPersisted.created_at);
      if (newer.length > 0) {
        setMessages((prev) => mergeSupportMessages(prev, newer));
      }
    } catch {
      // Keep existing messages if a soft sync fails.
    }
  }, []);

  const loadMessages = useCallback(async (conversationId: string, reset = true) => {
    setLoadingMessages(true);
    setError("");
    try {
      const before = reset ? undefined : messagesRef.current[0]?.created_at;
      const rows = await fetchMessages(conversationId, { before, limit: SUPPORT_PAGE_SIZE });
      setHasMore(rows.length >= SUPPORT_PAGE_SIZE);
      setMessages((prev) => (reset ? rows : [...rows, ...prev]));
      if (userId) await markConversationRead(conversationId, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("support.loadMessagesError"));
    } finally {
      setLoadingMessages(false);
    }
  }, [userId, t]);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  // Open latest open/pending chat automatically so users land straight in the thread.
  useEffect(() => {
    if (loadingList || activeId) return;
    const preferred =
      conversations.find((c) => c.status === "open" || c.status === "pending") ??
      conversations[0] ??
      null;
    if (preferred) setActiveId(preferred.id);
  }, [conversations, loadingList, activeId]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    void loadMessages(activeId, true);
  }, [activeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const setup = async () => {
      await ensureSupportRealtimeAuth();
      if (cancelled) return;

      const convChannel = supabase
        .channel(`support-conv-user-${userId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "support_conversations", filter: `user_id=eq.${userId}` },
          (payload) => {
            void refreshList({ soft: true });
            const row = payload.new as SupportConversation | undefined;
            if (row?.id && row.id === activeIdRef.current) {
              void syncLatestMessages(row.id);
            }
          }
        )
        .subscribe();

      return convChannel;
    };

    let convChannel: ReturnType<typeof supabase.channel> | undefined;
    void setup().then((ch) => {
      convChannel = ch;
    });

    return () => {
      cancelled = true;
      if (convChannel) void supabase.removeChannel(convChannel);
    };
  }, [userId, refreshList, syncLatestMessages]);

  useEffect(() => {
    if (!activeId) return;
    let cancelled = false;

    const setup = async () => {
      await ensureSupportRealtimeAuth();
      if (cancelled) return;

      const msgChannel = supabase
        .channel(`support-msg-${activeId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
          (payload) => {
            const row = payload.new as SupportMessageWithAttachments;
            setMessages((prev) => mergeSupportMessages(prev, [{ ...row, attachments: [] }]));
            void markConversationRead(activeId, false);
            void refreshList({ soft: true });
            // Re-fetch shortly so attachments / full row land even if realtime payload is partial.
            window.setTimeout(() => { void syncLatestMessages(activeId); }, 600);
          }
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "support_messages", filter: `conversation_id=eq.${activeId}` },
          (payload) => {
            const row = payload.new as SupportMessageWithAttachments;
            setMessages((prev) => mergeSupportMessages(prev, [{ ...row, attachments: [] }]));
          }
        )
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "support_attachments", filter: `conversation_id=eq.${activeId}` },
          () => { void syncLatestMessages(activeId); }
        )
        .subscribe((status) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            void syncLatestMessages(activeId);
          }
        });

      return msgChannel;
    };

    let msgChannel: ReturnType<typeof supabase.channel> | undefined;
    void setup().then((ch) => {
      msgChannel = ch;
    });

    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void syncLatestMessages(activeId);
        void refreshList({ soft: true });
      }
    }, THREAD_POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void syncLatestMessages(activeId);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (msgChannel) void supabase.removeChannel(msgChannel);
    };
  }, [activeId, refreshList, syncLatestMessages]);

  const startNew = async (subject: string, firstMessage: string, files: File[] = []) => {
    if (!userId) return;
    const { conversation, message } = await createConversation(
      userId,
      subject,
      firstMessage,
      files
    );
    await refreshList({ soft: true });
    setActiveId(conversation.id);
    setMessages([{ ...message, pending: false }]);
  };

  const send = async (body: string, files: File[]) => {
    if (!userId) return;

    if (!activeId) {
      await startNew(t("support.defaultSubject"), body, files);
      return;
    }

    const conversationId = activeId;
    const clientId = crypto.randomUUID();
    const optimistic: SupportMessageWithAttachments = {
      id: `temp-${clientId}`,
      conversation_id: conversationId,
      sender_id: userId,
      sender_role: "user",
      body,
      is_internal: false,
      delivered_at: null,
      read_at: null,
      client_id: clientId,
      created_at: new Date().toISOString(),
      pending: true,
      attachments: [],
    };
    setMessages((prev) => [...prev, optimistic]);
    try {
      const saved = await sendMessage({
        conversationId,
        senderId: userId,
        senderRole: "user",
        body,
        clientId,
        files,
      });
      setMessages((prev) => mergeSupportMessages(prev, [{ ...saved, pending: false }]));
      await refreshList({ soft: true });
    } catch {
      setMessages((prev) =>
        prev.map((m) => (m.client_id === clientId ? { ...m, pending: false, failed: true } : m))
      );
    }
  };

  const reopen = async (conversationId: string) => {
    await updateConversationStatus(conversationId, "open");
    await refreshList({ soft: true });
  };

  const loadOlder = () => {
    if (activeId) void loadMessages(activeId, false);
  };

  const unreadTotal = conversations.filter(isConversationUnreadForUser).length;

  return {
    conversations,
    activeId,
    setActiveId,
    messages,
    loadingList,
    loadingMessages,
    hasMore,
    error,
    startNew,
    send,
    reopen,
    loadOlder,
    refreshList,
    unreadTotal,
  };
}
