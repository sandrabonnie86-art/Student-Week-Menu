import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, menuItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/menu-items", async (req, res): Promise<void> => {
  let items = await db.select().from(menuItemsTable);
  const { vendorId, category } = req.query as Record<string, string>;
  if (vendorId) items = items.filter((i) => i.vendorId === Number(vendorId));
  if (category) items = items.filter((i) => i.category === category);
  res.json(items);
});

router.post("/menu-items", async (req, res): Promise<void> => {
  const { vendorId, name, description, category, isAvailable, isComplementary } = req.body;
  if (!vendorId || !name || !category) {
    res.status(400).json({ error: "vendorId, name, and category are required" });
    return;
  }
  const [item] = await db
    .insert(menuItemsTable)
    .values({ vendorId: Number(vendorId), name, description: description ?? null, category, isAvailable: isAvailable ?? true, isComplementary: isComplementary ?? false })
    .returning();
  res.status(201).json(item);
});

router.patch("/menu-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, description, category, isAvailable, isComplementary } = req.body;
  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (category !== undefined) updateData.category = category;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
  if (isComplementary !== undefined) updateData.isComplementary = isComplementary;
  const [item] = await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.json(item);
});

router.delete("/menu-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [item] = await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id)).returning();
  if (!item) { res.status(404).json({ error: "Menu item not found" }); return; }
  res.sendStatus(204);
});

export default router;
