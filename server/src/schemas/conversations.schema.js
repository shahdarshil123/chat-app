import { z } from "zod";
import { registry } from "../docs/registry.js";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// --- 1. Reusable Schemas ---
const userProfileSchema = z.object({
    id: z.number().openapi({ example: 2 }),
    username: z.string().openapi({ example: "bob" }),
    displayName: z.string().openapi({ example: "Bob Johnson" }),
    avatarUrl: z.string().url().nullable().openapi({ example: "https://i.pravatar.cc/150?img=2" }),
    status: z.string().openapi({ example: "online" })
});

// 1.2 A Member inside the conversation.members array
const memberSchema = z.object({
    conversationId: z.number().openapi({ example: 1 }),
    userId: z.number().openapi({ example: 2 }),
    role: z.string().openapi({ example: "member" }), // e.g., 'member', 'admin'
    joinedAt: z.string().datetime().openapi({ example: "2026-01-11T00:46:16.259Z" }),
    lastReadAt: z.string().datetime().openapi({ example: "2026-01-14T19:39:19.384Z" }),
    user: userProfileSchema
});

// 1.3 The inner "conversation" object (Metadata + Members)
const conversationInnerSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    isGroup: z.boolean().openapi({ example: false }),
    name: z.string().nullable().openapi({ example: null }), // Null for direct messages, String for groups
    createdBy: z.number().openapi({ example: 1 }),
    createdAt: z.string().datetime().openapi({ example: "2026-01-11T00:46:16.259Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2026-01-14T19:38:53.232Z" }),
    lastMessageId: z.number().nullable().optional(),
    members: z.array(memberSchema)
});

// 1.4 The "lastMessage" object
const lastMessageSchema = z.object({
    id: z.number().openapi({ example: 7 }),
    content: z.string().openapi({ example: "Hi Bob, how are you today?" }),
    senderId: z.number().openapi({ example: 1 }),
    createdAt: z.string().datetime().openapi({ example: "2026-01-14T19:38:53.232Z" }),
    deletedAt: z.string().datetime().nullable().optional()
});

const conversationListItemSchema = z.object({
    conversationId: z.number().openapi({ example: 1 }),
    userId: z.number().openapi({ example: 1 }), // The current user's ID
    role: z.string().openapi({ example: "member" }),
    joinedAt: z.string().datetime().openapi({ example: "2026-01-11T00:46:16.259Z" }),
    lastReadAt: z.string().datetime().openapi({ example: "2026-01-16T21:22:50.880Z" }),
    unreadCount: z.number().openapi({ example: 0 }),
    conversation: conversationInnerSchema,
    lastMessage: lastMessageSchema.nullable().optional() // Can be null if conversation is empty
});

export const userIdParamSchema = z.object({
    userId: z.string().regex(/^\d+$/, "User ID must be a number").openapi({ example: "1" })
});

export const  conversationIdParamSchema = z.object({
    conversationId: z.string().regex(/^\d+$/, "Conversation ID must be a number").openapi({ example: "101" })
});

// A standard representation of a conversation for the list
const publicConversationSchema = z.object({
    id: z.number().openapi({ example: 101 }),
    otherUser: z.object({
        id: z.number(),
        displayName: z.string(),
        avatarUrl: z.string().optional().nullable(),
        isOnline: z.boolean().optional()
    }).openapi({ example: { id: 2, displayName: "Jane Doe", isOnline: true } }),
    lastMessage: z.object({
        content: z.string(),
        createdAt: z.string().datetime(),
        senderId: z.number()
    }).optional().nullable().openapi({ example: { content: "Hello!", createdAt: "2024-01-01T12:00:00Z", senderId: 2 } }),
    unreadCount: z.number().optional().openapi({ example: 2 })
});


// --- 2. Route Registration ---

// POST /direct/:userId
registry.registerPath({
    method: 'post',
    path: '/api/v1/conversation/direct/{userId}',
    tags: ['Conversations'],
    summary: 'Create or get direct conversation',
    description: 'Creates a new direct conversation with the target user, or returns the existing one if it already exists.',
    security: [{ cookieAuth: [] }],
    request: {
        params: userIdParamSchema
    },
    responses: {
        200: {
            description: 'Conversation details',
            content: {
                'application/json': {
                    schema: z.object({
                        exists: z.boolean().openapi({ example: true, description: "True if conversation already existed" }),
                        conversationId: z.number().openapi({ example: 101 })
                    })
                }
            }
        },
        400: { description: 'Invalid Target User ID' },
        401: { description: 'Unauthorized' }
    }
});

// GET /:userId
// Note: Your code defines the route as /:userId, but ignores the param and uses the session user.
// We document the param to match the route definition.
registry.registerPath({
    method: 'get',
    path: '/api/v1/conversation/{userId}',
    tags: ['Conversations'],
    summary: 'Get all conversations',
    description: 'Retrieves the list of conversations for the currently logged-in user.',
    security: [{ cookieAuth: [] }],
    request: {
        params: userIdParamSchema
    },
    responses: {
        200: {
            description: 'List of conversations',
            content: {
                'application/json': {
                    schema: z.object({
                        conversations: z.array(conversationListItemSchema)
                    }),
                }
            }
        },
        401: { description: 'Unauthorized' }
    }
});

// PATCH /:conversationId/read
registry.registerPath({
    method: 'patch',
    path: '/api/v1/conversation/{conversationId}/read',
    tags: ['Conversations'],
    summary: 'Mark conversation as read',
    description: 'Updates the last read timestamp for the given conversation.',
    security: [{ cookieAuth: [] }],
    request: {
        params: conversationIdParamSchema
    },
    responses: {
        200: {
            description: 'Updated successfully',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string().openapi({ example: "Conversation: 101 last read at updated" })
                    })
                }
            }
        },
        400: { description: 'Invalid Conversation ID' },
        401: { description: 'Unauthorized' }
    }
});