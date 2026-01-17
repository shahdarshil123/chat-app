import { z } from "zod";
import { registry } from "../docs/registry.js";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// --- 1. Reusable Schemas ---

const messageSenderSchema = z.object({
    id: z.number().openapi({ example: 1 }),
    username: z.string().openapi({ example: "alice" }),
    displayName: z.string().openapi({ example: "Alice Smith" })
});

const publicMessageSchema = z.object({
    id: z.number().openapi({ example: 501 }),
    conversationId: z.number().openapi({ example: 101 }),
    senderId: z.number().openapi({ example: 1 }),
    content: z.string().openapi({ example: "Hello world" }),
    createdAt: z.string().datetime().openapi({ example: "2024-01-01T12:00:00Z" }),
    deletedAt: z.string().datetime().nullable().optional(),
    createdAt: z.string().datetime().openapi({ example: "2026-01-17T00:22:20.972Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2026-01-17T00:22:20.972Z" }),
    sender: messageSenderSchema.optional()
});

const sendMessageBodySchema = z.object({
    content: z.string().min(1, "Message content is required").openapi({ example: "Hello there!" })
});

const conversationIdParamSchema = z.object({
    conversationId: z.string().regex(/^\d+$/, "ID must be a number").openapi({ example: "101" })
});

const deleteMessageParamSchema = z.object({
    conversationId: z.string().regex(/^\d+$/, "Conversation ID must be a number").openapi({ example: "101" }),
    messageId: z.string().regex(/^\d+$/, "Message ID must be a number").openapi({ example: "501" })
});


// --- 2. Route Registration ---

// POST /:conversationId/messages
registry.registerPath({
    method: 'post',
    path: '/api/v1/message/{conversationId}/messages', // Note: Check your app.use prefix. If router is mounted at /messages, this path might be duplicate.
    // Based on standard conventions, if this file is mounted at /api/v1/conversations, the path below is correct.
    // If this file is mounted at /api/v1/messages, check the route definition carefully.
    // Assuming messages.js is mounted under /api/v1/conversations or similar, but the file content says router.post("/:conversationId/messages")
    // If the file is mounted as `app.use('/api/v1/conversations', messagesRouter)`, then the path is `/api/v1/conversations/{conversationId}/messages`
    
    // ADJUST THIS PATH based on your index.js mounting!
    // I will assume it's mounted at /api/v1/conversations based on the parameter name.
    tags: ['Messages'],
    summary: 'Send a message',
    security: [{ cookieAuth: [] }],
    request: {
        params: conversationIdParamSchema,
        body: {
            content: { 'application/json': { schema: sendMessageBodySchema } }
        }
    },
    responses: {
        201: {
            description: 'Message sent successfully',
            content: {
                'application/json': {
                    schema: z.object({ message: publicMessageSchema })
                }
            }
        },
        400: { description: 'Validation Error' },
        500: { description: 'Server Error' }
    }
});

// GET /:conversationId/messages
registry.registerPath({
    method: 'get',
    path: '/api/v1/message/{conversationId}/messages', // Adjust based on actual mount path
    tags: ['Messages'],
    summary: 'Get messages for a conversation',
    security: [{ cookieAuth: [] }],
    request: {
        params: conversationIdParamSchema
    },
    responses: {
        200: {
            description: 'List of messages',
            content: {
                'application/json': {
                    schema: z.object({
                        messages: z.array(publicMessageSchema)
                    })
                }
            }
        },
        400: { description: 'Failed to get messages' },
        500: { description: 'Server Error' }
    }
});

// DELETE /:conversationId/messages/:messageId
registry.registerPath({
    method: 'delete',
    path: '/api/v1/message/{conversationId}/messages/{messageId}', // Adjust based on actual mount path
    tags: ['Messages'],
    summary: 'Delete a message',
    security: [{ cookieAuth: [] }],
    request: {
        params: deleteMessageParamSchema
    },
    responses: {
        200: {
            description: 'Message deleted',
            content: {
                'application/json': {
                    schema: z.object({
                        id: z.number(),
                        conversationId: z.number()
                    }).openapi({ example: { id: 501, conversationId: 101 } })
                }
            }
        },
        400: { description: 'Invalid IDs' },
        500: { description: 'Failed to delete' }
    }
});