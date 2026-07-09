"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { updateCustomerContactAction, type CustomerContactInput } from "@/lib/actions/customers";
import { PR_TOWNS } from "@/lib/pr-towns";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/types/customer";

const selectClassName =
  "h-10 w-full rounded-lg border border-muted/30 bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

function toForm(customer: Customer): CustomerContactInput {
  return {
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    type: customer.type,
    town: customer.town ?? "",
    creditCode: customer.credit_code ?? "",
    installDate: customer.install_date ?? "",
  };
}

export function EditCustomerButton({ customer }: { customer: Customer }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CustomerContactInput>(toForm(customer));

  function openDialog() {
    setForm(toForm(customer));
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await updateCustomerContactAction(customer.id, form);
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
      <Button variant="ghost" size="sm" onClick={openDialog}>
        <Pencil size={14} />
        Editar
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="Editar cliente">
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
              <label className="mb-1 block text-xs text-muted">Pueblo</label>
              <Input
                list="pr-towns-edit"
                value={form.town}
                onChange={(e) => setForm({ ...form, town: e.target.value })}
                placeholder="Bayamón"
              />
              <datalist id="pr-towns-edit">
                {PR_TOWNS.map((town) => (
                  <option key={town} value={town} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Código de crédito</label>
              <Input
                value={form.creditCode}
                onChange={(e) => setForm({ ...form, creditCode: e.target.value.toUpperCase() })}
                placeholder="Ej. AB"
                className="font-data uppercase"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Fecha de instalación</label>
              <Input
                type="date"
                value={form.installDate}
                onChange={(e) => setForm({ ...form, installDate: e.target.value })}
              />
            </div>
          </div>

          <p className="text-xs text-muted">
            Las notas se escriben en la bitácora del cliente (quedan fechadas). El plan y el precio
            solo cambian ejecutando un upsell, para mantener el historial de auditoría completo.
          </p>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
