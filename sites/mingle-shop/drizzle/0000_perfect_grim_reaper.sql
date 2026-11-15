CREATE TABLE `shop_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`id` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`direction` text NOT NULL,
	`text` text NOT NULL,
	`contact` text DEFAULT '' NOT NULL,
	`needs_owner` integer DEFAULT 0 NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`name` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cents` integer NOT NULL,
	`revision` integer NOT NULL,
	PRIMARY KEY(`order_id`, `product_id`),
	FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`attempt` text NOT NULL,
	`visitor` text NOT NULL,
	`fingerprint` text NOT NULL,
	`state` text DEFAULT 'creating' NOT NULL,
	`total_cents` integer NOT NULL,
	`shipping_cents` integer NOT NULL,
	`fulfilment` text NOT NULL,
	`session_id` text,
	`session_url` text,
	`customer` text,
	`tracking` text DEFAULT '' NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `orders_attempt_unique` ON `orders` (`attempt`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_session_id_unique` ON `orders` (`session_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`image_url` text DEFAULT '' NOT NULL,
	`price_cents` integer,
	`minimum_cents` integer,
	`stock` integer DEFAULT 0 NOT NULL,
	`reserved` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL,
	`negotiable` integer DEFAULT 0 NOT NULL,
	`bulk_qty` integer DEFAULT 2 NOT NULL,
	`bulk_percent` integer DEFAULT 0 NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` integer NOT NULL,
	CONSTRAINT "inventory_valid" CHECK("products"."stock" >= "products"."reserved" AND "products"."reserved" >= 0),
	CONSTRAINT "price_valid" CHECK(("products"."price_cents" IS NULL OR "products"."price_cents" > 0) AND ("products"."minimum_cents" IS NULL OR ("products"."minimum_cents" > 0 AND "products"."minimum_cents" <= "products"."price_cents")))
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor` text NOT NULL,
	`product_id` text NOT NULL,
	`quantity` integer NOT NULL,
	`unit_cents` integer NOT NULL,
	`revision` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `shop_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL
);
