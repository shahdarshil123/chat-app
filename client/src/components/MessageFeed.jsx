import { Fragment, useEffect, useRef } from "react";

/**
 * Props:
 * - messages: Array of message objects
 *   {
 *     id,
 *     fromSelf: boolean,
 *     text,
 *     time,
 *     status?: "sent" | "delivered" | "seen"
 *   }
 *
 * - unreadStartId: message id where unread messages start (optional)
 */
export default function MessageFeed({ messages = [], unreadStartId = null }) {
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!messages.length) {
    return (
      <div className="messages">
        <div style={{ color: "#6b7280" }}>No messages yet</div>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((m) => (
        <Fragment key={m.id}>
          {/* Unread divider */}
          {unreadStartId === m.id && (
            <div className="unread-divider">Unread messages</div>
          )}

          {/* Message row */}
          <div
            className={`message-row ${
              m.fromSelf ? "self" : "other"
            }`}
          >
            <div className="message">
              <span>{m.text}</span>

              <div className="message-meta">
                <span className="time">{m.time}</span>

                {/* Two-tick indicator for self messages */}
                {m.fromSelf && (
                  <span
                    className={`ticks ${
                      m.status ? m.status : "sent"
                    }`}
                  >
                    ✓✓
                  </span>
                )}
              </div>
            </div>
          </div>
        </Fragment>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}
