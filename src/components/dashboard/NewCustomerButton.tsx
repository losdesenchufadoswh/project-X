"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCustomerAction, type NewCustomerInput } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Plan } from "@/types/plan";

const selectClassName =
  "h-10 w-full rounded-lg border border-muted/30 bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const emptyForm: NewCustomerInput = {
  name: "",
  email: "",
  phone: "",
  type: "B2C",
  currentPlanId: "",
  pricePayingNow: 0,
  notes: "",
};

export function NewCustomerButton({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewCustomerInput>(emptyForm);

  function openDialog() {
    setForm(emptyForm);
    setError(null);
    setOpen(true);
  }

  function handlePlanChange(planId: string) {
    const plan = plans.find((p) => p.id === planId);
    setForm((prev) => ({
      ...prev,
      currentPlanId: planId,
      pricePayingNow: plan ? plan.promo_price_2025 : prev.pricePayingNow,
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCustomerAction(form);
      if (result.success) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return (
    <>
      <Button onClick={openDialog}>
        <Plus size={16} />
        Nuevo cliente
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Nombre</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Teléfono</label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "B2B" | "B2C" })}
                className={selectClassName}
              >
                <option value="B2C">B2C</option>
                <option value="B2B">B2B</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Plan actual</label>
              <select
                value={form.currentPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                required
                className={selectClassName}
              >
                <option value="" disabled>
                  Selecciona un plan
                </option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Precio que paga ($)</label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.pricePayingNow}
              onChange={(e) => setForm({ ...form, pricePayingNow: Number(e.target.value) })}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Notas (opcional)</label>
            <Input
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear cliente"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
