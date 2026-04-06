import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const conn = await mysql.createConnection(DATABASE_URL);

try {
  // Check if admin already exists
  const [existing] = await conn.execute(
    "SELECT id FROM internal_accounts WHERE username = 'admin' LIMIT 1"
  );
  
  if (existing.length > 0) {
    console.log('✅ Admin account already exists');
    await conn.end();
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('Admin@2024', 10);
  
  await conn.execute(
    `INSERT INTO internal_accounts (username, passwordHash, role, isActive, createdAt, updatedAt)
     VALUES (?, ?, 'admin', 1, NOW(), NOW())`,
    ['admin', passwordHash]
  );
  
  console.log('✅ Admin account created successfully');
  console.log('   Username: admin');
  console.log('   Password: Admin@2024');
  console.log('   ⚠️  Please change the password after first login!');
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
