import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { ordersTable } from "./orders";

export const orderSidesTable = pgTable("order_sides", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  sideId: integer("side_id").notNull(),
  sideName: text("side_name").notNull(),
  isComplementary: boolean("is_complementary").notNull().default(false),
});

export const orderProteinsTable = pgTable("order_proteins", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  proteinId: integer("protein_id").notNull(),
  proteinName: text("protein_name").notNull(),
});

export type OrderSide = typeof orderSidesTable.$inferSelect;
export type OrderProtein = typeof orderProteinsTable.$inferSelect;
