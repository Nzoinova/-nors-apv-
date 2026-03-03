# CLAUDE.md — NORS APV Codebase Guide

This document provides guidance for AI assistants working on the NORS APV repository.

## Project Overview

**NORS APV** is a vehicle maintenance contract management system for NORS Trucks & Buses Angola VT. It manages:
- Vehicle contracts (APV preventive maintenance and CM corrective maintenance types)
- Vehicles (Dongfeng, Volvo, SDMO, Rekohl brands)
- Service orders and maintenance schedules
- Client relationships
- KPI dashboards and alerts for upcoming renewals/maintenance

Operating locations: Luanda, Lubango, Lobito (Angola). Currency: USD for contracts, KZ (Angolan Kwanza) for internal accounting.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Routing | React Router DOM 6 (HashRouter) |
| Server State | TanStack React Query 5 |
| Database | Supabase (PostgreSQL) |
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
│   │   ├── Layout.tsx          # Main layout wrapper with sidebar
│   │   └── Sidebar.tsx         # Navigation sidebar (receives totalAlerts prop)
│   └── shared/
│       ├── ConfirmDialog.tsx    # Reusable confirmation modal
│       ├── KPICard.tsx          # Dashboard KPI metric card (compact 6-col layout)
│       └── StatusBadge.tsx      # Color-coded status chip
├── pages/
│   ├── Dashboard.tsx            # KPI overview with Recharts visualizations
│   ├── clients/
│   │   ├── ClientsList.tsx
│   │   ├── ClientDetail.tsx
│   │   └── ClientForm.tsx
│   ├── contracts/
│   │   ├── ContractsList.tsx    # useMemo-optimized, multiple status columns
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
│       └── Settings.tsx
├── services/                    # All Supabase API calls
│   ├── clients.ts
│   ├── contracts.ts
│   ├── vehicles.ts
│   ├── service-orders.ts
│   ├── dashboard.ts
│   └── config.ts
├── lib/
│   └── supabase.ts             # Supabase client initialization
├── types/
│   └── index.ts                # All TypeScript interfaces
├── utils/
│   ├── constants.ts            # Business constants, status colors, vehicle types
│   └── formatters.ts           # Currency (USD/KZ), date, number formatters
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

There is no test runner configured. No `npm test` command exists.

## Environment Variables

Create `.env.local` (gitignored) for local development:

```
VITE_SUPABASE_URL=<your-supabase-project-url>
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

These are also required as GitHub Actions secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) for CI/CD deployment.

## Database Schema (Supabase)

### Tables
| Table | Purpose |
|---|---|
| `clientes` | Client records |
| `viaturas` | Vehicle records |
| `contratos` | Contract records |
| `ordens_servico` | Service order records |
| `configuracao` | System-wide configuration |

### Views
| View | Purpose |
|---|---|
| `v_estado_contratos` | Contract state aggregation |
| `v_dashboard_kpis` | KPI metrics used by Dashboard |
| `v_alertas` | Alert generation for upcoming renewals/maintenance |

### RPC Functions
- `get_resumo_clientes` — Aggregated client summary data

### Key Relations
- `contratos` → `clientes` (client FK)
- `contratos` → `viaturas` (vehicle FK)
- `ordens_servico` → `contratos` (contract FK)
- Supabase join syntax: `cliente:clientes(*)` in select queries

## Routing

The app uses **HashRouter** (important for GitHub Pages compatibility). All routes are defined in `App.tsx`:

| Path | Component |
|---|---|
| `/` | Dashboard |
| `/contratos` | ContractsList |
| `/contratos/novo` | ContractForm (create) |
| `/contratos/:id` | ContractDetail |
| `/viaturas` | VehiclesList |
| `/viaturas/nova` | VehicleForm (create) |
| `/viaturas/:id` | VehicleDetail |
| `/os` | ServiceOrdersList |
| `/os/nova` | ServiceOrderForm (create) |
| `/os/:id` | ServiceOrderDetail |
| `/clientes` | ClientsList |
| `/clientes/novo` | ClientForm (create) |
| `/clientes/:id` | ClientDetail |
| `/configuracoes` | Settings |

## Data Fetching Conventions

All server state is managed via **TanStack React Query** with these global defaults (set in `App.tsx`):
- `staleTime`: 2 minutes (120,000 ms)
- `retry`: 1

Pattern for queries:
```tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', id],
  queryFn: () => fetchResource(id),
});
```

Pattern for mutations:
```tsx
const mutation = useMutation({
  mutationFn: createResource,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resource'] }),
});
```

All API functions live in `src/services/` and return typed Supabase results. Always handle errors via Supabase's `{ data, error }` pattern.

## TypeScript Conventions

All types are centralized in `src/types/index.ts`. Key interfaces:

- `Cliente` — client entity
- `Viatura` — vehicle entity
- `Contrato` — contract entity
- `OrdemServico` — service order
- `Configuracao` — system config
- `EstadoContrato` — contract state (from view)
- `DashboardKPIs` — dashboard metric shape
- `Alerta` — alert entity

**Always add new types to `src/types/index.ts`.** Do not define types inline in components.

Use the path alias `@/` for imports (maps to `src/`):
```tsx
import { Cliente } from '@/types';
import { fetchClientes } from '@/services/clients';
```

## Styling Conventions

The project uses **Tailwind CSS** with a custom NORS color palette:

```js
// tailwind.config.js custom colors
nors: {
  black: '#000000',
  'off-black': '#1A1A1A',
  'dark-gray': '#333333',
  'medium-gray': '#666666',
  'light-gray-2': '#999999',
  'light-gray': '#CCCCCC',
  'off-white': '#F5F5F5',
  white: '#FFFFFF',
  teal: '#415A67',       // primary accent
  'sky-blue': '#9CC7DE', // secondary accent
}
```

- Font: Inter (with Arial fallback)
- Always prefer NORS palette classes (e.g., `text-nors-teal`, `bg-nors-off-white`) over generic Tailwind grays
- Do **not** write custom CSS unless absolutely necessary — use Tailwind utilities

## Business Logic Constants (`src/utils/constants.ts`)

Key exports used throughout the app:
- `TIPOS_VIATURA` — vehicle type options
- `LOCALIZACOES` — Luanda, Lubango, Lobito
- `STATUS_COLORS` — maps contract/order status strings to Tailwind color classes (includes `CORTESIA` and `FECHADO` states)
- Maintenance interval constants (B1, B2, B3, B4 cycles)

When adding new status values, always add corresponding entries to `STATUS_COLORS` in `constants.ts`.

## Formatting Utilities (`src/utils/formatters.ts`)

- Currency: USD and KZ (Angolan Kwanza) with exchange rate support
- Dates: Portuguese locale formatting
- Numbers: locale-aware number formatting

Always use these formatters for displaying monetary values and dates — never format inline.

## CI/CD

**GitHub Actions** (`.github/workflows/deploy.yml`):
- Trigger: push to `main` branch
- Node 20 with npm cache
- Runs `npm run build`
- Deploys `dist/` to GitHub Pages

The Vite build uses `base: '/-nors-apv-/'` in `vite.config.ts` for GitHub Pages subdirectory hosting.

## Key Patterns & Conventions

1. **No test framework** — the project has no tests configured. Do not add test files without first setting up a framework.

2. **Portuguese naming in domain entities** — Database tables, types, and many variables use Portuguese names (`clientes`, `viaturas`, `contratos`, `ordens_servico`). Maintain this convention for domain entities. UI copy and comments can be Portuguese or English.

3. **Performance** — `ContractsList` uses `useMemo` for filtering/sorting. Apply the same pattern to other list pages when adding filter logic.

4. **Sidebar alerts** — `totalAlerts` count is passed as a prop from `Layout` down to `Sidebar`. When adding new alert sources, update the alert aggregation in the dashboard/layout level.

5. **HashRouter is intentional** — Do not change to BrowserRouter; GitHub Pages does not support server-side routing.

6. **Supabase client is a singleton** — Import from `@/lib/supabase`, never instantiate a new client.

7. **No Docker, no ORM** — Direct Supabase JS SDK calls only. No migration files in this repo (migrations are managed in Supabase dashboard).
