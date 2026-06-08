import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isBuild = process.argv.some((arg) => arg === "build");

const rawPort = process.env.PORT;
let port: number;

if (!isBuild) {
  if (!rawPort) {
    throw new Error(
      "PORT environment variable is required but was not provided.",
    );
  }
  const p = Number(rawPort);
  if (Number.isNaN(p) || p <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  port = p;
} else {
  port = 3000;
}

const basePath = isBuild ? (process.env.BASE_PATH ?? "/") : (() => {
  const bp = process.env.BASE_PATH;
  if (!bp) {
    throw new Error(
      "BASE_PATH environment variable is required but was not provided.",
    );
  }
  return bp;
})();

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    ...(!isBuild ? [runtimeErrorOverlay()] : []),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
