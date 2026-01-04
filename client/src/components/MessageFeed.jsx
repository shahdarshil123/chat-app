import { useEffect, useLayoutEffect, useRef } from "react";

export default function MessageFeed({
  messages = [],
  unreadStartId,
  activeId,
  onLoadOlder,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // Track previous conversation
  const prevConversationRef = useRef(null);

  // Track message count (append vs prepend)
  const prevMessageCountRef = useRef(0);

  // Track if we scrolled after THIS activation
  const didInitialScrollRef = useRef(false);

  // 🔑 Track height before PREPEND
  const prevScrollHeightRef = useRef(null);

  /* =====================================================
     1️⃣ Reset initial-scroll flag when conversation changes
     ===================================================== */
  useEffect(() => {
    if (prevConversationRef.current !== activeId) {
      didInitialScrollRef.current = false;
      prevConversationRef.current = activeId;
      prevMessageCountRef.current = 0;
      prevScrollHeightRef.current = null;
    }
  }, [activeId]);

  /* =====================================================
     2️⃣ Scroll to bottom when messages first appear
     ===================================================== */
  useLayoutEffect(() => {
    if (!activeId) return;
    if (!messages.length) return;
    if (didInitialScrollRef.current) return;

    requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    });

    didInitialScrollRef.current = true;
    prevMessageCountRef.current = messages.length;
  }, [activeId, messages]);

  /* =====================================================
     3️⃣ Restore scroll after PREPEND
     ===================================================== */
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current !== null) {
      container.scrollTop =
        container.scrollHeight -
        prevScrollHeightRef.current;

      prevScrollHeightRef.current = null;
    }
  }, [messages]);

  /* =====================================================
     3️⃣ Auto-scroll ONLY when messages are appended
     ===================================================== */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prevCount = prevMessageCountRef.current;
    const currCount = messages.length;

    const appended = currCount > prevCount &&
      prevScrollHeightRef.current === null;

    if (appended) {
      const isNearBottom =
        container.scrollHeight -
          container.scrollTop -
          container.clientHeight < 80;

      if (isNearBottom) {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }

    prevMessageCountRef.current = currCount;
  }, [messages]);

  /* =====================================================
     4️⃣ Scroll-up pagination trigger
     ===================================================== */
  function handleScroll(e) {
    if (e.target.scrollTop === 0) {
      prevScrollHeightRef.current = e.target.scrollHeight;
      onLoadOlder?.();
    }
  }

  /* =====================================================
     5️⃣ Render
     ===================================================== */
  return (
    <div
      className="messages"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {messages.map(m => (
        <div key={m.id}>
          {unreadStartId === m.id && (
            <div className="unread-divider">
              Unread messages
            </div>
          )}

          <div
            className={`message-row ${
              m.fromSelf ? "self" : "other"
            }`}
          >
            <div className="message">
              <span>{m.text}</span>

              <div className="message-meta">
                <span className="time">{m.time}</span>
                {m.fromSelf && (
                  <span className={`ticks ${m.status ?? "sent"}`}>
                    ✓✓
                  </span>
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
