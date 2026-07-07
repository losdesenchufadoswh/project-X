import { Check, X } from "lucide-react";
import type { Plan } from "@/types/plan";

function serviceLabel(plan: Plan, type: "internet" | "cable_tv" | "phone_lines"): string {
  const service = plan.services.find((s) => s.type === type);
  switch (type) {
    case "internet":
      return service?.included ? `Internet ${service.speed ?? 0} Mbps` : "Internet";
    case "cable_tv":
      return "Cable TV";
    case "phone_lines":
      return service?.included
        ? `${service.count ?? 0} línea${(service.count ?? 0) > 1 ? "s" : ""} telefónica${(service.count ?? 0) > 1 ? "s" : ""}`
        : "Teléfono";
  }
}

/** Desglose de servicios de un plan: qué incluye y qué no */
export function PriceBreakdown({ plan }: { plan: Plan }) {
  const types = ["internet", "cable_tv", "phone_lines"] as const;

  return (
    <ul className="space-y-2">
      {types.map((type) => {
        const included = plan.services.some((s) => s.type === type && s.included);
        return (
          <li key={type} className="flex items-center gap-2 text-sm">
            {included ? (
              <Check size={16} className="shrink-0 text-success" />
            ) : (
              <X size={16} className="shrink-0 text-muted/50" />
            )}
            <span className={included ? "text-foreground" : "text-muted/50 line-through"}>
              {serviceLabel(plan, type)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
