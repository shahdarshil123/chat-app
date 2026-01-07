import { useEffect, useState } from "react";
import { USER_API_VERSION, CONVERSATION_API_VERSION } from "../config";

export default function NewChatDialog({
    open,
    currentUserId,
    onClose,
    onConversationCreated,
}) {
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
  if (!open) return;

  if (!query.trim()) {
    setUsers([]);
    setSelectedUser(null);
    return;
  }

  const controller = new AbortController();

  async function searchUsers() {
    setLoading(true);
    try {
      const res = await fetch(
        `http://localhost:4000/api/${USER_API_VERSION}/user/search?query=${encodeURIComponent(
        query
      )}`,
        { credentials: "include", signal: controller.signal }
      );

      const data = await res.json();

      // ✅ DEFENSIVE FIX
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch (err) {
      setUsers([]);
    }
    setLoading(false);
  }

  searchUsers();
  return () => controller.abort();
}, [open, query]);

    // ✅ Optional: reset input when closing
    useEffect(() => {
        if (!open) {
            setQuery("");
            setUsers([]);
            setSelectedUser(null);
            setLoading(false);
        }
    }, [open]);

    async function startConversation() {
        if (!selectedUser) return;

        const res = await fetch(
            `http://localhost:4000/api/${CONVERSATION_API_VERSION}/conversation/direct`,
            {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetUserId: selectedUser.id }),
            }
        );

        const json = await res.json();
        onConversationCreated(String(json.conversationId));
        onClose();
    }

    // ✅ Return AFTER hooks (Rule of Hooks)
    if (!open) return null;

    return (
        <div className="new-chat-modal-overlay">
            <div className="new-chat-modal">
                <div className="new-chat-modal-title">New Chat</div>

                <input
                    className="search"
                    placeholder="Search by display name"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />

                <div className="new-chat-modal-list">
                    {loading && <div className="muted">Searching…</div>}

                    {!loading &&
                        users
                            .filter(u => u.id !== currentUserId)
                            .map(user => (
                                <button
                                    key={user.id}
                                    className={`new-chat-user-row ${selectedUser?.id === user.id ? "selected" : ""
                                        }`}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div className="avatar">
                                        {user.displayName?.[0]?.toUpperCase()}
                                    </div>
                                    <span>{user.displayName}</span>
                                </button>
                            ))}
                </div>

                <div className="new-chat-modal-actions">
                    <button
                        className="btn-primary"
                        disabled={!selectedUser}
                        onClick={startConversation}
                    >
                        Start Conversation
                    </button>

                    <button className="btn-cancel" onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
