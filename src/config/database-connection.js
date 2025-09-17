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
    connectionTimeoutMillis: 2000,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

pool.connect()
    .then(client => {
        console.log('Connected to PostgreSQL database');
        client.release();
    })
    .catch(err => {
        console.error('Error connecting to PostgreSQL database:', err);
        process.exit(-1);
    });

module.exports = pool;
