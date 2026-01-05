import prisma from "./prisma.js";


export async function getUserConversations(userId) {
    const memberships = await prisma.conversationMember.findMany({
        where: { userId },
        include: {
            conversation: {
                include: {
                    members: {
                        where: {
                            userId: { not: userId },
                        },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    displayName: true,
                                    avatarUrl: true,
                                    status: true,
                                },
                            },
                        },
                    },
                },
            },
        },
        orderBy: {
            conversation: {
                updatedAt: 'desc',
            },
        },
    });

    // Calculate unread counts
    const conversationsWithUnread = await Promise.all(
        memberships.map(async (m) => {
            const unreadCount = await prisma.message.count({
                where: {
                    conversationId: m.conversationId,
                    createdAt: {
                        gt: m.lastReadAt,
                    },
                    senderId: {
                        not: userId,
                    },
                },
            });
            
            const lastMessage = await prisma.message.findFirst({
                where: {
                    conversationId: m.conversationId,
                },
                orderBy:{
                    createdAt: "desc",
                },
                select:{
                    id: true,
                    content: true,
                    senderId: true,
                    createdAt: true,
                },
            });
    
            return {
                ...m,
                unreadCount,
                lastReadAt: m.lastReadAt,
                lastMessage,
            };
        })
    );

    return conversationsWithUnread;
    // return memberships;
}



export async function getOrCreateDirectConversation(userId1, userId2) {
    const existing = await prisma.conversationMember.findFirst({
        where: {
            userId: userId1,
            conversation: {
                isGroup: false,
                members: {
                    some: {
                        userId: userId2
                    }
                },
            },
        },
        include: {
            conversation: true
        }
    });

    if (existing) {
        return existing.conversation;
    }

    return await prisma.conversation.create({
        data: {
            isGroup: false,
            createdBy: userId1,
            members: {
                create: [
                    { userId: userId1, role: 'member' },
                    { userId: userId2, role: 'member' },
                ],
            },
        },
    });
}

export async function updateLastConversationReadAt(userId, conversationId) {
    await prisma.conversationMember.update({
        where: {
            conversationId_userId: {
                conversationId,
                userId,
            },
        },
        data: {
            lastReadAt: new Date(),
        },
    });
}

export async function getConversationMembers(conversationId) {
    return await prisma.conversation.findUnique({
        where: { id: Number(conversationId) },
        include: {
            members: {
                select: { userId: true },
            },
        },
    });
}


