const { Pool } = require("pg");

const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        user: "postgres",
        password: "postgres",
        host: "localhost",
        port: 5432,
        database: "appointment_scheduler"
    });

module.exports = pool;