"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createCustomerAction, type NewCustomerInput } from "@/lib/actions/customers";
import { COMPETITOR_SPEED_OPTIONS_MBPS, describePlan, recommendPlanForProspect } from "@/lib/pricing/prospects";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { UpsellSuggestion } from "./UpsellSuggestion";
import type { Plan } from "@/types/plan";

const selectClassName =
  "h-10 w-full rounded-lg border border-muted/30 bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

const emptyForm: NewCustomerInput = {
  name: "",
  email: "",
  phone: "",
  type: "B2C",
  competitorSpeedMbps: 100,
  competitorPrice: 0,
  assignedPlanId: "",
  notes: "",
};

export function NewCustomerButton({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewCustomerInput>(emptyForm);
  const lastAutoPlanId = useRef("");

  const recommendation = useMemo(
    () => recommendPlanForProspect(form.competitorSpeedMbps, form.competitorPrice, plans),
    [form.competitorSpeedMbps, form.competitorPrice, plans]
  );

  // Auto-asigna el plan recomendado, pero deja de tocarlo en cuanto el admin elige uno manualmente.
  // La mutación del ref vive fuera del updater: el updater debe ser puro porque
  // React lo invoca dos veces en modo desarrollo para detectar impurezas.
  useEffect(() => {
    const recommendedId = recommendation?.id ?? "";
    const previousAutoId = lastAutoPlanId.current;
    lastAutoPlanId.current = recommendedId;

    setForm((prev) =>
      prev.assignedPlanId === previousAutoId ? { ...prev, assignedPlanId: recommendedId } : prev
    );
  }, [recommendation]);

  function openDialog() {
    lastAutoPlanId.current = "";
    setForm(emptyForm);
    setError(null);
    setOpen(true);
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

  const assignedPlan = plans.find((p) => p.id === form.assignedPlanId) ?? null;

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

          <div className="rounded-lg border border-muted/20 bg-background/40 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              Lo que tiene hoy (con otro proveedor)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Internet actual</label>
                <select
                  value={form.competitorSpeedMbps}
                  onChange={(e) =>
                    setForm({ ...form, competitorSpeedMbps: Number(e.target.value) })
                  }
                  className={selectClassName}
                >
                  {COMPETITOR_SPEED_OPTIONS_MBPS.map((mbps) => (
                    <option key={mbps} value={mbps}>
                      {mbps >= 1000 ? "1 Gig" : `${mbps} Mbps`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Paga hoy ($)</label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.competitorPrice || ""}
                  onChange={(e) =>
                    setForm({ ...form, competitorPrice: Number(e.target.value) })
                  }
                  placeholder="50.00"
                />
              </div>
            </div>

            {form.competitorPrice > 0 &&
              (recommendation ? (
                <div className="mt-3">
                  <UpsellSuggestion
                    fromName={`${form.competitorSpeedMbps >= 1000 ? "1 Gig" : `${form.competitorSpeedMbps} Mbps`} (otro proveedor)`}
                    fromPrice={form.competitorPrice}
                    toName={recommendation.name}
                    toPrice={recommendation.promo_price_2025}
                    savings={
                      Math.round((form.competitorPrice - recommendation.promo_price_2025) * 100) /
                      100
                    }
                    valueAdd={describePlan(recommendation)}
                  />
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted">
                  No tenemos un plan que le gane ese precio y velocidad todavía — asigna uno
                  manualmente abajo.
                </p>
              ))}
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Plan a asignar</label>
            <select
              value={form.assignedPlanId}
              onChange={(e) => setForm({ ...form, assignedPlanId: e.target.value })}
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
            {assignedPlan && (
              <p className="mt-1 text-xs text-muted">
                Pagará <span className="font-data text-success">${assignedPlan.promo_price_2025.toFixed(2)}</span>/mes con nosotros
              </p>
            )}
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
