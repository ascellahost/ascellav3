import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";
import env from "../env.json" assert { type: "json" };
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let define = {
  ...env.default,
};

try {
  await build({
    define: Object.fromEntries(Object.entries(define).map((x) => [x[0], JSON.stringify(x[1])])),
    bundle: true,
    sourcemap: true,
    format: "esm",
    target: "esnext",
    external: ["__STATIC_CONTENT_MANIFEST"],
    plugins: [],
    conditions: ["worker", "browser"],
    entryPoints: [path.join(__dirname, "src", "index.ts")],
    outdir: path.join(__dirname, "dist"),
    outExtension: { ".js": ".mjs" },
    minifySyntax: true,
  });
} catch (e) {
  process.exitCode = 1;
}
