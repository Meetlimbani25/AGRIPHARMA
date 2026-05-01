const { Sequelize } = require('sequelize');
require('dotenv').config();

const useSsl = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const sslCa = process.env.DB_SSL_CA ? process.env.DB_SSL_CA.replace(/\\n/g, '\n') : undefined;

const dialectOptions = useSsl ? {
  ssl: {
    rejectUnauthorized,
    ...(sslCa ? { ca: sslCa } : {})
  }
} : {};

const sequelize = new Sequelize(
  process.env.DB_NAME || 'plant_disease_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    dialectOptions,
    logging: false, // Set to console.log to see SQL queries
  }
);

sequelize.authenticate()
  .then(() => console.log('✅ Sequelize ORM connected to MySQL database!'))
  .catch((err) => console.error('❌ Sequelize connection failed:', err.message));

module.exports = sequelize;
