import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mainDishTypesTable } from "./mainDishTypes";

export const proteinItemsTable = pgTable("protein_items", {
  id: serial("id").primaryKey(),
  mainDishTypeId: integer("main_dish_type_id").notNull().references(() => mainDishTypesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertProteinItemSchema = createInsertSchema(proteinItemsTable).omit({ id: true });
export type InsertProteinItem = z.infer<typeof insertProteinItemSchema>;
export type ProteinItem = typeof proteinItemsTable.$inferSelect;
