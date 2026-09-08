CREATE TABLE `builds` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`state` text NOT NULL,
	`saved_total` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `builds_owner_updated` ON `builds` (`owner_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `price_notes` (
	`owner_id` text NOT NULL,
	`part_id` text NOT NULL,
	`price_cents` integer NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner_id`, `part_id`)
);
