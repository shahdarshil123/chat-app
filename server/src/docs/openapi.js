// src/docs/openapi.js
import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

// ⚠️ IMPORTANT: Import the schema files so they execute and register their paths!
import '../schemas/auth.schema.js';
import '../schemas/users.schema.js';
import '../schemas/conversations.schema.js'; 
import '../schemas/messages.schema.js';

export function generateOpenApiSpec() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'Chat Application API',
            version: '1.0.0',
            description: 'API documentation generated from Zod schemas',
        },
        servers: [
            { url: 'http://localhost:4000', description: 'Local Server' }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'chat.sid',
                },
            },
        },
        // Apply global security if needed
        // security: [{ cookieAuth: [] }], 
    });
}