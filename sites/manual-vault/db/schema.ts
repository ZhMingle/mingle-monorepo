import { integer, sqliteTable, text, index } from "drizzle-orm/sqlite-core";
export const products = sqliteTable(
  "products",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id").notNull(),
    name: text("name").notNull(),
    brand: text("brand").notNull().default(""),
    model: text("model").notNull().default(""),
    category: text("category").notNull().default("其他设备"),
    notes: text("notes").notNull().default(""),
    favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [index("products_owner_idx").on(t.ownerId)],
);
export const pages = sqliteTable(
  "pages",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    ownerId: text("owner_id").notNull(),
    objectKey: text("object_key").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    size: integer("size").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: text("created_at").notNull(),
    extraction: text("extraction"),
    reviewed: integer("reviewed", { mode: "boolean" }).notNull().default(false),
    analysisToken: text("analysis_token"),
    analysisStartedAt: text("analysis_started_at"),
  },
  (t) => [index("pages_owner_product_idx").on(t.ownerId, t.productId)],
);
