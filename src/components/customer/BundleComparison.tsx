import { ArrowRight } from "lucide-react";
import { CurrentPlan } from "./CurrentPlan";
import type { Plan } from "@/types/plan";

interface BundleComparisonProps {
  currentPlan: Plan;
  pricePayingNow: number;
  suggestedPlan: Plan;
}

/** Side-by-side: plan actual vs bundle sugerido */
export function BundleComparison({
  currentPlan,
  pricePayingNow,
  suggestedPlan,
}: BundleComparisonProps) {
  return (
    <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
      <CurrentPlan plan={currentPlan} pricePayingNow={pricePayingNow} label="Plan actual" />
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/15 p-3">
          <ArrowRight size={24} className="text-primary" />
        </div>
      </div>
      <CurrentPlan
        plan={suggestedPlan}
        pricePayingNow={suggestedPlan.promo_price_2025}
        highlight
        label="Bundle sugerido"
      />
    </div>
  );
}
