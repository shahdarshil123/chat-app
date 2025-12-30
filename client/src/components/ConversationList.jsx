export default function ConversationList({ conversations, activeId, onSelect }) {
    return (
        <div className="conversation-list">
            {conversations.map(c => (
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
                            {/* <span className="preview">{c.lastMessage}</span> */}
                            {c.unread > 0 && <span className="badge">{c.unread}</span>}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}
