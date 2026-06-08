import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build as esbuild } from "esbuild";
import { rm } from "node:fs/promises";

globalThis.require = createRequire(import.meta.url);

const artifactDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(artifactDir, "..", "..");

// Shim packages that appear as unresolved requires in the bundle but are never
// actually used at runtime — ZISI (Netlify's bundler) would otherwise fail
// trying to resolve them during the build step.
//
// supports-color: required by debug (Express) for terminal color detection.
//   Returning false just disables colored debug output — no functional impact.
//
// pg-native: pg's optional native C driver; loaded only when pg.native is
//   accessed explicitly. Our code uses the pure-JS Pool, so this code path
//   is never reached. Shimming it prevents ZISI from choking on the require.
const SHIMS = {
  "supports-color": "module.exports = { stdout: false, stderr: false };",
  "pg-native": 'throw new Error("pg-native is not available in this environment");',
};

const shimPlugin = {
  name: "cjs-shims",
  setup(build) {
    const filter = new RegExp(`^(${Object.keys(SHIMS).join("|")})$`);

    build.onResolve({ filter }, (args) => ({
      path: args.path,
      namespace: "cjs-shim",
    }));

    build.onLoad({ filter: /.*/, namespace: "cjs-shim" }, (args) => ({
      contents: SHIMS[args.path],
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
