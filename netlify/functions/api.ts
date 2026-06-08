import serverless from "serverless-http";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "../../artifacts/api-server/src/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api", router);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export const handler = serverless(app);
