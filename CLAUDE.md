# CLAUDE.md — NORS APV Codebase Guide
This document provides guidance for AI assistants working on the NORS APV repository.
## Project Overview
**NORS APV** is a vehicle maintenance contract management system for NORS Trucks & Buses Angola VT. It manages:
- Vehicle contracts — two types: **APV** (paid preventive maintenance) and **CM** (commercial agreements, free maintenance included with vehicle purchase)
- Vehicles (Volvo, Dongfeng, SDMO, Rekohl brands)
- Service orders and maintenance schedules
- Client relationships
- KPI dashboards and alerts for upcoming renewals/maintenance
Operating locations: Luanda, Lubango, Lobito (Angola). Currency: USD for APV contracts, KZ (Angolan Kwanza) for CM agreements and internal accounting.
## Business Context
### Contract Types
| Type | Description | Duration | Value | Renewal |
|------|-------------|----------|-------|---------|
| **APV** | Paid preventive maintenance contracts | 1-3 years | Monthly USD | Auto-renewable |
| **CM** | Commercial agreements (free with vehicle sale) | 12 months fixed | Total KZ (global value) | No renewal |
### CM Contract Rules
- CM = "acordo comercial" — maintenance offered free when client buys a truck
- Volvo CM: 4 interventions (3 basic + 1 complete revision)
- Dongfeng CM: 5 interventions (4 basic + 1 complete)
- CM can have a "cortesia" period (1 extra month after expiry)
- CM status lifecycle: ACTIVO → CORTESIA → FECHADO_TEMPO / FECHADO_INTERVENCOES / FECHADO_OUTRO
### Contract Statuses
| Status | Meaning | Applies to |
|--------|---------|------------|
| `ATIVO` | Contract in force | APV + CM |
| `A RENOVAR` | Expiring within alert threshold | APV only |
| `CORTESIA` | Grace period after expiry | CM only |
| `FECHADO` | Closed (see status_cm for reason) | CM only |
| `EXPIRADO` | Expired without renewal | APV + CM |
### Key Stakeholders
- **Sidney Maia** — Technical Business Support (manages contracts, does NOT set prices)
- **Ricardo Barata** (Portugal) — Generates proposals and pricing
- **Tiago Alves** — APV Manager, approves proposals
- **Kitana Barbosa** — APV Director, final approval
### Revenue Rules
- Dashboard revenue KPIs count APV contracts ONLY (CM has no monthly USD value)
- CM value is stored in `valor_total_kz` (total for 12 months), NOT `valor_mensal_usd`
## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Routing | React Router DOM 6 (HashRouter) |
| Server State | TanStack React Query 5 |
| Database | Supabase (PostgreSQL) — project ID: `tesizdabthzkvlhlphvl` |
| Styling | Tailwind CSS 3 with custom NORS theme |
| Icons | Lucide React |
| Charts | Recharts |
| Build | Vite 5 |
| Deploy | GitHub Pages via GitHub Actions |
## Repository Structure
```
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx          # Main layout wrapper with sidebar + alert queries
│   │   └── Sidebar.tsx         # Navigation sidebar with alert banner
│   └── shared/
│       ├── ConfirmDialog.tsx    # Reusable confirmation modal
│       ├── KPICard.tsx          # Dashboard KPI metric card
│       └── StatusBadge.tsx      # Color-coded status chip (uses STATUS_CONTRATO_COLORS)
├── pages/
│   ├── Dashboard.tsx            # KPI overview with Recharts (donut, bar, progress bars)
│   ├── clients/
│   │   ├── ClientsList.tsx      # Uses getResumoClientes() RPC
│   │   ├── ClientDetail.tsx     # Edit mode with ConfirmDialog
│   │   └── ClientForm.tsx
│   ├── contracts/
│   │   ├── ContractsList.tsx    # Hybrid view: APV/CM tabs + status tabs + client groups + sortable
│   │   ├── ContractDetail.tsx
│   │   └── ContractForm.tsx
│   ├── service-orders/
│   │   ├── ServiceOrdersList.tsx
│   │   ├── ServiceOrderDetail.tsx
│   │   └── ServiceOrderForm.tsx
│   ├── vehicles/
│   │   ├── VehiclesList.tsx
│   │   ├── VehicleDetail.tsx
│   │   └── VehicleForm.tsx
│   └── settings/
│       └── Settings.tsx         # Exchange rate, revision intervals
├── services/                    # All Supabase API calls
│   ├── clients.ts
│   ├── contracts.ts
│   ├── vehicles.ts
│   ├── service-orders.ts
│   ├── dashboard.ts             # getKPIs, getAlertas, getEstadoContratos
│   └── config.ts
├── lib/
│   └── supabase.ts             # Supabase client singleton
├── types/
│   └── index.ts                # All TypeScript interfaces (EstadoContrato, DashboardKPIs, etc.)
├── utils/
│   ├── constants.ts            # STATUS_CONTRATO_COLORS, PRIORIDADE_COLORS, MARCAS, CICLO_DONGFENG
│   └── formatters.ts           # formatUSD, formatKZ, formatDate, formatNumber, formatPercent, formatHorasMotor
├── App.tsx                     # QueryClient config + all routes
├── main.tsx                    # React entry point
└── index.css                   # Global styles + Tailwind directives
```
## Development Commands
```bash
npm run dev        # Start Vite dev server (hot reload)
npm run build      # tsc type-check + Vite production build → dist/
npm run preview    # Preview production build locally
```
No test runner is configured.
## Environment Variables
Required in `.env.local` and as GitHub Actions secrets:
```
VITE_SUPABASE_URL=https://tesizdabthzkvlhlphvl.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```
## Database Schema (Supabase)
### Tables
| Table | Purpose | Key Columns |
|---|---|---|
| `clientes` | Client records | `nome`, `nif`, `codigo_sap`, `ativo` |
| `viaturas` | Vehicle records | `vin`, `matricula`, `marca`, `modelo`, `km_inicial` |
| `contratos` | Contract records | `tipo_contrato` (APV/CM), `valor_mensal_usd`, `valor_total_kz`, `status_cm`, `intervencoes_previstas` |
| `ordens_servico` | Service orders | `numero_os`, `tipo_revisao`, `km_na_revisao`, `status` |
| `configuracao` | System config | `taxa_cambio_usd_kz`, `intervalo_dias_revisao`, `alerta_renovacao_dias` |
| `ciclos_revisao` | Revision cycle definitions | `marca`, `posicao`, `tipo_revisao` |
### Views (managed in Supabase SQL Editor, NOT in this repo)
| View | Purpose |
|---|---|
| `v_estado_contratos` | Joins contracts+vehicles+clients, calculates status, KM%, next revision |
| `v_dashboard_kpis` | Aggregated KPIs (active, expiring, expired, revenue) |
| `v_alertas` | 9 alert types with priority (ALTA/MEDIA/INFO) |
### RPC Functions
- `get_resumo_clientes()` — returns client summary with vehicle/contract counts
### Key Contract Columns
```sql
tipo_contrato   VARCHAR(10)  -- 'APV' or 'CM'
valor_mensal_usd DECIMAL     -- APV monthly value (NULL for CM)
valor_total_kz   DECIMAL     -- CM total value (NULL for APV)
status_cm        VARCHAR(30) -- ACTIVO, CORTESIA, FECHADO_TEMPO, FECHADO_INTERVENCOES, FECHADO_OUTRO
motivo_fecho     TEXT         -- Reason for closing (free text)
data_fecho       DATE         -- Date contract was closed
intervencoes_previstas INTEGER -- Volvo=4, Dongfeng=5
```
## Routing
**HashRouter** (required for GitHub Pages). All routes in `App.tsx`:
| Path | Component |
|---|---|
| `/` | Dashboard |
| `/contratos` | ContractsList |
| `/contratos/novo` | ContractForm |
| `/contratos/:id` | ContractDetail |
| `/viaturas` | VehiclesList |
| `/viaturas/nova` | VehicleForm |
| `/viaturas/:id` | VehicleDetail |
| `/os` | ServiceOrdersList |
| `/os/nova` | ServiceOrderForm |
| `/os/:id` | ServiceOrderDetail |
| `/clientes` | ClientsList |
| `/clientes/novo` | ClientForm |
| `/clientes/:id` | ClientDetail |
| `/configuracoes` | Settings |
## Styling — NORS Brand
The NORS brand is **primarily monochromatic**. Colour is used sparingly.
### Tailwind Custom Colors (from `tailwind.config.js`)
```
nors-black:       #000000
nors-off-black:   #2B2B2B
nors-dark-gray:   #575757
nors-medium-gray: #808080
nors-light-gray-2:#ABABAB
nors-light-gray:  #D6D6D6
nors-off-white:   #F2F2F2
nors-white:       #FFFFFF
nors-teal:        #415A67   ← primary accent (Trucks & Buses segment)
nors-sky-blue:    #9CC7DE   ← secondary accent
```
- Font: `Inter` with `Arial` fallback
- Headlines: `font-extrabold` (800), Body: `font-light` (300)
- Prefer NORS palette classes over generic Tailwind colors
- When Tailwind classes don't have exact colors, use `style={{ color: '#415A67' }}`
## Business Constants (`src/utils/constants.ts`)
- `STATUS_CONTRATO_COLORS` — ATIVO, A RENOVAR, CORTESIA, FECHADO, EXPIRADO
- `PRIORIDADE_COLORS` — ALTA, MEDIA, INFO (with dot color for badge)
- `CICLO_DONGFENG` — B1, B2, B3, B4, MC revision cycle
- `MARCAS` — Dongfeng, Volvo, SDMO, Rekohl
- `LOCALIZACOES` — Luanda, Lubango, Lobito
- `OS_PREFIXES` — OS number prefixes per location and type
**Rule:** When adding new status values, ALWAYS add entries to `STATUS_CONTRATO_COLORS`.
## Data Fetching Patterns
```tsx
// Query
const { data, isLoading } = useQuery({
  queryKey: ['estado-contratos'],
  queryFn: getEstadoContratos,
})
// Mutation with cache invalidation
const mutation = useMutation({
  mutationFn: (updates) => updateCliente(id, updates),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['cliente', id] })
    queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
  },
})
```
All API functions in `src/services/`. Always handle Supabase `{ data, error }` pattern.
## CI/CD
GitHub Actions (`.github/workflows/deploy.yml`): push to `main` → build → deploy to GitHub Pages.
Vite config: `base: '/-nors-apv-/'` for subdirectory hosting.
Live URL: https://nzoinova.github.io/-nors-apv-/
## Critical Rules
1. **HashRouter is mandatory** — GitHub Pages requires it. Never change to BrowserRouter.
2. **Supabase views are read-only from frontend** — Schema changes happen in Supabase SQL Editor, not in code.
3. **Portuguese domain naming** — Tables, types, and variables use Portuguese (`clientes`, `viaturas`, `contratos`).
4. **Revenue = APV only** — Never include CM contracts in revenue calculations.
5. **No Docker, no ORM** — Direct Supabase JS SDK calls only.
6. **useMemo for lists** — All list pages with filtering/sorting must use `useMemo`.
7. **Always invalidate related queries** — When mutating a resource, invalidate all views that depend on it.
8. **Format with utilities** — Use `formatUSD`, `formatKZ`, `formatDate` from `@/utils/formatters`. Never format inline.
