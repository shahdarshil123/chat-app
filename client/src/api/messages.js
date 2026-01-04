export async function fetchMessages({
    conversationId,
    limit,
    before,
    version = "v2", // default version
}){
    if(!conversationId){
        throw new Error("conversationId is required");
    }

    if (version === 'v1'){
        console.log("fetching messages using API version: v1");
        const res = await fetch(`http://localhost:4000/api/v1/message/${conversationId}/messages`,
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
    `http://localhost:4000/api/v2/message/${conversationId}/messages?${params}`,
    {credentials: "include"}
);
if (!res.ok) {
    throw new Error("Failed to fetch v2 messages");
  }
return res.json();

}