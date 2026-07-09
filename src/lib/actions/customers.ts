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

  // Todas las notas nacen fechadas en la bitácora
  const noteEntries: CustomerNote[] = [];
  if (input.competitorSpeedMbps > 0 && input.competitorPrice > 0) {
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
    current_plan_id: plan.id,
    price_paying_now: plan.promo_price_2025,
    signup_date: now,
    last_plan_change: null,
    town: input.town.trim(),
    credit_code: input.creditCode.trim().toUpperCase(),
    install_date: null,
    notes: "",
    notes_log: noteEntries,
    last_call: null,
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
