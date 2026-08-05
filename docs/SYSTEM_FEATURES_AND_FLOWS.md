# CRMC-AIMS — Current System Features, Purpose & Flows

> Snapshot of the system **as designed and implemented today** (not the long-term backlog).  
> Last aligned with the codebase after the Assets server backend was introduced under `src/server`.

---

## 1. Purpose

**CRMC-AIMS** (Asset & Inventory Management System) is a web application for the **Property Custodian’s office** at CRMC.

It is meant to:

- Track **coded capital assets** (equipment, AV, furniture, transport) via unique asset codes / QR tags.
- Track **consumable supplies** by quantity, with low-stock visibility.
- Let departments **request items**, and let staff **approve, release, return**, and log condition.
- Give custodians a single place for **operations, logs, maintenance, users, and settings**.

**Today’s practical status:** the staff-facing product surface is largely **UI-complete with mock/local state**. The first production-shaped backend exists for **Assets only**. The UI assets page does **not** yet call that API—client hooks are ready for integration.

---

## 2. Who uses it

| Role | How they access | What they do |
|------|-----------------|--------------|
| **Property Custodian / Admin** | Authenticated staff app (`/dashboard`, etc.) | Full control: assets, requests, logs, users, settings |
| **Assistant Staff** | Same app (role model: `admin` \| `staff` \| `viewer`) | Day-to-day approve/release/return, consumables, maintenance |
| **Viewer** | Same app (read-oriented role in UI model) | Observe dashboard, registries, logs (no write in role definition) |
| **Borrowers / departments** | Intended: public no-login request form | Request coded assets or consumables by name/dept/contact |

**Current reality:** the private staff shell and all operation screens exist. A full **public borrow form route** is planned in product docs but is **not** the focus of the current staff UI build. Auth is present as Supabase scaffolding; screens run as a demo staff context without full session gating integration on every page.

---

## 3. Domain model (conceptual)

Two separate item kinds (deliberately not merged):

1. **Coded assets** — one physical unit, unique code (e.g. `AV-031`), QR, location, holder, operational status, maintenance history.
2. **Consumables** — bulk stock by quantity and unit (e.g. reams), min threshold, restock/adjust history—not QR-per-unit.

Cross-cutting process concepts:

- **Borrow request** — someone asks for an item (pending → approved / rejected → returned / closed).
- **Borrow / return log** — operational history of check-out and check-in (active, overdue, returned).
- **Condition & maintenance** — damage, repair, inspections, resolution of flagged assets.
- **Users & roles** — who may act in the system.
- **Settings** — profile, category taxonomy, system/export/backup (UI-level).

---

## 4. Feature catalog (as built in the product UI)

Navigation (sidebar) groups features as follows.

### 4.1 Dashboard — `/dashboard`

**Purpose:** At-a-glance operational health for the custodian.

**Capabilities (UI):**

- KPI stat cards (totals / backlog-style metrics)
- Pending approvals widget (approve/reject affordances)
- Low-stock widget
- Overdue assets widget (reminder affordance)
- Assets-by-category chart
- Recent activity feed
- Quick actions bar

**Data source today:** mock data (`features/dashboard/mock-data`).  
**Backend today:** none for dashboard aggregates.

---

### 4.2 Borrow Requests — `/borrow-requests`

**Purpose:** Staff queue for requests from departments; approve or reject before anything leaves inventory.

**Capabilities (UI):**

- Tabs: pending / approved / rejected / all
- Filters (search, department, date range)
- List + detail panel
- Approve / reject dialog with note / rejection reason
- Request history trail (submitted → approved/rejected → returned)

**Domain shape (frontend types):**

- Status: `pending` | `approved` | `rejected` | `returned`
- Requester contact fields, item description, optional asset code, category, quantity, purpose, expected return date

**Data source today:** mock data.  
**Backend today:** feature stubs only (no production API module equivalent to Assets).

**Designed business rule (product):** nothing is released without staff confirmation; consumable stock is not deducted at request time (deduct on release)—enforced later when backend exists.

---

### 4.3 Assets (Institutional Registry) — `/assets`

**Purpose:** Master registry of QR-tagged capital equipment.

**Capabilities (UI):**

- Grid / table view toggle
- Search + multi-select category/status filters + sort
- Add / edit asset dialog
- Detail slide-over (metadata, holder, notes, maintenance history)
- Mark for maintenance (updates status + appends flagged history entry locally)
- QR scan dialog (match by asset code in local list)
- QR display on assets

**Domain shape (frontend — source of truth for API DTOs today):**

| Field | Notes |
|-------|--------|
| `assetCode` | e.g. `CP-080`, encoded in QR |
| `name`, `category` | `transport` \| `computing` \| `av` \| `furniture` |
| `status` | `active` \| `needs_repair` \| `out_of_service` \| `retired` |
| `location` | required human-readable place |
| `currentHolder` | empty ⇒ available; set ⇒ checked out / held |
| `serialNumber`, `department`, `purchaseDate`, `value`, `imageUrl`, `notes` | optional |
| `lastUpdated` | date string |
| `maintenanceHistory[]` | inspection / repair / maintenance / flagged |

**Data source today (UI page):** `INITIAL_MOCK_ASSETS` local React state — not wired to React Query hooks.

**Backend today (live API, server module):** see §6 and §7.

**Client hooks (ready, not used by page yet):**

- `useAssetsQuery` / `useAssetQuery`
- `useCreateAssetMutation` / `useUpdateAssetMutation` / `useDeleteAssetMutation`
- `useReleaseAssetMutation` / `useReturnAssetMutation`

Located under `src/features/assets/client/`.

---

### 4.4 Borrow & Return Log — `/borrow-log`

**Purpose:** Operational history after release—who has what, due dates, returns, condition on return, overdue.

**Capabilities (UI):**

- Tabs: active / overdue / returned / all
- Filters, list, detail panel
- Release asset dialog / return asset dialog
- Overdue badge, condition select, audit-style history entries

**Domain shape (frontend types):**

- Status: `active` | `overdue` | `returned`
- Links request code ↔ asset code, borrower + department, release/due/return dates, condition on return

**Data source today:** mock data.  
**Backend today:** none dedicated (Assets API has provisional release/return on the asset row only).

---

### 4.5 Consumables — `/consumables`

**Purpose:** Track bulk supplies by quantity; surface low/critical stock.

**Capabilities (UI):**

- Grid / table, filters, severity (healthy / low / critical)
- Add / edit consumable
- Restock dialog, adjust stock dialog
- Detail panel + stock history (restock / adjustment / checkout)

**Data source today:** mock data.  
**Backend today:** none production module under `src/server`.

---

### 4.6 Condition & Maintenance Logs — `/maintenance-logs`

**Purpose:** Track condition events separately from the asset’s embedded history (UI model), resolve open items.

**Capabilities (UI):**

- Filters (category, condition, dates, open-only)
- List + detail
- Flag for maintenance / resolve maintenance dialogs
- Sources: return checkout vs manual flag

**Data source today:** mock data.  
**Backend today:** asset rows can store `maintenanceHistory` as JSONB; no standalone maintenance API yet.

---

### 4.7 Users & Roles — `/users`

**Purpose:** Manage staff accounts and role access.

**Capabilities (UI):**

- Filters, table, detail panel
- Invite user, edit user, deactivate user
- Roles: `admin` | `staff` | `viewer` with defined capability descriptions

**Data source today:** mock data.  
**Backend today:** Supabase Auth intended for real accounts; not fully wired end-to-end in screens.

---

### 4.8 Settings — `/settings`

**Purpose:** Account profile, category taxonomy, system utilities.

**Capabilities (UI):**

- Account / password forms
- Categories list (asset vs consumable types) with add/edit
- System section: backup status card, data export card

**Data source today:** mock / local UI state.  
**Backend today:** none dedicated.

---

### 4.9 Reports — `/reports`

**Purpose:** Analytics / exports (planned).

**Status today:** placeholder page (“under development”).

---

### 4.10 System / API tooling

| Path | Purpose | Status |
|------|---------|--------|
| `/api/health` | Liveness | Live |
| `/api/docs` | Swagger UI for API | Live for annotated routes |
| `/api/assets…` | Assets REST API | Live (server-backed) |

Entry: `/` redirects to `/dashboard`.

---

## 5. High-level system architecture (current)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Staff UI)                         │
│  pages under src/app/(private)/*  +  src/components/*             │
│  Most modules: local React state + mock arrays                    │
│  Assets: mock page  ·  hooks ready but not mounted on page        │
└───────────────────────────────┬─────────────────────────────────┘
                                │  (not yet for most features)
                                │  assets hooks → fetch /api/assets
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js App Router API                        │
│  src/app/api/*  (thin route handlers)                             │
└───────────────────────────────┬─────────────────────────────────┘
                                │  Assets only
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server module layer                           │
│  src/server/modules/assets/                                       │
│  Controller → Service → Repository                                │
│  Validation (Zod) · App errors · HTTP { data } / { error }        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Drizzle + Postgres (Supabase)                                    │
│  src/server/db/schema/*                                           │
│  assets (+ future: categories, locations, departments tables)     │
└─────────────────────────────────────────────────────────────────┘
```

**Design rules in play:**

- **App routes stay thin** — no business logic in `route.ts` beyond forwarding.
- **Assets business logic lives in `src/server/modules/assets`.**
- **Frontend asset types** (`src/components/assets/types.ts` via `src/features/assets/types.ts`) are the public DTO contract for the Assets API.
- **Mock UI is intentional** until integration is switched on per feature.

---

## 6. Assets backend (designed & implemented)

### 6.1 Layering

| Layer | Location | Responsibility |
|-------|----------|----------------|
| Route | `src/app/api/assets/**` | HTTP method + path, Swagger JSDoc |
| Controller | `asset.controller.ts` | Parse request, call service, return envelope |
| Service | `asset.service.ts` | Validation orchestration, rules, DTO mapping |
| Repository | `asset.repository.ts` | Drizzle queries only |
| Schema | `src/server/db/schema/assets.ts` | Postgres table + enums |
| Shared | `src/server/shared/*` | Errors + HTTP helpers |

### 6.2 HTTP envelope (hook-compatible)

Success:

```json
{ "data": /* Asset | Asset[] */ }
```

Error:

```json
{ "error": "Human-readable message" }
```

Delete: `204` empty body.

### 6.3 Endpoints

| Method | Path | Behavior |
|--------|------|----------|
| `GET` | `/api/assets` | List; optional `?status=` |
| `POST` | `/api/assets` | Create (code unique) |
| `GET` | `/api/assets/:id` | Detail |
| `PATCH` | `/api/assets/:id` | Partial update |
| `DELETE` | `/api/assets/:id` | Hard delete |
| `POST` | `/api/assets/:id/release` | Check out if active & no holder; sets placeholder holder `"Checked Out"` |
| `POST` | `/api/assets/:id/return` | Clear holder if checked out; append condition note; optional status |

### 6.4 Availability vs status (current design choice)

UI statuses are **operational condition** (`active`, `needs_repair`, …).

**Borrow/availability** is approximated with:

- Available: `status === "active"` **and** no `currentHolder`
- Out: `currentHolder` is set

Full borrower identity and due dates belong to **borrow requests / borrow log**, not fully modeled on the asset row yet.

### 6.5 Supporting schema (present, lightly used)

Tables scaffolded for later: `categories`, `locations`, `departments`.  
Current assets table **denormalizes** location/department as text to match the frontend registry UI.

---

## 7. Core product flows

### 7.1 Designed end-to-end borrow flow (target process)

```
Borrower submits request (public form — future / partial)
        │
        ▼
  Request status: pending
        │
        ▼
  Staff reviews in Borrow Requests
        │
   ┌────┴────┐
   │         │
 approve   reject → request closed with reason
   │
   ▼
 Staff releases item (QR scan or manual)
   - Asset: associate borrower / set holder; create borrow log (active)
   - Consumable: deduct stock only at release
   │
   ▼
 While out: log is active; if past due → overdue (derived)
   │
   ▼
 Return: QR / manual + condition
   - Clear holder / return log closed
   - Optional open maintenance if damaged / needs repair
```

**Where this lives today:**

| Step | UI | Backend |
|------|----|---------|
| Submit request | Not primary private UI | Not built |
| Approve/reject | Mock borrow-requests | Not built |
| Release/return log | Mock borrow-log + assets provisional release/return API | Assets release/return only (holder placeholder) |
| Overdue | Mock widgets / logs | Derive later from due date |
| Consumable deduct | Mock consumables | Not built |

---

### 7.2 Assets registry flow (UI today)

```
Load Assets page
  → show mock INITIAL_MOCK_ASSETS
  → client-side filter/sort
  → select card/row → detail panel
  → Add/Edit dialog → mutates local state
  → Mark maintenance → local status + history
  → Scan QR → find code in local list → open detail
```

### 7.3 Assets API flow (ready for integration)

```
useAssetsQuery / mutations
  → assetsApi (fetch)
  → /api/assets*
  → AssetController
  → AssetService (Zod + rules)
  → AssetRepository
  → Postgres via Drizzle getDb()
  → toAssetDTO (frontend Asset shape)
  → { data: ... }
```

**Integration switch (not done yet):** replace mock state on `/assets` with the hooks above.

---

### 7.4 Consumables stock flow (designed; UI mock)

```
Request (quantity) → pending (stock unchanged)
  → staff release → quantity_on_hand decreases
  → if qty ≤ threshold → low / critical severity in UI helpers
  → restock / adjust updates qty + history entry
```

---

### 7.5 Maintenance flow (designed; UI mock + embedded asset history)

```
Flag on return or manual
  → maintenance log open (or asset maintenanceHistory entry)
  → optional asset status → needs_repair
  → resolve dialog → closed with resolution notes
```

---

## 8. Maturity matrix

| Feature | UI | Client hooks | API routes | Server module / DB |
|---------|----|--------------|------------|--------------------|
| Dashboard | Mock | — | — | — |
| Borrow requests | Mock | — | — | Stub types only |
| **Assets registry** | **Mock page** | **Ready** | **Live** | **Live** |
| Borrow & return log | Mock | — | (via assets release/return partial) | Partial on asset row |
| Consumables | Mock | — | — | Stub only |
| Maintenance logs | Mock | — | — | JSONB on asset only |
| Users & roles | Mock | — | — | Auth scaffolding |
| Settings | Mock | — | — | Categories table scaffold |
| Reports | Placeholder | — | — | — |
| Health / Swagger | Live | — | Live | — |

---

## 9. Tech stack (current)

| Layer | Choice |
|-------|--------|
| Framework | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS, shadcn/ui-style components |
| Client data | TanStack React Query (assets hooks ready; QueryProvider present) |
| ORM | Drizzle ORM |
| Database | Postgres (Supabase), `DATABASE_URL` |
| Auth (intended) | Supabase Auth (`@supabase/ssr`) — staff only |
| API docs | next-swagger-doc + swagger-ui-react |
| Hosting target | Vercel-friendly serverless route handlers (`max: 1` DB connection default) |

---

## 10. Folder map (relevant)

```
src/
├── app/
│   ├── (private)/          # Staff pages: dashboard, assets, borrow-*, etc.
│   ├── api/
│   │   ├── assets/         # Wire to src/server/modules/assets
│   │   ├── health/
│   │   └── docs/           # Swagger
│   └── page.tsx            # Redirect → /dashboard
├── components/             # Feature UIs + shared layout/UI (mostly mock-driven pages)
├── features/
│   ├── assets/
│   │   ├── client/         # hooks + assets-api (integration-ready)
│   │   └── types.ts        # re-exports UI Asset contract
│   ├── consumables/        # types / stub actions / schemas (not full server module)
│   ├── borrow-requests/
│   └── dashboard/          # mock data for dashboard page
├── server/
│   ├── db/                 # drizzle client + schema
│   ├── modules/assets/     # production assets backend
│   └── shared/             # errors, http envelope
└── lib/supabase/           # auth clients (scaffold)
```

---

## 11. What is deliberately not done yet

- Wire `/assets` page to React Query hooks and live API
- Migrations applied + seed data for all environments (operator step with `DATABASE_URL`)
- Borrow-request and consumable **server modules** at the same fidelity as Assets
- Public borrower request form as a first-class production flow
- Hard authz on every private route and API (custodian session)
- First-class `borrow_transactions` / `maintenance_logs` tables (vs asset holder + JSONB)
- Reports analytics backend
- Soft-delete / archive strategy product sign-off vs hard `DELETE` + `retired` status

---

## 12. One-sentence summary

**CRMC-AIMS is a staff-facing Property Custodian app whose screens and domain flows (requests, assets, borrow log, consumables, maintenance, users, settings) are largely designed in the UI with mock data; the scalable server foundation starts with the Assets module (API + service/repository/schema + client hooks), ready for UI integration next.**

---

## Related docs

| Doc | Role |
|-----|------|
| `docs/PROJECT_OVERVIEW.md` | Original product intent |
| `docs/ARCHITECTURE.md` | Structural conventions (feature-based) |
| `docs/DATA_MODEL.md` | Early draft schema (may lag frontend + server assets) |
| `docs/API_REFERENCE.md` | Swagger conventions + planned endpoint list |
| `docs/AI_CONTEXT.md` | Rules for automated coding agents |
