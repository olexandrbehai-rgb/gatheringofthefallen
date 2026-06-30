import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),

  // Order identifiers
  order_id: text("order_id"),
  order_number: text("order_number"),
  cart_id: text("cart_id"),
  user_id: text("user_id"),

  // Product / item fields
  product: text("product"),
  product_id: text("product_id"),
  product_name: text("product_name"),
  product_title: text("product_title"),
  title: text("title"),
  sku: text("sku"),
  variant_id: text("variant_id"),
  variant: text("variant"),
  size: text("size"),
  color: text("color"),
  image: text("image"),
  image_url: text("image_url"),
  quantity: integer("quantity").notNull().default(1),

  // Customer name fields
  first_name: text("first_name"),
  last_name: text("last_name"),
  full_name: text("full_name"),
  name: text("name"),

  // Customer contact fields
  email: text("email"),
  phone: text("phone"),
  customer_email: text("customer_email"),
  customer_name: text("customer_name"),
  customer_phone: text("customer_phone"),

  // Shipping / address fields
  address: text("address"),
  address1: text("address1"),
  address2: text("address2"),
  address_line1: text("address_line1"),
  address_line2: text("address_line2"),

  street: text("street"),
  street_address: text("street_address"),
  house_number: text("house_number"),
  building: text("building"),
  door_code: text("door_code"),
  delivery_instructions: text("delivery_instructions"),

  apartment: text("apartment"),
  unit: text("unit"),
  city: text("city"),
  province: text("province"),
  state: text("state"),
  region: text("region"),
  postal_code: text("postal_code"),
  zip: text("zip"),
  zip_code: text("zip_code"),
  country: text("country"),
  country_code: text("country_code"),

  // Billing fields
  billing_name: text("billing_name"),
  billing_email: text("billing_email"),
  billing_phone: text("billing_phone"),
  billing_address: text("billing_address"),
  billing_address_line1: text("billing_address_line1"),
  billing_address_line2: text("billing_address_line2"),
  billing_street: text("billing_street"),
  billing_city: text("billing_city"),
  billing_province: text("billing_province"),
  billing_state: text("billing_state"),
  billing_postal_code: text("billing_postal_code"),
  billing_zip: text("billing_zip"),
  billing_country: text("billing_country"),

  // Price / money fields
  // Text because frontend sends values like "CA$58"
  price: text("price").notNull().default("0"),
  unit_price: text("unit_price").notNull().default("0"),
  subtotal: text("subtotal").notNull().default("0"),
  shipping: text("shipping").notNull().default("0"),
  shipping_cost: text("shipping_cost").notNull().default("0"),
  tax: text("tax").notNull().default("0"),
  taxes: text("taxes").notNull().default("0"),
  discount: text("discount").notNull().default("0"),
  total: text("total").notNull().default("0"),
  amount: text("amount").notNull().default("0"),
  amount_total: text("amount_total").notNull().default("0"),
  total_amount: text("total_amount").notNull().default("0"),
  currency: text("currency").notNull().default("cad"),

  // Status fields
  status: text("status").notNull().default("pending"),
  order_status: text("order_status").notNull().default("pending"),
  payment_status: text("payment_status").notNull().default("pending"),
  fulfillment_status: text("fulfillment_status").notNull().default("unfulfilled"),

  // Stripe fields
  stripe_session_id: text("stripe_session_id"),
  stripe_checkout_session_id: text("stripe_checkout_session_id"),
  stripe_payment_intent_id: text("stripe_payment_intent_id"),
  stripe_customer_id: text("stripe_customer_id"),
  stripe_price_id: text("stripe_price_id"),
  stripe_product_id: text("stripe_product_id"),
  checkout_url: text("checkout_url"),
  payment_url: text("payment_url"),

  // PayPal / generic payment fields
  paypal_order_id: text("paypal_order_id"),
  paypal_capture_id: text("paypal_capture_id"),
  paypal_payer_id: text("paypal_payer_id"),
  paypal_payment_id: text("paypal_payment_id"),
  paypal_status: text("paypal_status"),
  payment_provider: text("payment_provider"),
  payment_method: text("payment_method"),
  provider: text("provider"),
  transaction_id: text("transaction_id"),

  // Delivery / shipping provider fields
  delivery_method: text("delivery_method"),
  shipping_method: text("shipping_method"),
  tracking_number: text("tracking_number"),
  tracking_url: text("tracking_url"),
  carrier: text("carrier"),

  // Notes / messages
  notes: text("notes"),
  note: text("note"),
  message: text("message"),
  comment: text("comment"),

  // Flags
  paid: boolean("paid").notNull().default(false),
  shipped: boolean("shipped").notNull().default(false),
  fulfilled: boolean("fulfilled").notNull().default(false),
  test_mode: boolean("test_mode").notNull().default(false),

  // JSON backup fields
  items: jsonb("items").notNull().default(sql`'[]'::jsonb`),
  cart_items: jsonb("cart_items").notNull().default(sql`'[]'::jsonb`),
  shipping_address: jsonb("shipping_address").default(sql`'{}'::jsonb`),
  billing_address_json: jsonb("billing_address_json").default(sql`'{}'::jsonb`),
  customer: jsonb("customer").default(sql`'{}'::jsonb`),
  metadata: jsonb("metadata").default(sql`'{}'::jsonb`),
  raw_data: jsonb("raw_data").default(sql`'{}'::jsonb`),

  // Timestamps
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  paid_at: timestamp("paid_at"),
  shipped_at: timestamp("shipped_at"),
  fulfilled_at: timestamp("fulfilled_at"),
  canceled_at: timestamp("canceled_at"),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
