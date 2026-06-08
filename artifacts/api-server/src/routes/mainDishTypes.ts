import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, mainDishTypesTable, dishConfigsTable } from "@workspace/db";

const router: IRouter = Router();

router.post("/main-dish-types", async (req, res): Promise<void> => {
  const { mainDishId, name, imageUrl, isAvailable } = req.body;
  if (!mainDishId || !name) {
    res.status(400).json({ error: "mainDishId and name are required" });
    return;
  }

  const [type] = await db
    .insert(mainDishTypesTable)
    .values({
      mainDishId: Number(mainDishId),
      name,
      imageUrl: imageUrl ?? null,
      isAvailable: isAvailable ?? true,
    })
    .returning();

  await db.insert(dishConfigsTable).values({ mainDishTypeId: type.id, maxSides: 2, maxProteins: 1 });

  res.status(201).json(type);
});

router.patch("/main-dish-types/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name, imageUrl, isAvailable } = req.body;

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (isAvailable !== undefined) updateData.isAvailable = isAvailable;

  const [type] = await db
    .update(mainDishTypesTable)
    .set(updateData)
    .where(eq(mainDishTypesTable.id, id))
    .returning();

  if (!type) {
    res.status(404).json({ error: "Dish type not found" });
    return;
  }

  res.json(type);
});

router.delete("/main-dish-types/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [type] = await db.delete(mainDishTypesTable).where(eq(mainDishTypesTable.id, id)).returning();
  if (!type) {
    res.status(404).json({ error: "Dish type not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
