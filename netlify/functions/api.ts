import serverless from "serverless-http";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import router from "../../artifacts/api-server/src/routes/index.js";

const app = express();

app.use(cors());

// ------------------------------------------------------------------
// Body parser — works in both serverless (Netlify) and local contexts.
//
// In Netlify, serverless-http creates a mock IncomingMessage from
// event.body. In some redirect/rewrite scenarios the body stream can
// be empty (or report Content-Length: 0) even when event.body has the
// real payload. The serverless-http `request` hook below pre-sets
// req.body from the raw event string BEFORE Express sees the request.
// This middleware then short-circuits if the hook already did the work,
// or falls back to reading from the stream (local Express dev server).
// ------------------------------------------------------------------
app.use(async (req: any, _res: Response, next: NextFunction) => {
  if (req.body !== undefined) return next();

  const method = (req.method || "").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return next();
  }

  const contentType = (req.headers["content-type"] || "").toLowerCase();

  try {
    if (contentType.includes("application/json")) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks).toString("utf-8");
      req.body = raw.trim() ? JSON.parse(raw) : {};
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(Buffer.from(chunk));
      }
      const raw = Buffer.concat(chunks).toString("utf-8");
      req.body = Object.fromEntries(new URLSearchParams(raw));
    } else {
      req.body = {};
    }
  } catch {
    req.body = {};
  }

  next();
});

app.use("/api", router);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// The request hook runs before Express sees the request.
// It reads event.body (the raw Netlify/Lambda payload string) and
// JSON-parses it directly onto req.body so the middleware above
// skips the now-unreliable stream path.
export const handler = serverless(app, {
  request(req: any, event: any) {
    if (!event.body) return;
    try {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, "base64").toString("utf-8")
        : (event.body as string);
      req.body = JSON.parse(raw);
    } catch {
      // Non-JSON body — leave undefined so stream fallback handles it.
    }
  },
});
