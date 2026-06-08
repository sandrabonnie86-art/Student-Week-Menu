import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { db, appConfigTable, vendorsTable } from "@workspace/db";
import { VerifyAdminPinBody, VerifyUsherPinBody, VerifyVendorPinBody } from "@workspace/api-zod";
import jwt from "jsonwebtoken";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const JWT_EXPIRES_IN = "30d"; // 30 days

async function getConfig() {
  const configs = await db.select().from(appConfigTable);
  return configs[0] || null;
}

// Auth middleware for protected routes
export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

router.post("/auth/admin", async (req, res): Promise<void> => {
  const parsed = VerifyAdminPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const config = await getConfig();
  const valid = !config?.adminPin || config.adminPin === parsed.data.pin;
  
  if (valid) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ valid: true, token });
  } else {
    res.status(401).json({ valid: false });
  }
});

router.post("/auth/usher", async (req, res): Promise<void> => {
  const parsed = VerifyUsherPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const config = await getConfig();
  const valid = !config?.usherPin || config.usherPin === parsed.data.pin;
  
  if (valid) {
    const token = jwt.sign({ role: "usher" }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ valid: true, token });
  } else {
    res.status(401).json({ valid: false });
  }
});

router.post("/auth/vendor", async (req, res): Promise<void> => {
  const parsed = VerifyVendorPinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const vendors = await db.select().from(vendorsTable);
  const vendor = vendors.find((v) => v.vendorPin === parsed.data.pin);
  
  if (vendor) {
    const token = jwt.sign({ role: "vendor", vendorId: vendor.id, vendorName: vendor.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({
      valid: true,
      token,
      vendor: {
        ...vendor,
        orderCount: 0,
        createdAt: vendor.createdAt.toISOString(),
      },
    });
  } else {
    res.status(401).json({ valid: false });
  }
});

export default router;
