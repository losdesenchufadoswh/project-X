import { TrendingDown, TrendingUp } from "lucide-react";
import { formatMoney } from "@/lib/utils";

interface SavingsCalculatorProps {
  pricePayingNow: number;
  newPrice: number;
  valueAdd: string;
}

/** "Pagas $X, ahorras $Y" — mensual y anual */
export function SavingsCalculator({ pricePayingNow, newPrice, valueAdd }: SavingsCalculatorProps) {
  const savings = Math.round((pricePayingNow - newPrice) * 100) / 100;
  const yearly = Math.round(savings * 12 * 100) / 100;

  return (
    <div className="rounded-xl border border-success/40 bg-success/5 p-6">
      <div className="mb-3 flex items-center gap-2">
        {savings >= 0 ? (
          <TrendingDown size={20} className="text-success" />
        ) : (
          <TrendingUp size={20} className="text-warning" />
        )}
        <h3 className="font-heading font-bold">Cálculo del cambio</h3>
      </div>

      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Paga hoy</dt>
          <dd className="font-data">{formatMoney(pricePayingNow)}/mes</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Pagaría</dt>
          <dd className="font-data text-success">{formatMoney(newPrice)}/mes</dd>
        </div>
        <div className="flex justify-between border-t border-muted/20 pt-2">
          <dt className="font-semibold">Ahorro mensual</dt>
          <dd className={`font-data font-bold ${savings >= 0 ? "text-success" : "text-warning"}`}>
            {savings >= 0 ? formatMoney(savings) : `-${formatMoney(Math.abs(savings))}`}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="font-semibold">Ahorro anual</dt>
          <dd className={`font-data font-bold ${yearly >= 0 ? "text-success" : "text-warning"}`}>
            {yearly >= 0 ? formatMoney(yearly) : `-${formatMoney(Math.abs(yearly))}`}
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-lg bg-background/60 p-3 text-sm">
        <span className="font-semibold text-success">Además gana:</span> {valueAdd}
      </p>
    </div>
  );
}
