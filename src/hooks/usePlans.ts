"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Plan } from "@/types/plan";

/** Escucha en tiempo real el catálogo de planes */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(getClientDb(), "plans"), orderBy("tier"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPlans(snap.docs.map((doc) => ({ ...(doc.data() as Omit<Plan, "id">), id: doc.id })));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { plans, loading, error };
}
