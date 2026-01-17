import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

const APP_URL = process.env.APP_URL || 'http://localhost:4000';

// ✅ Helper to create unique users every time (avoids "User already exists" errors)
const generateUser = () => {
    const timestamp = Date.now();
    return {
        username: `user_${timestamp}_${Math.floor(Math.random() * 1000)}`,
        email: `user_${timestamp}_${Math.floor(Math.random() * 1000)}@test.com`,
        password: "password123",
        displayName: "Test User"
    };
};

describe('Conversation Endpoints', () => {
    let aliceCookie;
    let bobId;
    let createdConversationId;

    // Generate fresh, unique user data for this specific run
    const aliceData = generateUser();
    const bobData = generateUser();

    beforeAll(async () => {
        // 1. Register Bob (Target User)
        const bobRes = await request(APP_URL)
            .post('/api/v1/auth/register')
            .send(bobData)
            .expect(201); // Expect 201 Created
        
        bobId = bobRes.body.id;

        // 2. Register Alice (Main User)
        await request(APP_URL)
            .post('/api/v1/auth/register')
            .send(aliceData)
            .expect(201);

        // 3. Login Alice to get Session Cookie
        const loginRes = await request(APP_URL)
            .post('/api/v1/auth/login')
            .send({
                email: aliceData.email,
                password: aliceData.password
            })
            .expect(200);

        aliceCookie = loginRes.headers['set-cookie'].find(c => c.startsWith('chat.sid'));
    });

    // --- 1. Create Direct Conversation ---

    describe('POST /api/v1/conversation/direct/:userId', () => {
        it('should create a new conversation with a valid user', async () => {
            const res = await request(APP_URL)
                .post(`/api/v1/conversation/direct/${bobId}`)
                .set('Cookie', aliceCookie)
                .expect(200);

            expect(res.body).toHaveProperty('conversationId');
            createdConversationId = res.body.conversationId;
        });

        it('should return existing conversation if repeated', async () => {
            const res = await request(APP_URL)
                .post(`/api/v1/conversation/direct/${bobId}`)
                .set('Cookie', aliceCookie)
                .expect(200);

            expect(res.body.exists).toBe(true);
            // Use String() to ensure we match "123" with 123
            expect(String(res.body.conversationId)).toBe(String(createdConversationId));
        });

        it('should return 404 if target user does not exist', async () => {
            const nonExistentId = 99999999;
            const res = await request(APP_URL)
                .post(`/api/v1/conversation/direct/${nonExistentId}`)
                .set('Cookie', aliceCookie)
                .expect(404);
            
            expect(res.body).toHaveProperty('error');
        });
    });

    // --- 2. Get User Conversations ---

    describe('GET /api/v1/conversation/:userId', () => {
        it('should return the new conversation in the list', async () => {
            // Note: We pass '1' as a placeholder ID because your route requires /:userId,
            // but your controller ignores it and uses the session ID (Alice).
            const res = await request(APP_URL)
                .get(`/api/v1/conversation/1`) 
                .set('Cookie', aliceCookie)
                .expect(200);

            expect(Array.isArray(res.body.conversations)).toBe(true);

            // Find the conversation we just created
            const found = res.body.conversations.find(c => 
                String(c.conversationId) === String(createdConversationId)
            );
            expect(found).toBeDefined();
        });

        it('should return 401 if not authenticated', async () => {
            await request(APP_URL)
                .get('/api/v1/conversation/1')
                .expect(401);
        });
    });

    // --- 3. Mark Conversation as Read ---

    describe('POST /api/v1/conversation/:conversationId/read', () => {
        it('should update last read timestamp', async () => {
            const res = await request(APP_URL)
                .post(`/api/v1/conversation/${createdConversationId}/read`)
                .set('Cookie', aliceCookie)
                .expect(200);

            expect(res.body.message).toBeTruthy();
        });

        it('should return 404 for non-existent conversation ID', async () => {
            const fakeId = 99999999;
            await request(APP_URL)
                .post(`/api/v1/conversation/${fakeId}/read`)
                .set('Cookie', aliceCookie)
                .expect(404);
        });
    });
});