import { Check, Phone, Tv, Wifi, X } from "lucide-react";
import type { Plan } from "@/types/plan";

export interface ServiceFlags {
  internet: boolean;
  tv: boolean;
  phone: boolean;
}

export function planToServiceFlags(plan: Plan | null | undefined): ServiceFlags {
  if (!plan) return { internet: false, tv: false, phone: false };
  return {
    internet: plan.services.some((s) => s.type === "internet" && s.included),
    tv: plan.services.some((s) => s.type === "cable_tv" && s.included),
    phone: plan.services.some((s) => s.type === "phone_lines" && s.included),
  };
}

const items = [
  { key: "internet" as const, label: "Internet", icon: Wifi },
  { key: "tv" as const, label: "TV", icon: Tv },
  { key: "phone" as const, label: "Teléfono", icon: Phone },
];

/** Muestra Internet / TV / Teléfono con un check (tiene) o X (no tiene), estilo HUD */
export function ServiceChips({
  flags,
  size = "sm",
}: {
  flags: ServiceFlags;
  size?: "sm" | "md";
}) {
  const iconSize = size === "md" ? 16 : 13;
  const textClass = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      {items.map(({ key, label, icon: Icon }) => {
        const has = flags[key];
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 ${textClass} ${
              has ? "text-primary" : "text-muted/50"
            }`}
            title={has ? `Tiene ${label}` : `No tiene ${label}`}
          >
            <Icon size={iconSize} />
            {label}
            {has ? (
              <Check size={iconSize} className="text-success" />
            ) : (
              <X size={iconSize} className="text-muted/40" />
            )}
          </span>
        );
      })}
    </div>
  );
}
