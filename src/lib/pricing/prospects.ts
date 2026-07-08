import type { Plan } from "@/types/plan";

function internetSpeed(plan: Plan): number {
  return plan.services.find((s) => s.type === "internet" && s.included)?.speed ?? 0;
}

function includedCount(plan: Plan): number {
  return plan.services.filter((s) => s.included).length;
}

/**
 * Dado lo que un prospecto paga hoy con otro proveedor (velocidad + precio),
 * recomienda el mejor plan propio: velocidad igual o mayor, precio igual o menor.
 * Entre los que califican, prioriza el bundle con más servicios incluidos.
 */
export function recommendPlanForProspect(
  competitorSpeedMbps: number,
  competitorPrice: number,
  allPlans: Plan[]
): Plan | null {
  if (competitorSpeedMbps <= 0 || competitorPrice <= 0) return null;

  const candidates = allPlans.filter(
    (plan) => internetSpeed(plan) >= competitorSpeedMbps && plan.promo_price_2025 <= competitorPrice
  );

  candidates.sort((a, b) => {
    const servicesDiff = includedCount(b) - includedCount(a);
    if (servicesDiff !== 0) return servicesDiff;
    const speedDiff = internetSpeed(b) - internetSpeed(a);
    if (speedDiff !== 0) return speedDiff;
    return a.promo_price_2025 - b.promo_price_2025;
  });

  return candidates[0] ?? null;
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
