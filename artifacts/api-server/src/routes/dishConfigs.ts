import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dishConfigsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dish-configs/type/:typeId", async (req, res): Promise<void> => {
  const typeId = Number(req.params.typeId);
  const [config] = await db.select().from(dishConfigsTable).where(eq(dishConfigsTable.mainDishTypeId, typeId));

  if (!config) {
    res.json({ id: 0, mainDishTypeId: typeId, maxSides: 2, maxProteins: 1 });
    return;
  }

  res.json(config);
});

router.put("/dish-configs/type/:typeId", async (req, res): Promise<void> => {
  const typeId = Number(req.params.typeId);
  const { maxSides, maxProteins } = req.body;

  const updateData: Record<string, unknown> = {};
  if (maxSides !== undefined) updateData.maxSides = Number(maxSides);
  if (maxProteins !== undefined) updateData.maxProteins = Number(maxProteins);

  const existing = await db
    .select()
    .from(dishConfigsTable)
    .where(eq(dishConfigsTable.mainDishTypeId, typeId))
    .then((r) => r[0]);

  let config;
  if (existing) {
    [config] = await db
      .update(dishConfigsTable)
      .set(updateData)
      .where(eq(dishConfigsTable.mainDishTypeId, typeId))
      .returning();
  } else {
    [config] = await db
      .insert(dishConfigsTable)
      .values({ mainDishTypeId: typeId, maxSides: Number(maxSides ?? 2), maxProteins: Number(maxProteins ?? 1) })
      .returning();
  }

  res.json(config);
});

export default router;
