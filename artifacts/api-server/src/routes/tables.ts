import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tablesTable } from "@workspace/db";
import {
  GetTablesQueryParams,
  GetTablesResponse,
  CreateTableBody,
  UpdateTableParams,
  UpdateTableBody,
  UpdateTableResponse,
  DeleteTableParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tables", async (req, res): Promise<void> => {
  const query = GetTablesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const tables = await db.select().from(tablesTable).orderBy(tablesTable.tableNumber);
  const filtered = query.data.activeOnly ? tables.filter((t) => t.isActive) : tables;

  res.json(GetTablesResponse.parse(filtered.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))));
});

router.post("/tables", async (req, res): Promise<void> => {
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [table] = await db
    .insert(tablesTable)
    .values({
      tableNumber: parsed.data.tableNumber,
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  res.status(201).json({ ...table, createdAt: table.createdAt.toISOString() });
});

router.patch("/tables/:id", async (req, res): Promise<void> => {
  const params = UpdateTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.tableNumber !== undefined) updateData.tableNumber = parsed.data.tableNumber;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [table] = await db
    .update(tablesTable)
    .set(updateData)
    .where(eq(tablesTable.id, params.data.id))
    .returning();

  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  res.json(UpdateTableResponse.parse({ ...table, createdAt: table.createdAt.toISOString() }));
});

router.delete("/tables/:id", async (req, res): Promise<void> => {
  const params = DeleteTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [table] = await db
    .delete(tablesTable)
    .where(eq(tablesTable.id, params.data.id))
    .returning();

  if (!table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
