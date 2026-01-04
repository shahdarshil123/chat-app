/**
 * MessageStrategy interface
 *
 * Each strategy MUST implement these methods
 */
export class MessageStrategy {
  fetchInitial({ conversationId }) {
    throw new Error("Not implemented");
  }

  fetchOlder({ conversationId, cursor }) {
    throw new Error("Not implemented");
  }

  fetchMissed({ conversationId, after }) {
    throw new Error("Not implemented");
  }
}
