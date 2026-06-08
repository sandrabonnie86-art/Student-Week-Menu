import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { vendorsTable } from "./vendors";

export const mainDishesTable = pgTable("main_dishes", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => vendorsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertMainDishSchema = createInsertSchema(mainDishesTable).omit({ id: true, createdAt: true });
export type InsertMainDish = z.infer<typeof insertMainDishSchema>;
export type MainDish = typeof mainDishesTable.$inferSelect;
