const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    password: "postgres",
    host: "localhost",
    port: 5432,
    database: "appointment_scheduler"
});

module.exports = pool;