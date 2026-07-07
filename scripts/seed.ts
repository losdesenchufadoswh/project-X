/**
 * Seed del catálogo de planes (y clientes demo con --demo).
 *
 *   npm run seed        → solo planes (merge, no borra nada)
 *   npm run seed:demo   → planes + 5 clientes de ejemplo
 *
 * Requiere FIREBASE_ADMIN_SDK_KEY en .env.local
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Carga .env.local sin dependencias extra ──────────────────
function loadEnvLocal(): void {
  const file = resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const key = process.env.FIREBASE_ADMIN_SDK_KEY;
if (!key) {
  console.error("✗ FIREBASE_ADMIN_SDK_KEY no está en .env.local — copia .env.example y llénalo.");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential: cert(JSON.parse(key)) });
}
const db = getFirestore();

const now = new Date().toISOString();

// ── Catálogo: 8 planes ────────────────────────────────────────
// tier ordena el valor; el motor sugiere dentro de los próximos 2 tiers
// con precio promo ≤ lo que el cliente paga hoy.
const plans = [
  {
    id: "PLAN_100M_ONLY",
    name: "100M Internet Only",
    description: "100 Mbps Internet",
    services: [
      { type: "internet", speed: 100, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 54.99,
    promo_price_2025: 49.99,
    discount_code: "8UD01",
    bundle_code: "R6UA1",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 1,
    created_at: now,
  },
  {
    id: "PLAN_300M_ONLY",
    name: "300M Internet Only",
    description: "300 Mbps Internet",
    services: [
      { type: "internet", speed: 300, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 74.99,
    promo_price_2025: 69.99,
    discount_code: "8UD05",
    bundle_code: "R6UC1",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 2,
    created_at: now,
  },
  {
    id: "PLAN_500M_ONLY",
    name: "500M Internet Only",
    description: "500 Mbps Internet",
    services: [
      { type: "internet", speed: 500, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 84.99,
    promo_price_2025: 79.99,
    discount_code: "8UD07",
    bundle_code: "R6UD1",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 3,
    created_at: now,
  },
  {
    id: "PLAN_300M_CABLE",
    name: "300M Internet + Cable TV",
    description: "300 Mbps + Cable TV estándar",
    services: [
      { type: "internet", speed: 300, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 84.99,
    promo_price_2025: 64.99,
    discount_code: "8UD09",
    bundle_code: "R6UE2",
    is_bundle: true,
    bundle_type: "internet_cable",
    tier: 3,
    created_at: now,
  },
  {
    // ⭐ El del caso de uso: 300M $69.99 → 500M + Cable $68.99 (¡$1 menos!)
    id: "PLAN_500M_CABLE",
    name: "500M Internet + Cable TV",
    description: "500 Mbps + Cable TV estándar",
    services: [
      { type: "internet", speed: 500, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 89.99,
    promo_price_2025: 68.99,
    discount_code: "8UD11",
    bundle_code: "R6UF2",
    is_bundle: true,
    bundle_type: "internet_cable",
    tier: 4,
    created_at: now,
  },
  {
    id: "PLAN_1G_ONLY",
    name: "1 Gig Internet Only",
    description: "1000 Mbps Internet",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 99.99,
    promo_price_2025: 89.99,
    discount_code: "8UD13",
    bundle_code: "R6UG1",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 4,
    created_at: now,
  },
  {
    id: "PLAN_500M_TRIPLE",
    name: "500M Triple Play",
    description: "500 Mbps + Cable TV + 1 línea telefónica",
    services: [
      { type: "internet", speed: 500, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 109.99,
    promo_price_2025: 79.99,
    discount_code: "8UD15",
    bundle_code: "R6UH3",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 5,
    created_at: now,
  },
  {
    id: "PLAN_1G_TRIPLE",
    name: "1 Gig Triple Play",
    description: "1000 Mbps + Cable TV + 2 líneas telefónicas",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 2, included: true },
    ],
    price_2025: 139.99,
    promo_price_2025: 99.99,
    discount_code: "8UD17",
    bundle_code: "R6UJ3",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 6,
    created_at: now,
  },
];

// ── Clientes demo (solo con --demo) ───────────────────────────
const demoCustomers = [
  {
    id: "CUST_DEMO_001",
    name: "José García",
    phone: "+1-787-555-1234",
    email: "jose@example.com",
    type: "B2C",
    current_plan_id: "PLAN_300M_ONLY",
    price_paying_now: 69.99,
    signup_date: "2024-03-15T10:00:00.000Z",
    last_plan_change: null,
    notes: "Cliente importante, contacto directo",
    created_at: now,
    updated_at: now,
  },
  {
    id: "CUST_DEMO_002",
    name: "María Rivera",
    phone: "+1-787-555-2345",
    email: "maria@example.com",
    type: "B2C",
    current_plan_id: "PLAN_100M_ONLY",
    price_paying_now: 49.99,
    signup_date: "2023-11-02T10:00:00.000Z",
    last_plan_change: null,
    notes: "",
    created_at: now,
    updated_at: now,
  },
  {
    id: "CUST_DEMO_003",
    name: "Ferretería Delgado",
    phone: "+1-787-555-3456",
    email: "compras@ferreteriadelgado.com",
    type: "B2B",
    current_plan_id: "PLAN_500M_ONLY",
    price_paying_now: 79.99,
    signup_date: "2024-01-20T10:00:00.000Z",
    last_plan_change: null,
    notes: "Negocio — pregunta por líneas telefónicas",
    created_at: now,
    updated_at: now,
  },
  {
    id: "CUST_DEMO_004",
    name: "Carmen Ortiz",
    phone: "+1-787-555-4567",
    email: "carmen@example.com",
    type: "B2C",
    current_plan_id: "PLAN_300M_CABLE",
    price_paying_now: 64.99,
    signup_date: "2025-05-10T10:00:00.000Z",
    last_plan_change: null,
    notes: "",
    created_at: now,
    updated_at: now,
  },
  {
    id: "CUST_DEMO_005",
    name: "Luis Fernández",
    phone: "+1-787-555-5678",
    email: "luisf@example.com",
    type: "B2C",
    current_plan_id: "PLAN_1G_TRIPLE",
    price_paying_now: 99.99,
    signup_date: "2025-09-01T10:00:00.000Z",
    last_plan_change: null,
    notes: "Ya está en el tope del catálogo",
    created_at: now,
    updated_at: now,
  },
];

async function main() {
  const withDemo = process.argv.includes("--demo");

  console.log(`Sembrando ${plans.length} planes...`);
  for (const plan of plans) {
    const { id, ...data } = plan;
    await db.collection("plans").doc(id).set(data, { merge: true });
    console.log(`  ✓ ${id} — ${plan.name} (${plan.promo_price_2025})`);
  }

  if (withDemo) {
    console.log(`\nSembrando ${demoCustomers.length} clientes demo...`);
    for (const customer of demoCustomers) {
      const { id, ...data } = customer;
      await db.collection("customers").doc(id).set(data, { merge: true });
      console.log(`  ✓ ${id} — ${customer.name}`);
    }
  }

  console.log("\n✓ Seed completado.");
  console.log(
    "\nRecuerda: para entrar a la app crea un usuario en Firebase Auth y luego un doc en la colección 'admins' con ID = uid del usuario y campo { role: 'admin' }."
  );
}

main().catch((err) => {
  console.error("✗ Seed falló:", err);
  process.exit(1);
});
