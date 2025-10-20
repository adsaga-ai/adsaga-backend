module.exports = {
    port: 8080,
    logLevel: 'info',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
        expiresIn: '24h',
        cookieName: 'auth_token'
    },
    postgresConfig: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    },
    migrationConfig: {
        host: process.env.POSTGRES_HOST,
        port: process.env.POSTGRES_PORT,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB
    },
    cors: {
        origin: process.env.CORS_ORIGIN,
        credentials: true
    },
    email: {
        host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        sendgrid: {
            apiKey: process.env.SENDGRID_API_KEY,
            fromEmail: process.env.SENDGRID_FROM_EMAIL || process.env.EMAIL_USER
        }
    },
    passwordReset: {
        tokenExpiry: process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1h',
        // Used as the base URL for all frontend links (password reset, invite acceptance, etc.)
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
    },
    agentApi: {
        url: process.env.AGENT_API_URL,
        port: process.env.AGENT_API_PORT,
    },
    redis: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null
    }
}