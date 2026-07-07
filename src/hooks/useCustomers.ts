"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { getClientDb } from "@/lib/firebase/client";
import type { Customer } from "@/types/customer";

/** Escucha en tiempo real la colección de clientes (requiere sesión Firebase Auth en el cliente) */
export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(getClientDb(), "customers"), orderBy("name"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setCustomers(
          snap.docs.map((doc) => ({ ...(doc.data() as Omit<Customer, "id">), id: doc.id }))
        );
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  return { customers, loading, error };
}
