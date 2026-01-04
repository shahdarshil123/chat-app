import { useRef } from "react";
import {
  addToOutbox,
  getOutboxMessages,
  removeFromOutbox,
} from "../db/outbox.js";

/**
 * Manages offline message queue + retry logic
 */
export function useOutbox({
  sendMessagePayload,
  onMessageSent,
}) {
  const flushingRef = useRef(false);
  const sendingRef = useRef(Promise.resolve());

  function enqueue(task) {
    sendingRef.current = sendingRef.current
      .then(task)
      .catch(() => {});
    return sendingRef.current;
  }

  async function queueMessage(message) {
    await addToOutbox(message);
  }

  async function flushOutbox() {
    if (flushingRef.current) return;
    flushingRef.current = true;

    try {
      const queued = (await getOutboxMessages()).sort(
        (a, b) => a.createdAt - b.createdAt
      );

      for (const msg of queued) {
        const res = await enqueue(() =>
          sendMessagePayload({
            conversationId: msg.conversationId,
            content: msg.content,
          })
        );

        if (res?.ok) {
          await removeFromOutbox(msg.id);
          onMessageSent?.(msg);
        }
      }
    } finally {
      flushingRef.current = false;
    }
  }

  return {
    queueMessage,
    flushOutbox,
  };
}
