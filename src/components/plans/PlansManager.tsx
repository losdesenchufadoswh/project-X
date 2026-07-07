"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deletePlanAction, savePlanAction, type PlanInput } from "@/lib/actions/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatMoney } from "@/lib/utils";
import type { Plan } from "@/types/plan";

const emptyForm: PlanInput = {
  id: "",
  name: "",
  description: "",
  internetSpeed: 0,
  cableIncluded: false,
  phoneLines: 0,
  price2025: 0,
  promoPrice2025: 0,
  discountCode: "",
  bundleCode: "",
  tier: 1,
};

function planToInput(plan: Plan): PlanInput {
  const internet = plan.services.find((s) => s.type === "internet" && s.included);
  const cable = plan.services.some((s) => s.type === "cable_tv" && s.included);
  const phones = plan.services.find((s) => s.type === "phone_lines" && s.included);
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    internetSpeed: internet?.speed ?? 0,
    cableIncluded: cable,
    phoneLines: phones?.count ?? 0,
    price2025: plan.price_2025,
    promoPrice2025: plan.promo_price_2025,
    discountCode: plan.discount_code,
    bundleCode: plan.bundle_code,
    tier: plan.tier,
  };
}

const bundleTypeLabels: Record<Plan["bundle_type"], string> = {
  internet_only: "Internet",
  internet_cable: "Internet + Cable",
  triple_play: "Triple Play",
};

export function PlansManager({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlanInput>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openNew() {
    setForm({ ...emptyForm, tier: plans.length + 1 });
    setEditing(false);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(plan: Plan) {
    setForm(planToInput(plan));
    setEditing(true);
    setError(null);
    setFormOpen(true);
  }

  function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await savePlanAction(form);
      if (result.success) {
        setFormOpen(false);
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  function handleDelete() {
    if (!deleteTarget) return;
    setError(null);
    startTransition(async () => {
      const result = await deletePlanAction(deleteTarget.id);
      if (result.success) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  function set<K extends keyof PlanInput>(key: K, value: PlanInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus size={16} />
          Nuevo plan
        </Button>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Tier</TH>
            <TH>Plan</TH>
            <TH>Tipo</TH>
            <TH>Servicios</TH>
            <TH>Precio lista</TH>
            <TH>Precio promo</TH>
            <TH>Acciones</TH>
          </TR>
        </THead>
        <TBody>
          {plans.length === 0 && (
            <TR>
              <TD colSpan={7} className="py-8 text-center text-muted">
                No hay planes. Corre <code>npm run seed</code> o agrega uno con el botón +.
              </TD>
            </TR>
          )}
          {plans.map((plan) => {
            const internet = plan.services.find((s) => s.type === "internet" && s.included);
            const cable = plan.services.some((s) => s.type === "cable_tv" && s.included);
            const phones = plan.services.find((s) => s.type === "phone_lines" && s.included);
            return (
              <TR key={plan.id}>
                <TD className="font-data">{plan.tier}</TD>
                <TD>
                  <p className="font-semibold">{plan.name}</p>
                  <p className="text-xs text-muted">{plan.id}</p>
                </TD>
                <TD>
                  <Badge variant={plan.is_bundle ? "primary" : "default"}>
                    {bundleTypeLabels[plan.bundle_type]}
                  </Badge>
                </TD>
                <TD className="text-sm text-muted">
                  {[
                    internet ? `${internet.speed}M` : null,
                    cable ? "Cable TV" : null,
                    phones ? `${phones.count} tel` : null,
                  ]
                    .filter(Boolean)
                    .join(" + ")}
                </TD>
                <TD className="font-data text-muted line-through">
                  {formatMoney(plan.price_2025)}
                </TD>
                <TD className="font-data text-success">{formatMoney(plan.promo_price_2025)}</TD>
                <TD>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}>
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:text-danger"
                      onClick={() => {
                        setError(null);
                        setDeleteTarget(plan);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>

      {/* Form crear/editar */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Editar ${form.name}` : "Nuevo plan"}
      >
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">ID (ej. PLAN_500M_CABLE)</label>
              <Input
                value={form.id}
                onChange={(e) => set("id", e.target.value.toUpperCase())}
                disabled={editing}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Tier</label>
              <Input
                type="number"
                min={1}
                value={form.tier}
                onChange={(e) => set("tier", Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Nombre</label>
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Descripción</label>
            <Input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Internet (Mbps)</label>
              <Input
                type="number"
                min={0}
                value={form.internetSpeed}
                onChange={(e) => set("internetSpeed", Number(e.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Líneas tel.</label>
              <Input
                type="number"
                min={0}
                value={form.phoneLines}
                onChange={(e) => set("phoneLines", Number(e.target.value))}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.cableIncluded}
                  onChange={(e) => set("cableIncluded", e.target.checked)}
                  className="h-4 w-4 accent-[#7c3aed]"
                />
                Cable TV
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Precio lista ($)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.price2025}
                onChange={(e) => set("price2025", Number(e.target.value))}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Precio promo ($)</label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.promoPrice2025}
                onChange={(e) => set("promoPrice2025", Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Discount code</label>
              <Input
                value={form.discountCode}
                onChange={(e) => set("discountCode", e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Bundle code</label>
              <Input
                value={form.bundleCode}
                onChange={(e) => set("bundleCode", e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : editing ? "Guardar cambios" : "Crear plan"}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Confirmación de borrado */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="¿Borrar este plan?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Se borrará <span className="font-semibold text-foreground">{deleteTarget?.name}</span>{" "}
            ({deleteTarget?.id}) del catálogo. Esta acción no se puede deshacer.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending}>
              <Trash2 size={14} />
              {pending ? "Borrando..." : "Borrar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
