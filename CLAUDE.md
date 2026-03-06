# CLAUDE.md — NORS APV Codebase Guide

This document provides guidance for AI assistants working on the NORS APV repository.

## Project Overview

**NORS APV** is a vehicle maintenance contract management system for NORS Trucks & Buses Angola VT. It manages:
- Vehicle contracts — two types: **APV** (paid preventive maintenance) and **CM** (commercial agreements, free maintenance included with vehicle purchase)
- Vehicles (Volvo, Dongfeng, SDMO, Rekohl brands)
- Service orders and maintenance schedules
- Client relationships
- KPI dashboards and alerts for upcoming renewals/maintenance
- **CM→APV Pipeline** — automated workflow to convert expiring CM contracts into APV proposals

Operating locations: Luanda, Lubango, Lobito (Angola). Currency: USD for APV contracts, KZ (Angolan Kwanza) for CM agreements.

## Business Context

### Contract Types
| Type | Description | Duration | Value | Renewal |
|------|-------------|----------|-------|---------|
| **APV** | Paid preventive maintenance contracts | 1-3 years | Monthly USD | Auto-renewable |
| **CM** | Commercial agreements (free with vehicle sale) | 12 months fixed | Total KZ (global value) | No renewal — triggers APV proposal |

### CM Contract Rules
- CM = "acordo comercial" — maintenance offered free when client buys a truck
- Volvo CM: 4 interventions (3 basic + 1 complete revision)
- Dongfeng CM: 5 interventions (4 basic + 1 complete)
- CM expiration is **not urgent** — it's a business opportunity to propose APV
- CM alerts use INFO priority (blue), never ALTA (red)
- CM status lifecycle: ACTIVO → CORTESIA → FECHADO_TEMPO / FECHADO_INTERVENCOES / FECHADO_OUTRO

### CM→APV Pipeline
When a CM contract expires or approaches expiration:
1. System shows INFO alert "Acordo CM expira — oportunidade de proposta APV"
2. User clicks "Propor APV →" on Dashboard widget
3. Modal opens with pre-filled client/vehicle data
4. User adds notes, clicks "Criar Draft + Copiar Email"
5. System creates APV draft contract (status_pipeline = PENDENTE_PROPOSTA)
6. Email text copied to clipboard for sending to Ricardo Barata
7. Pipeline tracked through: PENDENTE_PROPOSTA → PROPOSTA_RECEBIDA → EM_APROVACAO → APROVADO → REJEITADO

### Revenue Rules
- Dashboard revenue KPIs count APV contracts ONLY
- CM value stored in `valor_total_kz` (total for 12 months), NOT `valor_mensal_usd`

### Key Stakeholders
- **Sidney Maia** — Technical Business Support (manages contracts, does NOT set prices)
- **Ricardo Barata** (Portugal) — Generates proposals and pricing
- **Tiago Alves** — APV Manager, approves proposals
- **Kitana Barbosa** — APV Director, final approval

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
public/
├── nors-logo-white.png          # White logo for dark backgrounds
├── nors-logo-dark.png           # Dark logo for light backgrounds
├── nors-tagline-white.png       # "Making it work." white version
├── nors-tagline-dark.png        # "Making it work." dark version
src/
├── components/
│   ├── layout/
│   │   ├── Layout.tsx           # Main layout with sidebar + alert queries
│   │   └── Sidebar.tsx          # Navigation sidebar with alert banner
│   └── shared/
│       ├── ConfirmDialog.tsx     # Reusable confirmation modal
│       ├── KPICard.tsx          # Dashboard KPI metric card
│       ├── StatusBadge.tsx      # Pill-shaped status badges (emerald/amber/blue/red)
│       └── ProposalModal.tsx    # CM→APV proposal modal with email generation
├── pages/
│   ├── Dashboard.tsx            # KPIs + donut (APV/CM toggle) + calendar + top clients + pipeline
│   ├── ReceptionPortal.tsx      # Standalone vehicle lookup (no sidebar, route /recepcao)
│   ├── clients/
│   │   ├── ClientsList.tsx      # Card grid layout with APV/CM filters
│   │   ├── ClientDetail.tsx
│   │   └── ClientForm.tsx
│   ├── contracts/
│   │   ├── ContractsList.tsx    # Grouped by client, collapsible, advanced filters, pipeline tab
│   │   ├── ContractDetail.tsx
│   │   └── ContractForm.tsx
│   ├── service-orders/
│   │   ├── ServiceOrdersList.tsx
│   │   ├── ServiceOrderDetail.tsx
│   │   └── ServiceOrderForm.tsx
│   ├── vehicles/
│   │   ├── VehiclesList.tsx     # Grouped by client, collapsible, brand filters
│   │   ├── VehicleDetail.tsx
│   │   └── VehicleForm.tsx
│   └── settings/
│       └── Settings.tsx         # Exchange rate, alerts, revision cycles, portal link, system info
├── services/
│   ├── clients.ts
│   ├── contracts.ts
│   ├── vehicles.ts
│   ├── service-orders.ts
│   ├── dashboard.ts             # getKPIs, getAlertas, getEstadoContratos
│   ├── config.ts                # getConfiguracoes, updateConfiguracoes
│   ├── reception.ts             # searchVehicleContract for reception portal
│   └── pipeline.ts             # createAPVDraft, updatePipelineStatus, getPipeline, generateEmailForRicardo
├── lib/
│   └── supabase.ts             # Supabase client singleton
├── types/
│   └── index.ts                # All TypeScript interfaces
├── utils/
│   ├── constants.ts            # STATUS_CONTRATO_COLORS, PRIORIDADE_COLORS, MARCAS, CICLO_DONGFENG
│   └── formatters.ts           # formatUSD, formatKZ, formatDate, formatNumber, formatPercent, formatHorasMotor
├── App.tsx                     # QueryClient config + all routes
├── main.tsx
└── index.css
```

## Database Schema (Supabase)

### Tables
| Table | Purpose | Key Columns |
|---|---|---|
| `clientes` | Client records (12) | `nome`, `nif`, `codigo_sap`, `ativo` |
| `viaturas` | Vehicle records (51) | `vin`, `matricula`, `marca`, `modelo`, `km_inicial` |
| `contratos` | Contract records (50) | `tipo_contrato`, `valor_mensal_usd`, `valor_total_kz`, `status_cm`, `status_pipeline`, `contrato_origem_id` |
| `ordens_servico` | Service orders (11) | `numero_os`, `tipo_revisao`, `km_na_revisao`, `status` |
| `configuracao` | System config (1 row) | `taxa_cambio_usd_kz`, `intervalo_dias_revisao`, `alerta_renovacao_dias` |
| `ciclos_revisao` | Revision cycle definitions | `marca`, `posicao`, `tipo_revisao` |

### Pipeline Columns (on contratos table)
- `status_pipeline` VARCHAR(30) — PENDENTE_PROPOSTA, PROPOSTA_RECEBIDA, EM_APROVACAO, APROVADO, REJEITADO
- `notas_pipeline` TEXT — Notes for Ricardo
- `data_pipeline` TIMESTAMP — When pipeline was initiated
- `contrato_origem_id` UUID — FK to the originating CM contract

### Views (managed in Supabase SQL Editor)
| View | Purpose |
|---|---|
| `v_estado_contratos` | Joins contracts+vehicles+clients, calculates status, KM%, next revision |
| `v_dashboard_kpis` | Aggregated KPIs (active, expiring, expired, revenue — APV only) |
| `v_alertas` | 9 alert types. CM alerts = INFO priority, APV alerts = ALTA/MEDIA |
| `v_pipeline_apv` | Pipeline items with origin CM contract info |

### RPC Functions
- `get_resumo_clientes()` — returns client summary with vehicle/contract counts

## Routing

HashRouter required for GitHub Pages. Routes in App.tsx:

| Path | Component | Layout |
|---|---|---|
| `/` | Dashboard | With sidebar |
| `/contratos` | ContractsList | With sidebar |
| `/contratos/novo` | ContractForm | With sidebar |
| `/contratos/:id` | ContractDetail | With sidebar |
| `/viaturas` | VehiclesList | With sidebar |
| `/viaturas/nova` | VehicleForm | With sidebar |
| `/viaturas/:id` | VehicleDetail | With sidebar |
| `/os` | ServiceOrdersList | With sidebar |
| `/os/nova` | ServiceOrderForm | With sidebar |
| `/os/:id` | ServiceOrderDetail | With sidebar |
| `/clientes` | ClientsList | With sidebar |
| `/clientes/novo` | ClientForm | With sidebar |
| `/clientes/:id` | ClientDetail | With sidebar |
| `/configuracoes` | Settings | With sidebar |
| `/recepcao` | ReceptionPortal | **No sidebar** (standalone) |

## Styling — NORS Brand

Monochromatic brand. Colour used sparingly.

### Tailwind Custom Colors (tailwind.config.js)
```
nors-black: #000000, nors-off-black: #2B2B2B, nors-dark-gray: #575757
nors-medium-gray: #808080, nors-light-gray-2: #ABABAB, nors-light-gray: #D6D6D6
nors-off-white: #F2F2F2, nors-white: #FFFFFF
nors-teal: #415A67 (primary accent), nors-sky-blue: #9CC7DE (secondary)
```

### Design Tokens
- Cards: bg-white rounded-lg border border-gray-200 shadow-sm, hover shadow-md
- Buttons primary: bg-nors-teal text-white rounded-md h-10 px-4
- Status badges: rounded-full px-2.5 py-0.5 text-xs font-semibold border
- Tables: header bg-gray-50/50 text-xs uppercase, rows hover:bg-gray-50/50
- All accents: nors-teal (#415A67), never green

### Logo Assets (public/)
Use with: `${import.meta.env.BASE_URL}nors-logo-white.png`

## Critical Rules

1. **HashRouter mandatory** — GitHub Pages requires it
2. **Supabase views read-only** — Schema changes in SQL Editor only
3. **Portuguese domain naming** — clientes, viaturas, contratos
4. **Revenue = APV only** — Never include CM in revenue
5. **CM alerts = INFO** — Not urgent, they're opportunities
6. **navigate(-1) for back** — Not hardcoded routes
7. **useMemo for lists** — All filtered/sorted lists
8. **Format with utilities** — formatUSD, formatKZ, formatDate
9. **Pipeline drafts excluded** — From revenue and regular lists
10. **STATUS_CONTRATO_COLORS** — Update when adding new statuses

## Current Data (March 2026)
- 12 clients, 51 vehicles (15 Dongfeng, 36 Volvo)
- 50 contracts (14 APV, 36 CM), 11 service orders
- Live: https://nzoinova.github.io/-nors-apv-/

## Pending / Next Steps
- Logo NORS images in sidebar and reception portal
- Relatório mensal exportável (PDF/Excel for Tiago meetings)
- Histórico de intervenções / utilização % por contrato CM
- Fecho automático de CM expirados
- "Total em Aberto" column from CM data (saldo disponível)
