import prisma from "./prisma.js";


export async function saveMessage(data){
    const {conversationId, senderId, content} = data;
    if (conversationId === null || conversationId === undefined){
        return {}
    }
    if (senderId === null || senderId === undefined){
        return {}
    }
    if (content === null || content === undefined){
        return {}
    }
    return await prisma.message.create({
        data:{
            conversationId: data.conversationId,
            senderId: data.senderId,
            content: data.content,
        },
        include:{
            sender:{
                select:{
                    id: true,
                    username: true,
                    displayName: true,
                }
            }
        }
    });
}


export async function getMessages(conversationId){
    if(conversationId === null || conversationId === undefined){
        return null;
    }
    const messages = await prisma.message.findMany({
        where: {conversationId: conversationId},
        orderBy: [
            {createdAt: 'asc'},
            {id: 'asc'},
        ],
        include:{
            sender:{
                select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true
                },
            },
        },
    });

    return messages;
}