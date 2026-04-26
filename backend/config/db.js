const mysql = require('mysql2');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const sslCa = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;

const sslConfig = useSsl
  ? {
      rejectUnauthorized,
      ...(sslCa ? { ca: sslCa } : {}),
    }
  : undefined;

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT || 3306),
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'plant_disease_db',
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const db = pool.promise();

pool.getConnection((err, conn) => {
  if (err) console.error('❌ Database connection failed:', err.message);
  else { console.log('✅ Database connected!'); conn.release(); }
});

module.exports = db;
