import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BundleComparison } from "@/components/customer/BundleComparison";
import { CurrentPlan } from "@/components/customer/CurrentPlan";
import { EditCustomerButton } from "@/components/customer/EditCustomerButton";
import { SavingsCalculator } from "@/components/customer/SavingsCalculator";
import { ExecuteButton } from "@/components/dashboard/ExecuteButton";
import { Badge } from "@/components/ui/badge";
import { getCustomer } from "@/lib/db/customers";
import { listPlans } from "@/lib/db/plans";
import { findBestUpsell } from "@/lib/pricing/bundles";
import { calculateValueAdd } from "@/lib/pricing/calculator";
import { formatDate } from "@/lib/utils";

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
  const suggestion = currentPlan
    ? findBestUpsell(currentPlan, plans, customer.price_paying_now)
    : null;

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
          {customer.notes && (
            <p className="mt-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-warning">
              {customer.notes}
            </p>
          )}
        </div>
        <EditCustomerButton customer={customer} />
      </div>

      {!currentPlan && (
        <p className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
          El plan asignado ({customer.current_plan_id}) no existe en el catálogo. Revisa la
          colección <code>plans</code>.
        </p>
      )}

      {currentPlan && !suggestion && (
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

      {currentPlan && suggestion && (
        <>
          <BundleComparison
            currentPlan={currentPlan}
            pricePayingNow={customer.price_paying_now}
            suggestedPlan={suggestion}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <SavingsCalculator
              pricePayingNow={customer.price_paying_now}
              newPrice={suggestion.promo_price_2025}
              valueAdd={calculateValueAdd(currentPlan, suggestion)}
            />

            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-muted/20 bg-surface p-6">
              <p className="text-center text-sm text-muted">
                Al ejecutar, Firebase se actualiza al instante y el cambio queda en el historial.
              </p>
              <ExecuteButton
                customerId={customer.id}
                customerName={customer.name}
                newPlanId={suggestion.id}
                newPlanName={suggestion.name}
                newPrice={suggestion.promo_price_2025}
                fromPlanName={currentPlan.name}
                fromPrice={customer.price_paying_now}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
