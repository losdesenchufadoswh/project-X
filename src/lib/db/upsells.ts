import { adminDb } from "@/lib/firebase/server";
import type { UpsellLog, UpsellLogInput } from "@/types/upsell";

const COLLECTION = "upsell_log";

export async function createUpsellLog(input: UpsellLogInput): Promise<string> {
  const ref = adminDb().collection(COLLECTION).doc();
  await ref.set({ ...input, created_at: new Date().toISOString() });
  return ref.id;
}

export async function listUpsellLogs(limit = 100): Promise<UpsellLog[]> {
  const snap = await adminDb()
    .collection(COLLECTION)
    .orderBy("executed_at", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((doc) => ({ ...(doc.data() as Omit<UpsellLog, "id">), id: doc.id }));
}
