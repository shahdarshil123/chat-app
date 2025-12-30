import { useEffect, useMemo, useState } from "react";
import ConversationList from "./ConversationList";
import ConversationHeader from "./ConversationHeader";
import MessageFeed from "./MessageFeed";
import MessageInput from "./MessageInput";

import { connectSocket, disconnectSocket } from "../socket";


/* ================================
   Temporary Logged-in User
================================ */
// const CURRENT_USER_ID = 2;

/* ================================
   Chat Layout
================================ */
export default function ChatLayout({ currentUser, onLogout }) {

  const CURRENT_USER_ID = currentUser.id;

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeId, setActiveId] = useState(null); // Active conversation id
  const [search, setSearch] = useState("");
  // const [activeConversation, setActiveConversation]= useState("");

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  useEffect(() => {
  if (!CURRENT_USER_ID) return;

  const socket = connectSocket(CURRENT_USER_ID);

  socket.on("users:online", (users) => {
    console.log("users:online received:", users);
    setOnlineUsers(new Set(users));
  });

  socket.on("message:new", (msg) => {
    setMessages(prev => {
      const existing = prev[msg.conversationId] || [];

      if (existing.some(m => m.id === msg.id)) {
        return prev;
      }

      const mapped = {
        id: msg.id,
        fromSelf: msg.senderId === CURRENT_USER_ID,
        text: msg.content,
        createdAt: msg.createdAt,
        time: new Date(msg.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      return {
        ...prev,
        [msg.conversationId]: [...existing, mapped],
      };
    });
  });

  return () => {
    socket.off("users:online");
    socket.off("message:new");
  };
}, [CURRENT_USER_ID]);

  /* ================================
     Load Conversations
  ================================ */
  useEffect(() => {
    async function loadConversations() {
      const res = await fetch(
        `http://localhost:4000/api/conversation/${CURRENT_USER_ID}`
      );
      const json = await res.json();
      console.log(json);

      const mapped = json.conversations.map(item => {
        const conv = item.conversation;

        // Determine title
        let title = conv.name;
        if (!conv.isGroup) {
          const other = conv.members.find(
            m => m.userId !== CURRENT_USER_ID
          );
          //title = `User ${other?.userId ?? "Unknown"}`;
          const displayName = other.user.displayName;
          title = !( displayName === null || displayName === undefined)? displayName: "Unknown" ;
        }

        return {
          id: String(conv.id),
          title,
          members: conv.members,
          avatar: title
            .split(" ")
            .slice(0, 2)
            .map(w => w[0])
            .join("")
            .toUpperCase(),
          lastMessage: "",
          lastTime: "",
          unread: item.unreadCount,
          lastReadAt: item.lastReadAt, // backend read timestamp
        };
      });

      setConversations(mapped);

      if (mapped.length) {
        setActiveId(mapped[0].id);
      }
    }

    loadConversations();
  }, []);

  /* ================================
     Load Messages (per conversation)
  ================================ */
  useEffect(() => {
    if (!activeId) return;

    async function loadMessages() {
      const res = await fetch(
        `http://localhost:4000/api/message/${activeId}/messages`
      );
      const json = await res.json();

      const mapped = json.messages.map(m => ({
        id: m.id,
        fromSelf: m.senderId === CURRENT_USER_ID,
        text: m.content,
        time: new Date(m.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: m.senderId === CURRENT_USER_ID ? "delivered" : undefined,
        createdAt: m.createdAt,
        sender: {
          id: m.sender.id,
          name: m.sender.displayName,
          avatar: m.sender.avatarUrl,
        },
      }));

      // 🔑 REPLACE messages for this conversation
      setMessages(prev => ({
        ...prev,
        [activeId]: mapped,
      }));
    }

    loadMessages();
  }, [activeId]);

  /* ================================
     Derived State
  ================================ */
  let activeConversation = useMemo(
    () => conversations.find(c => c.id === activeId),
    [conversations, activeId]
  );

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, conversations]);

  const activeMessages = messages[activeId] || [];

  /* ================================
     Unread Divider Logic
     (incoming only, backend-driven)
  ================================ */
  const unreadStartId = useMemo(() => {
    if (!activeConversation?.lastReadAt) return null;

    const lastReadTime = new Date(
      activeConversation.lastReadAt
    ).getTime();

    return activeMessages.find(
      m =>
        !m.fromSelf &&
        new Date(m.createdAt).getTime() > lastReadTime
    )?.id ?? null;
  }, [activeConversation, activeMessages]);

  /* ================================
     Actions
  ================================ */
  async function selectConversation(id) {
    setActiveId(id);

    // Optimistically mark conversation as read in UI
    const now = new Date().toISOString();
    setConversations(prev =>
      prev.map(c =>
        c.id === id
          ? {
            ...c,
            unread: 0,
            lastReadAt: now,
          }
          : c
      )
    );

    const res = await fetch(
      `http://localhost:4000/api/conversation/${activeId}/read`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          userId: CURRENT_USER_ID,
        }),
      }
    );

    const message = await res.json();

    console.log(message);

  }

  async function sendMessage(text) {
    if (!text.trim() || !activeId) return;

    const res = await fetch(
      `http://localhost:4000/api/message/${activeId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeId,
          senderId: CURRENT_USER_ID,
          content: text,
        }),
      }
    );
    const saved = await res.json();
    const createdAt = saved.createdAt ?? new Date().toISOString();

    const mapped = {
      id: saved.id,
      fromSelf: true,
      text,
      createdAt,
      time: new Date(createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    // ✅ Append message (DO NOT replace, DO NOT dedupe)
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), mapped],
    }));

    // ✅ Update sidebar preview for this conversation
    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? {
            ...c,
            lastMessage: mapped.text,
            lastTime: mapped.time,
          }
          : c
      )
    );
  }

  function dedupeMessages(list) {
    const unique = Array.from(new Map(list.map(m => [m.id, m])).values());

    // Sort by creation time so temporary ids don't break ordering
    unique.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return ta - tb;
    });

    return unique;
  }

  /* ================================
     Render
  ================================ */
  return (
    <div className="chat-app">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <input
          className="search"
          placeholder="Search conversations"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <ConversationList
          conversations={filteredConversations}
          activeId={activeId}
          onSelect={selectConversation}
        />

        <div className="sidebar-footer">
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </aside>

    
      {/* ===== Main Chat ===== */}
      <section className="main">
        <ConversationHeader conversation={activeConversation}
          onlineUsers={onlineUsers}
          currentUserId = {CURRENT_USER_ID} />

        <MessageFeed
          messages={activeMessages}
          unreadStartId={unreadStartId}
        />

        <MessageInput onSend={sendMessage} />
      </section>
    </div>
  );
}
