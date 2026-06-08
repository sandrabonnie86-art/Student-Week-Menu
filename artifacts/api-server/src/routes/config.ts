import { Router, type IRouter } from "express";
import { db, appConfigTable } from "@workspace/db";
import { UpdateConfigBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateConfig() {
  const configs = await db.select().from(appConfigTable);
  if (configs.length > 0) return configs[0];

  const [config] = await db
    .insert(appConfigTable)
    .values({ maxSides: 2, maxProteins: 1, allowMultipleMains: false })
    .returning();

  return config;
}

router.get("/config", async (_req, res): Promise<void> => {
  const config = await getOrCreateConfig();
  res.json({
    ...config,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  });
});

router.put("/config", async (req, res): Promise<void> => {
  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getOrCreateConfig();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.maxSides !== undefined) updateData.maxSides = parsed.data.maxSides;
  if (parsed.data.maxProteins !== undefined) updateData.maxProteins = parsed.data.maxProteins;
  if (parsed.data.allowMultipleMains !== undefined) updateData.allowMultipleMains = parsed.data.allowMultipleMains;
  if (parsed.data.adminPin !== undefined) updateData.adminPin = parsed.data.adminPin;
  if (parsed.data.usherPin !== undefined) updateData.usherPin = parsed.data.usherPin;

  const { eq } = await import("drizzle-orm");
  const [config] = await db
    .update(appConfigTable)
    .set(updateData)
    .where(eq(appConfigTable.id, existing.id))
    .returning();

  res.json({
    ...config,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  });
});

export default router;
