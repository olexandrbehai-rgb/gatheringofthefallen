import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const trustedDeviceCleanupHealthTable = pgTable(
  "trusted_device_cleanup_health",
  {
    healthKey: text("health_key").primaryKey(),
    consecutiveFailures: integer("consecutive_failures").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
);

export type TrustedDeviceCleanupHealth =
  typeof trustedDeviceCleanupHealthTable.$inferSelect;