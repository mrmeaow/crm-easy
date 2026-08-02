ALTER TABLE `contacts` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `deals` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `leads` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `tasks` ADD `deleted_at` integer;