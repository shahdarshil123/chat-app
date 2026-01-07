import { useState, useEffect, useMemo, useCallback } from "react";

export function useConversations({ currentUserId, apiVersion }) {
  const [conversations, setConversations] = useState([]);
  const [unreadBoundary, setUnreadBoundary] = useState({});

  /* ================================
     Load conversations (EXTRACTED)
  ================================ */
  const reloadConversations = useCallback(async () => {
    const res = await fetch(
      `http://localhost:4000/api/${apiVersion}/conversation/${currentUserId}`,
      { credentials: "include" }
    );
    const json = await res.json();

    setConversations(
      json.conversations.map(item => {
        const conv = item.conversation;
        const other = conv.members.find(
          m => m.userId !== currentUserId
        );

        const title =
          conv.isGroup || !other?.user?.displayName
            ? conv.name
            : other.user.displayName;

        const lastMsg = item.lastMessage;

        return {
          id: String(conv.id),
          title,
          members: conv.members,
          avatar: title
            .split(" ")
            .slice(0, 2)
            .map(w => w[0])
            .join("")
            .toUpperCase(),
          lastMessage: lastMsg?.content || "",
          lastTime: lastMsg
            ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unread: item.unreadCount,
          lastReadAt: item.lastReadAt,
          updatedAt: conv.updatedAt,
        };
      })
    );
  }, [currentUserId, apiVersion]);

  /* ================================
     Initial load
  ================================ */
  useEffect(() => {
    reloadConversations();
  }, [reloadConversations]);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });
  }, [conversations]);

  async function markAsRead(conversationId) {
    await fetch(
      `http://localhost:4000/api/${apiVersion}/conversation/${conversationId}/read`,
      { method: "POST", credentials: "include" }
    );

    setUnreadBoundary(prev => ({
      ...prev,
      [conversationId]: new Date().toISOString(),
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === conversationId ? { ...c, unread: 0 } : c
      )
    );
  }

  return {
    conversations: sortedConversations,
    setConversations,
    reloadConversations, // 🔥 THIS IS THE KEY ADDITION
    unreadBoundary,
    setUnreadBoundary,
    markAsRead,
  };
}
