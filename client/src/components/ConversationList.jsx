export default function ConversationList({
  conversations,
  messages,
  activeId,
  currentUserId,
  onSelect,
}) {
  function getUnreadCount(conversation) {
  const convoMessages = messages[conversation.id];

  // ✅ LOGIN CASE: messages not loaded yet
  if (!convoMessages) {
    return conversation.unread ?? 0;
  }

  // ✅ AFTER OPENING CHAT: derive from messages
  if (!conversation.lastReadAt) return 0;

  const lastRead = new Date(conversation.lastReadAt).getTime();

  return convoMessages.filter(
    m =>
      !m.fromSelf &&
      new Date(m.createdAt).getTime() > lastRead
  ).length;
}

  return (
    <div className="conversation-list">
      {conversations.map(c => {
        const unread = getUnreadCount(c);

        return (
          <button
            key={c.id}
            className={`conversation ${c.id === activeId ? "active" : ""}`}
            onClick={() => onSelect(c.id)}
          >
            <div className="avatar">{c.avatar}</div>

            <div className="meta">
              <div className="top">
                <span className="title">{c.title}</span>
                <span className="time">{c.lastTime}</span>
              </div>

              <div className="bottom">
                <span className="preview">{c.lastMessage}</span>
                {unread > 0 && <span className="badge">{unread}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
