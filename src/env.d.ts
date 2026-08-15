/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly DEFAULT_LOCALE: string;
  readonly PUBLIC_WAITLIST_COUNT?: string;
  readonly PUBLIC_SUPABASE_URL?: string;
  readonly PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly PUBLIC_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
