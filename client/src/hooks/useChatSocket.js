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

      setMessages(prev => ({
        ...prev,
        [msg.conversationId]: [
          ...(prev[msg.conversationId] || []),
          mapMessage(msg),
        ],
      }));

      setConversations(prev =>
        prev.map(c =>
          c.id === String(msg.conversationId)
            ? {
                ...c,
                lastMessage: msg.content,
                unread:
                  c.id === activeId ? 0 : (c.unread || 0) + 1,
              }
            : c
        )
      );
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
