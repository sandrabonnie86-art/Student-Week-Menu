import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, proteinItemsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/protein-items", async (req, res): Promise<void> => {
  const { mainDishTypeId, name, imageUrl, isAvailable } = req.body;
  if (!mainDishTypeId || !name) {
    res.status(400).json({ error: "mainDishTypeId and name are required" });
    return;
  }

  const [item] = await db
    .insert(proteinItemsTable)
    .values({
      mainDishTypeId: Number(mainDishTypeId),
      name,
      imageUrl: imageUrl ?? null,
      isAvailable: isAvailable ?? true,
    })
    .returning();

  res.status(201).json(item);
});

router.patch("/protein-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, imageUrl, isAvailable } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  const [item] = await db
    .update(proteinItemsTable)
    .set(updateData)
    .where(eq(proteinItemsTable.id, id))
    .returning();

  if (!item) {
    res.status(404).json({ error: "Protein item not found" });
    return;
  }

  res.json(item);
});

router.delete("/protein-items/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [item] = await db.delete(proteinItemsTable).where(eq(proteinItemsTable.id, id)).returning();
  if (!item) {
    res.status(404).json({ error: "Protein item not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
