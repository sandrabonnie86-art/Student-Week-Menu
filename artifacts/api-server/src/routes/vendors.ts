import { Router, type IRouter } from "express";
import { eq, ne, count, and } from "drizzle-orm";
import { db, vendorsTable, ordersTable } from "@workspace/db";
import {
  GetVendorsQueryParams,
  GetVendorsResponse,
  CreateVendorBody,
  UpdateVendorParams,
  UpdateVendorBody,
  UpdateVendorResponse,
  DeleteVendorParams,
} from "@workspace/api-zod";

function generateRandomPin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const router: IRouter = Router();

async function getVendorsWithOrderCounts() {
  const vendors = await db.select().from(vendorsTable).orderBy(vendorsTable.createdAt);
  const orderCounts = await db
    .select({ vendorId: ordersTable.vendorId, cnt: count() })
    .from(ordersTable)
    .groupBy(ordersTable.vendorId);

  const countMap = new Map(orderCounts.map((r) => [r.vendorId, Number(r.cnt)]));

  return vendors.map((v) => ({
    ...v,
    orderCount: countMap.get(v.id) ?? 0,
    createdAt: v.createdAt.toISOString(),
  }));
}

router.get("/vendors", async (req, res): Promise<void> => {
  const query = GetVendorsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const vendors = await getVendorsWithOrderCounts();
  const filtered = query.data.activeOnly ? vendors.filter((v) => v.isActive) : vendors;

  res.json(GetVendorsResponse.parse(filtered));
});

router.post("/vendors", async (req, res): Promise<void> => {
  const parsed = CreateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [vendor] = await db
    .insert(vendorsTable)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      imageUrl: parsed.data.imageUrl ?? null,
      isActive: parsed.data.isActive ?? true,
      maxPlates: parsed.data.maxPlates ?? 0,
      vendorPin: generateRandomPin(),
    })
    .returning();

  res.status(201).json({ ...vendor, orderCount: 0, createdAt: vendor.createdAt.toISOString() });
});

router.patch("/vendors/:id", async (req, res): Promise<void> => {
  const params = UpdateVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateVendorBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.imageUrl !== undefined) updateData.imageUrl = parsed.data.imageUrl;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;
  if (parsed.data.maxPlates !== undefined) updateData.maxPlates = parsed.data.maxPlates;
  if (parsed.data.vendorPin !== undefined) updateData.vendorPin = parsed.data.vendorPin;

  const [vendor] = await db
    .update(vendorsTable)
    .set(updateData)
    .where(eq(vendorsTable.id, params.data.id))
    .returning();

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const orderCounts = await db
    .select({ cnt: count() })
    .from(ordersTable)
    .where(eq(ordersTable.vendorId, vendor.id));

  res.json(
    UpdateVendorResponse.parse({
      ...vendor,
      orderCount: Number(orderCounts[0]?.cnt ?? 0),
      createdAt: vendor.createdAt.toISOString(),
    })
  );
});

router.delete("/vendors/:id", async (req, res): Promise<void> => {
  const params = DeleteVendorParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [vendor] = await db
    .delete(vendorsTable)
    .where(eq(vendorsTable.id, params.data.id))
    .returning();

  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
