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

    function handleDeleted(payload) {
      const { id, conversationId } = payload;
      const convoId = String(conversationId);

      setMessages(prev => {
        const current = prev[conversationId] || [];
        const filtered = current.filter(m => String(m.id) !== String(id));

        // update conversations based on remaining messages
        const lastMsg = filtered.length ? filtered[filtered.length - 1] : null;
        setConversations(prevConvos => {
          const existing = prevConvos.find(c => c.id === convoId);
          if (!existing) return prevConvos;

          const updated = {
            ...existing,
            lastMessage: lastMsg ? lastMsg.content : "",
            lastTime: lastMsg
              ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            updatedAt: new Date().toISOString(),
          };

          return [updated, ...prevConvos.filter(c => c.id !== convoId)];
        });

        return {
          ...prev,
          [conversationId]: filtered,
        };
      });
    }

    socket.on("users:online", handleOnline);
    socket.on("message:new", handleMessage);
    socket.on("message:deleted", handleDeleted);
    socket.on("connect", onReconnect);

    return () => {
      socket.off("users:online", handleOnline);
      socket.off("message:new", handleMessage);
      socket.off("message:deleted", handleDeleted);
      socket.off("connect", onReconnect);
    };
  }, [socket, activeId]);
}
