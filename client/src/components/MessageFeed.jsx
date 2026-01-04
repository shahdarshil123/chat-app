import { useEffect, useLayoutEffect, useRef } from "react";

export default function MessageFeed({ messages = [], unreadStartId, activeId }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // Track previous conversation + messages reference
  const prevConversationRef = useRef(null);
  const prevMessagesRef = useRef(null);

  const isConversationChanged =
    prevConversationRef.current !== activeId;

  const isMessageDatasetReplaced =
    prevMessagesRef.current !== messages;

  // 1️⃣ Detect conversation switch OR message dataset replacement
  const shouldForceScroll =
    isConversationChanged || isMessageDatasetReplaced;;

  // 2️⃣ After render, force scroll once
  useLayoutEffect(() => {
    if (!activeId) return;
    if (!shouldForceScroll) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    });

    prevConversationRef.current = activeId;
    prevMessagesRef.current = messages;
  }, [activeId, messages, shouldForceScroll]);

  // 3️⃣ Smart auto-scroll for new messages (same conversation)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight < 80;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

function handleScroll(e) {
    const el = e.target;

    if (el.scrollTop === 0) {
      onLoadOlder?.();
    }
  }
  
  return (
    <div className="messages" ref={containerRef} onScroll={handleScroll}>
      {messages.map(m => (
        <div key={m.id}>
          {unreadStartId === m.id && (
            <div className="unread-divider">anUnread messages</div>
          )}

          <div className={`message-row ${m.fromSelf ? "self" : "other"}`}>
            <div className="message">
              <span>{m.text}</span>

              <div className="message-meta">
                <span className="time">{m.time}</span>
                {m.fromSelf && (
                  <span className={`ticks ${m.status ?? "sent"}`}>✓✓</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
