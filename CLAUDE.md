# PROJECT X — PRICING ENGINE

Herramienta admin para sugerir y ejecutar upsells de bundles (Internet → Internet+Cable TV, o → Triple Play). El equipo de ventas ve clientes actuales, identifica oportunidades de "más por menos", y ejecuta cambios de plan directo en Firebase.

## Rápido Setup

```bash
npm install

# Variables de entorno
cp .env.example .env.local
# Editar con tus claves Firebase

# Sembrar el catálogo de 8 planes (+ clientes demo opcionales)
npm run seed
npm run seed:demo

# Correr en desarrollo
npm run dev
# http://localhost:3000
```

## Tech Stack

Next.js 15 (App Router) + TypeScript strict + Tailwind CSS v4 + Firebase (Firestore + Auth) + Vercel

## Estructura

- `src/app/admin/dashboard` — Dashboard principal (clientes + sugerencias)
- `src/app/admin/customer/[id]` — Detalles cliente + ejecutar upsell
- `src/app/admin/history` — Log de upsells aplicados
- `src/app/admin/plans` — CRUD del catálogo de planes
- `src/lib/pricing/bundles.ts` — Lógica para sugerir mejor bundle (`findBestUpsell`)
- `src/lib/pricing/calculator.ts` — Ahorro y valor agregado
- `src/lib/actions/` — Server Actions (upsell, plans, auth)
- `src/lib/firebase/` — Client SDK + Admin SDK
- `src/lib/db/` — Acceso a Firestore (customers, plans, upsell_log)
- `src/components/` — Componentes React (tablas, botones, cards)
- `scripts/seed.ts` — Seed de planes y clientes demo

## Flow Principal

1. Admin abre dashboard → ve tabla de clientes
2. Para cada cliente, el sistema sugiere el mejor bundle (más servicios, igual o menos precio, dentro de los próximos 2 tiers, nunca downgrade)
3. Admin clickea "EJECUTAR" → confirma en el dialog → Firebase se actualiza automáticamente
4. El cambio queda logueado en la colección `upsell_log`
5. Todo cambio auditado (quién, cuándo, de qué plan a qué plan)

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID proyecto Firebase |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key (pública) |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Auth domain |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |
| `FIREBASE_ADMIN_SDK_KEY` | Service account JSON (server only, ¡NUNCA en cliente!) |

## Auth

- Firebase Auth (email/password) en el cliente → el idToken se cambia por una cookie de sesión httpOnly (`createSessionCookie`)
- El rol admin vive en la colección `admins/{uid}` con `{ role: "admin" }` — crear a mano en Firebase console
- `src/middleware.ts` bloquea `/admin/*` sin cookie; `src/app/admin/layout.tsx` verifica firma + rol con el Admin SDK

## Reglas No Negociables

1. TypeScript strict mode siempre — cero `any`
2. Nunca expongas `FIREBASE_ADMIN_SDK_KEY` en client-side (solo se importa en `src/lib/firebase/server.ts`)
3. Todo cambio de plan se loguea en `upsell_log` (quién, cuándo, antes/después)
4. Rules en Firestore: solo admins pueden leer/escribir customers y modificar plans
5. Confirmación antes de ejecutar cualquier cambio (dialog, nunca directo)
6. `promo_price_2025` debe ser menor que `price_2025` (validado en `savePlanAction`)
7. Nunca sugerir downgrades — el candidato debe incluir todos los servicios actuales a nivel igual o mejor (`isServiceUpgrade`)
8. Mobile-first — el dashboard funciona en teléfono para consultas rápidas
