import { Router, type IRouter } from "express";
import { eq, desc, and, or, ilike, inArray, count } from "drizzle-orm";
import { sql } from "drizzle-orm";
import {
  db,
  ordersTable,
  orderSidesTable,
  orderProteinsTable,
  sideItemsTable,
  proteinItemsTable,
  mainDishTypesTable,
  mainDishesTable,
  vendorsTable,
} from "@workspace/db";

const router: IRouter = Router();

// Check if a name already has an order
router.get("/orders/check/:name", async (req, res): Promise<void> => {
  const { name } = req.params;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const normalizedName = name.trim().toLowerCase();
  const existingOrder = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(ilike(ordersTable.customerName, normalizedName));
  res.json({ exists: existingOrder.length > 0 });
});

async function enrichOrder(orderId: number) {
  const [order] = await db
    .select({
      id: ordersTable.id,
      customerName: ordersTable.customerName,
      tableNumber: ordersTable.tableNumber,
      vendorId: ordersTable.vendorId,
      vendorName: vendorsTable.name,
      mainDishTypeId: ordersTable.mainDishTypeId,
      mainDishTypeName: ordersTable.mainDishTypeName,
      mainDishName: ordersTable.mainDishName,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .leftJoin(vendorsTable, eq(ordersTable.vendorId, vendorsTable.id))
    .where(eq(ordersTable.id, orderId));

  if (!order) return null;

  const [sides, proteins] = await Promise.all([
    db.select().from(orderSidesTable).where(eq(orderSidesTable.orderId, orderId)),
    db.select().from(orderProteinsTable).where(eq(orderProteinsTable.orderId, orderId)),
  ]);

  return {
    ...order,
    vendorName: order.vendorName ?? "Unknown",
    createdAt: order.createdAt.toISOString(),
    sides,
    proteins,
  };
}

async function enrichOrders(orderIds: number[]) {
  if (orderIds.length === 0) return [];

  const orders = await db
    .select({
      id: ordersTable.id,
      customerName: ordersTable.customerName,
      tableNumber: ordersTable.tableNumber,
      vendorId: ordersTable.vendorId,
      vendorName: vendorsTable.name,
      mainDishTypeId: ordersTable.mainDishTypeId,
      mainDishTypeName: ordersTable.mainDishTypeName,
      mainDishName: ordersTable.mainDishName,
      status: ordersTable.status,
      createdAt: ordersTable.createdAt,
    })
    .from(ordersTable)
    .leftJoin(vendorsTable, eq(ordersTable.vendorId, vendorsTable.id))
    .where(inArray(ordersTable.id, orderIds))
    .orderBy(desc(ordersTable.createdAt));

  const [allSides, allProteins] = await Promise.all([
    db.select().from(orderSidesTable).where(inArray(orderSidesTable.orderId, orderIds)),
    db.select().from(orderProteinsTable).where(inArray(orderProteinsTable.orderId, orderIds)),
  ]);

  const sidesMap = new Map<number, typeof allSides>();
  const proteinsMap = new Map<number, typeof allProteins>();
  for (const s of allSides) {
    if (!sidesMap.has(s.orderId)) sidesMap.set(s.orderId, []);
    sidesMap.get(s.orderId)!.push(s);
  }
  for (const p of allProteins) {
    if (!proteinsMap.has(p.orderId)) proteinsMap.set(p.orderId, []);
    proteinsMap.get(p.orderId)!.push(p);
  }

  return orders.map((o) => ({
    ...o,
    vendorName: o.vendorName ?? "Unknown",
    createdAt: o.createdAt.toISOString(),
    sides: sidesMap.get(o.id) ?? [],
    proteins: proteinsMap.get(o.id) ?? [],
  }));
}

function buildSearchFilter(search: string) {
  return or(
    ilike(ordersTable.customerName, `%${search}%`),
    ilike(ordersTable.tableNumber, `%${search}%`)
  );
}

router.get("/orders/summary", async (_req, res): Promise<void> => {
  const orders = await db
    .select({ status: ordersTable.status, vendorId: ordersTable.vendorId, vendorName: vendorsTable.name })
    .from(ordersTable)
    .leftJoin(vendorsTable, eq(ordersTable.vendorId, vendorsTable.id));

  const total = orders.length;
  const pending = orders.filter((o) => o.status === "pending").length;
  const served = orders.filter((o) => o.status === "served").length;

  const vendorMap = new Map<number, { vendorId: number; vendorName: string; count: number }>();
  for (const o of orders) {
    if (!vendorMap.has(o.vendorId)) {
      vendorMap.set(o.vendorId, { vendorId: o.vendorId, vendorName: o.vendorName ?? "", count: 0 });
    }
    vendorMap.get(o.vendorId)!.count++;
  }

  res.json({ total, pending, served, byVendor: Array.from(vendorMap.values()) });
});

router.get("/orders/history", async (req, res): Promise<void> => {
  const { status, vendorId, search, dateFrom, dateTo } = req.query as Record<string, string>;

  const conditions = [];
  if (status === "pending" || status === "served") conditions.push(eq(ordersTable.status, status));
  if (vendorId) conditions.push(eq(ordersTable.vendorId, Number(vendorId)));
  if (search) { const f = buildSearchFilter(search); if (f) conditions.push(f); }
  if (dateFrom) conditions.push(sql`${ordersTable.createdAt} >= ${new Date(dateFrom)}`);
  if (dateTo) conditions.push(sql`${ordersTable.createdAt} <= ${new Date(dateTo)}`);

  const rows = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(await enrichOrders(rows.map((r) => r.id)));
});

router.get("/orders/by-table", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt));

  const enriched = await enrichOrders(rows.map((r) => r.id));

  const grouped = new Map<string, typeof enriched>();
  for (const o of enriched) {
    if (!grouped.has(o.tableNumber)) grouped.set(o.tableNumber, []);
    grouped.get(o.tableNumber)!.push(o);
  }

  res.json(
    Array.from(grouped.entries()).map(([tableNumber, orders]) => ({
      tableNumber,
      totalOrders: orders.length,
      pendingCount: orders.filter((o) => o.status === "pending").length,
      servedCount: orders.filter((o) => o.status === "served").length,
      orders,
    }))
  );
});

router.get("/orders", async (req, res): Promise<void> => {
  const { status, vendorId, search } = req.query as Record<string, string>;

  const conditions = [];
  if (status === "pending" || status === "served") conditions.push(eq(ordersTable.status, status));
  if (vendorId) conditions.push(eq(ordersTable.vendorId, Number(vendorId)));
  if (search) { const f = buildSearchFilter(search); if (f) conditions.push(f); }

  const rows = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(ordersTable.createdAt));

  res.json(await enrichOrders(rows.map((r) => r.id)));
});

router.post("/orders", async (req, res): Promise<void> => {
  const { customerName, tableNumber, vendorId, mainDishTypeId, sideIds, proteinIds } = req.body;

  if (!customerName || !tableNumber || !vendorId || !mainDishTypeId) {
    res.status(400).json({ error: "customerName, tableNumber, vendorId, and mainDishTypeId are required" });
    return;
  }

  // Check if the selected main dish type has any sides or proteins
  const [availableSides, availableProteins] = await Promise.all([
    db.select().from(sideItemsTable).where(eq(sideItemsTable.mainDishTypeId, Number(mainDishTypeId))),
    db.select().from(proteinItemsTable).where(eq(proteinItemsTable.mainDishTypeId, Number(mainDishTypeId))),
  ]);

  if (availableSides.length > 0 && (!Array.isArray(sideIds) || sideIds.length === 0)) {
    res.status(400).json({ error: "At least one side must be selected" });
    return;
  }
  if (availableProteins.length > 0 && (!Array.isArray(proteinIds) || proteinIds.length === 0)) {
    res.status(400).json({ error: "At least one protein must be selected" });
    return;
  }

  const normalizedName = customerName.trim().toLowerCase();
  const existingOrder = await db
    .select({ id: ordersTable.id })
    .from(ordersTable)
    .where(ilike(ordersTable.customerName, normalizedName));

  if (existingOrder.length > 0) {
    res.status(409).json({ error: `An order already exists for "${customerName}". Each person can only order once.` });
    return;
  }

  const dishType = await db
    .select({ id: mainDishTypesTable.id, name: mainDishTypesTable.name, mainDishId: mainDishTypesTable.mainDishId })
    .from(mainDishTypesTable)
    .where(eq(mainDishTypesTable.id, Number(mainDishTypeId)))
    .then((r) => r[0]);

  if (!dishType) {
    res.status(400).json({ error: "Invalid dish type" });
    return;
  }

  const [mainDish] = await db
    .select({ name: mainDishesTable.name })
    .from(mainDishesTable)
    .where(eq(mainDishesTable.id, dishType.mainDishId));

  const vendor = await db
    .select({ maxPlates: vendorsTable.maxPlates })
    .from(vendorsTable)
    .where(eq(vendorsTable.id, Number(vendorId)))
    .then((r) => r[0]);

  if (vendor && vendor.maxPlates > 0) {
    const [{ cnt }] = await db
      .select({ cnt: count() })
      .from(ordersTable)
      .where(eq(ordersTable.vendorId, Number(vendorId)));
    if (Number(cnt) >= vendor.maxPlates) {
      res.status(409).json({ error: "This vendor has reached its maximum plate limit" });
      return;
    }
  }

  const [sideItemRows, proteinItemRows] = await Promise.all([
    sideIds?.length > 0 
      ? db.select().from(sideItemsTable).where(inArray(sideItemsTable.id, sideIds.map(Number))) 
      : Promise.resolve([]),
    proteinIds?.length > 0 
      ? db.select().from(proteinItemsTable).where(inArray(proteinItemsTable.id, proteinIds.map(Number))) 
      : Promise.resolve([]),
  ]);

  const [order] = await db
    .insert(ordersTable)
    .values({
      customerName: customerName.trim(),
      tableNumber: tableNumber.trim(),
      vendorId: Number(vendorId),
      mainDishTypeId: dishType.id,
      mainDishTypeName: dishType.name,
      mainDishName: mainDish?.name ?? null,
      status: "pending",
    })
    .returning();

  if (sideItemRows.length > 0) {
    await db.insert(orderSidesTable).values(
      sideItemRows.map((s) => ({ orderId: order.id, sideId: s.id, sideName: s.name, isComplementary: s.isComplementary }))
    );
  }
  if (proteinItemRows.length > 0) {
    await db.insert(orderProteinsTable).values(
      proteinItemRows.map((p) => ({ orderId: order.id, proteinId: p.id, proteinName: p.name }))
    );
  }

  res.status(201).json(await enrichOrder(order.id));
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const order = await enrichOrder(Number(req.params.id));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(order);
});

router.patch("/orders/:id/status", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (status !== "pending" && status !== "served") {
    res.status(400).json({ error: "Status must be 'pending' or 'served'" });
    return;
  }

  const [order] = await db.update(ordersTable).set({ status }).where(eq(ordersTable.id, id)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  res.json(await enrichOrder(id));
});

export default router;
