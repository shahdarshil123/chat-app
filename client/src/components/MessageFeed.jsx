import { useEffect, useRef } from "react";

export default function MessageFeed({ messages = [], unreadStartId }) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);

  // Auto-scroll ONLY when new messages arrive at the bottom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight -
        container.scrollTop -
        container.clientHeight <
      80; // px threshold

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]); // 🔑 depend on entire array, not length

  return (
    <div className="messages" ref={containerRef}>
      {messages.map(m => (
        <div key={m.id}>
          {unreadStartId === m.id && (
            <div className="unread-divider">Unread messages</div>
          )}

          <div
            className={`message-row ${m.fromSelf ? "self" : "other"}`}
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

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
