import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  mainDishesTable,
  mainDishTypesTable,
  sideItemsTable,
  proteinItemsTable,
  dishConfigsTable,
} from "@workspace/db";

const router: IRouter = Router();

async function getTypeFull(type: typeof mainDishTypesTable.$inferSelect) {
  const [sides, proteins, configRow] = await Promise.all([
    db.select().from(sideItemsTable).where(eq(sideItemsTable.mainDishTypeId, type.id)),
    db.select().from(proteinItemsTable).where(eq(proteinItemsTable.mainDishTypeId, type.id)),
    db.select().from(dishConfigsTable).where(eq(dishConfigsTable.mainDishTypeId, type.id)).then((r) => r[0]),
  ]);
  const config = configRow ?? { id: 0, mainDishTypeId: type.id, maxSides: 2, maxProteins: 1 };
  return { ...type, sides, proteins, config };
}

async function getMainDishFull(id: number) {
  const [dish] = await db.select().from(mainDishesTable).where(eq(mainDishesTable.id, id));
  if (!dish) return null;

  const types = await db.select().from(mainDishTypesTable).where(eq(mainDishTypesTable.mainDishId, id));
  const typesWithDetails = await Promise.all(types.map(getTypeFull));

  return { ...dish, createdAt: dish.createdAt.toISOString(), types: typesWithDetails };
}

router.get("/main-dishes", async (req, res): Promise<void> => {
  const vendorId = req.query.vendorId ? Number(req.query.vendorId) : undefined;

  const dishes = vendorId
    ? await db.select().from(mainDishesTable).where(eq(mainDishesTable.vendorId, vendorId))
    : await db.select().from(mainDishesTable);

  const full = await Promise.all(dishes.map((d) => getMainDishFull(d.id)));
  res.json(full.filter(Boolean));
});

router.post("/main-dishes", async (req, res): Promise<void> => {
  const { vendorId, name } = req.body;
  if (!vendorId || !name) {
    res.status(400).json({ error: "vendorId and name are required" });
    return;
  }

  const [dish] = await db.insert(mainDishesTable).values({ vendorId: Number(vendorId), name }).returning();
  const full = await getMainDishFull(dish.id);
  res.status(201).json(full);
});

router.patch("/main-dishes/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { name } = req.body;
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  const [dish] = await db.update(mainDishesTable).set({ name }).where(eq(mainDishesTable.id, id)).returning();
  if (!dish) {
    res.status(404).json({ error: "Main dish not found" });
    return;
  }

  const full = await getMainDishFull(dish.id);
  res.json(full);
});

router.delete("/main-dishes/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [dish] = await db.delete(mainDishesTable).where(eq(mainDishesTable.id, id)).returning();
  if (!dish) {
    res.status(404).json({ error: "Main dish not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
