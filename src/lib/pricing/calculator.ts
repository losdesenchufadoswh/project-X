import type { Plan } from "@/types/plan";

/** Positivo = el cliente ahorra dinero con el cambio */
export function calculateSavings(pricePayingNow: number, newPrice: number): number {
  return Math.round((pricePayingNow - newPrice) * 100) / 100;
}

/** Describe qué gana el cliente: "200M extra de Internet + Cable TV incluido" */
export function calculateValueAdd(from: Plan, to: Plan): string {
  const parts: string[] = [];

  const fromInternet = from.services.find((s) => s.type === "internet" && s.included);
  const toInternet = to.services.find((s) => s.type === "internet" && s.included);
  if (toInternet && !fromInternet) {
    parts.push(`Internet ${toInternet.speed ?? 0}M incluido`);
  } else if (toInternet && fromInternet) {
    const extra = (toInternet.speed ?? 0) - (fromInternet.speed ?? 0);
    if (extra > 0) parts.push(`${extra}M extra de Internet`);
  }

  const fromCable = from.services.some((s) => s.type === "cable_tv" && s.included);
  const toCable = to.services.some((s) => s.type === "cable_tv" && s.included);
  if (toCable && !fromCable) parts.push("Cable TV incluido");

  const fromPhones = from.services.find((s) => s.type === "phone_lines" && s.included)?.count ?? 0;
  const toPhones = to.services.find((s) => s.type === "phone_lines" && s.included)?.count ?? 0;
  if (toPhones > fromPhones) {
    const extra = toPhones - fromPhones;
    parts.push(
      fromPhones === 0
        ? `${extra} línea${extra > 1 ? "s" : ""} telefónica${extra > 1 ? "s" : ""}`
        : `${extra} línea${extra > 1 ? "s" : ""} extra`
    );
  }

  return parts.length > 0 ? parts.join(" + ") : "Mismos servicios a mejor precio";
}
