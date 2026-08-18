"use server";

import { getSessionUser, isAdmin } from "@/lib/auth/session";
import { saveTelcoState } from "@/lib/db/telco";
import type { TelcoState } from "@/types/telco";

async function requireAdminSession(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return isAdmin(user.uid);
}

export interface TelcoActionResult {
  success: boolean;
  error?: string;
}

/** Guarda el estado completo del visor telco (marcados, vendidos, notas, etc.). */
export async function saveTelcoStateAction(state: TelcoState): Promise<TelcoActionResult> {
  if (!(await requireAdminSession())) return { success: false, error: "No autorizado." };
  try {
    await saveTelcoState(state);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Error al guardar." };
  }
}
