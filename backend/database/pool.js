// @ts-ignore
const dotenv = require('dotenv');
dotenv.config();
const mysql = require('mysql2/promise'); // 使用 mysql2/promise 版本

// 初始化 MySQL 連線池 (避免連線未準備好問題)
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10, // 允許的最大連接數
  queueLimit: 0
});

module.exports = pool;