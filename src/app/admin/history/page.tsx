import { HistoryTable } from "@/components/dashboard/HistoryTable";
import { listUpsellLogs } from "@/lib/db/upsells";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const logs = await listUpsellLogs();

  const totalSavings = Math.round(logs.reduce((sum, log) => sum + log.savings, 0) * 100) / 100;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Historial de Upsells</h1>
        <p className="mt-1 text-sm text-muted">
          {logs.length} cambio{logs.length !== 1 ? "s" : ""} ejecutado
          {logs.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-success">
            {formatMoney(Math.max(totalSavings, 0))} ahorrados a clientes
          </span>
        </p>
      </div>

      <HistoryTable logs={logs} />
    </div>
  );
}
