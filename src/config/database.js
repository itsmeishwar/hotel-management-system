const { Sequelize } = require('sequelize');
require('dotenv').config();

const isSqlite = process.env.DB_DIALECT === 'sqlite';

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'postgres',
  storage: isSqlite ? (process.env.DB_STORAGE || './database.sqlite') : undefined,
  host: isSqlite ? undefined : (process.env.DB_HOST || 'localhost'),
  port: isSqlite ? undefined : (process.env.DB_PORT || 5432),
  database: isSqlite ? undefined : (process.env.DB_NAME || 'hotel_management_dev'),
  username: isSqlite ? undefined : (process.env.DB_USER || 'postgres'),
  password: isSqlite ? undefined : (process.env.DB_PASSWORD || 'password'),
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 20,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(isSqlite ? {} : {
    ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : false,
  })
});

module.exports = sequelize;