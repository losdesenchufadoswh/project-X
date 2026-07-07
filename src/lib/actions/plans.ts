"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { countCustomersOnPlan, deletePlan, getPlan, upsertPlan } from "@/lib/db/plans";
import type { BundleType, Plan, PlanService } from "@/types/plan";

export interface PlanInput {
  id: string;
  name: string;
  description: string;
  internetSpeed: number;
  cableIncluded: boolean;
  phoneLines: number;
  price2025: number;
  promoPrice2025: number;
  discountCode: string;
  bundleCode: string;
  tier: number;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdminSession(): Promise<string | null> {
  const user = await getSessionUser();
  if (!user || !(await isAdmin(user.uid))) return null;
  return user.email;
}

function buildServices(input: PlanInput): PlanService[] {
  return [
    { type: "internet", speed: input.internetSpeed, included: input.internetSpeed > 0 },
    { type: "cable_tv", channels: null, included: input.cableIncluded },
    { type: "phone_lines", count: input.phoneLines, included: input.phoneLines > 0 },
  ];
}

function deriveBundleType(input: PlanInput): BundleType {
  if (input.internetSpeed > 0 && input.cableIncluded && input.phoneLines > 0) return "triple_play";
  if (input.internetSpeed > 0 && input.cableIncluded) return "internet_cable";
  return "internet_only";
}

export async function savePlanAction(input: PlanInput): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  if (!input.id.trim() || !input.name.trim()) {
    return { success: false, error: "ID y nombre son requeridos." };
  }
  if (input.price2025 <= 0 || input.promoPrice2025 <= 0) {
    return { success: false, error: "Los precios deben ser mayores que 0." };
  }
  // Regla no negociable #5: el precio promo debe ser menor que el precio de lista
  if (input.promoPrice2025 >= input.price2025) {
    return {
      success: false,
      error: `El precio promo ($${input.promoPrice2025}) debe ser menor que el precio de lista ($${input.price2025}).`,
    };
  }
  if (input.internetSpeed <= 0 && !input.cableIncluded && input.phoneLines <= 0) {
    return { success: false, error: "El plan debe incluir al menos un servicio." };
  }

  const existing = await getPlan(input.id.trim());
  const bundleType = deriveBundleType(input);

  const plan: Plan = {
    id: input.id.trim(),
    name: input.name.trim(),
    description: input.description.trim(),
    services: buildServices(input),
    price_2025: input.price2025,
    promo_price_2025: input.promoPrice2025,
    discount_code: input.discountCode.trim(),
    bundle_code: input.bundleCode.trim(),
    is_bundle: bundleType !== "internet_only",
    bundle_type: bundleType,
    tier: input.tier,
    created_at: existing?.created_at ?? new Date().toISOString(),
  };

  await upsertPlan(plan);
  revalidatePath("/admin/plans");
  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function deletePlanAction(planId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const inUse = await countCustomersOnPlan(planId);
  if (inUse > 0) {
    return {
      success: false,
      error: `No se puede borrar: ${inUse} cliente${inUse > 1 ? "s" : ""} tiene${inUse > 1 ? "n" : ""} este plan.`,
    };
  }

  await deletePlan(planId);
  revalidatePath("/admin/plans");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
