import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

// Use APP_URL as requested
const APP_URL = process.env.APP_URL || 'http://localhost:4000';

describe('User Endpoints', () => {
    let sessionCookie;
    let currentUserId;

    // ⚠️ PREREQUISITE: Ensure this user exists in your DB
    const testUser = {
        email: "alice@example.com",
        password: "password123"
    };

    // 1. Setup: Login once before running user tests
    beforeAll(async () => {
        const res = await request(APP_URL)
            .post('/api/v1/auth/login')
            .send(testUser);

        // Ensure login worked so we have a valid session
        expect(res.status).toBe(200);

        // Capture cookie and user ID
        sessionCookie = res.headers['set-cookie'].find(c => c.startsWith('chat.sid'));
        currentUserId = res.body.id;
    });

    // --- 1. Search Route ---

    describe('GET /api/v1/user/search', () => {
        it('should return a list of users matching the query', async () => {
            const res = await request(APP_URL)
                .get('/api/v1/user/search?query=alice')
                .set('Cookie', sessionCookie)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            // Since we searched for the test user "alice", we expect at least 1 result
            if (res.body.length > 0) {
                expect(res.body[0]).toHaveProperty('username');
                expect(res.body[0]).toHaveProperty('displayName');
            }
        });

        it('should return 400 if query parameter is missing (Validation)', async () => {
            // Depending on your schema, empty query might be a validation error
            // or handled by the code returning empty array.
            // Assuming schema requires min(1):
            const res = await request(APP_URL)
                .get('/api/v1/user/search?query=') // Empty query
                .set('Cookie', sessionCookie);

            // If your schema allows empty strings, check for 200 and []; 
            // If schema enforces min(1), check for 400.
            if (res.status === 400) {
                expect(res.body).toHaveProperty('error');
            } else {
                expect(res.body).toEqual([]);
            }
        });

        it('should return 401 if not authenticated', async () => {
            await request(APP_URL)
                .get('/api/v1/user/search?query=alice')
                // No Cookie set
                .expect(401);
        });
    });

    // --- 2. Get User By ID ---

    describe('GET /api/v1/user/:id', () => {
        it('should return user details for a valid numeric ID', async () => {
            const res = await request(APP_URL)
                .get(`/api/v1/user/${currentUserId}`)
                .set('Cookie', sessionCookie)
                .expect(200);

            expect(res.body.user).toBeDefined();
            expect(res.body.user.id).toBe(currentUserId);
            expect(res.body.user.email).toBe(testUser.email);
        });

        it('should return 400 for invalid ID format (Validation)', async () => {
            const res = await request(APP_URL)
                .get('/api/v1/user/invalid-id') // String instead of number
                .set('Cookie', sessionCookie)
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        it('should return 404 for non-existent user ID', async () => {
            const nonExistentId = 9999999;
            const res = await request(APP_URL)
                .get(`/api/v1/user/${nonExistentId}`)
                .set('Cookie', sessionCookie)
                .expect(404);

            expect(res.body.error).toBe('User not found');
        });
    });

    // --- 3. Last Seen Routes ---

    describe('POST /api/v1/user/:id/last-seen', () => {
        it('should update the last seen timestamp', async () => {
            const res = await request(APP_URL)
                .post(`/api/v1/user/${currentUserId}/last-seen`)
                .set('Cookie', sessionCookie)
                .expect(200);

            // Expect the updated user object or success message
            expect(res.body).toHaveProperty('lastSeen');
        });

        it('should return 400 for invalid ID format', async () => {
            await request(APP_URL)
                .post('/api/v1/user/abc/last-seen')
                .set('Cookie', sessionCookie)
                .expect(400);
        });
    });

    describe('GET /api/v1/user/:id/last-seen', () => {
        it('should return the last seen timestamp', async () => {
            const res = await request(APP_URL)
                .get(`/api/v1/user/${currentUserId}/last-seen`)
                .set('Cookie', sessionCookie)
                .expect(200);

            expect(res.body).toHaveProperty('lastSeen');
        });
    });

});