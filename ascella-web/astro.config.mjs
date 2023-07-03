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
      mode: 'development',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Ascella the image uploader',
        short_name: 'Ascella',
        theme_color: '#ffffff',
        start_url: '/',
        id: 'host.ascella',
        display: 'standalone',
        scope: '/',
        categories: ['media', 'images', 'upload'],
        description: 'Ascella is a simple image uploader, with native and web support.',
        prefer_related_applications: false,
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          }
        ],
      },
      workbox: {
        navigateFallback: '/404',
        globPatterns: ['**/*.{css,js,html,svg,png,ico,txt}'],
      },
      devOptions: {
        enabled: true,
        navigateFallbackAllowlist: [/^\/404$/],
      },
    })
  ],
  output: "server",
  adapter: cloudflare({
    mode: "directory"
  })
});