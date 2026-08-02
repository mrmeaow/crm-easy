CREATE TABLE `deal_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`deal_id` integer NOT NULL,
	`action` text NOT NULL,
	`from_stage_id` integer,
	`to_stage_id` integer,
	`note` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`deal_id`) REFERENCES `deals`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deal_log_deal_idx` ON `deal_log` (`deal_id`);
--> statement-breakpoint
CREATE TABLE `custom_field_defs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`label` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`options` text,
	`position` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `custom_field_defs_entity_idx` ON `custom_field_defs` (`entity_type`);
--> statement-breakpoint
CREATE TABLE `custom_field_values` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`def_id` integer NOT NULL,
	`entity_id` integer NOT NULL,
	`value` text,
	FOREIGN KEY (`def_id`) REFERENCES `custom_field_defs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `custom_field_values_def_entity_idx` ON `custom_field_values` (`def_id`, `entity_id`);
