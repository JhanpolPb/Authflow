const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'authflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Conexión a MySQL establecida correctamente');
    conn.release();
  } catch (error) {
    console.error('Error conectando a MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
