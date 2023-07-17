import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";
import cloudflare from "@astrojs/cloudflare";
import htmlMinify from "@frontendista/astro-html-minify";
import starlight from "@astrojs/starlight";
import { resolve } from "node:path";
import mdx from "@astrojs/mdx";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "My Docs",
      social: {
        github: "https://github.com/withastro/starlight",
      },
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", link: "/guides/example/" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
    svelte(),
    tailwind(),
    mdx(),
    htmlMinify(),
  ],
  experimental: {
    assets: true,
  },
  build: {
    assets: "_ascella",
  },
  vite: {
    resolve: {
      alias: {
        "astro:assets": resolve("/opt/dev/ascellav3/ascella-web", "empty.mjs"),
        "virtual:image-service": resolve(
          "/opt/dev/ascellav3/ascella-web",
          "empty.mjs",
        ),
      },
    },
  },
  output: "hybrid",
  // image: {
  //   service: {
  //     entrypoint: "./image"
  //   }
  // },
  adapter: cloudflare({
    mode: "directory",
  }),
});
