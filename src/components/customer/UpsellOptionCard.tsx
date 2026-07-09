import { TrendingDown, Zap } from "lucide-react";
import { BundleComparison } from "@/components/customer/BundleComparison";
import { SavingsCalculator } from "@/components/customer/SavingsCalculator";
import { ExecuteButton } from "@/components/dashboard/ExecuteButton";
import { calculateValueAdd } from "@/lib/pricing/calculator";
import type { Customer } from "@/types/customer";
import type { Plan } from "@/types/plan";

interface UpsellOptionCardProps {
  kind: "savings" | "max";
  customer: Customer;
  currentPlan: Plan;
  suggestedPlan: Plan;
}

const kindConfig = {
  savings: { label: "Mejor ahorro", icon: TrendingDown, colorClass: "text-success" },
  max: { label: "El MAX", icon: Zap, colorClass: "text-primary" },
};

export function UpsellOptionCard({ kind, customer, currentPlan, suggestedPlan }: UpsellOptionCardProps) {
  const { label, icon: Icon, colorClass } = kindConfig[kind];

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-2 font-heading text-lg font-bold ${colorClass}`}>
        <Icon size={18} />
        {label}
      </div>

      <BundleComparison
        currentPlan={currentPlan}
        pricePayingNow={customer.price_paying_now}
        suggestedPlan={suggestedPlan}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SavingsCalculator
          pricePayingNow={customer.price_paying_now}
          newPrice={suggestedPlan.promo_price_2025}
          valueAdd={calculateValueAdd(currentPlan, suggestedPlan)}
        />

        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-muted/20 bg-surface p-6">
          <p className="text-center text-sm text-muted">
            Al ejecutar, Firebase se actualiza al instante y el cambio queda en el historial.
          </p>
          <ExecuteButton
            customerId={customer.id}
            customerName={customer.name}
            newPlanId={suggestedPlan.id}
            newPlanName={suggestedPlan.name}
            newPrice={suggestedPlan.promo_price_2025}
            fromPlanName={currentPlan.name}
            fromPrice={customer.price_paying_now}
          />
        </div>
      </div>
    </div>
  );
}
