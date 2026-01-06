import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import { deleteMessage } from "../api/messages.js";

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
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [pendingDelete, setPendingDelete] = useState(null); // message object pending confirmation

  // Clear deleting state when server marks message deleted
  useEffect(() => {
    if (!messages || !messages.length) return;

    setDeletingIds(prev => {
      const copy = new Set(prev);
      let changed = false;

      for (const m of messages) {
        if (m.deleted && copy.has(String(m.id))) {
          copy.delete(String(m.id));
          changed = true;
        }
      }

      return changed ? copy : prev;
    });
  }, [messages]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;

    setPendingDelete(null);
    // mark as deleting to disable button / show loader until server responds
    setDeletingIds(prev => new Set(prev).add(String(id)));

    try {
      await deleteMessage({ conversationId: activeId, messageId: id });
      // wait for server `message:deleted` event to update UI; we remove the deleting flag below
    } catch (err) {
      // rollback deleting flag
      setDeletingIds(prev => {
        const copy = new Set(prev);
        copy.delete(String(id));
        return copy;
      });
      alert("Failed to delete message: " + (err.message || err));
    }
  }, [activeId, pendingDelete]);

  const handleDeleteCancel = useCallback(() => {
    setPendingDelete(null);
  }, []);
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
              {(() => {
                const isDeleted = !!m.deleted;
                return (
                  <>
                    <span className={isDeleted ? "deleted" : ""}>
                      {m.text}
                    </span>

                    <div className="message-meta">
                      <span className="time">{m.time}</span>
                      {m.fromSelf && !isDeleted && (
                        <span className={`ticks ${m.status ?? "sent"}`}>
                          ✓✓
                        </span>
                      )}

                      {m.fromSelf && !isDeleted && (
                        (() => {
                          const idStr = String(m.id);
                          const isDeleting = deletingIds.has(idStr);
                          return (
                            <button
                              className={`btn-delete ${isDeleting ? 'loading' : ''}`}
                              onClick={() => setPendingDelete(m)}
                              aria-label="Delete message"
                              title="Delete message"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <span className="loader" aria-hidden></span>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                  <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </button>
                          );
                        })()
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      ))}

      {pendingDelete && (
        <div className="delete-modal-overlay">
          <div className="delete-modal" role="dialog" aria-modal="true">
            <div className="delete-modal-title">Delete message</div>
            <div className="delete-modal-body">Are you sure you want to delete this message?</div>
            <div className="delete-modal-preview">"{pendingDelete.text}"</div>
            <div className="delete-modal-actions">
              <button className="btn btn-cancel" onClick={handleDeleteCancel}>Cancel</button>
              <button className="btn btn-confirm" onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
