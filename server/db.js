import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || '31.97.78.86',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'syncarch_db',
  user: process.env.DB_USER || 'syncarch_user',
  password: process.env.DB_PASSWORD || 'SyncArch2025!Secure',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
