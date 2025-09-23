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
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true' || false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    },
    passwordReset: {
        tokenExpiry: process.env.PASSWORD_RESET_TOKEN_EXPIRY || '1h', // 1 hour
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
    }
}