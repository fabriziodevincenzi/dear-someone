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
  integrations: [
    react(),
    sitemap({
      // Only public, indexable content belongs in the sitemap. Legacy blog
      // URLs redirect to the Journal, while these routes are functional or
      // intended for authenticated/email flows.
      filter: (page) => {
        const pathname = new URL(page).pathname;
        return !['/blog', '/email', '/member', '/sign-in', '/welcome'].some(
          (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
        );
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
