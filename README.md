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
```

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
