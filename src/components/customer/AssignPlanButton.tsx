"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { assignPlanAction } from "@/lib/actions/customers";
import { AddedProductsCheckboxes, type AddedProducts } from "@/components/customer/AddedProductsCheckboxes";
import { planToServiceFlags } from "@/components/customer/ServiceChips";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import type { Plan } from "@/types/plan";

const selectClassName =
  "h-10 w-full rounded-lg border border-muted/30 bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

interface AssignPlanButtonProps {
  customerId: string;
  customerName: string;
  plans: Plan[];
}

/** Convierte un prospecto en venta asignándole su primer plan */
export function AssignPlanButton({ customerId, customerName, plans }: AssignPlanButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [planId, setPlanId] = useState("");
  const [addedProducts, setAddedProducts] = useState<AddedProducts>({
    internet: false,
    video: false,
    voice: false,
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selected = plans.find((p) => p.id === planId) ?? null;

  function selectPlan(id: string) {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    if (!plan) return;
    // Pre-marca según los servicios del plan; el admin puede ajustar antes de cerrar la venta
    const flags = planToServiceFlags(plan);
    setAddedProducts({ internet: flags.internet, video: flags.tv, voice: flags.phone });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!planId) return;
    setError(null);
    startTransition(async () => {
      const result = await assignPlanAction(customerId, planId, addedProducts);
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
      <Button
        variant="success"
        onClick={() => {
          setPlanId("");
          setAddedProducts({ internet: false, video: false, voice: false });
          setError(null);
          setOpen(true);
        }}
      >
        <CheckCircle2 size={16} />
        Asignar plan (cerrar venta)
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title={`Asignar plan a ${customerName}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted">Plan</label>
            <select
              value={planId}
              onChange={(e) => selectPlan(e.target.value)}
              required
              className={selectClassName}
            >
              <option value="" disabled>
                Selecciona un plan
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — ${plan.promo_price_2025.toFixed(2)}
                </option>
              ))}
            </select>
            {selected && (
              <p className="mt-1 text-xs text-muted">
                Pagará{" "}
                <span className="font-data text-success">
                  ${selected.promo_price_2025.toFixed(2)}
                </span>
                /mes. Contará como venta desde hoy.
              </p>
            )}
          </div>

          {planId && <AddedProductsCheckboxes value={addedProducts} onChange={setAddedProducts} />}

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="success" disabled={pending || !planId}>
              {pending ? "Guardando..." : "Cerrar venta"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
