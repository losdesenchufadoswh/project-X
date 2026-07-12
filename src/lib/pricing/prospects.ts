import type { Plan } from "@/types/plan";

function internetSpeed(plan: Plan): number {
  return plan.services.find((s) => s.type === "internet" && s.included)?.speed ?? 0;
}

function includedCount(plan: Plan): number {
  return plan.services.filter((s) => s.included).length;
}

/** Ordena candidatos: más servicios primero, luego más velocidad, luego menor precio */
function rankBySavings(a: Plan, b: Plan): number {
  const servicesDiff = includedCount(b) - includedCount(a);
  if (servicesDiff !== 0) return servicesDiff;
  const speedDiff = internetSpeed(b) - internetSpeed(a);
  if (speedDiff !== 0) return speedDiff;
  return a.promo_price_2025 - b.promo_price_2025;
}

export interface DualProspectOptions {
  /** El más barato que ya le gana al proveedor actual en velocidad y precio */
  bestSavings: Plan | null;
  /** El plan más completo del catálogo estándar (excluye specialty), aunque cueste más */
  maxPlan: Plan | null;
}

/**
 * Dado lo que un prospecto paga hoy con otro proveedor (velocidad + precio),
 * calcula dos recomendaciones:
 * - bestSavings: el más barato que ya es mejor (velocidad ≥, precio ≤)
 * - maxPlan: el plan más completo del catálogo estándar, sin importar el precio del prospecto
 */
export function findProspectOptions(
  competitorSpeedMbps: number,
  competitorPrice: number,
  allPlans: Plan[]
): DualProspectOptions {
  if (competitorSpeedMbps <= 0) return { bestSavings: null, maxPlan: null };

  const eligible = allPlans
    .filter((plan) => !plan.is_specialty && internetSpeed(plan) >= competitorSpeedMbps)
    .sort(rankBySavings);

  const bestSavings =
    competitorPrice > 0 ? eligible.filter((plan) => plan.promo_price_2025 <= competitorPrice)[0] ?? null : null;
  const topMax = eligible[0] ?? null;
  const maxPlan = topMax && topMax.id !== bestSavings?.id ? topMax : null;

  return { bestSavings, maxPlan };
}

/** Texto corto describiendo lo que incluye un plan: "300 Mbps + Cable TV" */
export function describePlan(plan: Plan): string {
  const internet = plan.services.find((s) => s.type === "internet" && s.included);
  const cable = plan.services.some((s) => s.type === "cable_tv" && s.included);
  const phones = plan.services.find((s) => s.type === "phone_lines" && s.included);

  const parts: string[] = [];
  if (internet) parts.push(`${internet.speed} Mbps`);
  if (cable) parts.push("Cable TV");
  if (phones) {
    const count = phones.count ?? 0;
    parts.push(`${count} línea${count > 1 ? "s" : ""} tel.`);
  }
  return parts.join(" + ");
}

export const COMPETITOR_SPEED_OPTIONS_MBPS = [50, 100, 200, 300, 500, 1000];

function hasCableTv(plan: Plan): boolean {
  return plan.services.some((s) => s.type === "cable_tv" && s.included);
}

/**
 * Prospecto sin Internet que hoy solo paga por TV/cable con otro proveedor.
 * Recomienda el plan con TV más barato que ya le gane ese precio (normalmente
 * un bundle con Internet incluido) — así se le muestra que gana Internet gratis
 * pagando lo mismo o menos.
 */
export function findTvOnlyProspectOptions(
  competitorPrice: number,
  allPlans: Plan[]
): DualProspectOptions {
  const eligible = allPlans.filter((plan) => !plan.is_specialty && hasCableTv(plan)).sort(rankBySavings);

  const bestSavings =
    competitorPrice > 0 ? eligible.filter((plan) => plan.promo_price_2025 <= competitorPrice)[0] ?? null : null;
  const topMax = eligible[0] ?? null;
  const maxPlan = topMax && topMax.id !== bestSavings?.id ? topMax : null;

  return { bestSavings, maxPlan };
}
