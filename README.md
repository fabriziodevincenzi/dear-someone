# Dear Someone

A private correspondence club: one letter, one reader, maybe a reply.

## Local development

Requirements: Node.js 22.12 or newer and pnpm 11.

```sh
pnpm install
pnpm dev
```

The local site is available at [http://127.0.0.1:4321](http://127.0.0.1:4321).

## Checks

```sh
pnpm check
pnpm build
```

## Current scope

- Astro 7, Tailwind CSS 4, TypeScript and native Astro i18n scaffolding.
- React is limited to server-rendered Shadcn-style UI primitives; no client JavaScript is shipped for them by default.
- Editorial, near-monochrome design tokens live in `src/styles/global.css`.
- The landing, privacy draft and terms placeholder are implemented.
- The waitlist form is a local interaction prototype. Supabase persistence and email confirmation belong to Phase 2.
- The public waitlist counter is environment-driven and remains hidden until it reaches 100 people (`PUBLIC_WAITLIST_COUNT`).
- Phase 1 prototype surfaces are available at `/waitlist/`, `/sign-in/`, `/member/`, `/member/settings/`, `/member/letters/` (email-first explanation), `/email/you-have-a-letter/`, `/email/action/*`, `/blog/`, `/blog/what-an-inbox-can-still-be-for/`, `/pricing/`, and `/ukraine/`.
- The blog has a versioned first article and an RSS endpoint at `/blog/rss.xml`.
- The post-launch landing is prepared at `/launch/`; the current root `/` remains the waitlist landing until launch.
- A non-destructive post-season preview is available at `/launch-after-free/`; it does not replace either the waitlist landing or the opening landing.

## Domain scaffolding

- `src/lib/limits.ts` contains the free (90-day) and annual/founding (24-hour) opening cadence without limiting replies inside an open conversation.
- `src/lib/matching.ts` contains the MVP language compatibility, block, availability and inverse-frequency weighted selection rules.
- `src/lib/mailbox-activity.ts` contains the provisional mailbox-availability policy: three unredeemed magic links plus 30 inactive days pauses new inbound matching without deleting or judging the account; recovery remains possible through re-authentication, a verified alias reply, or an authenticated email change.
- `src/lib/product-config.ts` keeps waitlist thresholds, launch state, first-phase exclusions, the full local price grid and the reference annual price in one place.
- `src/lib/market-pricing.ts` maps a country-level market signal to a supported local annual price and falls back to EUR when a market price is not defined; the active copy remains English until translated routes are added.
- The reserved-area authentication direction is now passwordless magic link; the local prototype does not issue real tokens yet.

When the configured waitlist count reaches 100, the public copy switches to the open-service flow: founding waitlist members receive eight weeks at the daily opening pace; new members start on Free and can upgrade whenever they choose. Requests made while a cadence is full are queued; Free members are invited to switch to annual membership for the faster opening pace. Conversation aliases are planned to expire 30 days after the last exchange.

The real Supabase, Stripe and Resend integrations are intentionally not faked in the local prototype. They are the next implementation gate once the open decisions in the implementative document are closed and credentials are available.

Product decisions live in `dear-someone-project-spec.md`; visual direction lives in `dear-someone-design-brief.md`.

## Template attribution

The technical scaffolding began from the MIT-licensed Cooper Astro template. Its license is retained in `LICENSE-COOPER`.
