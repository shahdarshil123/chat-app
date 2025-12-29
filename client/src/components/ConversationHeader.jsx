export default function ConversationHeader({ conversation, onlineUsers }) {
    if (!conversation) return null;

    const isOnline = onlineUsers?.has(Number(conversation.id));

    return (
        <div className="header">
            <div className="avatar">{conversation.avatar}</div>
            <div className="info">
                <div className="title">{conversation.title}</div>
                <div className="status">{isOnline ? "online" : "last seen recently"}</div>
            </div>
        </div>
    );
}
