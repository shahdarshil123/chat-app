import { useEffect } from "react";

export function useChatSocket({
  socket,
  activeId,
  currentUserId,
  setMessages,
  setConversations,
  setOnlineUsers,
  mapMessage,
  onReconnect,
}) {
  useEffect(() => {
    if (!socket) return;

    function handleOnline(users) {
      setOnlineUsers(new Set(users));
    }

    function handleMessage(msg) {
      if (msg.senderId === currentUserId) return;

      const convoId = String(msg.conversationId);

      setMessages(prev => ({
        ...prev,
        [msg.conversationId]: [
          ...(prev[msg.conversationId] || []),
          mapMessage(msg),
        ],
      }));


      setConversations(prev => {
        const existing = prev.find(c => c.id === convoId);
        if (!existing) return prev;

        const updated = {
          ...existing,
          lastMessage: msg.content,
          lastTime: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          unread:
            convoId === activeId
              ? 0
              : (existing.unread || 0) + 1,
          updatedAt: msg.createdAt, // 🔑 MUST update
        };

        // 🔑 REMOVE + PREPEND (do NOT rely on sort)
        return [
          updated,
          ...prev.filter(c => c.id !== convoId),
        ];
      });
    }

    socket.on("users:online", handleOnline);
    socket.on("message:new", handleMessage);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("users:online", handleOnline);
      socket.off("message:new", handleMessage);
      socket.off("connect", onReconnect);
    };
  }, [socket, activeId]);
}
