/**
 * Seed del catálogo de planes (y clientes demo con --demo).
 *
 *   npm run seed        → solo planes (borra el catálogo viejo y siembra el nuevo)
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

// ── Catálogo real ─────────────────────────────────────────────
// 1 línea telefónica asumida en todos los 2P/3P (no especificado por el negocio).
// tier ordena el catálogo (más completo = mayor tier); el motor de sugerencias
// NO usa el tier para elegibilidad, solo velocidad/servicios/precio reales.
const plans = [
  // Internet solo
  {
    id: "PLAN_40M_ONLY",
    name: "40M Internet Only",
    description: "40 Mbps Internet",
    services: [
      { type: "internet", speed: 40, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 44.99,
    promo_price_2025: 37.99,
    discount_code: "8UD01",
    bundle_code: "R6UA1",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 1,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_100M_ONLY",
    name: "100M Internet Only",
    description: "100 Mbps Internet",
    services: [
      { type: "internet", speed: 100, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 64.99,
    promo_price_2025: 57.99,
    discount_code: "8UD02",
    bundle_code: "R6UA2",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 2,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_300M_ONLY",
    name: "300M Internet Only",
    description: "300 Mbps Internet — promo válida por 6 meses",
    services: [
      { type: "internet", speed: 300, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 74.99,
    promo_price_2025: 52.99,
    discount_code: "8UD03",
    bundle_code: "R6UA3",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 3,
    is_specialty: false,
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
    price_2025: 74.99,
    promo_price_2025: 67.99,
    discount_code: "8UD04",
    bundle_code: "R6UA4",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 4,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_1G_ONLY",
    name: "1 Gig Internet Only",
    description: "1000 Mbps Internet — Promo de Verano",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 0, included: false },
    ],
    price_2025: 79.99,
    promo_price_2025: 59.99,
    discount_code: "8UD05",
    bundle_code: "R6UA5",
    is_bundle: false,
    bundle_type: "internet_only",
    tier: 5,
    is_specialty: false,
    created_at: now,
  },

  // 2P — Internet + Teléfono
  {
    id: "PLAN_100M_2P",
    name: "2P 100M",
    description: "100 Mbps + 1 línea telefónica",
    services: [
      { type: "internet", speed: 100, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 64.99,
    promo_price_2025: 57.99,
    discount_code: "8UD06",
    bundle_code: "R6UB1",
    is_bundle: true,
    bundle_type: "internet_phone",
    tier: 6,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_500M_2P",
    name: "2P 500M",
    description: "500 Mbps + 1 línea telefónica",
    services: [
      { type: "internet", speed: 500, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 74.99,
    promo_price_2025: 67.99,
    discount_code: "8UD07",
    bundle_code: "R6UB2",
    is_bundle: true,
    bundle_type: "internet_phone",
    tier: 7,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_1G_2P",
    name: "2P 1 Gig",
    description: "1000 Mbps + 1 línea telefónica",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: false },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 94.99,
    promo_price_2025: 84.99,
    discount_code: "8UD08",
    bundle_code: "R6UB3",
    is_bundle: true,
    bundle_type: "internet_phone",
    tier: 8,
    is_specialty: false,
    created_at: now,
  },

  // 3P — Internet + TV + Teléfono (primer mes de TV gratis)
  {
    id: "PLAN_100M_3P",
    name: "3P 100M",
    description: "100 Mbps + Cable TV + 1 línea telefónica — primer mes de TV gratis",
    services: [
      { type: "internet", speed: 100, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 74.99,
    promo_price_2025: 67.99,
    discount_code: "8UD09",
    bundle_code: "R6UC1",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 9,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_300M_3P",
    name: "3P 300M",
    description: "300 Mbps + Cable TV + 1 línea telefónica — primer mes de TV gratis",
    services: [
      { type: "internet", speed: 300, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 79.99,
    promo_price_2025: 71.49,
    discount_code: "8UD10",
    bundle_code: "R6UC2",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 10,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_500M_3P",
    name: "3P 500M",
    description: "500 Mbps + Cable TV + 1 línea telefónica — primer mes de TV gratis",
    services: [
      { type: "internet", speed: 500, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 89.99,
    promo_price_2025: 81.49,
    discount_code: "8UD11",
    bundle_code: "R6UC3",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 11,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_1G_3P",
    name: "3P 1 Gig",
    description: "1000 Mbps + Cable TV + 1 línea telefónica — primer mes de TV gratis",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 94.99,
    promo_price_2025: 86.49,
    discount_code: "8UD12",
    bundle_code: "R6UC4",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 12,
    is_specialty: false,
    created_at: now,
  },
  {
    id: "PLAN_1G_3P_ULTIMATE",
    name: "3P 1 Gig Ultimate",
    description:
      "1000 Mbps + Cable TV con todos los canales (Ultimate) + 1 línea telefónica — primer mes de TV gratis",
    services: [
      { type: "internet", speed: 1000, included: true },
      { type: "cable_tv", channels: null, included: true },
      { type: "phone_lines", count: 1, included: true },
    ],
    price_2025: 129.99,
    promo_price_2025: 118.99,
    discount_code: "8UD13",
    bundle_code: "R6UC5",
    is_bundle: true,
    bundle_type: "triple_play",
    tier: 13,
    is_specialty: true,
    created_at: now,
  },
];

// ── Clientes demo (solo con --demo) — apuntan al catálogo real de arriba ──
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
    town: "Bayamón",
    credit_code: "AB",
    install_date: "2024-03-20",
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
    price_paying_now: 62.99,
    signup_date: "2023-11-02T10:00:00.000Z",
    last_plan_change: null,
    town: "Caguas",
    credit_code: "C",
    install_date: "2023-11-08",
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
    town: "Ponce",
    credit_code: "BB",
    install_date: "2024-01-26",
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
    current_plan_id: "PLAN_100M_3P",
    price_paying_now: 74.99,
    signup_date: "2025-05-10T10:00:00.000Z",
    last_plan_change: null,
    town: "Carolina",
    credit_code: "A",
    install_date: null,
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
    current_plan_id: "PLAN_1G_3P",
    price_paying_now: 99.99,
    signup_date: "2025-09-01T10:00:00.000Z",
    last_plan_change: null,
    town: "San Juan",
    credit_code: "AC",
    install_date: "2025-09-05",
    notes: "Ya está cerca del tope del catálogo",
    created_at: now,
    updated_at: now,
  },
];

async function main() {
  const withDemo = process.argv.includes("--demo");

  console.log("Borrando catálogo de planes anterior...");
  const oldPlans = await db.collection("plans").get();
  for (const doc of oldPlans.docs) {
    await doc.ref.delete();
  }
  console.log(`  ✓ ${oldPlans.size} plan(es) viejo(s) borrado(s)`);

  console.log(`\nSembrando ${plans.length} planes...`);
  for (const plan of plans) {
    const { id, ...data } = plan;
    await db.collection("plans").doc(id).set(data);
    console.log(`  ✓ ${id} — ${plan.name} ($${plan.promo_price_2025})`);
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
