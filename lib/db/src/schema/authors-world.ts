import { createInsertSchema } from "drizzle-zod";
import {
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type AuthorPlatformLink = {
  label: string;
  url: string;
};

export const authorsTable = pgTable(
  "authors",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    displayName: text("display_name").notNull(),
    role: text("role").notNull(),
    bio: text("bio").notNull(),
    avatarUrl: text("avatar_url"),
    platformLinks: jsonb("platform_links")
      .$type<AuthorPlatformLink[]>()
      .notNull()
      .default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    displayNameIdx: index("authors_display_name_idx").on(table.displayName),
    createdAtIdx: index("authors_created_at_idx").on(table.createdAt),
  }),
);

export const chatMessagesTable = pgTable(
  "authors_world_chat_messages",
  {
    id: serial("id").primaryKey(),
    authorId: integer("author_id")
      .notNull()
      .references(() => authorsTable.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("authors_world_chat_created_at_idx").on(table.createdAt),
    authorIdIdx: index("authors_world_chat_author_id_idx").on(table.authorId),
  }),
);

export const insertAuthorSchema = createInsertSchema(authorsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({
  id: true,
  createdAt: true,
});

export type Author = typeof authorsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;