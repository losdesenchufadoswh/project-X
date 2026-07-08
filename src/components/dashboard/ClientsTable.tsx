"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { ExecuteButton } from "./ExecuteButton";
import { NewCustomerButton } from "./NewCustomerButton";
import { UpsellSuggestion } from "./UpsellSuggestion";
import { formatMoney } from "@/lib/utils";
import type { Plan } from "@/types/plan";

export interface DashboardRow {
  id: string;
  name: string;
  email: string;
  type: "B2B" | "B2C";
  planName: string;
  priceNow: number;
  suggestion: {
    planId: string;
    planName: string;
    price: number;
    savings: number;
    valueAdd: string;
  } | null;
}

export function ClientsTable({ rows, plans }: { rows: DashboardRow[]; plans: Plan[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(term) ||
        row.email.toLowerCase().includes(term) ||
        row.planName.toLowerCase().includes(term)
    );
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <NewCustomerButton plans={plans} />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Nombre</TH>
            <TH>Plan Actual</TH>
            <TH>Paga</TH>
            <TH>Sugerencia Upsell</TH>
            <TH>Ahorro</TH>
            <TH>Acción</TH>
          </TR>
        </THead>
        <TBody>
          {filtered.length === 0 && (
            <TR>
              <TD colSpan={6} className="py-8 text-center text-muted">
                No se encontraron clientes.
              </TD>
            </TR>
          )}
          {filtered.map((row) => (
            <TR key={row.id}>
              <TD>
                <Link
                  href={`/admin/customer/${row.id}`}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {row.name}
                </Link>
                <p className="text-xs text-muted">
                  {row.type} · {row.email}
                </p>
              </TD>
              <TD>{row.planName}</TD>
              <TD className="font-data">{formatMoney(row.priceNow)}</TD>
              <TD>
                {row.suggestion ? (
                  <UpsellSuggestion
                    fromName={row.planName}
                    fromPrice={row.priceNow}
                    toName={row.suggestion.planName}
                    toPrice={row.suggestion.price}
                    savings={row.suggestion.savings}
                    valueAdd={row.suggestion.valueAdd}
                  />
                ) : (
                  <span className="text-sm text-muted">No hay sugerencia</span>
                )}
              </TD>
              <TD>
                {row.suggestion ? (
                  row.suggestion.savings > 0 ? (
                    <Badge variant="success">-{formatMoney(row.suggestion.savings)}</Badge>
                  ) : (
                    <Badge variant="primary">$0.00</Badge>
                  )
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TD>
              <TD>
                {row.suggestion && (
                  <ExecuteButton
                    customerId={row.id}
                    customerName={row.name}
                    newPlanId={row.suggestion.planId}
                    newPlanName={row.suggestion.planName}
                    newPrice={row.suggestion.price}
                    fromPlanName={row.planName}
                    fromPrice={row.priceNow}
                  />
                )}
              </TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
