# events — backend API service

Decentraland Community Events service. Express HTTP API + Postgres + AWS (S3/SNS) + scheduled jobs. The user-facing dApp lives in a different repo and consumes this API.

## Stack

- Node 18, TypeScript, Express
- Postgres (`pg` + `node-pg-migrate`)
- AWS SDK v2 (S3 for posters) and `@aws-sdk/client-sns` v3 (push notification fan-out)
- `decentraland-gatsby` package — **server-side SDK**, not the framework. Provides `Database`, `Route` middleware, `Mail`, `Job`, `Server`, `Profile`, `Prometheus`, and HTTP clients (`API`, `Catalyst`, `Land`). The `gatsby` in the name is misleading — there is no Gatsby in this repo.
- Jest (unit + integration), ESLint + Prettier, Husky pre-commit

## Project layout

```
src/
  server.ts              Express app, CORS allowlist, Prometheus, cron schedules, DB init
  entities/              Each entity owns its own model/routes/types/schemas/utils
    Event/               Core event aggregate; has a routes/ subdir, cron.ts, large schemas
    EventAttendee/       Event attendance tracking
    EventCategory/       Tags/categories (single-category-per-event today)
    Notification/        Email senders + web-push (path: "templates" → repo's templates/)
    NotificationCursors/ Cursor table for SNS fan-out idempotency
    Notifications/       AWS SNS publisher (separate from Notification/)
    Poster/              S3 upload for event poster images
    ProfileSettings/     User notification prefs; routes/ subdir
    ProfileSubscription/ Web push subscription store
    Schedule/            Curated event collections (festivals, weeks, etc.)
    Sitemap/             /events/sitemap.xml
    Slack/               Outbound Slack webhook for moderation events
  api/                   External API clients (Communities, CommsGatekeeper, Places)
  intl/en.json           Backend copies (used by Slack/EventCategory — NOT i18n for users)
  modules/               Backend-shared utilities
    decentralandFoundationAddresses.ts   Cron-refreshed allow-list of foundation wallets
    features.ts                          Feature-flag enum
    servers.ts                           Catalyst realm helpers
  migrations/            45 timestamped node-pg-migrate files
  __mocks__/@dcl/        Jest mock for @dcl/ui-env (referenced by jest.config moduleNameMapper)
templates/               HTML email templates (validate_email_v3, upcoming_event_v3, …)
test/
  integration/           Real-DB integration tests (jest.integration.config.js)
  setup/db.ts            Test-DB safety guards (NODE_ENV=test + localhost + db name "test")
  setup/server.ts        Lightweight Express app for integration tests
  mocks/                 Test fixtures (event, identity, profileSettings)
docs/
  openapi.yaml           OpenAPI 3.1 — source of truth for HTTP surface
  database-schemas.md    Schema-by-table reference
  ai-agent-context.md    Architectural overview
scripts/                 Auth/IDOR smoke scripts (manual)
```

## Common commands

| Goal                                                         | Command                                                                                                              |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Install                                                      | `npm ci`                                                                                                             |
| Run dev server (watching `src/entities` and `src/server.ts`) | `npm run serve` (alias: `npm start`)                                                                                 |
| Build                                                        | `npm run build` (= `tsc -p .`)                                                                                       |
| Unit tests                                                   | `npm test`                                                                                                           |
| Integration tests                                            | `NODE_ENV=test CONNECTION_STRING="postgres://postgres:postgres@127.0.0.1:5432/events_test" npm run test:integration` |
| Run migrations                                               | `npm run migrate up` (uses `.env.development`) — or set `CONNECTION_STRING` and call `node-pg-migrate` directly      |
| Lint                                                         | `npm run lint` / `npm run lint:fix`                                                                                  |
| Format                                                       | `npm run format`                                                                                                     |
| Clean build artifacts                                        | `npm run clean` (= `rm -rf lib`)                                                                                     |

Production entrypoint is `entrypoint.sh` → runs migrations, then `node lib/server.js`.

## Env vars

`.env.example` is the source of truth. Backend reads (via `decentraland-gatsby/dist/utils/env`):

- DB: `CONNECTION_STRING`
- Admin: `ADMIN_ADDRESSES` (CSV of wallet addresses), `EVENTS_ADMIN_AUTH_TOKEN` (bearer for service-to-service moderation)
- Slack: `SLACK_WEBHOOK`
- AWS: `AWS_REGION`, `AWS_ACCESS_KEY`, `AWS_ACCESS_SECRET`, `AWS_BUCKET_NAME`, `AWS_BUCKET_URL`, `AWS_SNS_ARN`, `AWS_SNS_ENDPOINT`
- Web push: `WEB_PUSH_KEY`, `WEB_PUSH_SECRET`
- Downstreams: `COMMS_GATEKEEPER_URL`, `COMMUNITIES_API_URL` (with `GATSBY_COMMUNITIES_API_URL` legacy fallback in code), `PLACES_API_URL` (with `GATSBY_PLACES_API_URL` legacy fallback), `NOTIFICATION_SERVICE_URL`, `NOTIFICATION_SERVICE_TOKEN`, `COMMUNITIES_API_ADMIN_TOKEN`
- Misc: `JUMP_IN_SITE_URL`, `SERVICE_ORG_DOMAIN` (defaults to `decentraland.org`), `FEATURE_FLAGS_USER_ID`

The `GATSBY_*` prefixes survive only as fallback defaults inside `src/api/Communities.ts` and `src/api/Places.ts` for backwards compatibility — new code should use the unprefixed names.

## HTTP surface (high-level)

- `GET/POST/PATCH /api/events` and subroutes — main aggregate (paginated lists, filters, recurrence via RRule, admin/moderation)
- `/api/event-attendees`, `/api/categories`, `/api/schedules`, `/api/profile-settings`, `/api/profile-subscriptions`, `/api/poster` — supporting CRUD
- `/api/profile/*` — wallet auth handshake (provided by `decentraland-gatsby`)
- `/events/sitemap.xml` — server-rendered for crawlers
- `/metrics` — Prometheus

CORS allowlist (in `src/server.ts`): `localhost`, `*.decentraland.{zone,today,org,systems}`, Vercel preview pattern, `mvfw.org`, `dcl-metrics.com`.

## Cron jobs (every minute unless noted)

Defined in `src/server.ts` and `src/entities/Event/cron.ts`:

- `notifyUpcomingEvents` — push/email reminders before start
- `notifyStartedEvents` — push at start
- `notifyEndedEvents` — push at end
- `updateNextStartAt` — recompute `next_start_at` for recurrent events
- `refreshFoundationAddresses` — every 5 min, hits the feature-flag service for `events-decentraland-foundation-addresses`

## Conventions specific to this repo

### Entity changes follow a fixed order

For any change that touches an enum or filter (e.g. `EventListType`):

1. `src/entities/<Entity>/types.ts` (enum / TS types)
2. `src/entities/<Entity>/schemas.ts` (Ajv validators)
3. `src/entities/<Entity>/*.test.ts` (unit) and `test/integration/*.test.ts`
4. `src/entities/<Entity>/routes/*.ts` (handlers)
5. `docs/openapi.yaml` — every new query param / enum addition needs to be reflected here AND covered in an integration test in the same PR

### Hidden backend deps inside frontend-looking dirs

These look like frontend things but the API depends on them — never delete blindly:

- `src/intl/en.json` — imported by `Slack/utils.ts`, `EventCategory/routes.ts`
- `src/modules/{decentralandFoundationAddresses,features,servers}.ts` — backend
- `src/api/{Communities,CommsGatekeeper,Places}.ts` — backend (used by `Event/cron.ts`, `Event/routes/{createEvent,updateEvent,getEventList}.ts`)
- `src/__mocks__/@dcl/ui-env.ts` — referenced by `jest.config.js` `moduleNameMapper`
- `templates/*.html` — read by `Notification/sender.ts` (`path: "templates"`)

When refactoring this layout, grep `from \"\.\./.*<dir>` from `src/server.ts` and `src/entities/` before deleting anything.

### Stale build cache

`tsc -p .` uses `tsconfig.tsbuildinfo` for incremental compilation. After deleting files (especially under `src/`), `lib/` may not regenerate fully. If `lib/` is missing or stale after `npm run build`, run `rm -rf lib tsconfig.tsbuildinfo && npm run build`.

### ESLint preset

`.eslintrc.js` is a local config that mirrors what the legacy `@dcl/eslint-config/gatsby` preset enforced (double quotes, trailing commas, `no-restricted-imports` banning `decentraland-ui`/`decentraland-dapps`/`decentraland-connect`/`decentraland-gatsby`/`semantic-ui-react`/`@dcl/schemas` from direct import). Backend files import the banned packages with `// eslint-disable-next-line @typescript-eslint/no-restricted-imports`. Switching to base `@dcl/eslint-config` will conflict with `.prettierrc` (single vs double quotes) — keep the local config.

### Integration tests

- Need any local Postgres reachable on `127.0.0.1:5432` with a DB whose name contains `test`. Docker is **not** required.
- `test/setup/db.ts` refuses to run unless `NODE_ENV=test`, the connection is local, and the DB name contains `test` — guards against accidentally truncating production tables on a port-forwarded DB.
- Each suite calls `initTestDb` / `cleanTables` / `closeTestDb` per the existing pattern.
- `test/setup/server.ts` builds a minimal Express app from a subset of the routes — keep it in sync when new routers land.

### Smoke test the compiled server when removing modules

`tsc` and Jest will not catch a runtime require chain that fails because a deleted file is imported transitively. After any large deletion, run:

```
CONNECTION_STRING=postgres://invalid:invalid@127.0.0.1:1/missing PORT=4099 node lib/server.js
```

It should fail only on the DB connect — never on `Cannot find module` or `ENOENT: <path>`.

### Migrations

- All in `src/migrations/`, timestamped, written in TS.
- The `node-pg-migrate` we use is v6.x (deprecated upstream — pinned). Don't bump without testing the CLI.
- Migrations run automatically at container start via `entrypoint.sh`.

### Ban list (do not reintroduce)

This repo is API-only. Do not add: Gatsby, React, gatsby-plugin-_, postcss, sharp, workbox, lottie, rc-slider, react-virtualized, semantic-ui_, decentraland-ui\*, prop-types. Adding any of these means a frontend is creeping back in and probably belongs in the dApp repo.
