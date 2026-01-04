export function createMessageStrategyV1(fetchMessages) {
  return {
    async fetchInitial({ conversationId }) {
      const data = await fetchMessages({
        conversationId,
        version: "v1",
      });

      return {
        messages: data.messages,
        hasMore: false,
        oldestCursor: null,
      };
    },

    async fetchOlder() {
      // ❌ v1 does not support pagination
      return {
        messages: [],
        hasMore: false,
        oldestCursor: null,
      };
    },

    async fetchMissed({ conversationId, after }) {
      const data = await fetchMessages({
        conversationId,
        after,
        version: "v1",
      });

      return {
        messages: data.messages,
      };
    },
  };
}
