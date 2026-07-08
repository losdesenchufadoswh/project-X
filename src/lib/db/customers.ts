import { adminDb } from "@/lib/firebase/server";
import type { Customer } from "@/types/customer";

const COLLECTION = "customers";

export async function listCustomers(): Promise<Customer[]> {
  const snap = await adminDb().collection(COLLECTION).orderBy("name").get();
  return snap.docs.map((doc) => ({ ...(doc.data() as Omit<Customer, "id">), id: doc.id }));
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const doc = await adminDb().collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return { ...(doc.data() as Omit<Customer, "id">), id: doc.id };
}

export async function updateCustomer(id: string, data: Partial<Omit<Customer, "id">>): Promise<void> {
  await adminDb().collection(COLLECTION).doc(id).update(data);
}

export async function createCustomer(data: Omit<Customer, "id">): Promise<string> {
  const ref = adminDb().collection(COLLECTION).doc();
  await ref.set(data);
  return ref.id;
}
