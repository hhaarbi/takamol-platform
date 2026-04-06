ALTER TABLE `employees` MODIFY COLUMN `skills` json;--> statement-breakpoint
ALTER TABLE `freelancers` MODIFY COLUMN `skills` json;--> statement-breakpoint
ALTER TABLE `projects` MODIFY COLUMN `tags` json;--> statement-breakpoint
ALTER TABLE `tasks` MODIFY COLUMN `tags` json;