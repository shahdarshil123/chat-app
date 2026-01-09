import { useEffect, useRef, useState } from "react";
import { USER_API_VERSION, CONVERSATION_API_VERSION } from "../config";

/**
 * Props expected:
 * open: boolean
 * currentUserId: number
 * onClose: () => void
 * onConversationCreated: (conversationId: string) => void
 */
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
  const [statusMessage, setStatusMessage] = useState("");
  const [creating, setCreating] = useState(false);

  // Track mounted to avoid setState after unmount (safe in strict mode)
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Reset modal state when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
      setUsers([]);
      setLoading(false);
      setSelectedUser(null);
      setStatusMessage("");
      setCreating(false);
    }
  }, [open]);

  // Search users (debounced)
  useEffect(() => {
    if (!open) return;

    const q = query.trim();
    if (!q) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/${USER_API_VERSION}/user/search?query=${encodeURIComponent(
            q
          )}`,
          { credentials: "include", signal: controller.signal }
        );

        // If backend returns non-200, treat as empty list
        if (!res.ok) {
          const text = await res.text();
          console.error("User search failed:", res.status, text);
          if (isMountedRef.current) setUsers([]);
          return;
        }

        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.users ?? [];

        if (isMountedRef.current) setUsers(arr);
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("User search error:", err);
        }
        if (isMountedRef.current) setUsers([]);
      } finally {
        if (isMountedRef.current) setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [open, query]);

  async function startConversation() {
    if (!selectedUser || creating) return;

    setCreating(true);
    setStatusMessage("Creating conversation…");

    try {
      // ✅ Your backend route: POST /conversation/direct/:userId
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/${CONVERSATION_API_VERSION}/conversation/direct/${selectedUser.id}`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (!res.ok) {
        const text = await res.text();
        console.error("Create conversation failed:", res.status, text);
        setStatusMessage("Failed to create conversation. Check server logs.");
        setCreating(false);
        return;
      }

      const data = await res.json();

      // Expecting: { exists: boolean, conversationId: number }
      const conversationId = data?.conversationId;

      if (!conversationId) {
        console.error("Unexpected response shape:", data);
        setStatusMessage("Server returned an invalid response.");
        setCreating(false);
        return;
      }

      if (data.exists) {
        setStatusMessage("Conversation already exists. Opening…");
      } else {
        setStatusMessage("Conversation created. Opening…");
      }

      // ✅ OPEN first (update parent state), THEN close modal
      onConversationCreated(String(conversationId));
      onClose();
    } catch (err) {
      console.error("Start conversation error:", err);
      setStatusMessage("Failed to create conversation. Try again.");
      setCreating(false);
    }
  }

  if (!open) return null;

  const visibleUsers = users.filter(u => u.id !== currentUserId);

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

        {statusMessage ? (
          <div className="muted" style={{ marginBottom: 8 }}>
            {statusMessage}
          </div>
        ) : null}

        <div className="new-chat-modal-list">
          {loading && <div className="muted">Searching…</div>}

          {!loading &&
            visibleUsers.map(user => (
              <button
                key={user.id}
                type="button"
                className={`new-chat-user-row ${
                  selectedUser?.id === user.id ? "selected" : ""
                }`}
                onClick={() => {
                  setSelectedUser(user);
                  setStatusMessage("");
                }}
              >
                <div className="avatar">
                  {user.displayName?.[0]?.toUpperCase() || "?"}
                </div>
                <span>{user.displayName || user.username || "Unknown"}</span>
              </button>
            ))}
        </div>

        <div className="new-chat-modal-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedUser || creating}
            onClick={startConversation}
          >
            {creating ? "Starting…" : "Start Conversation"}
          </button>

          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
