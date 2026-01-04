import { useEffect, useMemo, useState, useRef } from "react";
import ConversationList from "./ConversationList";
import ConversationHeader from "./ConversationHeader";
import MessageFeed from "./MessageFeed";
import MessageInput from "./MessageInput";

import { fetchMessages } from "../api/messages";
import { connectSocket} from "../socket";
import { addToOutbox, getOutboxMessages, removeFromOutbox } from "../db/outbox.js";

import { MESSAGE_API_VERSION_ENUM } from "../constants/apiVersions.js";
import { MESSAGE_API_VERSION } from "../config.js";

/* ================================
   Temporary Logged-in User
================================ */
// const CURRENT_USER_ID = 2;

/* ================================
   Chat Layout
================================ */
export default function ChatLayout({ currentUser, onLogout }) {
  // const MESSAGE_API_VERSION = import.meta.env.VITE_MESSAGE_API_VERSION;
  console.log("Message API version:", MESSAGE_API_VERSION);
  const CURRENT_USER_ID = currentUser.id;

  // const chatContainerRef = useRef(null);
  const flushingRef = useRef(false);
  const sendingRef = useRef(Promise.resolve());

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [pagination, setPagination] = useState({});
  const [activeId, setActiveId] = useState(null); // Active conversation id
  const [search, setSearch] = useState("");
  const [unreadBoundary, setUnreadBoundary] = useState({});

  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const socket = useMemo(
    () => (CURRENT_USER_ID ? connectSocket(CURRENT_USER_ID) : null),
    [CURRENT_USER_ID]
  );

  //   useEffect(() => {
  //   flushOutbox();
  // }, []);

  /* ================================
     Helpers
  ================================ */
  function mapMessage(m) {
    return {
      id: m.id,
      fromSelf: m.senderId === CURRENT_USER_ID,
      text: m.content,
      createdAt: m.createdAt,
      time: new Date(m.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: m.senderId === CURRENT_USER_ID ? "sent" : undefined,
    };
  }

  async function fetchMissedMessages(conversationId) {
  const existing = messages[conversationId];
  if (!existing || existing.length === 0) return;

  const lastMessage = existing[existing.length - 1];

  const data = await fetchMessages({
    conversationId,
    after: lastMessage.createdAt,
    version: MESSAGE_API_VERSION,
  });

  if (!data.messages.length) return;

  setMessages(prev => ({
    ...prev,
    [conversationId]: [
      ...prev[conversationId],
      ...data.messages.map(mapMessage),
    ],
  }));
}

  const handleMessage = (msg) => {
    // ❌ Ignore messages sent by myself
    if (msg.senderId === CURRENT_USER_ID) return;

    setMessages(prev => {
      const cid = String(msg.conversationId);
      const existing = prev[cid] || [];

      if (existing.some(m => m.id === msg.id)) return prev;

      return {
        ...prev,
        [cid]: [...existing, {
          id: msg.id,
          fromSelf: false,
          text: msg.content,
          createdAt: msg.createdAt,
          time: new Date(msg.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }],
      };
    });

    // update sidebar preview
    setConversations(prev =>
      prev.map(c =>
        c.id === String(msg.conversationId)
          ? {
            ...c,
            lastMessage: msg.content,
            lastTime: new Date(msg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            unread:
              c.id === activeId ? 0 : (c.unread || 0) + 1,
          }
          : c
      )
    );
  }

  async function flushOutbox() {
  if (flushingRef.current) return;
  flushingRef.current = true;

  try {
    const queued = (await getOutboxMessages())
      .sort((a, b) => a.createdAt - b.createdAt);

    for (const msg of queued) {
      const res = await enqueueSend(async () => {
         return await sendMessagePayload({
          conversationId: msg.conversationId,
          content: msg.content,
        });
      });

        if (res.ok) {
          await removeFromOutbox(msg.id);

          setMessages(prev => ({
            ...prev,
            [msg.conversationId]: prev[msg.conversationId].map(m =>
              m.id === msg.id ? { ...m, status: "sent" } : m
            ),
          }));
        }
    }
  } finally {
    flushingRef.current = false;
  }
}


  const handleOnline = (users) => {
    console.log("users:online received:", users);
    setOnlineUsers(new Set(users));
  }

  useEffect(() => {
    if (!socket) return;

    const onConnect = async () => {
      console.log("Socket reconnected → flushing outbox");
      await flushOutbox();

    //loadMessages();
    if (activeId) {
      await fetchMissedMessages(activeId);
    }

    }

    socket.on("users:online", handleOnline);

    socket.on("message:new", handleMessage);

    socket.on("connect", onConnect);
    // window.addEventListener("online", flushOutbox);

    return () => {
      socket.off("users:online", handleOnline);
      socket.off("message:new", handleMessage);
      socket.off("connect", onConnect);
    }

  }, [socket]);



  /* ================================
     Load Conversations
  ================================ */
  useEffect(() => {
    async function loadConversations() {
      const res = await fetch(
        `http://localhost:4000/api/conversation/${CURRENT_USER_ID}`, { credentials: "include" }
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
          title = !(displayName === null || displayName === undefined) ? displayName : "Unknown";
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

      // if (mapped.length) {
      //   setActiveId(mapped[0].id);
      // }
    }

    loadConversations();
  }, []);



  /* ================================
     Load Messages (per conversation)
  ================================ */


async function loadInitialMessages(conversationId){
  if(!conversationId) return;

  if(messages[conversationId]) return;

  if(MESSAGE_API_VERSION === MESSAGE_API_VERSION_ENUM.V1){
     // 🔹 V1: load ALL messages at once
    const res = await fetch(
      `http://localhost:4000/api/v1/message/${conversationId}/messages`,
      { credentials: "include" }
    );

    const data = await res.json();

    setMessages(prev => ({
      ...prev,
      [conversationId]: data.messages.map(mapMessage),
    }));

    // ❌ no pagination state
    setPagination(prev => ({
      ...prev,
      [conversationId]: { hasMore: false },
    }));

    return;
  }

  // v2: cursor based pagination
  setPagination(prev =>({
    ...prev,
    [conversationId]: {loading: true},
  }));

  const data = await fetchMessages({
    conversationId,
    limit: 20,
    version: MESSAGE_API_VERSION,
  });

  setMessages(prev=>({
    ...prev,
    [conversationId]: data.messages.map(mapMessage),
  }));

  setPagination(prev => ({
    ...prev,
    [conversationId]:{
      hasMore: data.hasMore,
      oldestCursor: data.oldestCursor,
      loading: false,
    },
  }));

}


async function loadOlderMessages() {
  if (MESSAGE_API_VERSION === MESSAGE_API_VERSION_ENUM.V1) return;

  const page = pagination[activeId];
  if (!page || !page.hasMore || page.loading) return;

  const container = document.querySelector(".messages");
  const prevHeight = container.scrollHeight;

  setPagination(prev => ({
    ...prev,
    [activeId]: { ...prev[activeId], loading: true },
  }));

  console.log(`Next Page: messages fetching...`);
  const data = await fetchMessages({
    conversationId: activeId,
    limit: 20,
    before: page.oldestCursor,
    version: MESSAGE_API_VERSION,
  });

  setMessages(prev => ({
    ...prev,
    [activeId]: [...data.messages.map(mapMessage), ...prev[activeId]],
  }));

  setPagination(prev => ({
    ...prev,
    [activeId]: {
      hasMore: data.hasMore,
      oldestCursor: data.oldestCursor,
      loading: false,
    },
  }));

  // 🔑 preserve scroll position
  requestAnimationFrame(() => {
    container.scrollTop = container.scrollHeight - prevHeight;
  });
}


  // async function loadMessages() {
  //     const res = await fetch(
  //       `http://localhost:4000/api/message/${activeId}/messages`, { credentials: "include" }
  //     );
  //     const json = await res.json();

  //     const mapped = json.messages.map(m => ({
  //       id: m.id,
  //       fromSelf: m.senderId === CURRENT_USER_ID,
  //       text: m.content,
  //       time: new Date(m.createdAt).toLocaleTimeString([], {
  //         hour: "2-digit",
  //         minute: "2-digit",
  //       }),
  //       status: m.senderId === CURRENT_USER_ID ? "delivered" : undefined,
  //       createdAt: m.createdAt,
  //       sender: {
  //         id: m.sender.id,
  //         name: m.sender.displayName,
  //         avatar: m.sender.avatarUrl,
  //       },
  //     }));

  //     // 🔑 REPLACE messages for this conversation
  //     setMessages(prev => ({
  //       ...prev,
  //       [activeId]: mapped,
  //     }));
  //   }

  // useEffect(() => {
  //   if (!activeId) return;
  //   loadMessages();
  // }, [activeId]);

  useEffect(() => {
    if (!activeId) return;

    // once messages are rendered, mark as read
    const timeout = setTimeout(async () => {
      const now = new Date().toISOString();

      setConversations(prev =>
        prev.map(c =>
          c.id === activeId
            ? { ...c, unread: 0, lastReadAt: now }
            : c
        )
      );

      await fetch(
        `http://localhost:4000/api/conversation/${activeId}/read`,
        { method: "POST", credentials: "include" }
      );
    }, 300); // small delay ensures render completed

    return () => clearTimeout(timeout);
  }, [activeId]);

  async function selectConversation(id) {
    setActiveId(id);
    loadInitialMessages(id);

    const convo = conversations.find(c => c.id === id);
    if (convo?.lastReadAt) {
      setUnreadBoundary(prev => ({ ...prev, [id]: convo.lastReadAt }));
    }

    await fetch(
      `http://localhost:4000/api/conversation/${id}/read`,
      { method: "POST", credentials: "include" }
    );
  }

  /* ================================
     Derived State
  ================================ */
  let activeConversation = useMemo(
    () => conversations.find(c => c.id === activeId),
    [conversations, activeId]
  );

  const activeMessages = messages[activeId] || [];

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, conversations]);


  /* ================================
     Unread Divider Logic
     (incoming only, backend-driven)
  ================================ */
  const unreadStartId = useMemo(() => {
    const boundary = unreadBoundary[activeId];
    if (!boundary) return null;

    const boundaryTime = new Date(boundary).getTime();

    return activeMessages.find(
      m =>
        !m.fromSelf &&
        new Date(m.createdAt).getTime() > boundaryTime
    )?.id ?? null;
  }, [activeId, activeMessages, unreadBoundary]);


  /* ================================
     Actions
  ================================ */
  // async function selectConversation(id) {
  //   setActiveId(id);

  //   const convo = conversations.find(c => c.id === id);
  //   if (convo?.lastReadAt) {
  //     setUnreadBoundary(prev => ({
  //       ...prev,
  //       [id]: convo.lastReadAt, // 🔒 freeze boundary
  //     }));
  //   }

  //   // Optimistically mark conversation as read in UI
  //   const now = new Date().toISOString();
  //   setConversations(prev =>
  //     prev.map(c =>
  //       c.id === id
  //         ? {
  //           ...c,
  //           unread: 0,
  //           // lastReadAt: now,
  //         }
  //         : c
  //     )
  //   );

  //   const res = await fetch(
  //     `http://localhost:4000/api/conversation/${activeId}/read`,
  //     {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       credentials: "include",
  //       // body: JSON.stringify({
  //       //   conversationId: activeId,
  //       //   userId: CURRENT_USER_ID,
  //       // }),
  //     }
  //   );

  //   const message = await res.json();

  //   console.log(message);

  // }

  async function sendMessagePayload({ conversationId, content }) {
    console.log("➡️ Sending to server:", {
      conversationId,
      content,
    });

    const res = await fetch(
      `http://localhost:4000/api/message/${conversationId}/messages`,
      {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content }),
      }
    );

    console.log("⬅️ Server response status:", res.status);

    return res;
  }

  function enqueueSend(task) {
  sendingRef.current = sendingRef.current
    .then(task)
    .catch(() => {}); // prevent chain break

  return sendingRef.current;
  }

async function sendMessage(text) {
  if (!text.trim() || !activeId) return;

  // ---------- 1️⃣ Create optimistic message ----------
  const now = Date.now();
  const time = new Date(now).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const tempMessage = {
    id: crypto.randomUUID(),
    conversationId: activeId,
    text,
    createdAt: now,
    time,               // ✅ ALWAYS present
    fromSelf: true,
    status: "pending",  // pending | sent
  };

  // ---------- 2️⃣ Optimistic chat update ----------
  setMessages(prev => ({
    ...prev,
    [activeId]: [...(prev[activeId] || []), tempMessage],
  }));

  // ---------- 3️⃣ Optimistic SIDEBAR update ----------
  setConversations(prev =>
    prev.map(c =>
      c.id === activeId
        ? {
            ...c,
            lastMessage: text,
            lastTime: time,
            unread: 0,
          }
        : c
    )
  );

  // ---------- 4️⃣ Store ONCE in IndexedDB ----------
  await addToOutbox({
    id: tempMessage.id,
    conversationId: activeId,
    content: text,
    createdAt: now,
  });

  try {
    // ---------- 5️⃣ Try sending to server ----------
    const res = await enqueueSend(async () => {
  return await sendMessagePayload({
    conversationId: activeId,
    content: text,
  });
});

if (!res.ok) throw new Error("Send failed");

    const saved = await res.json();

    const serverTime = saved.createdAt
      ? new Date(saved.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : time;

    // ---------- 6️⃣ Update SAME message → sent ----------
    setMessages(prev => ({
      ...prev,
      [activeId]: prev[activeId].map(m =>
        m.id === tempMessage.id
          ? { ...m, status: "sent", time: serverTime }
          : m
      ),
    }));

    // ---------- 7️⃣ Remove from IndexedDB ----------
    await removeFromOutbox(tempMessage.id);
  } catch {
    // ❌ DO NOTHING
    // Message remains:
    // - visible in UI
    // - status = pending
    // - stored in IndexedDB
    // - will be sent by flushOutbox()
  }
}



  // function dedupeMessages(list) {
  //   const unique = Array.from(new Map(list.map(m => [m.id, m])).values());

  //   // Sort by creation time so temporary ids don't break ordering
  //   unique.sort((a, b) => {
  //     const ta = new Date(a.createdAt).getTime();
  //     const tb = new Date(b.createdAt).getTime();
  //     return ta - tb;
  //   });

  //   return unique;
  // }

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
          messages={messages}
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
          currentUserId={CURRENT_USER_ID} />

        <MessageFeed
          messages={activeMessages}
          unreadStartId={unreadStartId}
          activeId={activeId}
          onLoadOlder ={loadOlderMessages}
        />

        <MessageInput onSend={sendMessage} />
      </section>
    </div>
  );
}
