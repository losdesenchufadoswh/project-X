"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { CallStatusButtons } from "@/components/customer/CallStatusButtons";
import { ServiceChips, type ServiceFlags } from "@/components/customer/ServiceChips";
import { ExecuteButton } from "./ExecuteButton";
import { NewCustomerButton } from "./NewCustomerButton";
import { UpsellSuggestion } from "./UpsellSuggestion";
import { formatMoney } from "@/lib/utils";
import type { LastCall } from "@/types/customer";
import type { Plan } from "@/types/plan";

export interface DashboardRow {
  id: string;
  name: string;
  email: string;
  type: "B2B" | "B2C";
  town: string;
  services: ServiceFlags;
  lastCall: LastCall | null;
  isProspect: boolean;
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

type TypeFilter = "all" | "B2C" | "B2B";
type ServiceFilter = "all" | "tv" | "phone" | "internet_only";
type OpportunityFilter = "all" | "with_upsell" | "optimized" | "prospect";

const selectClassName =
  "h-10 rounded-lg border border-muted/30 bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary";

export function ClientsTable({ rows, plans }: { rows: DashboardRow[]; plans: Plan[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [opportunityFilter, setOpportunityFilter] = useState<OpportunityFilter>("all");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (
        term &&
        !row.name.toLowerCase().includes(term) &&
        !row.email.toLowerCase().includes(term) &&
        !row.planName.toLowerCase().includes(term) &&
        !row.town.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (typeFilter !== "all" && row.type !== typeFilter) return false;
      if (serviceFilter === "tv" && !row.services.tv) return false;
      if (serviceFilter === "phone" && !row.services.phone) return false;
      if (serviceFilter === "internet_only" && (row.services.tv || row.services.phone)) return false;
      if (opportunityFilter === "with_upsell" && !row.suggestion) return false;
      if (opportunityFilter === "optimized" && (row.suggestion || row.isProspect)) return false;
      if (opportunityFilter === "prospect" && !row.isProspect) return false;
      return true;
    });
  }, [rows, search, typeFilter, serviceFilter, opportunityFilter]);

  const activeFilters =
    (typeFilter !== "all" ? 1 : 0) +
    (serviceFilter !== "all" ? 1 : 0) +
    (opportunityFilter !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Buscar por nombre, email, plan o pueblo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <NewCustomerButton plans={plans} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-muted">
          <SlidersHorizontal size={14} /> Filtros
        </span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className={selectClassName}
          aria-label="Filtrar por tipo"
        >
          <option value="all">Todos los tipos</option>
          <option value="B2C">B2C</option>
          <option value="B2B">B2B</option>
        </select>
        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value as ServiceFilter)}
          className={selectClassName}
          aria-label="Filtrar por servicio"
        >
          <option value="all">Todos los servicios</option>
          <option value="tv">Con TV</option>
          <option value="phone">Con Teléfono</option>
          <option value="internet_only">Solo Internet</option>
        </select>
        <select
          value={opportunityFilter}
          onChange={(e) => setOpportunityFilter(e.target.value as OpportunityFilter)}
          className={selectClassName}
          aria-label="Filtrar por oportunidad"
        >
          <option value="all">Toda oportunidad</option>
          <option value="with_upsell">Con upsell</option>
          <option value="optimized">Optimizados</option>
          <option value="prospect">Prospectos</option>
        </select>
        {activeFilters > 0 && (
          <button
            type="button"
            onClick={() => {
              setTypeFilter("all");
              setServiceFilter("all");
              setOpportunityFilter("all");
            }}
            className="text-xs text-primary hover:underline"
          >
            Limpiar ({activeFilters})
          </button>
        )}
        <span className="ml-auto text-xs text-muted">
          {filtered.length} de {rows.length}
        </span>
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Nombre</TH>
            <TH>Servicios</TH>
            <TH>Llamada</TH>
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
              <TD colSpan={8} className="py-8 text-center text-muted">
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
                {row.town && (
                  <p className="flex items-center gap-1 text-xs text-muted">
                    <MapPin size={11} /> {row.town}
                  </p>
                )}
              </TD>
              <TD>
                <ServiceChips flags={row.services} />
              </TD>
              <TD>
                <CallStatusButtons customerId={row.id} lastCall={row.lastCall} />
              </TD>
              <TD>
                {row.isProspect ? (
                  <Badge variant="warning">Prospecto</Badge>
                ) : (
                  row.planName
                )}
              </TD>
              <TD className="font-data">{row.isProspect ? "—" : formatMoney(row.priceNow)}</TD>
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
