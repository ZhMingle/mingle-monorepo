CREATE TABLE `media_assets` (
	`id` text PRIMARY KEY NOT NULL,
	`storage_key` text NOT NULL,
	`kind` text NOT NULL,
	`content_type` text NOT NULL,
	`size` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `media_assets_storage_key_unique` ON `media_assets` (`storage_key`);--> statement-breakpoint
CREATE TABLE `product_media` (
	`product_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`position` integer NOT NULL,
	PRIMARY KEY(`product_id`, `asset_id`),
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`asset_id`) REFERENCES `media_assets`(`id`) ON UPDATE no action ON DELETE no action
);
