import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import { rename } from "fs/promises";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  await build({
    bundle: true,
    sourcemap: false,
    format: "esm",
    target: "esnext",
    external: ["__STATIC_CONTENT_MANIFEST"],
    plugins: [],
    conditions: ["worker", "browser"],
    entryPoints: [path.join(__dirname, "src", "index.tsx")],
    outdir: path.join(__dirname, "dist"),
    outExtension: { ".js": ".mjs" },
    minifySyntax: true,
    minify: true,
  });
  await rename(path.join(__dirname, "dist", "index.mjs"), path.join(__dirname, "dist", "_worker.js"));
} catch (e) {
  process.exitCode = 1;
}
