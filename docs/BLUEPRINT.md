# PROJECT X — Blueprint

> Archetype: Internal Admin Tool / SaaS

---

## 1. Project Overview

### Vision

Project X es una herramienta interna para que el equipo de ventas vea clientes actuales, identifique oportunidades de upsell con bundles más valiosos por igual o menor precio, y ejecute cambios de plan automáticamente en Firebase.

**Caso de uso real:**

- Cliente tiene: `300M Internet $69.99`
- Admin busca cliente → App sugiere: `500M Internet + Cable TV $68.99` (¡$1 menos!)
- Admin clickea "EJECUTAR" → Firebase se actualiza al tiro
- Cliente pasó de pagar $69.99 a $68.99 pero ahora tiene Cable TV incluido

### Goals

- Acelerar venta de bundles sin fricción
- Aumentar ARR por cliente sugiriendo "más por menos"
- Automatizar cambios en Firebase (sin llamadas a API externas)
- Dashboard rápido y visual para el team
- Log de todos los cambios aplicados

### Success Metrics

- 10+ upsells ejecutados por semana
- AOV (Average Order Value) sube 15%
- Reducir fricción: cambio de plan en < 10 segundos

---

## 2. Tech Stack

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Framework | Next.js 15 (App Router) | Rápido, SSR, deploy automático a Vercel |
| Lenguaje | TypeScript strict | Tipado en data de clientes y planes |
| Styling | Tailwind CSS v4 | Dashboard oscuro, tablas, responsive |
| Database | Firebase Firestore | Real-time, sin backend extra |
| Auth | Firebase Auth + session cookies | Integración nativa |
| API | Next.js Server Actions | Escrituras server-side con Admin SDK |
| Hosting | Vercel | Deploy desde GitHub, serverless |

---

## 3. Directory Structure

```
project-x/
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout (fonts + tema)
│   │   ├── page.tsx                   # Login page
│   │   ├── globals.css                # Design tokens Tailwind v4
│   │   └── admin/
│   │       ├── layout.tsx             # Admin layout con sidebar + verificación de rol
│   │       ├── dashboard/page.tsx     # Página principal (clientes + upsells)
│   │       ├── customer/[id]/page.tsx # Detalles cliente + plan actual + comparativa
│   │       ├── history/page.tsx       # Histórico de cambios
│   │       └── plans/page.tsx         # Catálogo de planes (CRUD)
│   │
│   ├── components/
│   │   ├── auth/LoginForm.tsx
│   │   ├── dashboard/
│   │   │   ├── ClientsTable.tsx       # Tabla de clientes (búsqueda, links)
│   │   │   ├── UpsellSuggestion.tsx   # Card mostrando bundle sugerido
│   │   │   ├── ExecuteButton.tsx      # Botón EJECUTAR con dialog de confirmación
│   │   │   └── HistoryTable.tsx       # Log de cambios aplicados
│   │   ├── customer/
│   │   │   ├── CurrentPlan.tsx        # Card de plan + precio + servicios
│   │   │   ├── BundleComparison.tsx   # Side-by-side: actual vs sugerido
│   │   │   ├── SavingsCalculator.tsx  # "Pagas $X, ahorras $Y" (mensual/anual)
│   │   │   └── PriceBreakdown.tsx     # Desglose de servicios (Internet, Cable, Tel)
│   │   ├── plans/PlansManager.tsx     # CRUD de planes (form + delete confirm)
│   │   └── ui/                        # button, table, dialog, input, badge
│   │
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── client.ts              # Firebase browser SDK (lazy init)
│   │   │   └── server.ts              # Admin SDK (server only)
│   │   ├── db/
│   │   │   ├── customers.ts           # list/get/updateCustomer
│   │   │   ├── plans.ts               # list/get/upsert/deletePlan
│   │   │   └── upsells.ts             # createUpsellLog, listUpsellLogs
│   │   ├── pricing/
│   │   │   ├── bundles.ts             # findBestUpsell + isServiceUpgrade
│   │   │   └── calculator.ts          # calculateSavings, calculateValueAdd
│   │   ├── actions/
│   │   │   ├── auth.ts                # createSessionAction, logoutAction
│   │   │   ├── upsell.ts              # suggestUpsellAction, executeUpsellAction
│   │   │   └── plans.ts               # savePlanAction, deletePlanAction
│   │   ├── auth/session.ts            # getSessionUser, isAdmin, requireAdmin
│   │   └── utils.ts                   # cn, formatMoney, formatDate
│   │
│   ├── hooks/
│   │   ├── useCustomers.ts            # Real-time listener de customers
│   │   ├── usePlans.ts                # Real-time listener del catálogo
│   │   └── useUpsell.ts               # Calcular y aplicar upsell desde el cliente
│   │
│   ├── types/
│   │   ├── customer.ts                # Customer
│   │   ├── plan.ts                    # Plan, PlanService, BundleType
│   │   └── upsell.ts                  # UpsellLog, UpsellSuggestion
│   │
│   └── middleware.ts                  # Bloquea /admin/* sin cookie de sesión
│
├── scripts/seed.ts                    # Seed: 8 planes (+clientes demo con --demo)
├── docs/BLUEPRINT.md                  # Este documento
├── firebase.json
├── firestore.rules
├── .env.example
└── next.config.ts
```

---

## 4. Data Model

Todas las fechas se guardan como strings ISO 8601 (serializables entre server y client components).

### `customers`

```typescript
{
  id: string,                    // Doc ID
  name: string,                  // "José García"
  phone: string,                 // "+1-787-555-1234"
  email: string,
  type: "B2B" | "B2C",
  current_plan_id: string,       // FK → plans.id (ej. "PLAN_300M_ONLY")
  price_paying_now: number,      // 69.99
  signup_date: string,           // ISO 8601
  last_plan_change: string | null,
  notes: string,
  created_at: string,
  updated_at: string
}
```

### `plans`

```typescript
{
  id: string,                    // "PLAN_300M_ONLY", "PLAN_500M_CABLE", ...
  name: string,                  // "300M Internet Only"
  description: string,
  services: [
    { type: "internet", speed: 300, included: true },
    { type: "cable_tv", channels: null, included: false },
    { type: "phone_lines", count: 0, included: false }
  ],
  price_2025: number,            // 74.99 (precio de lista)
  promo_price_2025: number,      // 69.99 (precio vigente — siempre < price_2025)
  discount_code: string,         // "8UD05"
  bundle_code: string,           // "R6UC1"
  is_bundle: boolean,
  bundle_type: "internet_only" | "internet_cable" | "triple_play",
  tier: number,                  // 1, 2, 3... ordena las sugerencias
  created_at: string
}
```

### `upsell_log`

```typescript
{
  id: string,
  customer_id: string,
  customer_name: string,         // Desnormalizado para leer el log sin joins
  from_plan_id: string,
  from_plan_name: string,
  from_price: number,
  to_plan_id: string,
  to_plan_name: string,
  to_price: number,
  savings: number,               // Positivo = "más por menos"
  value_add: string,             // "Cable TV incluido", "200M extra + Cable TV"
  executed_by: string,           // Email del admin (viene de la sesión, no del cliente)
  executed_at: string,
  created_at: string
}
```

### `admins`

```typescript
// Doc ID = uid de Firebase Auth
{ role: "admin" }
```

### Firestore Rules

Ver [firestore.rules](../firestore.rules): solo usuarios con doc en `admins` y `role == "admin"` pueden leer/escribir customers y upsell_log, o modificar plans. Cualquier usuario autenticado puede leer el catálogo de planes.

---

## 5. Motor de Sugerencias

`findBestUpsell(currentPlan, allPlans, pricePayingNow)` en [src/lib/pricing/bundles.ts](../src/lib/pricing/bundles.ts):

1. **Nunca downgrade** — el candidato debe incluir todos los servicios del plan actual a nivel igual o mejor (velocidad de internet, cantidad de líneas)
2. **Precio** — `promo_price_2025 ≤ price_paying_now`
3. **Tier** — dentro de los siguientes 2 tiers (`current.tier < tier ≤ current.tier + 2`)
4. **Orden** — más servicios primero; a igualdad, el precio más bajo

`calculateValueAdd(from, to)` genera el texto de valor: `"200M extra de Internet + Cable TV incluido"`.

---

## 6. Server Actions

| Action | Qué hace |
|--------|----------|
| `suggestUpsellAction(customerId)` | Calcula la mejor sugerencia para un cliente |
| `executeUpsellAction(customerId, newPlanId)` | Verifica sesión admin → actualiza customer → escribe `upsell_log` → revalida rutas |
| `savePlanAction(input)` | Crea/edita plan con validación (promo < lista, al menos un servicio) |
| `deletePlanAction(planId)` | Borra plan solo si ningún cliente lo tiene asignado |
| `createSessionAction(idToken)` | Cambia idToken por cookie de sesión httpOnly (verifica rol admin) |
| `logoutAction()` | Borra cookie y redirige al login |

`executed_by` siempre sale de la cookie de sesión verificada — el cliente nunca manda su propio email.

---

## 7. Design System

### Colors

| Token | Valor |
|-------|-------|
| Background | `#0A0A0F` |
| Surface | `#0E0E1A` |
| Primary (Purple) | `#7C3AED` |
| Success (Green) | `#16A34A` |
| Warning (Orange) | `#EA580C` |
| Danger (Red) | `#DC2626` |
| Text | `#E8E8F0` |
| Muted | `#6B6B8A` |

### Typography

- Headings: **Cinzel** (serif, bold) — `font-heading`
- Data/precios: **Orbitron** (monospace) — `font-data`
- Body: **Inter** (sans-serif) — default

### Layout

- Sidebar + main content (sidebar colapsa arriba en mobile)
- Tablas con scroll horizontal en mobile
- Cards de sugerencia siempre visibles (no hidden)

---

## 8. Authentication & Authorization

1. Login con Firebase Auth (email/password) en el cliente
2. El idToken se cambia por una **cookie de sesión httpOnly** con `adminAuth().createSessionCookie()` — 5 días
3. `src/middleware.ts` (Edge) rechaza `/admin/*` sin cookie
4. `src/app/admin/layout.tsx` verifica la firma de la cookie **y** el rol en `admins/{uid}` con el Admin SDK
5. Cada server action que escribe vuelve a verificar sesión + rol

---

## 9. Setup & Deploy

```bash
# 1. Instalar
npm install

# 2. Firebase console
#    - Crear proyecto, habilitar Firestore + Auth (email/password)
#    - Publicar firestore.rules
#    - Descargar service account key (Settings → Service accounts)

# 3. Variables de entorno
cp .env.example .env.local   # llenar claves

# 4. Seed
npm run seed        # solo los 8 planes
npm run seed:demo   # planes + 5 clientes de ejemplo

# 5. Crear el primer admin
#    - Auth → agregar usuario
#    - Firestore → colección "admins" → doc ID = uid → { role: "admin" }

# 6. Desarrollo
npm run dev

# 7. Deploy: conectar el repo a Vercel + set env vars (FIREBASE_*)
```

---

## 10. Testing

Unit tests recomendados:

- `findBestUpsell()` — dado plan actual, devuelve el bundle correcto; nunca sugiere downgrade
- `calculateSavings()` / `calculateValueAdd()` — cálculos y textos correctos
- `savePlanAction` — rechaza promo ≥ lista

E2E: login → buscar cliente → ejecutar upsell → verificar customer actualizado en Firestore → ver entrada en historial.

---

## 11. Reglas No Negociables

1. **TypeScript strict** — cero `any`
2. **Audit trail** — todo cambio logged con usuario, timestamp, antes/después
3. **Confirmación siempre** — nunca ejecutar sin que el admin confirme en el dialog
4. **Firebase Security** — service account key NUNCA en client
5. **Precios correctos** — `promo_price_2025` siempre menor que `price_2025`
6. **Bundles lógicos** — nunca sugerir downgrades (ej. "500M solo" a quien tiene "300M + Cable")
7. **Mobile responsive** — el dashboard funciona en teléfono para consultas rápidas
