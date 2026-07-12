import { planToServiceFlags } from "@/components/customer/ServiceChips";
import { ClientsTable, type DashboardRow } from "@/components/dashboard/ClientsTable";
import {
  HudSidePanels,
  type MonthSaleItem,
  type MonthUpsellItem,
} from "@/components/dashboard/HudSidePanels";
import { SalesMetricsPanel } from "@/components/dashboard/SalesMetricsPanel";
import { listCustomers } from "@/lib/db/customers";
import { listPlans } from "@/lib/db/plans";
import { listUpsellLogs } from "@/lib/db/upsells";
import { findBestUpsell } from "@/lib/pricing/bundles";
import { calculateSavings, calculateValueAdd } from "@/lib/pricing/calculator";
import { formatMoney } from "@/lib/utils";
import { computeWeeklyGoal } from "@/lib/weekly-goal";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [customers, plans, logs] = await Promise.all([
    listCustomers(),
    listPlans(),
    listUpsellLogs(),
  ]);

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
      town: customer.town ?? "",
      services: planToServiceFlags(currentPlan),
      lastCall: customer.last_call ?? null,
      isProspect: !customer.current_plan_id,
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

  // ── Ventas del mes (clientes nuevos + upsells ejecutados este mes) ──
  const monthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  const monthLabel = new Date().toLocaleDateString("es-PR", { month: "long", year: "numeric" });

  // Fecha real de la venta: si nació prospecto y se le asignó plan después, cuenta el mes de
  // la asignación (last_plan_change), no el de creación del prospecto (signup_date).
  const saleDate = (c: (typeof customers)[number]) => c.last_plan_change ?? c.signup_date;

  const monthSaleCustomers = customers.filter(
    (c) => c.current_plan_id && (saleDate(c) ?? "").slice(0, 7) === monthKey
  );

  const sales: MonthSaleItem[] = [...monthSaleCustomers]
    .sort((a, b) => (saleDate(b) ?? "").localeCompare(saleDate(a) ?? ""))
    .map((c) => ({
      id: c.id,
      name: c.name,
      planName: plans.find((p) => p.id === c.current_plan_id)?.name ?? c.current_plan_id,
      date: saleDate(c) ?? c.signup_date,
    }));

  const monthUpsells: MonthUpsellItem[] = logs
    .filter((log) => (log.executed_at ?? "").slice(0, 7) === monthKey)
    .map((log) => ({
      id: log.id,
      customerName: log.customer_name,
      toPlanName: log.to_plan_name,
      savings: log.savings,
      date: log.executed_at,
    }));

  // Desglose de productos agregados este mes (Internet/Video cuentan para meta; Voice es bono)
  const salesMetrics = {
    internetCount: monthSaleCustomers.filter((c) => c.added_internet).length,
    videoCount: monthSaleCustomers.filter((c) => c.added_video).length,
    voiceCount: monthSaleCustomers.filter((c) => c.added_voice).length,
  };

  // Una fecha por cada unidad (Internet o Video) agregada, para repartir la meta por semana
  const saleUnitDates: string[] = [];
  for (const c of monthSaleCustomers) {
    const date = saleDate(c) ?? c.signup_date;
    if (c.added_internet) saleUnitDates.push(date);
    if (c.added_video) saleUnitDates.push(date);
  }
  const weeklyGoal = computeWeeklyGoal(saleUnitDates, new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="hud-title font-heading text-2xl font-bold">Clientes Activos</h1>
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="min-w-0">
          <ClientsTable rows={rows} plans={plans} />
        </div>

        <HudSidePanels
          monthLabel={monthLabel}
          sales={sales}
          upsells={monthUpsells}
          salesMetrics={{ ...salesMetrics, weeks: weeklyGoal }}
          stats={{
            total: rows.length,
            withUpsell: withSuggestion,
            optimized: rows.filter((r) => !r.isProspect && !r.suggestion).length,
            withTv: rows.filter((r) => r.services.tv).length,
          }}
        />
      </div>
    </div>
  );
}
