const { Pool } = require('pg');
const config = require('./');

const pool = new Pool({
    host: config.postgresConfig.host,
    port: config.postgresConfig.port,
    user: config.postgresConfig.user,
    password: config.postgresConfig.password,
    database: config.postgresConfig.database,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: false,
    statement_timeout: 0,
    query_timeout: 0,
});

console.log(`PostgreSQL Config ${JSON.stringify(config.postgresConfig, null, 2)}`)

pool.on('error', (err) => {
    console.log(`Error with PostgreSQL Config ${JSON.stringify(config.postgresConfig, null, 2)}`)
    console.error('Unexpected error on idle client', err);
    // process.exit(-1);
});

pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database');
        client.release();
    })
    .catch(err => {
        console.log(`Error connecting to PostgreSQL database with config ${JSON.stringify(config.postgresConfig, null, 2)}`)
        console.error('Error connecting to PostgreSQL database:', err);
        // process.exit(-1);
    });

// Query wrapper with enhanced logging
const queryWithLogging = async (text, params) => {
    const start = Date.now();
    console.log('🔍 Executing Query:', text);
    if (params && params.length > 0) {
        console.log('📝 Query Parameters:', params);
    }
    
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log(`✅ Query completed in ${duration}ms`);
        console.log(`📊 Rows affected: ${result.rowCount || 0}`);
        return result;
    } catch (error) {
        const duration = Date.now() - start;
        console.error(`❌ Query failed after ${duration}ms:`, error.message);
        console.error('🔍 Failed Query:', text);
        if (params && params.length > 0) {
            console.error('📝 Query Parameters:', params);
        }
        throw error;
    }
};

// Enhanced pool object with query logging
const enhancedPool = {
    ...pool,
    query: queryWithLogging,
    // Keep original methods
    connect: pool.connect.bind(pool),
    end: pool.end.bind(pool),
    on: pool.on.bind(pool),
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
};

module.exports = enhancedPool;
