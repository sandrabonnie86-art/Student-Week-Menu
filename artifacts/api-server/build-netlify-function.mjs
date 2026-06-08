import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(artifactDir, "..", "..");

// Shim any ESM-only packages that get dynamically required in CJS context.
// supports-color is required by debug (used by Express) only for terminal
// color detection — returning false just disables colored debug output.
const shimPlugin = {
  name: "cjs-shims",
  setup(build) {
    build.onResolve({ filter: /^supports-color$/ }, (args) => ({
      path: args.path,
      namespace: "cjs-shim",
    }));
    build.onLoad({ filter: /.*/, namespace: "cjs-shim" }, () => ({
      contents: "module.exports = { stdout: false, stderr: false };",
      loader: "js",
    }));
  },
};

async function buildFunction() {
  const distDir = path.resolve(rootDir, "netlify-functions-dist");
  await rm(distDir, { recursive: true, force: true });

  await esbuild({
    entryPoints: [path.resolve(rootDir, "netlify/functions/api.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.resolve(distDir, "api.js"),
    logLevel: "info",
    nodePaths: [
      path.resolve(artifactDir, "node_modules"),
      path.resolve(rootDir, "node_modules"),
    ],
    external: [
      "*.node",
      "sharp",
      "better-sqlite3",
      "sqlite3",
      "canvas",
      "bcrypt",
      "argon2",
      "fsevents",
      "re2",
      "farmhash",
      "bufferutil",
      "utf-8-validate",
      "pg-native",
      "oracledb",
      "mysql2",
      "sequelize",
      "typeorm",
      "@prisma/client",
      "@aws-sdk/*",
      "@azure/*",
      "@google-cloud/*",
      "firebase-admin",
    ],
    sourcemap: false,
    plugins: [shimPlugin],
  });
}

buildFunction().catch((err) => {
  console.error(err);
  process.exit(1);
});
