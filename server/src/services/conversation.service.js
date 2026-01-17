import { getUserConversations, getOrCreateDirectConversation, updateLastConversationReadAt, createConversation, findDirectConversation, getConversationById } from "../db/conversations.js";
import { getUserById } from "../db/users.js";

export async function getUserConversationsService(userId) {
    if (!userId) return;

    const user = await getUserById(userId);
    if(!user) return;

    const conversations = await getUserConversations(userId);

    if (!conversations) return;

    return conversations;
};

export async function getOrCreateDirectConversationService(userId1, userId2) {
    if (!userId1 || !userId2) return;

    const conversation = await getOrCreateDirectConversation(userId1, userId2);

    if (!conversation) return;

    return conversation;
};

export async function createConversationService(currentUserId, targetUserId) {

    const existing = await findDirectConversation(
        currentUserId,
        targetUserId
    );

    if (existing) {
        return {
            exists: true,
            conversation: existing,
        };
    }

    const conversation = await createConversation(currentUserId, targetUserId);

    return {
        exists: false,
        conversation,
    };
}

export async function updateLastConversationReadAtService(userId, conversationId) {

    if (!userId || !conversationId) return;

    const conversation = await getConversationById(conversationId);
    console.log(conversation);

    if(!conversation) return;

    const response = await updateLastConversationReadAt(userId, conversationId);

    if (!response) return;

    return response;
};

export async function  getConversationByIdService(conversationId){
    if(!conversationId) return;

    const conversation = await getConversationById(conversationId);

    if(!conversation) return;

    return conversation;
}

