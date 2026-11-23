CREATE TABLE `pages` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`owner_id` text NOT NULL,
	`object_key` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` text NOT NULL,
	`extraction` text,
	`reviewed` integer DEFAULT false NOT NULL,
	`analysis_token` text,
	`analysis_started_at` text,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `pages_owner_product_idx` ON `pages` (`owner_id`,`product_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`brand` text DEFAULT '' NOT NULL,
	`model` text DEFAULT '' NOT NULL,
	`category` text DEFAULT '其他设备' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`favorite` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `products_owner_idx` ON `products` (`owner_id`);