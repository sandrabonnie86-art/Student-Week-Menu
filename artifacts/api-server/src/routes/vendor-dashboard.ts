import { Router, type IRouter } from "express";
import { db, vendorsTable, ordersTable, orderItemsTable } from "@workspace/db";
import { GetVendorDashboardStatsParams } from "@workspace/api-zod";
import { eq, and, count, ne } from "drizzle-orm";

const router: IRouter = Router();

router.get("/vendor-dashboard/:vendorId/stats", async (req, res): Promise<void> => {
  const params = GetVendorDashboardStatsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const vendorId = params.data.vendorId;
  
  const [vendor] = await db.select().from(vendorsTable).where(eq(vendorsTable.id, vendorId));
  if (!vendor) {
    res.status(404).json({ error: "Vendor not found" });
    return;
  }

  const allOrders = await db.select().from(ordersTable).where(eq(ordersTable.vendorId, vendorId));
  const totalOrders = allOrders.length;
  const pendingOrders = allOrders.filter(o => o.status === "pending").length;
  const servedOrders = allOrders.filter(o => o.status === "served").length;
  
  const remainingPlates = vendor.maxPlates > 0 
    ? Math.max(0, vendor.maxPlates - totalOrders) 
    : -1; // -1 means unlimited

  const mainDishCounts: Record<string, number> = {};
  const mainDishTypeCounts: Record<string, number> = {};
  const sideCounts: Record<string, number> = {};
  const proteinCounts: Record<string, number> = {};

  const orderItems = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, -1)).execute();

  for (const order of allOrders) {
    if (order.mainDishName) {
      mainDishCounts[order.mainDishName] = (mainDishCounts[order.mainDishName] || 0) + 1;
    }
    if (order.mainDishTypeName) {
      mainDishTypeCounts[order.mainDishTypeName] = (mainDishTypeCounts[order.mainDishTypeName] || 0) + 1;
    }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
    for (const item of items) {
      if (item.category === "side") {
        sideCounts[item.menuItemName] = (sideCounts[item.menuItemName] || 0) + 1;
      } else if (item.category === "protein") {
        proteinCounts[item.menuItemName] = (proteinCounts[item.menuItemName] || 0) + 1;
      }
    }
  }

  const sortByCount = (obj: Record<string, number>) => {
    return Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([name, cnt]) => ({ name, count: cnt }));
  };

  res.json({
    totalOrders,
    pendingOrders,
    servedOrders,
    remainingPlates,
    popularMainDishes: sortByCount(mainDishCounts),
    popularMainDishTypes: sortByCount(mainDishTypeCounts),
    popularSides: sortByCount(sideCounts),
    popularProteins: sortByCount(proteinCounts),
  });
});

export default router;
