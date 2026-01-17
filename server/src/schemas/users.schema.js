import { z } from "zod";
import { registry } from "../docs/registry.js";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

// --- 1. Reusable Schemas ---

const PublicUserSchema = z.object({
    id: z.number().openapi({ example: 101 }),
    username: z.string().optional().openapi({ example: "jdoe" }),
    email: z.string().email().openapi({ example: "jdoe@example.com" }),
    displayName: z.string().openapi({ example: "John Doe" }),
    avatarUrl: z.string().url().optional().nullable().openapi({ example: "https://i.pravatar.cc/150?img=1" }),
    status: z.string().optional().openapi({ example: "online" }),
    lastSeen: z.string().datetime().nullable().optional().openapi({ example: "2024-01-01T12:00:00Z" }),
    createdAt: z.string().datetime().optional().openapi({ example: "2026-01-11T00:46:15.975Z" }),
});

// --- 2. Request Schemas ---

export const searchUserSchema = z.object({
    query: z.string().min(1).openapi({ example: "John", description: "Search by name or email" }),
});

export const createUserSchema = z.object({
    username: z.string().min(1, "Username is required").openapi({ example: "newuser" }),
    email: z.string().email("Invalid email").openapi({ example: "new@example.com" }),
    password: z.string().min(6, "Password min 6 chars").openapi({ example: "secret123" }),
    displayName: z.string().min(1, "Display Name is required").openapi({ example: "New User" }),
});

export const userIdParamSchema = z.object({
    id: z.string().regex(/^\d+$/, "ID must be a number").openapi({ example: "101" }),
});


// --- 3. Route Registration ---

// GET /search
registry.registerPath({
    method: 'get',
    path: '/api/v1/user/search',
    tags: ['Users'],
    summary: 'Search for users',
    security: [{ cookieAuth: [] }],
    request: {
        query: searchUserSchema,
    },
    responses: {
        200: {
            description: 'List of users matching query',
            content: {
                'application/json': {
                    schema: z.array(PublicUserSchema)
                }
            }
        },
        401: { description: 'Unauthorized' }
    }
});


// GET /:id
registry.registerPath({
    method: 'get',
    path: '/api/v1/user/{id}',
    tags: ['Users'],
    summary: 'Get user details by ID',
    security: [{ cookieAuth: [] }],
    request: {
        params: userIdParamSchema
    },
    responses: {
        200: {
            description: 'User details',
            content: {
                'application/json': {
                    schema: z.object({ user: PublicUserSchema })
                }
            }
        },
        404: { description: 'User not found' }
    }
});

// POST /:id/last-seen
registry.registerPath({
    method: 'post',
    path: '/api/v1/user/{id}/last-seen',
    tags: ['Users'],
    summary: 'Update user last seen',
    security: [{ cookieAuth: [] }],
    request: {
        params: userIdParamSchema
    },
    responses: {
        200: {
            description: 'Updated successfully',
            content: {
                'application/json': { schema: PublicUserSchema }
            }
        }
    }
});

// GET /:id/last-seen
registry.registerPath({
    method: 'get',
    path: '/api/v1/user/{id}/last-seen',
    tags: ['Users'],
    summary: 'Get user last seen status',
    security: [{ cookieAuth: [] }],
    request: {
        params: userIdParamSchema
    },
    responses: {
        200: {
            description: 'User last seen status',
            content: {
                'application/json': { schema: PublicUserSchema }
            }
        },
        404: { description: 'User not found' }
    }
});