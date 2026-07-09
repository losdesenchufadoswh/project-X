import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, KeyRound, MapPin, PhoneCall } from "lucide-react";
import { CallStatusButtons } from "@/components/customer/CallStatusButtons";
import { CurrentPlan } from "@/components/customer/CurrentPlan";
import { CustomerNotes } from "@/components/customer/CustomerNotes";
import { DeleteCustomerButton } from "@/components/customer/DeleteCustomerButton";
import { EditCustomerButton } from "@/components/customer/EditCustomerButton";
import { ServiceChips, planToServiceFlags } from "@/components/customer/ServiceChips";
import { UpsellOptionCard } from "@/components/customer/UpsellOptionCard";
import { Badge } from "@/components/ui/badge";
import { getCustomer } from "@/lib/db/customers";
import { listPlans } from "@/lib/db/plans";
import { findUpsellOptions } from "@/lib/pricing/bundles";
import { formatDate, formatDateOnly } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  const plans = await listPlans();
  const currentPlan = plans.find((p) => p.id === customer.current_plan_id) ?? null;
  const { bestSavings, maxPlan } = currentPlan
    ? findUpsellOptions(currentPlan, plans, customer.price_paying_now)
    : { bestSavings: null, maxPlan: null };

  return (
    <div className="space-y-6">
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Volver al dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{customer.name}</h1>
            <Badge variant={customer.type === "B2B" ? "warning" : "primary"}>
              {customer.type}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {customer.email} · {customer.phone}
          </p>
          <p className="text-sm text-muted">
            Cliente desde {formatDate(customer.signup_date)} · Último cambio de plan:{" "}
            {formatDate(customer.last_plan_change)}
          </p>
        </div>
        <div className="flex gap-1">
          <EditCustomerButton customer={customer} />
          <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
        </div>
      </div>

      {/* Datos, servicios contratados, instalación y llamada de hoy */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="hud-panel p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Servicios contratados
          </p>
          <ServiceChips flags={planToServiceFlags(currentPlan)} size="md" />
        </div>

        <div className="hud-panel p-4">
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <PhoneCall size={13} /> Llamada de hoy
          </p>
          <CallStatusButtons
            customerId={customer.id}
            lastCall={customer.last_call ?? null}
            size="md"
          />
        </div>

        <div className="hud-panel p-4">
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted">
            <CalendarCheck size={13} /> Instalación
          </p>
          {customer.install_date ? (
            <p className="text-sm text-success">{formatDateOnly(customer.install_date)}</p>
          ) : (
            <p className="text-sm text-warning">Por agendar — usa &quot;Editar&quot;</p>
          )}
        </div>

        <div className="hud-panel p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Datos</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-1.5 text-muted">
              <MapPin size={13} />
              <span className="text-foreground">{customer.town || "Sin pueblo"}</span>
            </p>
            <p className="flex items-center gap-1.5 text-muted">
              <KeyRound size={13} />
              Crédito:{" "}
              <span className="font-data text-primary">{customer.credit_code || "—"}</span>
            </p>
          </div>
        </div>
      </div>

      <CustomerNotes
        customerId={customer.id}
        notesLog={customer.notes_log ?? []}
        legacyNote={customer.notes ?? ""}
      />

      {!currentPlan && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          El plan asignado ({customer.current_plan_id}) no existe en el catálogo. Revisa la
          colección <code>plans</code>.
        </p>
      )}

      {currentPlan && !bestSavings && !maxPlan && (
        <div className="space-y-4">
          <CurrentPlan
            plan={currentPlan}
            pricePayingNow={customer.price_paying_now}
            label="Plan actual"
          />
          <p className="text-sm text-muted">
            No hay bundle superior por igual o menor precio. Este cliente ya está optimizado. 🎯
          </p>
        </div>
      )}

      {currentPlan && bestSavings && (
        <UpsellOptionCard
          kind="savings"
          customer={customer}
          currentPlan={currentPlan}
          suggestedPlan={bestSavings}
        />
      )}

      {currentPlan && maxPlan && (
        <UpsellOptionCard
          kind="max"
          customer={customer}
          currentPlan={currentPlan}
          suggestedPlan={maxPlan}
        />
      )}
    </div>
  );
}
