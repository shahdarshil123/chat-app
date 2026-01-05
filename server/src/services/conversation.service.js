import { getUserConversations, getOrCreateDirectConversation, updateLastConversationReadAt } from "../db/conversations.js";


export async function getUserConversationsService(userId){
    if(!userId) return;

    const conversations = await getUserConversations(userId); 

    if(!conversations) return;

    return conversations;
};

export async function getOrCreateDirectConversationService(userId1, userId2){
    if(!userId1 || !userId2) return;

    const conversation = await getOrCreateDirectConversation(userId1, userId2);

    if(!conversation) return;

    return conversation;
};

export async function updateLastConversationReadAtService(userId, conversationId){
    const response = await updateLastConversationReadAt(userId, conversationId);

    if(!response) return;

    return response;
};



