// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

import { index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export * from "./owner-device-security-events";

export const activityEventsTable = pgTable(
  "activity_events",
  {
    id: serial("id").primaryKey(),
    eventName: text("event_name").notNull(),
    path: text("path"),
    visitorId: text("visitor_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("activity_events_created_at_idx").on(table.createdAt),
    eventNameIdx: index("activity_events_event_name_idx").on(table.eventName),
    visitorIdIdx: index("activity_events_visitor_id_idx").on(table.visitorId),
  }),
);

export type ActivityEvent = typeof activityEventsTable.$inferSelect;

export const ownerDevicesTable = pgTable(
  "owner_devices",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull().unique(),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index("owner_devices_email_idx").on(table.email),
  }),
);

export type OwnerDevice = typeof ownerDevicesTable.$inferSelect;