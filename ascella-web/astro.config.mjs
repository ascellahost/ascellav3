import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import htmlMinify from "@frontendista/astro-html-minify";
import AstroPWA from '@vite-pwa/astro'

import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [
    svelte(),
    tailwind(),
    mdx(),
    htmlMinify(),
    AstroPWA({
      srcDir: 'src',
      filename: 'pwa.js',
      strategies: 'injectManifest',
      injectRegister: false,
      injectManifest: {
        injectionPoint: undefined,
      },
      devOptions: {
        enabled: true,
        type: "module"
      }
    })
  ],
  output: "server",
  adapter: cloudflare({
    mode: "directory"
  })
});