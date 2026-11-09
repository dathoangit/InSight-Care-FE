# InSight Care — Frontend

Next.js **Pages Router** client for hospital bed vitals tracking (Bệnh viện Đa khoa Xanh Pôn).

## Stack

| Tech | Notes |
|------|--------|
| Next.js (`latest` in package.json) | Pages Router only |
| React 18 | Hooks, no Redux / React Query |
| TypeScript | `strict`, path alias `src/*` |
| Tailwind CSS 3 | Utility styling |
| recharts | Episode vitals charts |
| xlsx-js-style | Excel export of today’s board |

Package manager: **yarn**.

## Quick start

```bash
cp .env.example .env
# NEXT_PUBLIC_API_URL=http://localhost:8081
yarn
yarn dev
```

App: `http://localhost:3000`

### Environment

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | BE base URL (browser calls BE directly) |
| `ALLOWED_DEV_ORIGINS` | Extra origins for Next `allowedDevOrigins` (e.g. ngrok) |
| `IS_DEV` / `PROJECT_ID` | Local metadata |

See `.env.example`.

## Scripts

```bash
yarn dev         # next dev
yarn build       # next build
yarn start       # next start (local prod without Docker)
yarn lint        # next lint
yarn deploy      # Docker Compose production deploy (./deploy.sh)
yarn deploy:ci   # Push temporary test-* tag to trigger GitHub Actions
```

## Routes

| Path | Auth | Description |
|------|------|-------------|
| `/login` | Public | Login form |
| `/` | JWT | Dashboard — bed vitals board |
| `/admin/users` | JWT + `ADMIN` | User management |
| `/404` | Public | Not found |
| `/api/health` | Public | FE process health JSON |

Gate logic lives in `pages/_app.tsx` (`AuthGate`).

## Project layout

```text
pages/                     # Next routes + _app / _document
src/
  api/authenticated.ts     # Bearer-bound API client factory
  auth/                    # Context, storage, expiry, unauthorized handler
  components/
    admin/users/           # Admin CRUD UI
    auth/                  # LoginForm
    history/               # History search section
    layout/                # Hospital layout UI (currently unused on pages)
    patient/               # Episode modal + charts
    records/               # Today board, bed modal, export, polling
    shell/                 # AppShell, header/footer, DashboardPage
    ui/                    # AnimatedModalShell
  config/public-api.ts     # Resolve API base URL
  constants/branding.ts    # Brand name + theme colors
  hooks/usePageVisible.ts
  styles/global.css
  utils/                   # api.ts, date-vn.ts, formatters
public/                    # logo, bg, favicon
docs/architecture.md       # Deeper FE architecture notes
```

## Auth (client)

1. `POST /auth/login` → `{ token: { accessToken, expiresIn }, user }`
2. Persist in `localStorage` (`triage.auth.*` keys — legacy prefix)
3. `createAuthenticatedApi(token)` attaches `Authorization: Bearer …`
4. Timer + JWT `exp` → auto-logout; `401` → clear session → `/login`
5. No refresh token

Roles: `NURSE` | `DOCTOR` | `ADMIN`.

## Main features

- **Today board** — floors / rooms / beds, morning + evening columns; polls every 3s when viewing today
- **Bed record modal** — upsert vitals + patient/medical codes for the editable shift
- **Patient episode** — summary cards, daily table, recharts, other admissions
- **History** — date-range search with pagination
- **Excel export** — styled workbook per floor
- **Admin users** — list / create / update / role / deactivate

Details: [docs/architecture.md](./docs/architecture.md).

## Docker / Ubuntu deploy

Multi-stage `node:22-alpine` image with Next `output: 'standalone'`. `NEXT_PUBLIC_API_URL` is baked in at **image build** time.

```bash
cp .env.production.example .env
# NEXT_PUBLIC_API_URL=http://<server-ip>:8081
# HOST_PORT=3000
./deploy.sh
```

- Compose publishes `${HOST_PORT:-3000}:3000`
- Changing the API URL requires rebuilding the image
- `yarn deploy:ci` keeps the old tag-trigger CI flow

## Related docs

- [System overview](../docs/overview.md)
- [Backend README](../InSight-Care-BE/README.md)
