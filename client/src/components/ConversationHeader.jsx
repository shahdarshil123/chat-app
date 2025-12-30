export default function ConversationHeader({
    conversation,
    onlineUsers,
    currentUserId
}) {
    if (!conversation) return null;
    console.log(conversation);
    const otherUser = conversation.members?.find(
  m => m.userId !== currentUserId
);

const isOnline = otherUser
  ? onlineUsers.has(otherUser.userId)
  : false;
    

    console.log("onlineUsers:", [...onlineUsers]);
    console.log("conversation.id:", conversation.id);
    console.log("members:", conversation.members);
    return (
        <div className="header">
            <div className="avatar">{conversation.avatar}</div>
            <div className="info">
                <div className="title">{conversation.title}</div>
                <div className="status">
                    {isOnline ? "online" : "last seen recently"}
                </div>
            </div>
        </div>
    );
}