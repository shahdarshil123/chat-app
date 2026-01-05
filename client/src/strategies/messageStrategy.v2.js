export function createMessageStrategyV2(fetchMessages) {
  return {
    async fetchInitial({ conversationId }) {
      const data = await fetchMessages({
        conversationId,
        limit: 20,
        version: "v2",
      });

      return {
        messages: data.messages,
        hasMore: data.hasMore,
        oldestCursor: data.messages[0]?.createdAt ?? null,
      };
    },

    async fetchOlder({ conversationId, cursor }) {
      const data = await fetchMessages({
        conversationId,
        limit: 20,
        before: cursor,
        version: "v2",
      });

      return {
        messages: data.messages,
        hasMore: data.hasMore,
        oldestCursor: data.oldestCursor,
      };
    },

    async fetchMissed({ conversationId, after }) {
      const data = await fetchMessages({
        conversationId,
        after,
        version: "v2",
      });

      return {
        messages: data.messages,
      };
    },
  };
}
