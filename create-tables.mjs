import mysql from 'mysql2/promise';

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const tables = [
  `CREATE TABLE IF NOT EXISTS tenant_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    contract_id INT NOT NULL,
    access_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at BIGINT NOT NULL,
    created_at BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS tenant_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    contract_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_key VARCHAR(500) NOT NULL,
    doc_type VARCHAR(100) DEFAULT 'other',
    uploaded_at BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    permissions JSON,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    last_used_at BIGINT,
    created_at BIGINT NOT NULL,
    revoked_at BIGINT
  )`,
  `CREATE TABLE IF NOT EXISTS property_listings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    unit_id INT,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    listing_type ENUM('rent','sale') NOT NULL DEFAULT 'rent',
    price DECIMAL(12,2) NOT NULL,
    status ENUM('active','paused','rented','sold') NOT NULL DEFAULT 'active',
    auto_published TINYINT(1) NOT NULL DEFAULT 0,
    contact_phone VARCHAR(50),
    contact_whatsapp VARCHAR(50),
    views_count INT NOT NULL DEFAULT 0,
    inquiries_count INT NOT NULL DEFAULT 0,
    published_at BIGINT,
    expires_at BIGINT,
    created_at BIGINT NOT NULL,
    updated_at BIGINT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS accounting_exports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    export_type VARCHAR(50) NOT NULL,
    date_from BIGINT NOT NULL,
    date_to BIGINT NOT NULL,
    records_count INT NOT NULL DEFAULT 0,
    file_url TEXT,
    file_key VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'completed',
    created_at BIGINT NOT NULL
  )`
];

for (const sql of tables) {
  try {
    await conn.query(sql);
    const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
    console.log(`✅ Created: ${name}`);
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
  }
}

await conn.end();
console.log('Done!');
