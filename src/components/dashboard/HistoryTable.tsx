import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDate, formatMoney } from "@/lib/utils";
import type { UpsellLog } from "@/types/upsell";

export function HistoryTable({ logs }: { logs: UpsellLog[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Cliente</TH>
          <TH>Cambio</TH>
          <TH>Ahorro</TH>
          <TH>Valor agregado</TH>
          <TH>Ejecutado por</TH>
          <TH>Cuándo</TH>
        </TR>
      </THead>
      <TBody>
        {logs.length === 0 && (
          <TR>
            <TD colSpan={6} className="py-8 text-center text-muted">
              Todavía no hay upsells ejecutados.
            </TD>
          </TR>
        )}
        {logs.map((log) => (
          <TR key={log.id}>
            <TD className="font-semibold">{log.customer_name}</TD>
            <TD>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted">
                  {log.from_plan_name}{" "}
                  <span className="font-data">{formatMoney(log.from_price)}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-primary" />
                <span>
                  {log.to_plan_name}{" "}
                  <span className="font-data text-success">{formatMoney(log.to_price)}</span>
                </span>
              </div>
            </TD>
            <TD>
              {log.savings > 0 ? (
                <Badge variant="success">-{formatMoney(log.savings)}</Badge>
              ) : log.savings === 0 ? (
                <Badge variant="primary">$0.00</Badge>
              ) : (
                <Badge variant="warning">+{formatMoney(Math.abs(log.savings))}</Badge>
              )}
            </TD>
            <TD className="text-sm text-muted">{log.value_add || "—"}</TD>
            <TD className="text-sm">{log.executed_by}</TD>
            <TD className="text-sm text-muted">{formatDate(log.executed_at)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
