import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";
import { PriceBreakdown } from "./PriceBreakdown";
import type { Plan } from "@/types/plan";

interface CurrentPlanProps {
  plan: Plan;
  pricePayingNow: number;
  highlight?: boolean;
  label?: string;
}

export function CurrentPlan({ plan, pricePayingNow, highlight = false, label }: CurrentPlanProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        highlight ? "border-primary/60 bg-primary/5 shadow-lg shadow-primary/10" : "border-muted/20 bg-surface"
      }`}
    >
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
      )}
      <div className="mb-1 flex items-center gap-2">
        <h3 className="font-heading text-lg font-bold">{plan.name}</h3>
        {plan.is_bundle && <Badge variant="primary">Bundle</Badge>}
      </div>
      <p className="mb-4 text-sm text-muted">{plan.description}</p>
      <p className={`mb-4 font-data text-3xl ${highlight ? "text-primary" : "text-foreground"}`}>
        {formatMoney(pricePayingNow)}
        <span className="text-sm text-muted">/mes</span>
      </p>
      <PriceBreakdown plan={plan} />
    </div>
  );
}
