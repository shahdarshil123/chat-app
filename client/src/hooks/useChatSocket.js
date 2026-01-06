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
        [convoId]: [
          ...(prev[convoId] || []),
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
            convoId === activeId ? 0 : (existing.unread || 0) + 1,
          updatedAt: msg.createdAt,
        };

        return [updated, ...prev.filter(c => c.id !== convoId)];
      });
    }

    function handleDeleted(payload) {
      const { id, conversationId } = payload;
      const targetId = String(id);

      setMessages(prev => {
        let changed = false;
        const next = {};
        let affectedConversationKey = null;

        for (const [convKey, arr] of Object.entries(prev)) {
          const mapped = arr.map(m => {
            if (String(m.id) === targetId) {
              changed = true;
              affectedConversationKey = convKey;
              return { ...m, text: "This message was deleted", deleted: true };
            }
            return m;
          });

          next[convKey] = mapped;
        }

        if (!changed) return prev;

        // Update conversation preview for affected conversation
        if (affectedConversationKey) {
          const mappedArr = next[affectedConversationKey] || [];
          const lastMsg = mappedArr.length ? mappedArr[mappedArr.length - 1] : null;

          setConversations(prevConvos => {
            const convoIdStr = String(conversationId);
            const existing = prevConvos.find(c => c.id === convoIdStr || c.id === Number(affectedConversationKey));
            if (!existing) return prevConvos;

            const updated = {
              ...existing,
              lastMessage: lastMsg ? lastMsg.text : "",
              lastTime: lastMsg
                ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "",
              updatedAt: new Date().toISOString(),
            };

            return [updated, ...prevConvos.filter(c => c.id !== existing.id)];
          });
        }

        return next;
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
  }, [socket, activeId, currentUserId, mapMessage, onReconnect, setMessages, setConversations, setOnlineUsers]);
}
