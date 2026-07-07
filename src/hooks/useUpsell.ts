"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { executeUpsellAction } from "@/lib/actions/upsell";
import { findBestUpsell } from "@/lib/pricing/bundles";
import { calculateSavings, calculateValueAdd } from "@/lib/pricing/calculator";
import type { Customer } from "@/types/customer";
import type { Plan } from "@/types/plan";
import type { UpsellSuggestion } from "@/types/upsell";

/** Calcula la sugerencia de upsell en el cliente y expone execute() para aplicarla */
export function useUpsell(customer: Customer | null, plans: Plan[]) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const suggestion: UpsellSuggestion | null = useMemo(() => {
    if (!customer) return null;
    const currentPlan = plans.find((p) => p.id === customer.current_plan_id);
    if (!currentPlan) return null;

    const best = findBestUpsell(currentPlan, plans, customer.price_paying_now);
    if (!best) return null;

    return {
      from_plan: currentPlan,
      to_plan: best,
      savings: calculateSavings(customer.price_paying_now, best.promo_price_2025),
      value_add: calculateValueAdd(currentPlan, best),
    };
  }, [customer, plans]);

  function execute(onSuccess?: () => void) {
    if (!customer || !suggestion) return;
    setError(null);
    startTransition(async () => {
      const result = await executeUpsellAction(customer.id, suggestion.to_plan.id);
      if (result.success) {
        router.refresh();
        onSuccess?.();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return { suggestion, execute, pending, error };
}
