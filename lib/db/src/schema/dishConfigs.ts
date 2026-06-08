import { pgTable, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { mainDishTypesTable } from "./mainDishTypes";

export const dishConfigsTable = pgTable("dish_configs", {
  id: serial("id").primaryKey(),
  mainDishTypeId: integer("main_dish_type_id").notNull().unique().references(() => mainDishTypesTable.id, { onDelete: "cascade" }),
  maxSides: integer("max_sides").notNull().default(2),
  maxProteins: integer("max_proteins").notNull().default(1),
});

export const insertDishConfigSchema = createInsertSchema(dishConfigsTable).omit({ id: true });
export type InsertDishConfig = z.infer<typeof insertDishConfigSchema>;
export type DishConfig = typeof dishConfigsTable.$inferSelect;
