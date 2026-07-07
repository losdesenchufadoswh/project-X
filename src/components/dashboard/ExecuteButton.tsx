"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import { executeUpsellAction } from "@/lib/actions/upsell";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { formatMoney } from "@/lib/utils";

interface ExecuteButtonProps {
  customerId: string;
  customerName: string;
  newPlanId: string;
  newPlanName: string;
  newPrice: number;
  fromPlanName: string;
  fromPrice: number;
}

export function ExecuteButton({
  customerId,
  customerName,
  newPlanId,
  newPlanName,
  newPrice,
  fromPlanName,
  fromPrice,
}: ExecuteButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function handleExecute() {
    setMessage(null);
    startTransition(async () => {
      const result = await executeUpsellAction(customerId, newPlanId);
      if (result.success) {
        setMessage({ ok: true, text: "✓ Plan actualizado en Firebase" });
        setOpen(false);
        router.refresh();
      } else {
        setMessage({ ok: false, text: `✗ ${result.error ?? "Error desconocido"}` });
      }
    });
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} disabled={pending}>
        <Zap size={14} />
        {pending ? "Ejecutando..." : "EJECUTAR"}
      </Button>

      {message && (
        <p className={`mt-1 text-xs ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      {/* Regla no negociable #3: confirmación siempre antes de ejecutar */}
      <Dialog open={open} onClose={() => setOpen(false)} title="¿Aplicar este cambio de plan?">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Cliente: <span className="font-semibold text-foreground">{customerName}</span>
          </p>

          <div className="flex items-center justify-between rounded-lg border border-muted/20 bg-background p-4 text-sm">
            <div>
              <p className="text-muted">{fromPlanName}</p>
              <p className="font-data text-lg">{formatMoney(fromPrice)}</p>
            </div>
            <span className="text-2xl text-primary">→</span>
            <div className="text-right">
              <p className="text-foreground">{newPlanName}</p>
              <p className="font-data text-lg text-success">{formatMoney(newPrice)}</p>
            </div>
          </div>

          {message && !message.ok && <p className="text-sm text-danger">{message.text}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button variant="success" onClick={handleExecute} disabled={pending}>
              <Zap size={14} />
              {pending ? "Ejecutando..." : "Confirmar y ejecutar"}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
