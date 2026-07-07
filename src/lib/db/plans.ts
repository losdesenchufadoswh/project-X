import { adminDb } from "@/lib/firebase/server";
import type { Plan } from "@/types/plan";

const COLLECTION = "plans";

export async function listPlans(): Promise<Plan[]> {
  const snap = await adminDb().collection(COLLECTION).orderBy("tier").get();
  return snap.docs.map((doc) => ({ ...(doc.data() as Omit<Plan, "id">), id: doc.id }));
}

export async function getPlan(id: string): Promise<Plan | null> {
  const doc = await adminDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as Omit<Plan, "id">), id: doc.id };
}

export async function upsertPlan(plan: Plan): Promise<void> {
  const { id, ...data } = plan;
  await adminDb().collection(COLLECTION).doc(id).set(data, { merge: true });
}

export async function deletePlan(id: string): Promise<void> {
  await adminDb().collection(COLLECTION).doc(id).delete();
}

/** Cuántos clientes tienen este plan asignado (para bloquear borrado si está en uso) */
export async function countCustomersOnPlan(planId: string): Promise<number> {
  const snap = await adminDb()
    .collection("customers")
    .where("current_plan_id", "==", planId)
    .count()
    .get();
  return snap.data().count;
}
