import { sqliteTable, text, integer, primaryKey, check } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
export const settings = sqliteTable('shop_settings', { id: integer('id').primaryKey(), payload: text('payload').notNull() });
export const products = sqliteTable('products', {
  id: text('id').primaryKey(), name: text('name').notNull(), category: text('category').notNull(), description: text('description').notNull().default(''), imageUrl: text('image_url').notNull().default(''),
  priceCents: integer('price_cents'), minimumCents: integer('minimum_cents'), stock: integer('stock').notNull().default(0), reserved: integer('reserved').notNull().default(0),
  enabled: integer('enabled').notNull().default(0), negotiable: integer('negotiable').notNull().default(0), bulkQty: integer('bulk_qty').notNull().default(2), bulkPercent: integer('bulk_percent').notNull().default(0), revision: integer('revision').notNull().default(1), updatedAt: integer('updated_at').notNull(),
}, t => [check('inventory_valid', sql`${t.stock} >= ${t.reserved} AND ${t.reserved} >= 0`), check('price_valid', sql`(${t.priceCents} IS NULL OR ${t.priceCents} > 0) AND (${t.minimumCents} IS NULL OR (${t.minimumCents} > 0 AND ${t.minimumCents} <= ${t.priceCents}))`)]);
export const quotes = sqliteTable('quotes', { id: text('id').primaryKey(), visitor: text('visitor').notNull(), productId: text('product_id').notNull(), quantity: integer('quantity').notNull(), unitCents: integer('unit_cents').notNull(), revision: integer('revision').notNull(), expiresAt: integer('expires_at').notNull() });
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(), attempt: text('attempt').notNull().unique(), visitor: text('visitor').notNull(), fingerprint: text('fingerprint').notNull(), state: text('state').notNull().default('creating'),
  totalCents: integer('total_cents').notNull(), shippingCents: integer('shipping_cents').notNull(), fulfilment: text('fulfilment').notNull(), sessionId: text('session_id').unique(), sessionUrl: text('session_url'), checkoutParams: text('checkout_params'), customer: text('customer'), tracking: text('tracking').notNull().default(''), createdAt: integer('created_at').notNull(),
});
export const orderItems = sqliteTable('order_items', { orderId: text('order_id').notNull().references(() => orders.id), productId: text('product_id').notNull().references(() => products.id), name: text('name').notNull(), quantity: integer('quantity').notNull(), unitCents: integer('unit_cents').notNull(), revision: integer('revision').notNull() }, t => [primaryKey({ columns: [t.orderId, t.productId] })]);
export const events = sqliteTable('payment_events', { id: text('id').primaryKey(), createdAt: integer('created_at').notNull() });
export const messages = sqliteTable('chat_messages', { id: text('id').primaryKey(), visitor: text('visitor').notNull(), direction: text('direction').notNull(), text: text('text').notNull(), contact: text('contact').notNull().default(''), needsOwner: integer('needs_owner').notNull().default(0), resolved: integer('resolved').notNull().default(0), createdAt: integer('created_at').notNull() });
export const limits = sqliteTable('rate_limits', { id: text('id').primaryKey(), count: integer('count').notNull() });
export const audit = sqliteTable('shop_audit', { id: text('id').primaryKey(), action: text('action').notNull(), detail: text('detail').notNull(), createdAt: integer('created_at').notNull() });
export const mediaAssets = sqliteTable('media_assets', {
  id: text('id').primaryKey(), storageKey: text('storage_key').notNull().unique(), kind: text('kind').notNull(), contentType: text('content_type').notNull(),
  size: integer('size').notNull(), name: text('name').notNull(), createdAt: integer('created_at').notNull(),
});
export const productMedia = sqliteTable('product_media', {
  productId: text('product_id').notNull().references(() => products.id), assetId: text('asset_id').notNull().references(() => mediaAssets.id), position: integer('position').notNull(),
}, t => [primaryKey({ columns: [t.productId, t.assetId] })]);
