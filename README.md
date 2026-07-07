# ⚡ Project X — Pricing Engine

Herramienta interna para que el equipo de ventas vea clientes actuales, identifique oportunidades de upsell con bundles más valiosos por igual o menor precio, y ejecute cambios de plan automáticamente en Firebase.

**Caso de uso real:**

- Cliente tiene: `300M Internet $69.99`
- Admin busca cliente → App sugiere: `500M Internet + Cable TV $68.99` (¡$1 menos!)
- Admin clickea "EJECUTAR" → Firebase se actualiza al tiro
- Cliente pasó de pagar $69.99 a $68.99 pero ahora tiene Cable TV incluido

## Quick Start

```bash
npm install
cp .env.example .env.local   # llena tus claves Firebase
npm run seed:demo            # 8 planes + 5 clientes demo
npm run dev                  # http://localhost:3000
```

### Primer login

1. En Firebase console → Authentication → agrega un usuario (email/password)
2. En Firestore → crea la colección `admins` → doc con ID = uid del usuario → campo `role: "admin"`
3. Entra con ese email en la app

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Lenguaje | TypeScript strict |
| Styling | Tailwind CSS v4 (dark dashboard) |
| Database | Firebase Firestore |
| Auth | Firebase Auth + session cookies |
| API | Next.js Server Actions |
| Hosting | Vercel |

## Documentación

- [CLAUDE.md](CLAUDE.md) — guía para trabajar en el repo
- [docs/BLUEPRINT.md](docs/BLUEPRINT.md) — arquitectura completa, data model, build order
