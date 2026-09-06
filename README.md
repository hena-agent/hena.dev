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

`wrangler.jsonc` targets the existing `hena-dev` Pages project. Select the **chris** account
with `CLOUDFLARE_ACCOUNT_ID`; Pages configuration does not support `account_id`.
Its compatibility date matches the existing production and preview settings.
The configuration is not yet waitlist-ready: D1 access is currently blocked by token
permissions, and no `DB` binding or runtime secrets have been provisioned.
Do not deploy the waitlist until the setup below is complete.

### Authentication

Use a scoped Cloudflare API Token through `CLOUDFLARE_API_TOKEN`, never in this repository.
If using a local shell file containing the export, source it in the same terminal before
running commands. `bun run cf:whoami` explicitly uses the installed Wrangler 4 rather
than a potentially outdated global binary. Set the following in the same terminal before
running resource or deployment commands to avoid using a cached account:

```sh
export CLOUDFLARE_ACCOUNT_ID=0c789b636217d3b7562fb404aa580b58
```

GitHub Actions supplies this environment variable through the existing
`CLOUDFLARE_ACCOUNT_ID` repository secret.

The token needs **Account / Cloudflare Pages / Edit** and **Account / D1 / Edit** for
the chris account. A successful `whoami` does not prove those permissions are present.

### Provisioning checklist

1. Grant D1 access, then list existing databases before creating any.
2. Create or select `hena-waitlist` and a separate preview database.
3. Add `d1_databases` entries with binding `DB`, verified `database_id` values, and
   `migrations_dir: "migrations"` to `wrangler.jsonc`; use `env.preview` for the isolated DB.
4. Apply the schema to both databases using their explicit environment selections.
5. Configure production Turnstile and Resend secrets below. Do not share production
   credentials or subscriber data with preview deployments.
6. Register GitHub Actions secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`
   for this same account, plus the public build variables below.
7. Verify registration, mail delivery, and unsubscription before deploying to production.

Wrangler configuration becomes the source of truth for bindings on deployment; it does
not provision a database or update a running deployment merely by existing on disk.

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
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote
```

Copy `.env.example` and `.dev.vars.example` for local configuration. Use Cloudflare's published
Turnstile test keys during local development, never production credentials. After building,
`bun run cf:dev` serves Pages Functions as well as the site. Local D1 testing requires the
pending `DB` configuration and local migrations (`d1 migrations apply DB --local`).
