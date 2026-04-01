-- Add VAT fields to subscription_invoices table
ALTER TABLE `subscription_invoices`
ADD COLUMN `inv_subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `plan_id_si`,
ADD COLUMN `inv_vat_rate` DECIMAL(5, 4) DEFAULT 0.1500 AFTER `inv_subtotal`,
ADD COLUMN `inv_vat_amount` DECIMAL(10, 2) DEFAULT 0 AFTER `inv_vat_rate`,
ADD COLUMN `inv_total_with_vat` DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER `inv_amount`;

-- Backfill existing invoices with VAT calculations (15%)
UPDATE `subscription_invoices`
SET 
  `inv_subtotal` = `inv_amount`,
  `inv_vat_amount` = ROUND(`inv_amount` * 0.15, 2),
  `inv_total_with_vat` = ROUND(`inv_amount` * 1.15, 2)
WHERE `inv_subtotal` = 0;
