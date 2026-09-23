import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site. When Daymont gets its own domain, set
// SITE=https://www.daymont.com.co and BASE=/ in the deploy workflow.
const site = process.env.SITE ?? 'https://aframirez177.github.io';
const base = process.env.BASE ?? '/daymont';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/estrategia/') }),
  ],
  build: { inlineStylesheets: 'auto' },
  vite: {
    ssr: { noExternal: ['gsap'] },
    build: { chunkSizeWarningLimit: 900 },
  },
});
