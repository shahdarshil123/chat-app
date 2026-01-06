import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import ConversationList from "./ConversationList.jsx";
import ConversationHeader from "./ConversationHeader.jsx";
import MessageFeed from "./MessageFeed.jsx";
import MessageInput from "./MessageInput.jsx";

import { fetchMessages } from "../api/messages.js";
import { connectSocket } from "../socket.js";
import { addToOutbox, getOutboxMessages, removeFromOutbox } from "../db/outbox.js";

import { MESSAGE_API_VERSION_ENUM, AUTH_API_VERSION_ENUM, USER_API_VERSION_ENUM, CONVERSATION_API_VERSION_ENUM } from "../constants/apiVersions.js";
import { MESSAGE_API_VERSION, CONVERSATION_API_VERSION, AUTH_API_VERSION, USER_API_VERSION } from "../config.js";

import { useMessages } from "../hooks/useMessages.js";
import { useChatSocket } from "../hooks/useChatSocket.js";
import { useOutbox } from "../hooks/useOutbox.js";
import { useConversations } from "../hooks/useConversations.js";

/* ================================
   Chat Layout
================================ */
export default function ChatLayout({ currentUser, onLogout }) {
  ;
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
      text: m.deleted || m.deletedAt ? "This message was deleted" : m.content,
      deleted: !!(m.deleted || m.deletedAt),
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
    onMessageSent: (queued, saved) => {
      const payload = saved?.message || saved;
      const mapped = payload ? mapMessage(payload) : null;
      setMessages(prev => {
        const key = String(queued.conversationId);
        const arr = prev[key] || [];
        const next = arr.map(m =>
          m.id === queued.id ? (mapped ? mapped : { ...m, status: "sent" }) : m
        );
        return { ...prev, [key]: next };
      });
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
        const lastMsg = item.lastMessage;

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
          lastMessage: lastMsg ? (lastMsg.deleted || lastMsg.deletedAt ? "This message was deleted" : lastMsg.content) : "",
          lastTime: lastMsg
            ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : "",
          unread: item.unreadCount,
          lastReadAt: item.lastReadAt, // backend read timestamp
          updatedAt: conv.updatedAt,
        };
      });

      setConversations(mapped);

      // if (mapped.length) {
      //   setActiveId(mapped[0].id);
      // }
    }

    loadConversations();
  }, [CURRENT_USER_ID, setConversations]);



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
  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return tb - ta;
    });
  }, [conversations]);

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
      .catch(() => { }); // prevent chain break

    return sendingRef.current;
  }

  async function sendMessage(text) {
    if (!text.trim() || !activeId) return;

    // ----------  Create optimistic message ----------
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

    // ----------  Optimistic chat update ----------
    setMessages(prev => ({
      ...prev,
      [activeId]: [...(prev[activeId] || []), tempMessage],
    }));

    setConversations(prev => {
      const convo = prev.find(c => c.id === activeId);
      if (!convo) return prev;

      const updated = {
        ...convo,
        lastMessage: text,
        lastTime: time,
        unread: 0,
        updatedAt: new Date(now).toISOString(),
      };

      return [
        updated,
        ...prev.filter(c => c.id !== activeId),
      ];
    });;

    try {
      // ----------  Try sending to server ----------
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

      // ---------- 6️⃣ Replace optimistic message with server-saved message ----------
      const payload = saved?.message || saved;
      const mappedSaved = payload ? mapMessage(payload) : null;
      // ensure server time if provided
      if (mappedSaved) mappedSaved.time = serverTime;

      setMessages(prev => ({
        ...prev,
        [activeId]: prev[activeId].map(m =>
          m.id === tempMessage.id ? mappedSaved : m
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
          onLoadOlder={loadOlderMessages}
        />

        <MessageInput onSend={sendMessage} />
      </section>
    </div>
  );
}
