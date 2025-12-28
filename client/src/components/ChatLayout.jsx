import { useState } from "react";

export default function ChatLayout({ onLogout }) {
  // -----------------------------
  // Conversations
  // -----------------------------
  const [conversations] = useState([
    {
      id: 1,
      name: "Project Channel",
      avatar: "PC",
      lastMessage: "Deployment completed",
      time: "22:10",
      unread: 2,
    },
    {
      id: 2,
      name: "Team Discussion",
      avatar: "TD",
      lastMessage: "Please review the changes",
      time: "18:45",
      unread: 0,
    },
    {
      id: 3,
      name: "General Chat",
      avatar: "GC",
      lastMessage: "Looks good to me",
      time: "Yesterday",
      unread: 0,
    },
  ]);

  // -----------------------------
  // Messages per conversation
  // -----------------------------
  const [messages] = useState({
    1: [
      { id: 1, text: "Deployment is done", from: "other", time: "22:07" },
      { id: 2, text: "Great, I’ll verify logs", from: "self", time: "22:08" },
    ],
    2: [
      {
        id: 1,
        text: "Please review the changes",
        from: "other",
        time: "18:45",
      },
    ],
    3: [
      {
        id: 1,
        text: "Looks good to me",
        from: "other",
        time: "Yesterday",
      },
    ],
  });

  // -----------------------------
  // Active conversation
  // -----------------------------
  const [activeId, setActiveId] = useState(conversations[0].id);

  const activeMessages = messages[activeId] || [];

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="chat-app">
      {/* ================= Sidebar ================= */}
      <aside className="sidebar">
        {/* Search */}
        <input
          className="search"
          placeholder="Search conversations"
        />

        {/* Conversation List */}
        <div className="conversation-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className={`conversation ${
                activeId === c.id ? "active" : ""
              }`}
              onClick={() => setActiveId(c.id)}
            >
              <div className="avatar">{c.avatar}</div>

              <div className="meta">
                <div className="top">
                  <span>{c.name}</span>
                  <span className="time">{c.time}</span>
                </div>

                <div className="bottom">
                  <span className="preview">{c.lastMessage}</span>
                  {c.unread > 0 && (
                    <span className="badge">{c.unread}</span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Logout */}
        <div className="sidebar-footer">
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

      {/* ================= Main Chat ================= */}
      <main className="main">
        {/* Messages */}
        <div className="messages">
          {activeMessages.length === 0 ? (
            <div style={{ color: "#6b7280" }}>No messages yet</div>
          ) : (
            activeMessages.map((m) => (
              <div
                key={m.id}
                className={`message-row ${
                  m.from === "self" ? "self" : "other"
                }`}
              >
                <div className="message">
                  <span>{m.text}</span>
                  <div className="time">{m.time}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="input-bar">
          <input placeholder="Type a message" />
          <button>Send</button>
        </div>
      </main>
    </div>
  );
}
