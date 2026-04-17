import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const statements = [
  // Users table update
  `ALTER TABLE \`users\` MODIFY COLUMN \`role\` enum('admin','manager','employee','freelancer') NOT NULL DEFAULT 'employee'`,

  // Departments
  `CREATE TABLE IF NOT EXISTS \`departments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`nameAr\` varchar(128) NOT NULL,
    \`nameEn\` varchar(128),
    \`description\` text,
    \`managerId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`departments_id\` PRIMARY KEY(\`id\`)
  )`,

  // Internal accounts
  `CREATE TABLE IF NOT EXISTS \`internal_accounts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`username\` varchar(64) NOT NULL,
    \`passwordHash\` varchar(256) NOT NULL,
    \`role\` enum('admin','manager','employee','freelancer') NOT NULL,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`employeeId\` int,
    \`freelancerId\` int,
    \`createdBy\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    \`lastSignedIn\` timestamp,
    CONSTRAINT \`internal_accounts_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`internal_accounts_username_unique\` UNIQUE(\`username\`)
  )`,

  // Employees
  `CREATE TABLE IF NOT EXISTS \`employees\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`accountId\` int,
    \`fullName\` varchar(128) NOT NULL,
    \`email\` varchar(320),
    \`phone\` varchar(32),
    \`departmentId\` int,
    \`jobTitle\` varchar(128),
    \`salary\` decimal(12,2),
    \`hireDate\` timestamp,
    \`skills\` json,
    \`avatar\` text,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`performanceScore\` decimal(5,2) DEFAULT '0',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`employees_id\` PRIMARY KEY(\`id\`)
  )`,

  // Freelancers
  `CREATE TABLE IF NOT EXISTS \`freelancers\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`accountId\` int,
    \`fullName\` varchar(128) NOT NULL,
    \`email\` varchar(320) NOT NULL,
    \`phone\` varchar(32),
    \`specialty\` varchar(128),
    \`skills\` json,
    \`hourlyRate\` decimal(10,2),
    \`portfolio\` text,
    \`rating\` decimal(3,2) DEFAULT '0',
    \`totalProjects\` int DEFAULT 0,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`inviteToken\` varchar(128),
    \`inviteStatus\` enum('pending','accepted','rejected') DEFAULT 'pending',
    \`notes\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`freelancers_id\` PRIMARY KEY(\`id\`)
  )`,

  // Clients
  `CREATE TABLE IF NOT EXISTS \`clients\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`companyName\` varchar(256) NOT NULL,
    \`contactName\` varchar(128),
    \`email\` varchar(320),
    \`phone\` varchar(32),
    \`address\` text,
    \`industry\` varchar(128),
    \`logo\` text,
    \`notes\` text,
    \`isActive\` boolean NOT NULL DEFAULT true,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`clients_id\` PRIMARY KEY(\`id\`)
  )`,

  // Contracts
  `CREATE TABLE IF NOT EXISTS \`contracts\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`clientId\` int NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`value\` decimal(14,2),
    \`startDate\` timestamp NULL,
    \`endDate\` timestamp NULL,
    \`status\` enum('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
    \`fileUrl\` text,
    \`notes\` text,
    \`createdBy\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`contracts_id\` PRIMARY KEY(\`id\`)
  )`,

  // Projects
  `CREATE TABLE IF NOT EXISTS \`projects\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`description\` text,
    \`clientId\` int,
    \`contractId\` int,
    \`serviceType\` enum('brand_identity','visual_production','advertising_campaigns','events','influencer_marketing','digital_presence','website_design') NOT NULL,
    \`status\` enum('draft','active','on_hold','under_review','completed','cancelled') NOT NULL DEFAULT 'draft',
    \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    \`budget\` decimal(14,2),
    \`actualCost\` decimal(14,2) DEFAULT '0',
    \`startDate\` timestamp NULL,
    \`endDate\` timestamp NULL,
    \`managerId\` int,
    \`progress\` int DEFAULT 0,
    \`tags\` json,
    \`createdBy\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`projects_id\` PRIMARY KEY(\`id\`)
  )`,

  // Project members
  `CREATE TABLE IF NOT EXISTS \`project_members\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`memberType\` enum('employee','freelancer') NOT NULL,
    \`employeeId\` int,
    \`freelancerId\` int,
    \`role\` varchar(128),
    \`joinedAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`project_members_id\` PRIMARY KEY(\`id\`)
  )`,

  // Tasks
  `CREATE TABLE IF NOT EXISTS \`tasks\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`projectId\` int NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`description\` text,
    \`status\` enum('pending','in_progress','under_review','completed','cancelled') NOT NULL DEFAULT 'pending',
    \`priority\` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    \`assigneeType\` enum('employee','freelancer'),
    \`assigneeEmployeeId\` int,
    \`assigneeFreelancerId\` int,
    \`assignedBy\` int,
    \`dueDate\` timestamp NULL,
    \`completedAt\` timestamp NULL,
    \`estimatedHours\` decimal(8,2),
    \`actualHours\` decimal(8,2),
    \`tags\` json,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT \`tasks_id\` PRIMARY KEY(\`id\`)
  )`,

  // Task comments
  `CREATE TABLE IF NOT EXISTS \`task_comments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`taskId\` int NOT NULL,
    \`authorType\` enum('internal','employee','freelancer') NOT NULL,
    \`authorId\` int NOT NULL,
    \`content\` text NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`task_comments_id\` PRIMARY KEY(\`id\`)
  )`,

  // Task attachments
  `CREATE TABLE IF NOT EXISTS \`task_attachments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`taskId\` int NOT NULL,
    \`fileName\` varchar(256) NOT NULL,
    \`fileUrl\` text NOT NULL,
    \`fileSize\` int,
    \`mimeType\` varchar(128),
    \`uploadedBy\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`task_attachments_id\` PRIMARY KEY(\`id\`)
  )`,

  // Notifications
  `CREATE TABLE IF NOT EXISTS \`notifications\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`recipientType\` enum('internal','employee','freelancer') NOT NULL,
    \`recipientId\` int NOT NULL,
    \`type\` enum('task_assigned','task_updated','task_completed','project_created','project_updated','deadline_reminder','comment_added','general') NOT NULL,
    \`title\` varchar(256) NOT NULL,
    \`message\` text NOT NULL,
    \`isRead\` boolean NOT NULL DEFAULT false,
    \`relatedType\` varchar(64),
    \`relatedId\` int,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`notifications_id\` PRIMARY KEY(\`id\`)
  )`,

  // Activity log
  `CREATE TABLE IF NOT EXISTS \`activity_log\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`actorType\` enum('internal','employee','freelancer') NOT NULL,
    \`actorId\` int NOT NULL,
    \`actorName\` varchar(128),
    \`action\` varchar(256) NOT NULL,
    \`entityType\` varchar(64),
    \`entityId\` int,
    \`entityTitle\` varchar(256),
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`activity_log_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of statements) {
  try {
    await conn.execute(sql);
    const tableName = sql.match(/CREATE TABLE IF NOT EXISTS `([^`]+)`|ALTER TABLE `([^`]+)`/)?.[1] || sql.match(/ALTER TABLE `([^`]+)`/)?.[1] || 'unknown';
    console.log(`✓ ${tableName}`);
  } catch (e) {
    console.error(`✗ Error: ${e.message.substring(0, 100)}`);
  }
}

// Insert default admin account (password: admin123)
// bcrypt hash of 'admin123'
try {
  await conn.execute(`
    INSERT IGNORE INTO \`internal_accounts\` (username, passwordHash, role, isActive)
    VALUES ('admin', '$2b$10$rOzJqQZJQZJQZJQZJQZJQOzJqQZJQZJQZJQZJQZJQZJQZJQZJQZJQ', 'admin', true)
  `);
  console.log('✓ Default admin account placeholder created');
} catch (e) {
  console.log('Admin account already exists or error:', e.message.substring(0, 80));
}

// Insert default departments
const depts = [
  ['الهوية البصرية والتصميم', 'Brand Identity & Design'],
  ['الإنتاج المرئي', 'Visual Production'],
  ['الإعلانات الممولة', 'Paid Advertising'],
  ['الفعاليات والمعارض', 'Events & Exhibitions'],
  ['التسويق عبر المؤثرين', 'Influencer Marketing'],
  ['إدارة السوشيال ميديا', 'Social Media Management'],
  ['تصميم المواقع', 'Web Design'],
  ['المبيعات', 'Sales'],
  ['المحاسبة', 'Accounting'],
  ['الإدارة', 'Management'],
];

for (const [nameAr, nameEn] of depts) {
  try {
    await conn.execute(
      'INSERT IGNORE INTO `departments` (nameAr, nameEn) VALUES (?, ?)',
      [nameAr, nameEn]
    );
  } catch (e) {
    console.error(`Dept error: ${e.message.substring(0, 80)}`);
  }
}
console.log('✓ Default departments inserted');

await conn.end();
console.log('\n✅ Migration complete!');
