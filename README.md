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
`src/data/preview.ts`. Messages, test results, invoice files, and run history are simulated;
the preview does not call model APIs, download invoices, or schedule real jobs.
Claw shows a saved weekly invoice routine with per-service progress, duplicate handling,
missing-invoice flags, and the next scheduled run rather than a chat transcript.

Each project starts once when visible and preserves its progress when switching projects.
Pause, Resume, and Replay control playback. Leaving the viewport or hiding the browser tab
pauses playback; reduced-motion users see the completed example instead. In Chat and Code,
scrolling up stops automatic following until the user returns to the latest activity.
Claw starts processing immediately, shows per-invoice activity and progress, and finishes
with a highlighted result summary. The taller preview fits its task list and results without
internal scrolling at standard text sizes; keyboard scrolling remains available when zoomed.

The conversation and message primitives in `src/components/ai-elements/` are adapted from
Vercel AI Elements under Apache-2.0, with the license and modification notice alongside them.
Only `use-stick-to-bottom` is added at runtime; no AI SDK or Markdown rendering stack is needed.

## Waitlist infrastructure

`wrangler.jsonc` targets the existing `hena-dev` Pages project. Select the **chris** account
with `CLOUDFLARE_ACCOUNT_ID`; Pages configuration does not support `account_id`.
Its compatibility date matches the existing production and preview settings.
D1 databases, migrations, and Turnstile widgets/secrets are provisioned for production
and preview. Pages project settings and this configuration both define the `DB` bindings.
Changes to these settings require a new deployment to take effect.
Registration still requires `RESEND_API_KEY` and an authenticated sender domain. Until
Resend is configured, the existing signup endpoint intentionally returns 503.

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

The token needs **Account / Cloudflare Pages / Edit**, **Account / D1 / Edit**, and
**Account / Turnstile / Edit** for
the chris account. A successful `whoami` does not prove those permissions are present.

### Environments

| Environment | D1 database | Turnstile public site key | Widget hostnames |
| --- | --- | --- | --- |
| Production | `hena-waitlist` | `0x4AAAAAAErAnxtRES4Ssc08` | `hena.dev`, `www.hena.dev` |
| Preview | `hena-waitlist-preview` | `0x4AAAAAAErAoSqCMV9VjqJs` | `hena-dev.pages.dev` and its subdomains |

Turnstile secret keys are stored only in the respective Pages environment as
`TURNSTILE_SECRET_KEY`. The production public key is registered in the GitHub Actions
variable `PUBLIC_TURNSTILE_SITE_KEY`; public site keys are not secrets.

For a preview build, explicitly set `PUBLIC_TURNSTILE_SITE_KEY` to the preview key and
deploy with `--branch=preview`. Its stable origin is `https://preview.hena-dev.pages.dev`,
used by `env.preview.vars.SITE_URL` for unsubscribe links. Do not use the production build
artifact for preview, or production credentials/subscriber data for testing.

Before enabling signup, configure Resend in the appropriate Pages environment, verify
the sender domain, and test registration, delivery, and unsubscribe end to end. The current
production deployment workflow does not automatically apply future D1 migrations.

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
| Secret | `DISCORD_WEBHOOK_URL` | Optional Discord signup notifications; must be an HTTPS `discord.com/api/webhooks/` URL |

Configure `DISCORD_WEBHOOK_URL` separately as a Pages secret in any environment that should receive
notifications. Use a restricted-access channel: alerts contain the full email address, registration
time, signup/rejoin type, and environment. Never reuse the production webhook in preview.
An unset webhook disables notifications without affecting signup. Alerts run through `waitUntil`
only after confirmation mail succeeds and D1 transitions to `subscribed`. Discord failures and
rate limits are logged without sensitive values; there is a five-second timeout and no automatic
retry or guaranteed delivery. D1 remains the source of truth. Resend is still mandatory.

Concurrent signup attempts use a 60-second claim lease; an active claim returns 409, and failed
mail delivery releases it for retry. A token-hash guard prevents stale requests from finalizing
another request's subscription or sending its notification. No database migration is required.

If a Pages runtime override changes `SITE_URL` or `CONSENT_VERSION`, keep it aligned
with the environment's intended origin and `src/data/site.ts` before deploying.

The Astro build reads these GitHub Actions repository variables:

| Variable | Purpose |
| --- | --- |
| `PUBLIC_TURNSTILE_SITE_KEY` | Public Turnstile widget key |
| `PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics token |

After creating and binding the D1 database, apply the schema:

```sh
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote
node node_modules/wrangler/bin/wrangler.js d1 migrations apply DB --remote --env preview
```

Copy `.env.example` and `.dev.vars.example` for local configuration. Use Cloudflare's published
Turnstile test keys during local development, never production credentials. After building,
`bun run cf:dev` serves Pages Functions as well as the site. Local D1 testing requires
local migrations (`d1 migrations apply DB --local`); local state is separate from remote D1.
