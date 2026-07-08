import { ClientsTable, type DashboardRow } from "@/components/dashboard/ClientsTable";
import { listCustomers } from "@/lib/db/customers";
import { listPlans } from "@/lib/db/plans";
import { findBestUpsell } from "@/lib/pricing/bundles";
import { calculateSavings, calculateValueAdd } from "@/lib/pricing/calculator";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [customers, plans] = await Promise.all([listCustomers(), listPlans()]);

  const rows: DashboardRow[] = customers.map((customer) => {
    const currentPlan = plans.find((p) => p.id === customer.current_plan_id) ?? null;
    const best = currentPlan
      ? findBestUpsell(currentPlan, plans, customer.price_paying_now)
      : null;

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      type: customer.type,
      planName: currentPlan?.name ?? "Plan desconocido",
      priceNow: customer.price_paying_now,
      suggestion:
        best && currentPlan
          ? {
              planId: best.id,
              planName: best.name,
              price: best.promo_price_2025,
              savings: calculateSavings(customer.price_paying_now, best.promo_price_2025),
              valueAdd: calculateValueAdd(currentPlan, best),
            }
          : null,
    };
  });

  const withSuggestion = rows.filter((r) => r.suggestion !== null).length;
  const totalMonthlyOpportunity = rows.reduce(
    (sum, row) => sum + Math.max(row.suggestion?.savings ?? 0, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Clientes Activos</h1>
        <p className="mt-1 text-sm text-muted">
          {rows.length} cliente{rows.length !== 1 ? "s" : ""} ·{" "}
          <span className="text-success">{withSuggestion} con oportunidad de upsell</span>
          {totalMonthlyOpportunity > 0 && (
            <>
              {" "}
              · <span className="text-primary">
                {formatMoney(totalMonthlyOpportunity)}/mes en ahorro disponible
              </span>
            </>
          )}
        </p>
      </div>

      <ClientsTable rows={rows} plans={plans} />
    </div>
  );
}
