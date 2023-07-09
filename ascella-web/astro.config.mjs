import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    tailwind(),
    mdx()
  ],
  output: "server",
  adapter: cloudflare({
    mode: "directory"
  }),
  compressHTML: true
});