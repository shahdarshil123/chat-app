import request from 'supertest';
import dotenv from 'dotenv';
dotenv.config();

// 1. Point this to your running local server
const APP_URL = `${process.env.APP_URL}`;
console.log(APP_URL);

describe('Auth Endpoints (Login, Logout, Me)', () => {
    let sessionCookie;

    // ⚠️ PREREQUISITE: Ensure this user exists in your database before running tests
    const existingUser = {
        email: "alice@example.com",
        password: "password123"
    };

    const invalidUser = {
        email: "wrong@example.com",
        password: "wrongpassword"
    };

    // --- 1. LOGIN TESTS ---

    describe('POST /api/v1/auth/login', () => {
        it('should login successfully with valid credentials', async () => {
            const res = await request(APP_URL)
                .post('/api/v1/auth/login')
                .send(existingUser)
                .expect(200);

            // Check response body structure
            expect(res.body).toHaveProperty('id');
            expect(res.body.email).toBe(existingUser.email);
            expect(res.body).toHaveProperty('displayName');

            // Check if cookie is set
            const cookies = res.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toMatch(/chat\.sid/);

            // Save cookie for next tests
            sessionCookie = cookies.find(c => c.startsWith('chat.sid'));
        });

        it('should return 401 for invalid credentials', async () => {
            const res = await request(APP_URL)
                .post('/api/v1/auth/login')
                .send(invalidUser)
                .expect(401); // Based on your auth.js logic

            expect(res.body).toHaveProperty('error', 'Invalid credentials');
        });

        it('should return 400 for missing fields', async () => {
            const res = await request(APP_URL)
                .post('/api/v1/auth/login')
                .send({}) // Empty body
                .expect(400);

            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toBeTruthy(); 
        });

        it('should return 400 for invalid email format', async () => {
            const res = await request(APP_URL)
                .post('/api/v1/auth/login')
                .send({ email: "not-an-email", password: "123" })
                .expect(400);

            // Expect the specific validation message
            expect(res.body.error).toContain('Invalid email'); 
        });
    });

    // --- 2. ME TESTS ---

    describe('GET /api/v1/auth/me', () => {
        it('should return user profile when authenticated', async () => {
            // Uses the cookie captured from the login test
            const res = await request(APP_URL)
                .get('/api/v1/auth/me')
                .set('Cookie', sessionCookie) // 👈 Authenticating the request
                .expect(200);

            expect(res.body.email).toBe(existingUser.email);
            expect(res.body).toHaveProperty('id');
        });

        it('should return 401 when not authenticated (No Cookie)', async () => {
            const res = await request(APP_URL)
                .get('/api/v1/auth/me')
                // No cookie set
                .expect(401);

            expect(res.body).toHaveProperty('error', 'Not authenticated');
        });
    });

    // --- 3. LOGOUT TESTS ---

    describe('POST /api/v1/auth/logout', () => {
        it('should logout successfully and clear cookie', async () => {
            const res = await request(APP_URL)
                .post('/api/v1/auth/logout')
                .set('Cookie', sessionCookie)
                .expect(200);

            expect(res.body).toHaveProperty('success', true);

            // Verify cookie is cleared (look for empty value or explicit clear)
            const cookies = res.headers['set-cookie'];
            const clearedCookie = cookies.find(c => c.startsWith('chat.sid'));
            
            // Usually cleared cookies have an expires date in the past or empty value
            expect(clearedCookie).toBeDefined();
        });

        it('should not be able to access /me after logout', async () => {
            // Try accessing /me again using the OLD session cookie
            await request(APP_URL)
                .get('/api/v1/auth/me')
                .set('Cookie', sessionCookie)
                .expect(401);
        });
    });
});