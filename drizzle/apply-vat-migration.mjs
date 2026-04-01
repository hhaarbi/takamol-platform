import mysql from 'mysql2/promise';

async function run() {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  try {
    const [cols] = await conn.execute('SHOW COLUMNS FROM subscription_invoices');
    const colNames = cols.map(c => c.Field);
    console.log('Existing columns:', colNames.join(', '));

    const toAdd = [];
    if (!colNames.includes('inv_subtotal')) {
      toAdd.push('ADD COLUMN `inv_subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0');
    }
    if (!colNames.includes('inv_vat_rate')) {
      toAdd.push('ADD COLUMN `inv_vat_rate` DECIMAL(5, 4) DEFAULT 0.1500');
    }
    if (!colNames.includes('inv_vat_amount')) {
      toAdd.push('ADD COLUMN `inv_vat_amount` DECIMAL(10, 2) DEFAULT 0');
    }
    if (!colNames.includes('inv_total_with_vat')) {
      toAdd.push('ADD COLUMN `inv_total_with_vat` DECIMAL(10, 2) NOT NULL DEFAULT 0');
    }

    if (toAdd.length > 0) {
      const sql = 'ALTER TABLE `subscription_invoices` ' + toAdd.join(', ');
      console.log('Running migration:', sql);
      await conn.execute(sql);
      console.log('✅ Columns added successfully');

      // Backfill existing rows
      await conn.execute(`
        UPDATE \`subscription_invoices\`
        SET
          inv_subtotal = inv_amount,
          inv_vat_amount = ROUND(inv_amount * 0.15, 2),
          inv_total_with_vat = ROUND(inv_amount * 1.15, 2)
        WHERE inv_subtotal = 0
      `);
      console.log('✅ Backfill done');
    } else {
      console.log('ℹ️  All VAT columns already exist — skipping');
    }
  } finally {
    await conn.end();
  }
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
