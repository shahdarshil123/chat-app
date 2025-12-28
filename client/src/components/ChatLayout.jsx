import { useMemo, useState } from "react";
import ConversationList from "./ConversationList";
import ConversationHeader from "./ConversationHeader";
import MessageFeed from "./MessageFeed";
import MessageInput from "./MessageInput";

/* -------------------------------
   Seed Data
-------------------------------- */
const conversationsSeed = [
  {
    id: "1",
    title: "Project Channel",
    lastMessage: "Deployment completed",
    lastTime: "22:10",
    unread: 2,
    avatar: "PC",
  },
  {
    id: "2",
    title: "Team Discussion",
    lastMessage: "Please review the changes",
    lastTime: "18:45",
    unread: 0,
    avatar: "TD",
  },
  {
    id: "3",
    title: "General Chat",
    lastMessage: "Looks good to me",
    lastTime: "Yesterday",
    unread: 0,
    avatar: "GC",
  }
];

const messagesSeed = {
  "1": [
    { id: 1, fromSelf: false, text: "Deployment is done", time: "22:07" },
    {
      id: 2,
      fromSelf: true,
      text: "Great, I’ll verify logs",
      time: "22:08",
      status: "seen",
    },
    {
      id: 3,                    // 👈 NEW incoming
      fromSelf: false,
      text: "New update from server",
      time: "22:15",
    },
  ],
  "2": [
    {
      id: 1,
      fromSelf: false,
      text: "Please review the changes",
      time: "18:45",
    },
  ],
  "3": [
    {
      id: 1,
      fromSelf: true,
      text: "Looks good to me",
      time: "Yesterday",
      status: "delivered",
    },
  ],
};

/* 👇 Track last SEEN INCOMING message */
const lastSeenIncomingSeed = {
  "1": 1,
  "2": null,
  "3": null,
  "4":null
};

export default function ChatLayout({ onLogout }) {
  const [conversations, setConversations] = useState(conversationsSeed);
  const [messages, setMessages] = useState(messagesSeed);
  const [activeId, setActiveId] = useState(conversationsSeed[0].id);
  const [search, setSearch] = useState("");
  const [lastSeenIncoming, setLastSeenIncoming] = useState(
    lastSeenIncomingSeed
  );

  /* -------------------------------
     Derived State
  -------------------------------- */
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === activeId);
  }, [conversations, activeId]);

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, conversations]);

  const activeMessages = messages[activeId] || [];

  /* ✅ UNREAD divider logic (incoming only) */
  const unreadStartId = useMemo(() => {
    const lastSeen = lastSeenIncoming[activeId];
    const firstUnreadIncoming = activeMessages.find(
      m => !m.fromSelf && (lastSeen == null || m.id > lastSeen)
    );
    return firstUnreadIncoming?.id ?? null;
  }, [activeMessages, activeId, lastSeenIncoming]);

  /* -------------------------------
     Actions
  -------------------------------- */
  function selectConversation(id) {
    setActiveId(id);

    const list = messages[id] || [];

    // mark latest incoming as seen
    const latestIncomingId =
      [...list].reverse().find(m => !m.fromSelf)?.id ?? null;

    setLastSeenIncoming(prev => ({
      ...prev,
      [id]: latestIncomingId,
    }));

    // Delivered → Seen (sent messages)
    setMessages(prev => ({
      ...prev,
      [id]: prev[id]?.map(m =>
        m.fromSelf && m.status === "delivered"
          ? { ...m, status: "seen" }
          : m
      ),
    }));
  }

  function sendMessage(text) {
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const newMessage = {
      id: Date.now(),
      fromSelf: true,
      text,
      time,
      status: "sent",
    };

    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), newMessage],
    }));

    setConversations(prev =>
      prev.map(c =>
        c.id === activeId
          ? { ...c, lastMessage: text, lastTime: time, unread: 0 }
          : c
      )
    );

    // Simulate delivery
    setTimeout(() => {
      setMessages(prev => ({
        ...prev,
        [activeId]: prev[activeId].map(m =>
          m.id === newMessage.id
            ? { ...m, status: "delivered" }
            : m
        ),
      }));
    }, 600);
  }

  /* -------------------------------
     Render
  -------------------------------- */
  return (
    <div className="chat-app">
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

      <section className="main">
        <ConversationHeader conversation={activeConversation} />

        <MessageFeed
          messages={activeMessages}
          unreadStartId={unreadStartId}
        />

        <MessageInput onSend={sendMessage} />
      </section>
    </div>
  );
}
