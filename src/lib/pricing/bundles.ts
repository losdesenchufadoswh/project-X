import type { Plan, ServiceType } from "@/types/plan";

export interface DualUpsellOptions {
  /** El más barato que ya representa una mejora real (ahorro genuino) */
  bestSavings: Plan | null;
  /** El plan más completo del catálogo estándar (excluye specialty), sin importar el precio actual */
  maxPlan: Plan | null;
}

function includedServiceTypes(plan: Plan): Set<ServiceType> {
  return new Set(plan.services.filter((s) => s.included).map((s) => s.type));
}

function internetSpeed(plan: Plan): number {
  return plan.services.find((s) => s.type === "internet" && s.included)?.speed ?? 0;
}

/**
 * Regla no negociable #6: nunca sugerir un downgrade.
 * El candidato debe incluir TODOS los servicios del plan actual,
 * a nivel igual o mejor (velocidad, líneas).
 */
export function isServiceUpgrade(current: Plan, candidate: Plan): boolean {
  const candidateIncluded = candidate.services.filter((s) => s.included);

  for (const service of current.services.filter((s) => s.included)) {
    const match = candidateIncluded.find((s) => s.type === service.type);
    if (!match) return false;
    if (service.type === "internet" && (match.speed ?? 0) < (service.speed ?? 0)) return false;
    if (service.type === "phone_lines" && (match.count ?? 0) < (service.count ?? 0)) return false;
  }
  return true;
}

/** Ordena candidatos: más servicios primero, luego más velocidad, luego menor precio */
function rankBySavings(a: Plan, b: Plan): number {
  const serviceDiff = includedServiceTypes(b).size - includedServiceTypes(a).size;
  if (serviceDiff !== 0) return serviceDiff;
  const speedDiff = internetSpeed(b) - internetSpeed(a);
  if (speedDiff !== 0) return speedDiff;
  return a.promo_price_2025 - b.promo_price_2025;
}

/**
 * Dado el plan actual y lo que el cliente paga hoy, devuelve dos opciones:
 * - bestSavings: el más barato que ya es una mejora real (nunca downgrade, precio ≤ actual)
 * - maxPlan: el plan más completo del catálogo estándar, aunque cueste más (la oferta aspiracional)
 */
export function findUpsellOptions(
  currentPlan: Plan,
  allPlans: Plan[],
  pricePayingNow: number
): DualUpsellOptions {
  const eligible = allPlans
    .filter(
      (plan) => plan.id !== currentPlan.id && !plan.is_specialty && isServiceUpgrade(currentPlan, plan)
    )
    .sort(rankBySavings);

  const bestSavings = eligible.filter((plan) => plan.promo_price_2025 <= pricePayingNow)[0] ?? null;
  const topMax = eligible[0] ?? null;
  const maxPlan = topMax && topMax.id !== bestSavings?.id ? topMax : null;

  return { bestSavings, maxPlan };
}

/** Compatibilidad: solo la mejor opción de ahorro (usado por rutas que no necesitan las dos) */
export function findBestUpsell(
  currentPlan: Plan,
  allPlans: Plan[],
  pricePayingNow: number
): Plan | null {
  return findUpsellOptions(currentPlan, allPlans, pricePayingNow).bestSavings;
}
