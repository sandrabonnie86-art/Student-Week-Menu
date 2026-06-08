import { pgTable, serial, integer, boolean, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appConfigTable = pgTable("app_config", {
  id: serial("id").primaryKey(),
  maxSides: integer("max_sides").notNull().default(2),
  maxProteins: integer("max_proteins").notNull().default(1),
  allowMultipleMains: boolean("allow_multiple_mains").notNull().default(false),
  adminPin: text("admin_pin"),
  usherPin: text("usher_pin"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAppConfigSchema = createInsertSchema(appConfigTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfigTable.$inferSelect;
