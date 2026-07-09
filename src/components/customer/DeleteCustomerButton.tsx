"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

interface DeleteCustomerButtonProps {
  customerId: string;
  customerName: string;
}

export function DeleteCustomerButton({ customerId, customerName }: DeleteCustomerButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteCustomerAction(customerId);
      if (result.success) {
        router.push("/admin/dashboard");
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="hover:text-danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        <Trash2 size={14} />
        Borrar
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} title="¿Borrar este cliente?">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Se borrará <span className="font-semibold text-foreground">{customerName}</span> de
            forma permanente, con sus notas y datos de contacto. Esta acción no se puede deshacer.
          </p>
          <p className="text-xs text-muted">
            El historial de upsells ejecutados NO se borra — queda en el Historial para auditoría.
          </p>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={pending}>
              <Trash2 size={14} />
              {pending ? "Borrando..." : "Borrar cliente"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
