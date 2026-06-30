import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),

  status: text("status").notNull().default("pending"),

  stripe_session_id: text("stripe_session_id"),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),

  customer_email: text("customer_email"),
  customer_name: text("customer_name"),

  currency: text("currency").notNull().default("cad"),
  amount_total: integer("amount_total").notNull().default(0),

  items: jsonb("items").notNull().default([]),

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
