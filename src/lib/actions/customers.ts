"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { createCustomer, getCustomer, updateCustomer } from "@/lib/db/customers";
import { getPlan } from "@/lib/db/plans";
import type { CustomerType } from "@/types/customer";

interface ActionResult {
  success: boolean;
  error?: string;
}

async function requireAdminSession(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return isAdmin(user.uid);
}

export interface NewCustomerInput {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  /** Velocidad que el prospecto tiene HOY con otro proveedor (Mbps) — solo para calcular la recomendación */
  competitorSpeedMbps: number;
  /** Precio que el prospecto paga HOY con otro proveedor — solo para calcular la recomendación */
  competitorPrice: number;
  /** El plan NUESTRO que se le va a asignar (normalmente el recomendado, pero editable) */
  assignedPlanId: string;
  notes: string;
}

export async function createCustomerAction(input: NewCustomerInput): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Nombre y email son requeridos." };
  }

  const plan = await getPlan(input.assignedPlanId);
  if (!plan) {
    return { success: false, error: "Selecciona el plan que le vamos a asignar." };
  }

  const now = new Date().toISOString();
  const conversionNote =
    input.competitorSpeedMbps > 0 && input.competitorPrice > 0
      ? `Antes pagaba $${input.competitorPrice.toFixed(2)} por ${input.competitorSpeedMbps} Mbps con otro proveedor.`
      : "";
  const notes = [conversionNote, input.notes.trim()].filter(Boolean).join(" ");

  await createCustomer({
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    type: input.type,
    current_plan_id: plan.id,
    price_paying_now: plan.promo_price_2025,
    signup_date: now,
    last_plan_change: null,
    notes,
    created_at: now,
    updated_at: now,
  });

  revalidatePath("/admin/dashboard");
  return { success: true };
}

export interface CustomerContactInput {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  notes: string;
}

// Nota: plan y precio NUNCA se editan aquí — solo executeUpsellAction puede cambiarlos,
// para que todo cambio de plan quede en upsell_log (regla no negociable #2/#3).
export async function updateCustomerContactAction(
  customerId: string,
  input: CustomerContactInput
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const existing = await getCustomer(customerId);
  if (!existing) return { success: false, error: "Cliente no encontrado." };

  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Nombre y email son requeridos." };
  }

  await updateCustomer(customerId, {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    type: input.type,
    notes: input.notes.trim(),
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customer/${customerId}`);
  return { success: true };
}
