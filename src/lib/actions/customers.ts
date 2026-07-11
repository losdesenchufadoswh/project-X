"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { createCustomer, deleteCustomer, getCustomer, updateCustomer } from "@/lib/db/customers";
import { getPlan } from "@/lib/db/plans";
import type { CallStatus, CustomerNote, CustomerType } from "@/types/customer";

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
  /** Pueblo / municipio */
  town: string;
  /** Código de crédito por letras */
  creditCode: string;
  /** Velocidad que el prospecto tiene HOY con otro proveedor (Mbps) — solo para calcular la recomendación */
  competitorSpeedMbps: number;
  /** Precio que el prospecto paga HOY con otro proveedor — solo para calcular la recomendación */
  competitorPrice: number;
  /** El plan NUESTRO que se le va a asignar (normalmente el recomendado, pero editable) */
  assignedPlanId: string;
  /** Qué productos se agregaron EN ESTA VENTA — para la métrica mensual de Internet/Video/Voice */
  addedInternet: boolean;
  addedVideo: boolean;
  addedVoice: boolean;
  notes: string;
}

export async function createCustomerAction(input: NewCustomerInput): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Nombre y email son requeridos." };
  }

  // Plan opcional: si viene vacío el cliente nace como prospecto (sin plan, no cuenta como venta)
  let planId = "";
  let price = 0;
  if (input.assignedPlanId) {
    const plan = await getPlan(input.assignedPlanId);
    if (!plan) return { success: false, error: "Selecciona un plan válido." };
    planId = plan.id;
    price = plan.promo_price_2025;
  }

  const now = new Date().toISOString();

  // Todas las notas nacen fechadas en la bitácora
  const noteEntries: CustomerNote[] = [];
  if (planId && input.competitorSpeedMbps > 0 && input.competitorPrice > 0) {
    noteEntries.push({
      text: `Antes pagaba $${input.competitorPrice.toFixed(2)} por ${input.competitorSpeedMbps} Mbps con otro proveedor.`,
      created_at: now,
    });
  }
  if (input.notes.trim()) {
    noteEntries.push({ text: input.notes.trim(), created_at: now });
  }

  await createCustomer({
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    type: input.type,
    current_plan_id: planId,
    price_paying_now: price,
    signup_date: now,
    last_plan_change: null,
    town: input.town.trim(),
    credit_code: input.creditCode.trim().toUpperCase(),
    install_date: null,
    notes: "",
    notes_log: noteEntries,
    last_call: null,
    // Solo cuenta para la métrica si nace con plan (venta real); un prospecto no agregó nada todavía
    added_internet: planId ? input.addedInternet : false,
    added_video: planId ? input.addedVideo : false,
    added_voice: planId ? input.addedVoice : false,
    created_at: now,
    updated_at: now,
  });

  revalidatePath("/admin/dashboard");
  return { success: true };
}

/** Asigna el primer plan a un prospecto (lo convierte en venta). No pasa por upsell_log
 *  porque no es un cambio de plan, es la venta inicial — queda en la bitácora fechado. */
export async function assignPlanAction(
  customerId: string,
  planId: string,
  addedProducts: { internet: boolean; video: boolean; voice: boolean }
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const [customer, plan] = await Promise.all([getCustomer(customerId), getPlan(planId)]);
  if (!customer) return { success: false, error: "Cliente no encontrado." };
  if (!plan) return { success: false, error: "Plan no encontrado." };
  if (customer.current_plan_id) {
    return { success: false, error: "El cliente ya tiene plan. Usa la sugerencia de upsell." };
  }

  const now = new Date().toISOString();
  const entry: CustomerNote = {
    text: `✅ Venta cerrada: ${plan.name} ($${plan.promo_price_2025.toFixed(2)}/mes)`,
    created_at: now,
  };

  await updateCustomer(customerId, {
    current_plan_id: plan.id,
    price_paying_now: plan.promo_price_2025,
    last_plan_change: now,
    added_internet: addedProducts.internet,
    added_video: addedProducts.video,
    added_voice: addedProducts.voice,
    notes_log: [...(customer.notes_log ?? []), entry],
    updated_at: now,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customer/${customerId}`);
  return { success: true };
}

export interface CustomerContactInput {
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  town: string;
  creditCode: string;
  /** YYYY-MM-DD o "" si aún no se agenda */
  installDate: string;
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
    town: input.town.trim(),
    credit_code: input.creditCode.trim().toUpperCase(),
    install_date: input.installDate.trim() || null,
    updated_at: new Date().toISOString(),
  });

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customer/${customerId}`);
  return { success: true };
}

export async function deleteCustomerAction(customerId: string): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const existing = await getCustomer(customerId);
  if (!existing) return { success: false, error: "Cliente no encontrado." };

  // El historial de upsells NO se borra: upsell_log guarda nombre desnormalizado (auditoría)
  await deleteCustomer(customerId);

  revalidatePath("/admin/dashboard");
  return { success: true };
}

export async function addCustomerNoteAction(
  customerId: string,
  text: string
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const trimmed = text.trim();
  if (!trimmed) return { success: false, error: "La nota no puede estar vacía." };

  const existing = await getCustomer(customerId);
  if (!existing) return { success: false, error: "Cliente no encontrado." };

  const now = new Date().toISOString();
  const entry: CustomerNote = { text: trimmed, created_at: now };

  await updateCustomer(customerId, {
    notes_log: [...(existing.notes_log ?? []), entry],
    updated_at: now,
  });

  revalidatePath(`/admin/customer/${customerId}`);
  return { success: true };
}

const callStatusLabels: Record<CallStatus, string> = {
  answered: "Contestó",
  no_answer: "No contestó",
  disconnected: "Desconectado",
};

export async function setCallStatusAction(
  customerId: string,
  status: CallStatus
): Promise<ActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };

  const existing = await getCustomer(customerId);
  if (!existing) return { success: false, error: "Cliente no encontrado." };

  const now = new Date().toISOString();
  // La llamada también queda en la bitácora, con fecha
  const entry: CustomerNote = { text: `📞 Llamada: ${callStatusLabels[status]}`, created_at: now };

  await updateCustomer(customerId, {
    last_call: { status, date: now },
    notes_log: [...(existing.notes_log ?? []), entry],
    updated_at: now,
  });

  revalidatePath("/admin/dashboard");
  revalidatePath(`/admin/customer/${customerId}`);
  return { success: true };
}
