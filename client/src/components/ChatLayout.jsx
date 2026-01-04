import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ConversationList from "./ConversationList.jsx";
import ConversationHeader from "./ConversationHeader.jsx";
import MessageFeed from "./MessageFeed.jsx";
import MessageInput from "./MessageInput.jsx";

import { fetchMessages } from "../api/messages.js";
import { connectSocket} from "../socket.js";
import { addToOutbox, getOutboxMessages, removeFromOutbox } from "../db/outbox.js";

import { MESSAGE_API_VERSION_ENUM, AUTH_API_VERSION_ENUM, USER_API_VERSION_ENUM, CONVERSATION_API_VERSION_ENUM } from "../constants/apiVersions.js";
import { MESSAGE_API_VERSION, CONVERSATION_API_VERSION, AUTH_API_VERSION, USER_API_VERSION } from "../config.js";

import {useMessages} from "../hooks/useMessages.js";
import { useChatSocket } from "../hooks/useChatSocket.js";
import { useOutbox } from "../hooks/useOutbox.js";
import { useConversations } from "../hooks/useConversations.js";

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

  // const [conversations, setConversations] = useState([]);
  // const [messages, setMessages] = useState({});
  // const [pagination, setPagination] = useState({});
  const [activeId, setActiveId] = useState(null); // Active conversation id
  const [search, setSearch] = useState("");
  // const [unreadBoundary, setUnreadBoundary] = useState({});

  const [onlineUsers, setOnlineUsers] = useState(new Set());



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

  const {
  conversations,
  setConversations,
  unreadBoundary,
  setUnreadBoundary,
  markAsRead,
} = useConversations({
  currentUserId: CURRENT_USER_ID,
  apiVersion: CONVERSATION_API_VERSION,
});

   const {
    messages,
    pagination,
    loadInitialMessages,
    loadOlderMessages,
    fetchMissedMessages,
    setMessages,
  } = useMessages({
    activeId,
    apiVersion: MESSAGE_API_VERSION,
    fetchMessages,
    mapMessage,
  });

  async function sendMessagePayload({ conversationId, content }) {
    console.log("➡️ Sending to server:", {
      conversationId,
      content,
    });

    const res = await fetch(
      `http://localhost:4000/api/${MESSAGE_API_VERSION}/message/${conversationId}/messages`,
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

   /* =====================================
     Outbox (online-first)
  ===================================== */
  const { queueMessage, flushOutbox } = useOutbox({
    sendMessagePayload,
    onMessageSent: msg => {
      setMessages(prev => ({
        ...prev,
        [msg.conversationId]: prev[msg.conversationId].map(m =>
          m.id === msg.id ? { ...m, status: "sent" } : m
        ),
      }));
    },
  });

/* =====================================
     Socket
  ===================================== */

    const socket = useMemo(
    () => (CURRENT_USER_ID ? connectSocket(CURRENT_USER_ID) : null),
    [CURRENT_USER_ID]
  );

  const handleReconnect = useCallback(async () => {
    await flushOutbox();
    if (activeId) {
      fetchMissedMessages(activeId);
    }
  }, [flushOutbox, activeId, fetchMissedMessages]);

useChatSocket({
  socket,
  activeId,
  currentUserId: CURRENT_USER_ID,
  setMessages,
  setConversations,
  setOnlineUsers,
  mapMessage,
  onReconnect: handleReconnect,
});


  /* ================================
     Load Conversations
  ================================ */
  useEffect(() => {
    async function loadConversations() {
      const res = await fetch(
        `http://localhost:4000/api/${CONVERSATION_API_VERSION}/conversation/${CURRENT_USER_ID}`, { credentials: "include" }
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
  }, [CURRENT_USER_ID]);



  /* ================================
     Load Messages (per conversation)
  ================================ */


// async function loadInitialMessages(conversationId){
//   if(!conversationId) return;

//   if(messages[conversationId]) return;

//   if(MESSAGE_API_VERSION === MESSAGE_API_VERSION_ENUM.V1){
//      // 🔹 V1: load ALL messages at once
//     const res = await fetch(
//       `http://localhost:4000/api/${MESSAGE_API_VERSION}/message/${conversationId}/messages`,
//       { credentials: "include" }
//     );

//     const data = await res.json();

//     setMessages(prev => ({
//       ...prev,
//       [conversationId]: data.messages.map(mapMessage),
//     }));

//     // ❌ no pagination state
//     setPagination(prev => ({
//       ...prev,
//       [conversationId]: { hasMore: false },
//     }));

//     return;
//   }

//   // v2: cursor based pagination
//   setPagination(prev =>({
//     ...prev,
//     [conversationId]: {loading: true},
//   }));

//   const data = await fetchMessages({
//     conversationId,
//     limit: 20,
//     version: MESSAGE_API_VERSION,
//   });

//   setMessages(prev=>({
//     ...prev,
//     [conversationId]: data.messages.map(mapMessage),
//   }));

//   setPagination(prev => ({
//     ...prev,
//     [conversationId]:{
//       hasMore: data.hasMore,
//       oldestCursor: data.oldestCursor,
//       loading: false,
//     },
//   }));

// }


// async function loadOlderMessages() {
//   if (MESSAGE_API_VERSION === MESSAGE_API_VERSION_ENUM.V1) return;

//   const page = pagination[activeId];
//   if (!page || !page.hasMore || page.loading) return;

//   const container = document.querySelector(".messages");
//   const prevHeight = container.scrollHeight;

//   setPagination(prev => ({
//     ...prev,
//     [activeId]: { ...prev[activeId], loading: true },
//   }));

//   console.log(`Next Page: messages fetching...`);
//   const data = await fetchMessages({
//     conversationId: activeId,
//     limit: 20,
//     before: page.oldestCursor,
//     version: MESSAGE_API_VERSION,
//   });

//   setMessages(prev => ({
//     ...prev,
//     [activeId]: [...data.messages.map(mapMessage), ...prev[activeId]],
//   }));

//   setPagination(prev => ({
//     ...prev,
//     [activeId]: {
//       hasMore: data.hasMore,
//       oldestCursor: data.oldestCursor,
//       loading: false,
//     },
//   }));

//   // 🔑 preserve scroll position
//   requestAnimationFrame(() => {
//     container.scrollTop = container.scrollHeight - prevHeight;
//   });
// }


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
        `http://localhost:4000/api/${CONVERSATION_API_VERSION}/conversation/${activeId}/read`,
        { method: "POST", credentials: "include" }
      );
    }, 300); // small delay ensures render completed

    return () => clearTimeout(timeout);
  }, [activeId]);



  async function selectConversation(id) {
    setActiveId(id);
    await loadInitialMessages(id);

    const convo = conversations.find(c => c.id === id);
    if (convo?.lastReadAt) {
      setUnreadBoundary(prev => ({ ...prev, [id]: convo.lastReadAt }));
    }

    await markAsRead(id);
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
  // await addToOutbox({
  //   id: tempMessage.id,
  //   conversationId: activeId,
  //   content: text,
  //   createdAt: now,
  // });

  try {
    // ---------- 5️⃣ Try sending to server ----------
   const res = await sendMessagePayload({
      conversationId: activeId,
      content: text,
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
    //await removeFromOutbox(tempMessage.id);
  } catch {
    await queueMessage({
      id: tempMessage.id,
      conversationId: activeId,
      content: text,
      createdAt: now,
    });
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
