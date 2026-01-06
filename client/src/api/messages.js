import { MESSAGE_API_VERSION } from "../config";
import { MESSAGE_API_VERSION_ENUM } from "../constants/apiVersions";

export async function fetchMessages({
    conversationId,
    limit = 20,
    before,
    version = MESSAGE_API_VERSION_ENUM.V2, // default version
}){
    if(!conversationId){
        throw new Error("conversationId is required");
    }

    if (version === MESSAGE_API_VERSION_ENUM.V1){
        console.log("fetching messages using API version: v1");
        const res = await fetch(`http://localhost:4000/api/${version}/message/${conversationId}/messages`,
      { credentials: "include" });

    if (!res.ok) {
      throw new Error("Failed to fetch v1 messages");
    }

    const data = await res.json();

    return {
      messages: data.messages,
      hasMore: false,
      oldestCursor: null,
    };
}

const params = new URLSearchParams();
if (limit) params.set("limit", limit);
if (before) params.set("before", before);

console.log("fetching messages using API version: v2");
const res = await fetch(
    `http://localhost:4000/api/${version}/message/${conversationId}/messages?${params}`,
    {credentials: "include"}
);
if (!res.ok) {
    throw new Error("Failed to fetch v2 messages");
  }
return res.json();

}

export async function deleteMessage({ conversationId, messageId, version = MESSAGE_API_VERSION_ENUM.V1 }){
  if(!conversationId || !messageId){
    throw new Error('conversationId and messageId are required');
  }

  const res = await fetch(
    `http://localhost:4000/api/${version}/message/${conversationId}/messages/${messageId}`,
    { method: 'DELETE', credentials: 'include' }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Failed to delete message');
  }

  return res.json();
}