import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mainDishTypesTable } from "./mainDishTypes";

export const sideItemsTable = pgTable("side_items", {
  id: serial("id").primaryKey(),
  mainDishTypeId: integer("main_dish_type_id").notNull().references(() => mainDishTypesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  isComplementary: boolean("is_complementary").notNull().default(false),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertSideItemSchema = createInsertSchema(sideItemsTable).omit({ id: true });
export type InsertSideItem = z.infer<typeof insertSideItemSchema>;
export type SideItem = typeof sideItemsTable.$inferSelect;
