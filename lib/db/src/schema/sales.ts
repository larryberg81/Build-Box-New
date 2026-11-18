import { sql } from "drizzle-orm";
import { boolean, check, index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// No buyer names, email addresses, phone numbers, or street addresses are stored.
export const salesTable = pgTable("sales", {
  id: serial("id").primaryKey(),
  sourceReference: text("source_reference").notNull().unique(),
  country: text("country", { enum: ["US", "CA"] }).notNull(),
  productType: text("product_type", { enum: ["container", "genset"] }).notNull(),
  productName: text("product_name").notNull(),
  city: text("city").notNull(),
  imagePath: text("image_path"),
  purchasedAt: timestamp("purchased_at", { withTimezone: true }).notNull(),
  verified: boolean("verified").notNull().default(false),
  displayApproved: boolean("display_approved").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check("sales_country_valid", sql`${table.country} IN ('US', 'CA')`),
  check("sales_product_type_valid", sql`${table.productType} IN ('container', 'genset')`),
  index("sales_feed_idx").on(table.country, table.displayApproved, table.verified, table.purchasedAt),
]);

export const insertSaleSchema = createInsertSchema(salesTable, {
  sourceReference: z.string().trim().min(1).max(120),
  country: z.enum(["US", "CA"]),
  productType: z.enum(["container", "genset"]),
  productName: z.string().trim().min(1).max(160),
  city: z.string().trim().min(1).max(100),
  // Only public local product photos; never external tracking URLs.
  imagePath: z.string().max(300).regex(/^\/images\/[a-zA-Z0-9_/-]+\.(?:webp|png|jpe?g)$/i).nullable().optional(),
  purchasedAt: z.date().refine(value => value.getTime() <= Date.now(), "Purchase date cannot be in the future"),
}).omit({ id: true, createdAt: true });
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type Sale = typeof salesTable.$inferSelect;
