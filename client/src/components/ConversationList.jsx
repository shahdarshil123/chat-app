export default function ConversationList({
  conversations,
  messages,
  activeId,
  onSelect,
}) {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="muted" style={{ padding: "12px" }}>
        No conversations
      </div>
    );
  }

  return (
    <div className="conversation-list">
      {conversations.map(convo => {
        const isActive = convo.id === activeId;

        const convoMessages = messages?.[convo.id] || [];
        const lastMessage =
          convoMessages.length > 0
            ? convoMessages[convoMessages.length - 1]?.text
            : convo.lastMessage || "";

        return (
          <button
            key={convo.id}
            type="button"
            className={`conversation ${isActive ? "active" : ""}`}
            onClick={() => onSelect(convo.id)}
          >
            <div className="avatar">
              {convo.avatar ||
                convo.title?.[0]?.toUpperCase() ||
                "?"}
            </div>

            <div className="meta">
              <div className="top">
                <span className="title">
                  {convo.title || "Unknown"}
                </span>

                {convo.lastTime && (
                  <span className="time">{convo.lastTime}</span>
                )}
              </div>

              <div className="bottom">
                <span className="preview">
                  {lastMessage}
                </span>

                {convo.unread > 0 && (
                  <span className="badge">
                    {convo.unread}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
