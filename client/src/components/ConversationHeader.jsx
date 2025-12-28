export default function ConversationHeader({ conversation }) {
    if (!conversation) return null;

    return (
        <div className="header">
            <div className="avatar">{conversation.avatar}</div>
            <div className="info">
                <div className="title">{conversation.title}</div>
                <div className="status">active</div>
            </div>
        </div>
    );
}
