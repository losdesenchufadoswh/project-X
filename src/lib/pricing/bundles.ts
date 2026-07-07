import type { Plan, ServiceType } from "@/types/plan";

function includedServiceTypes(plan: Plan): Set<ServiceType> {
  return new Set(plan.services.filter((s) => s.included).map((s) => s.type));
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

/**
 * Dado el plan actual y lo que el cliente paga hoy, devuelve el mejor bundle:
 * 1. Más servicios (o los mismos mejorados) que el actual — nunca downgrade
 * 2. Precio promocional ≤ lo que paga hoy
 * 3. Dentro de los siguientes 2 tiers
 * Prioriza más servicios; a igualdad, el precio más bajo.
 */
export function findBestUpsell(
  currentPlan: Plan,
  allPlans: Plan[],
  pricePayingNow: number
): Plan | null {
  const candidates = allPlans.filter(
    (plan) =>
      plan.id !== currentPlan.id &&
      plan.tier > currentPlan.tier &&
      plan.tier <= currentPlan.tier + 2 &&
      plan.promo_price_2025 <= pricePayingNow &&
      isServiceUpgrade(currentPlan, plan)
  );

  candidates.sort((a, b) => {
    const serviceDiff = includedServiceTypes(b).size - includedServiceTypes(a).size;
    if (serviceDiff !== 0) return serviceDiff;
    return a.promo_price_2025 - b.promo_price_2025;
  });

  return candidates[0] ?? null;
}
