"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { getCustomer, updateCustomer } from "@/lib/db/customers";
import { getPlan, listPlans } from "@/lib/db/plans";
import { createUpsellLog } from "@/lib/db/upsells";
import { findBestUpsell } from "@/lib/pricing/bundles";
import { calculateSavings, calculateValueAdd } from "@/lib/pricing/calculator";
import type { UpsellSuggestion } from "@/types/upsell";

export async function suggestUpsellAction(customerId: string): Promise<UpsellSuggestion | null> {
  const customer = await getCustomer(customerId);
  if (!customer) return null;

  const [currentPlan, allPlans] = await Promise.all([
    getPlan(customer.current_plan_id),
    listPlans(),
  ]);
  if (!currentPlan) return null;

  const suggestion = findBestUpsell(currentPlan, allPlans, customer.price_paying_now);
  if (!suggestion) return null;

  return {
    from_plan: currentPlan,
    to_plan: suggestion,
    savings: calculateSavings(customer.price_paying_now, suggestion.promo_price_2025),
    value_add: calculateValueAdd(currentPlan, suggestion),
  };
}

export interface ExecuteUpsellResult {
  success: boolean;
  error?: string;
}

export async function executeUpsellAction(
  customerId: string,
  newPlanId: string
): Promise<ExecuteUpsellResult> {
  // Auditoría: quién ejecuta viene de la sesión, nunca del cliente
  const user = await getSessionUser();
  if (!user) return { success: false, error: "Sesión expirada. Vuelve a entrar." };
  if (!(await isAdmin(user.uid))) return { success: false, error: "No autorizado." };

  const customer = await getCustomer(customerId);
  if (!customer) return { success: false, error: "Cliente no encontrado." };

  const [oldPlan, newPlan] = await Promise.all([
    getPlan(customer.current_plan_id),
    getPlan(newPlanId),
  ]);
  if (!newPlan) return { success: false, error: "Plan no encontrado." };
  if (newPlan.id === customer.current_plan_id) {
    return { success: false, error: "El cliente ya tiene ese plan." };
  }

  const now = new Date().toISOString();

  await updateCustomer(customerId, {
    current_plan_id: newPlan.id,
    price_paying_now: newPlan.promo_price_2025,
    last_plan_change: now,
    updated_at: now,
  });

  // Regla no negociable #2: todo cambio queda logueado
  await createUpsellLog({
    customer_id: customer.id,
    customer_name: customer.name,
    from_plan_id: oldPlan?.id ?? customer.current_plan_id,
    from_plan_name: oldPlan?.name ?? "Plan desconocido",
    from_price: customer.price_paying_now,
    to_plan_id: newPlan.id,
    to_plan_name: newPlan.name,
    to_price: newPlan.promo_price_2025,
    savings: calculateSavings(customer.price_paying_now, newPlan.promo_price_2025),
    value_add: oldPlan ? calculateValueAdd(oldPlan, newPlan) : "",
    executed_by: user.email,
    executed_at: now,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customer/${customerId}`);
  revalidatePath("/admin/history");

  return { success: true };
}
