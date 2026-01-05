import { saveMessage, getMessages, getMessagesV2 } from "../db/messages.js";
import { getConversationMembers, updateConversationUpdateAt } from "../db/conversations.js";
import { io, getUserSocketIds } from '../sockets.js';

export async function sendMessageService(conversationId, senderId, content) {

    
    // Save to db
    const message = await saveMessage({
        conversationId,
        senderId: senderId,
        content,
    });

    // await updateConversationUpdateAt();

    // 2️⃣ Fetch conversation members
    const conversation = await getConversationMembers(conversationId);

    if (!conversation) {
        throw new Error("Conversation not found");
    }

    // 3️⃣ Emit message to ALL members (including sender)
    for (const member of conversation.members) {
        // const sockets = onlineUsers.get(member.userId);

        const sockets = await getUserSocketIds(member.userId);

        console.log(sockets);
        if (!sockets) continue; // user offline

        for (const socketId of sockets) {
            io.to(socketId).emit("message:new", {
                id: message.id,
                conversationId: message.conversationId,
                senderId: message.senderId,
                content: message.content,
                createdAt: message.createdAt,
                sender: message.sender,
            });

            io.to(socketId).emit("conversation:updated", {
                conversationId,
                updatedAt: new Date(),
            });
        }
    }
    return message;
};


export async function getMessageServiceV1(conversationId) {
    if (!conversationId || conversationId === undefined) {
        return;
    }
    const messages = await getMessages(conversationId);

    if (!messages) {
        return;
    }
    return messages;
};

export async function getMessageServiceV2(
    conversationId,
    limit = 20,
    before = null,
    after = null,
) {

    const safeLimit = Math.min(Number(limit) || 20, 50);
    const messages = await getMessagesV2({ conversationId, limit:safeLimit, before, after });
    
    if (!messages) {
        return;
    }

    return messages;
}
