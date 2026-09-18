---
name: Additive database schema changes
description: Existing production tables may not be represented in the Drizzle schema, so schema push can suggest unsafe renames.
---

When adding tables to this project, verify the live development schema before accepting Drizzle's interactive rename suggestions; prefer additive, explicitly reviewed changes when unrelated legacy tables are present.

**Why:** The existing database contains tables outside the current Drizzle schema, and an ordinary push proposed interpreting one legacy table as a rename of a new security table.

**How to apply:** Inspect `information_schema` first, preserve unrelated tables, and only use a rename or force operation after confirming the intended mapping.