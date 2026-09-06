# hena.dev

Marketing and waitlist site for Hena, built with Astro and deployed to Cloudflare Pages.

## Development

```sh
bun install
bun run dev
```

The static site can be checked with:

```sh
bun run check
bun run typecheck
bun run build
bun test
```

## Product preview

The Chat, Code, and Claw projects play deterministic, browser-only demonstrations defined in
`src/data/preview.ts`. Messages, test results, and browser sources are simulated; the preview
does not call model APIs or store conversations.

Each project starts once when visible and preserves its progress when switching projects.
Pause, Resume, and Replay control playback. Leaving the viewport or hiding the browser tab
pauses playback; reduced-motion users see the completed example instead. Scrolling up stops
automatic following until the user returns to the latest activity.

The conversation and message primitives in `src/components/ai-elements/` are adapted from
Vercel AI Elements under Apache-2.0, with the license and modification notice alongside them.
Only `use-stick-to-bottom` is added at runtime; no AI SDK or Markdown rendering stack is needed.

## Waitlist infrastructure

The Pages project needs the following production resources and bindings:

| Type | Name | Purpose |
| --- | --- | --- |
| D1 binding | `DB` | Waitlist subscriber records |
| Secret | `TURNSTILE_SECRET_KEY` | Server-side Turnstile verification |
| Secret | `RESEND_API_KEY` | Confirmation and launch email delivery |
| Variable | `RESEND_FROM_EMAIL` | Defaults to `Hena <updates@hena.dev>` |
| Variable | `SITE_URL` | Defaults to `https://hena.dev` |
| Variable | `CONSENT_VERSION` | Must match `src/data/site.ts` |

The Astro build reads these GitHub Actions repository variables:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile widget key |
| `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics token |

After creating and binding the D1 database, apply the schema:

```sh
bunx wrangler d1 execute hena-waitlist --remote --file migrations/0001_waitlist.sql
```

Copy `.env.example` and `.dev.vars.example` for local configuration. Use Cloudflare's published
Turnstile test keys during local development, never production credentials.
