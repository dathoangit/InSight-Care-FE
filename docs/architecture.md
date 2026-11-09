# Frontend Architecture

## Bootstrap

`pages/_app.tsx` wraps every page:

```text
AuthProvider
  └─ AuthSessionManager   # registers 401 → logout
       └─ AuthGate        # route protection / redirects
            └─ AppShell   # header / footer / content
                 └─ Page
```

### Route rules

| Category | Paths | Behavior |
|----------|-------|----------|
| Public | `/login`, `/404` | Always allowed |
| Protected | `/`, `/admin/users` | Require JWT |
| Admin-only | `/admin/users` | Require role `ADMIN` |

Signed-in users hitting `/login` are redirected to `/` (`getDefaultLandingPath`).

## HTTP client

| File | Role |
|------|------|
| `src/config/public-api.ts` | `getPublicApiBaseUrl()` from `NEXT_PUBLIC_API_URL` (default `http://localhost:8081`) |
| `src/utils/api.ts` | `apiGet` / `apiPost` / `apiPatch` / `apiDelete`, unwrap envelope, `ApiError`, ngrok skip header |
| `src/api/authenticated.ts` | `createAuthenticatedApi(token)` → bound `{ get, post, patch, delete }` |
| `src/auth/unauthorized.ts` | Module-level 401 handler registry |

BE response shape:

```ts
{ statusCode: number; data: T; message?: string; timestamp?: string }
```

Feature modules expose thin `api.ts` files that call authenticated helpers (e.g. `src/components/records/api.ts`).

## Auth module (`src/auth`)

| File | Purpose |
|------|---------|
| `context.tsx` | Login / logout / restore session / expiry timer |
| `api.ts` | `POST /auth/login` |
| `storage.ts` | `localStorage` + in-memory token cache |
| `token-expiry.ts` | `expiresIn` → `expiresAt`, JWT `exp` fallback |
| `types.ts` | Roles, login response, user profile |
| `role-routing.ts` | Default landing path after login |
| `AuthSessionManager.tsx` | Wire 401 → logout + redirect |

Storage keys (legacy `triage` prefix):

- `triage.auth.accessToken`
- `triage.auth.user`
- `triage.auth.expiresAt`

Username is normalized (trim + lowercase) before login.

## Dashboard orchestration

`src/components/shell/DashboardPage.tsx` owns:

- Selected business date (max = server “today”)
- Polling via `useBedStatusByDate` (`src/components/records/useTodayStatusPolling.ts`)
- Open state for `BedRecordModal` and `PatientEpisodeModal`
- Renders `TodayStatusSection` + `HistorySection`

### Polling rules

Interval: **3000 ms**. Runs only when all are true:

- Valid access token
- Route is `/`
- Tab is visible (`usePageVisible`)
- Viewing **today** (not a past date)
- No modal open (`paused`)

After upsert, `mergeRecord` optimistically patches local state before the next poll.

### Editable shift

Server returns `editableShift` (`morning` | `evening`). Past days are read-only on the UI. Client helpers in `src/utils/date-vn.ts` mirror VN business-day rules for display.

## Feature map

### Records (`src/components/records`)

| Component / module | Purpose |
|--------------------|---------|
| `TodayStatusSection` | Date picker, “Hôm nay”, Excel button, floor tabs |
| `FloorTabs` | Floor switcher |
| `VitalsSpreadsheetTable` / `VitalsTableRow` | Spreadsheet-style morning/evening columns |
| `BedRecordModal` | Upsert form (name, patient code, medical record code, vitals, note) |
| `NotePreviewModal` | Long-note preview |
| `export-vitals-xlsx.ts` | Build styled XLSX per floor |
| `vitals-input.ts` / `vitals-status.ts` | Input validation & abnormal highlighting |
| `api.ts` | `today-status`, `upsert`, episode, admissions |

### Patient episode (`src/components/patient`)

| Component | Purpose |
|-----------|---------|
| `PatientEpisodeModal` | Shell + data load |
| `EpisodeHeader` | Patient / bed / dates |
| `EpisodeSummaryCards` | Latest / avg / max / min |
| `EpisodeDailyTable` | Per-day vitals rows |
| `EpisodeVitalsCharts` | recharts line charts (pulse, temp, BP) |
| `EpisodeOtherAdmissionsSection` | Switch between admissions |

### History (`src/components/history`)

`HistorySection` → `GET /records/history` with filters (`startDate`, `endDate`, name/code/bed, `limit`/`offset`). Supports daily vs admission-oriented views as returned by the API.

### Admin (`src/components/admin/users`)

`AdminUsersPage` + `UserFormModal` → `/admin/users` CRUD (soft delete = deactivate).

### Layout (`src/components/layout`)

`HospitalLayoutSection` + `useHospitalLayout` call `GET /layout`. **Not mounted on any page today**; the live board uses bed metadata from `today-status` instead. Kept for possible future floor map UI.

### Shell / branding

- Header: `bg-red-800`, footer: `bg-sky-800` (see `src/constants/branding.ts`)
- Brand copy: “InSight Care” / “Bệnh viện Đa khoa Xanh Pôn”
- Shared modal chrome: `src/components/ui/AnimatedModalShell.tsx`

## Path aliases

`tsconfig.json`:

```json
"paths": { "src/*": ["./src/*"] }
```

Imports look like `import { … } from 'src/utils/api'`. Next resolves these for the bundler.

## BE endpoints used by FE

```text
POST /auth/login
GET  /records/today-status
POST /records/upsert
GET  /records/patient-episode
GET  /records/patient-admissions
GET  /records/history
GET  /layout
GET  /admin/users
POST /admin/users
PATCH /admin/users/:id
PATCH /admin/users/:id/role
DELETE /admin/users/:id
```

## Known quirks

- localStorage key prefix is still `triage.*`
- `getTodayStatus` helper may be marked deprecated in favor of the polling hook
- Empty folders: `src/components/patient-records/`, `public/svg/`
- `next: "latest"` is floating — pin for reproducible builds when possible
