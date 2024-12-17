// /lib/db.js

const { Pool } = require('pg');

const pool = new Pool({
    user: 'admin',
    host: 'localhost',
    database: 'nyc-urban-data',
    password: '1234',
    port: '5432',
});

export const query = async (text, params) => {
    const res = await pool.query(text, params);
    return res;
};

module.exports = { pool, query };
