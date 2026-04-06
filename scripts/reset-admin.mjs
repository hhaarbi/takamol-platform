import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const conn = await mysql.createConnection(process.env.DATABASE_URL);
const passwordHash = await bcrypt.hash('Admin@2024', 10);

await conn.execute(
  "UPDATE internal_accounts SET passwordHash = ? WHERE username = 'admin'",
  [passwordHash]
);

console.log('✅ Admin password reset to: Admin@2024');
await conn.end();
