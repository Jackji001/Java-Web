import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbPassword = process.env.DB_PASSWORD;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: dbPassword === undefined || dbPassword === null ? 'root' : dbPassword,
  database: process.env.DB_NAME || 'highway_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    console.log('数据库连接成功');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS license_plate_records (
        id VARCHAR(50) PRIMARY KEY,
        plate_number VARCHAR(20) NOT NULL,
        device_id VARCHAR(50) NOT NULL,
        device_name VARCHAR(100) NOT NULL,
        timestamp DATETIME NOT NULL,
        confidence DECIMAL(5,2) NOT NULL,
        direction ENUM('in', 'out') NOT NULL,
        status ENUM('recognized', 'pending', 'invalid') NOT NULL DEFAULT 'recognized',
        image_url VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_plate_number (plate_number),
        INDEX idx_timestamp (timestamp),
        INDEX idx_device_id (device_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('数据表初始化完成');
    connection.release();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

export async function query(sql: string, params?: any[]) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export async function getConnection() {
  return await pool.getConnection();
}

export default pool;