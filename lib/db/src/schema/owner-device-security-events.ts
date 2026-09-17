import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ownerDeviceSecurityEventsTable = pgTable(
  "owner_device_security_events",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    eventType: text("event_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    emailCreatedAtIdx: index("owner_device_security_events_email_created_at_idx").on(
      table.email,
      table.createdAt,
    ),
  }),
);

export const insertOwnerDeviceSecurityEventSchema = createInsertSchema(
  ownerDeviceSecurityEventsTable,
).omit({ id: true, createdAt: true });

export type InsertOwnerDeviceSecurityEvent = z.infer<
  typeof insertOwnerDeviceSecurityEventSchema
>;
export type OwnerDeviceSecurityEvent =
  typeof ownerDeviceSecurityEventsTable.$inferSelect;