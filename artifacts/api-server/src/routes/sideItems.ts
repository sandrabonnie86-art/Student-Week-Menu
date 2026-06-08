import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, sideItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/side-items", async (req, res): Promise<void> => {
  const { mainDishTypeId, name, imageUrl, isComplementary, isAvailable } = req.body;
  if (!mainDishTypeId || !name) {
    res.status(400).json({ error: "mainDishTypeId and name are required" });
    return;
  }

  const [item] = await db
    .insert(sideItemsTable)
    .values({
      mainDishTypeId: Number(mainDishTypeId),
      name,
      imageUrl: imageUrl ?? null,
      isComplementary: isComplementary ?? false,
      isAvailable: isAvailable ?? true,
    })
    .returning();

  res.status(201).json(item);
});

router.patch("/side-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, imageUrl, isComplementary, isAvailable } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (isComplementary !== undefined) updateData.isComplementary = isComplementary;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  const [item] = await db
    .update(sideItemsTable)
    .set(updateData)
    .where(eq(sideItemsTable.id, id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Side item not found" });
    return;
  }

  res.json(item);
});

router.delete("/side-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [item] = await db.delete(sideItemsTable).where(eq(sideItemsTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Side item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
