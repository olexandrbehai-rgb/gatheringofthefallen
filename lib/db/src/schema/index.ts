import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),

  // Main order/product fields
  product: text("product"),
  product_id: text("product_id"),
  product_name: text("product_name"),
  size: text("size"),
  color: text("color"),
  quantity: integer("quantity").notNull().default(1),

  // Price fields
  price: integer("price").notNull().default(0),
  total: integer("total").notNull().default(0),
  amount_total: integer("amount_total").notNull().default(0),
  currency: text("currency").notNull().default("cad"),

  // Order status
  status: text("status").notNull().default("pending"),

  // Customer fields
  customer_email: text("customer_email"),
  customer_name: text("customer_name"),
  customer_phone: text("customer_phone"),

  // Stripe fields
  stripe_session_id: text("stripe_session_id"),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  checkout_url: text("checkout_url"),

  // Cart / shipping data
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  shipping_address: jsonb("shipping_address").default(sql`'{}'::jsonb`),

  // Timestamps
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
