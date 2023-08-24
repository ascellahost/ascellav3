import cloudflare from "@astrojs/cloudflare";
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import { resolve } from "path"
import starlight from '@astrojs/starlight';
import svelte from "@astrojs/svelte";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://picup.click",
  integrations: [
    svelte(),
    starlight({
      title: 'Picup Docs',
      social: {
        github: 'https://github.com/withastro/starlight',
      },
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Example Guide', link: '/guides/example/' },
          ],
        },
        {
          label: 'Reference',
          autogenerate: { directory: 'reference' },
        },
      ],
      customCss: ['./src/tailwind.css'],
    }),
    tailwind({
      applyBaseStyles: false
    }),
  ],
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
  adapter: cloudflare({
    mode: "directory"
  }),
  compressHTML: true
});