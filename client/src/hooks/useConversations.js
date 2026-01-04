import { useState, useEffect } from "react";

export function useConversations({
  currentUserId,
  apiVersion,
}) {
  const [conversations, setConversations] = useState([]);
  const [unreadBoundary, setUnreadBoundary] = useState({});

  /* ================================
     Load conversations
  ================================ */
  useEffect(() => {
    async function loadConversations() {
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
            lastMessage: "",
            lastTime: "",
            unread: item.unreadCount,
            lastReadAt: item.lastReadAt,
          };
        })
      );
    }

    loadConversations();
  }, [currentUserId, apiVersion]);

  /* ================================
     Mark conversation as read
  ================================ */
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
        c.id === conversationId
          ? { ...c, unread: 0 }
          : c
      )
    );
  }

  return {
    conversations,
    setConversations,
    unreadBoundary,
    setUnreadBoundary,
    markAsRead,
  };
}
