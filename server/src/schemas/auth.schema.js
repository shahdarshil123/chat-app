import { z } from "zod";
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { registry } from "../docs/registry.js";

extendZodWithOpenApi(z);

export const userResponseSchema = z.object({
    id: z.number(),
    email: z.string().email(),
    displayName: z.string(),
    lastSeen: z.string().optional()
}).openapi({ example: { id: 1, email: "user@example.com", displayName: "User", lastSeen: "2024-01-01T12:00:00Z" } });

/**
 * POST /login
 */
export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

/**
 * POST /register
 */
export const registerSchema = z.object({
    username: z.string().min(1, "Username is required"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    displayName: z.string().optional(),
});

/**
 * POST /reset-password
 */
export const resetPasswordSchema = z.object({
    token: z.string().min(1, "Reset token is required"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

/**
 * POST /forgot-password
 */
export const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

/**
 * GET /verify-email
 * (query params)
 */
export const verifyEmailSchema = z.object({
    token: z.string().min(1, "Verification token is required"),
});


// --- 2. Define API Paths (Routes) ---

registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/login',
    tags: ['Auth'],
    summary: 'Log in a user',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: loginSchema,
                },
            },
        },
    },
    responses: {
        200: {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: userResponseSchema
                }
            }
        },
        400: { description: 'Validation failed' },
        401: { description: 'Invalid credentials' }
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/logout',
    tags: ['Auth'],
    summary: 'Log out',
    description: 'Destroys the session and clears the auth cookie.',
    responses: {
        200: {
            description: 'Logout successful',
            content: {
                'application/json': {
                    schema: z.object({ success: z.boolean() }).openapi({ example: { success: true } })
                }
            }
        },
        500: { description: 'Logout failed' }
    }
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/me',
    tags: ['Auth'],
    summary: 'Get current user',
    description: 'Returns details of the currently logged-in user based on the session cookie.',
    responses: {
        200: {
            description: 'Authenticated user details',
            content: {
                'application/json': { schema: userResponseSchema } 
            }
        },
        401: { description: 'Not authenticated' }
    }
});


registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
        body: {
            content: {
                'application/json': { schema: registerSchema },
            },
        },
    },
    responses: {
        201: { description: 'User created successfully' },
        400: { description: 'Validation error' },
        409: { description: 'User already exists' }
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/forgot-password',
    tags: ['Auth'],
    summary: 'Request password reset',
    request: {
        body: {
            content: {
                'application/json': { schema: forgotPasswordSchema },
            },
        },
    },
    responses: {
        200: { description: 'Reset link sent' },
    },
});

registry.registerPath({
    method: 'post',
    path: '/api/v1/auth/reset-password',
    tags: ['Auth'],
    summary: 'Reset password with token',
    request: {
        body: {
            content: {
                'application/json': { schema: resetPasswordSchema },
            },
        },
    },
    responses: {
        200: { description: 'Password reset successful' },
        400: { description: 'Invalid token' },
    },
});

registry.registerPath({
    method: 'get',
    path: '/api/v1/auth/verify-email',
    tags: ['Auth'],
    summary: 'Verify email address',
    request: {
        query: verifyEmailSchema,
    },
    responses: {
        200: { description: 'Email verified' },
        400: { description: 'Invalid token' },
    },
});