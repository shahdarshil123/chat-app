import { useState } from "react";
import { MESSAGE_API_VERSION_ENUM } from "../constants/apiVersions.js";

export function useMessages({
  activeId,
  apiVersion,
  fetchMessages,
  mapMessage,
}) {
  const [messages, setMessages] = useState({});
  const [pagination, setPagination] = useState({});

  /* ----------------------------------
     Load initial messages
  ---------------------------------- */
  async function loadInitialMessages(conversationId) {
    if (!conversationId) return;

    // v1 → load all messages
    if (apiVersion === MESSAGE_API_VERSION_ENUM.V1) {
      const data = await fetchMessages({
        conversationId,
        version: apiVersion,
      });

      setMessages(prev => ({
        ...prev,
        [conversationId]: data.messages.map(mapMessage),
      }));

      return;
    }

    // v2 → paginated (latest messages)
    const data = await fetchMessages({
      conversationId,
      limit: 20,
      version: apiVersion,
    });

    setMessages(prev => ({
      ...prev,
      [conversationId]: data.messages.map(mapMessage),
    }));

    // ✅ always reset pagination state for this conversation
    setPagination(prev => ({
      ...prev,
      [conversationId]: {
        hasMore: data.hasMore,
        oldestCursor: data.messages[0]?.createdAt ?? null,
        loading: false,
      },
    }));
  }

  /* ----------------------------------
     Load older messages (pagination)
  ---------------------------------- */
  async function loadOlderMessages() {
    if (apiVersion === MESSAGE_API_VERSION_ENUM.V1) return;

    const page = pagination[activeId];
    if (!page || !page.hasMore || page.loading) return;

    setPagination(prev => ({
      ...prev,
      [activeId]: { ...prev[activeId], loading: true },
    }));

    const data = await fetchMessages({
      conversationId: activeId,
      limit: 20,
      before: page.oldestCursor,
      version: apiVersion,
    });

    if (!data.messages.length) {
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
        ...data.messages.map(mapMessage),
        ...(prev[activeId] || []),
      ],
    }));

    setPagination(prev => ({
      ...prev,
      [activeId]: {
        hasMore: data.hasMore,
        oldestCursor: data.messages[0]?.createdAt ?? null,
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

    const data = await fetchMessages({
      conversationId,
      after: last.createdAt,
      version: apiVersion,
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

  return {
    messages,
    pagination,
    loadInitialMessages,
    loadOlderMessages,
    fetchMissedMessages,
    setMessages, // exposed for socket append
  };
}
