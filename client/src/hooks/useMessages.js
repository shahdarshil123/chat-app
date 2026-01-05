import { useState, useMemo } from "react";
import { createMessageStrategy } from "../strategies/messageStrategy.factory.js";

export function useMessages({
  activeId,
  apiVersion,
  fetchMessages,
  mapMessage,
}) {
  const [messages, setMessages] = useState({});
  const [pagination, setPagination] = useState({});

  /* ----------------------------------
     Strategy (runtime selection)
  ---------------------------------- */
  const strategy = useMemo(
    () =>
      createMessageStrategy({
        version: apiVersion,
        fetchMessages,
      }),
    [apiVersion, fetchMessages]
  );

  /* ----------------------------------
     Load initial messages
  ---------------------------------- */
  async function loadInitialMessages(conversationId) {
    if (!conversationId) return;

    const result = await strategy.fetchInitial({
      conversationId,
    });

    setMessages(prev => ({
      ...prev,
      [conversationId]: result.messages.map(mapMessage),
    }));

    // v1 → no pagination state
    if (result.oldestCursor === undefined) return;

    // v2+ → reset pagination
    setPagination(prev => ({
      ...prev,
      [conversationId]: {
        hasMore: result.hasMore,
        oldestCursor: result.oldestCursor,
        loading: false,
      },
    }));
  }

  /* ----------------------------------
     Load older messages (pagination)
  ---------------------------------- */
  async function loadOlderMessages() {
    const page = pagination[activeId];
    if (!page || !page.hasMore || page.loading) return;

    setPagination(prev => ({
      ...prev,
      [activeId]: { ...prev[activeId], loading: true },
    }));

    const result = await strategy.fetchOlder({
      conversationId: activeId,
      cursor: page.oldestCursor,
    });

    if (!result.messages.length) {
      setPagination(prev => ({
        ...prev,
        [activeId]: {
          ...prev[activeId],
          hasMore: false,
          loading: false,
        },
      }));
      return;
    }

    setMessages(prev => ({
      ...prev,
      [activeId]: [
        ...result.messages.map(mapMessage),
        ...(prev[activeId] || []),
      ],
    }));

    setPagination(prev => ({
      ...prev,
      [activeId]: {
        hasMore: result.hasMore,
        oldestCursor: result.oldestCursor,
        loading: false,
      },
    }));
  }

  /* ----------------------------------
     Fetch missed messages (reconnect)
  ---------------------------------- */
  async function fetchMissedMessages(conversationId) {
    const existing = messages[conversationId];
    if (!existing || !existing.length) return;

    const last = existing[existing.length - 1];

    const result = await strategy.fetchMissed({
      conversationId,
      after: last.createdAt,
    });

    if (!result.messages.length) return;

    setMessages(prev => ({
      ...prev,
      [conversationId]: [
        ...prev[conversationId],
        ...result.messages.map(mapMessage),
      ],
    }));
  }

  return {
    messages,
    pagination,
    loadInitialMessages,
    loadOlderMessages,
    fetchMissedMessages,
    setMessages, // still exposed for socket usage
  };
}
