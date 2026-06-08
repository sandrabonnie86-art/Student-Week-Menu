import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mainDishesTable } from "./mainDishes";

export const mainDishTypesTable = pgTable("main_dish_types", {
  id: serial("id").primaryKey(),
  mainDishId: integer("main_dish_id").notNull().references(() => mainDishesTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").notNull().default(true),
});

export const insertMainDishTypeSchema = createInsertSchema(mainDishTypesTable).omit({ id: true });
export type InsertMainDishType = z.infer<typeof insertMainDishTypeSchema>;
export type MainDishType = typeof mainDishTypesTable.$inferSelect;
