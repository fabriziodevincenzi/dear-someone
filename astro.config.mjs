import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { siteLocales } from './src/lib/i18n';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://onereader.co',
  output: 'static',
  compressHTML: true,
  i18n: {
    defaultLocale: 'en',
    locales: siteLocales,
    routing: {
      prefixDefaultLocale: false,
    },
  },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
