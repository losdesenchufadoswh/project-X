import { PlansManager } from "@/components/plans/PlansManager";
import { listPlans } from "@/lib/db/plans";

export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Catálogo de Planes</h1>
        <p className="mt-1 text-sm text-muted">
          {plans.length} plan{plans.length !== 1 ? "es" : ""} — el motor de sugerencias usa este
          catálogo (tier + precio + servicios).
        </p>
      </div>

      <PlansManager plans={plans} />
    </div>
  );
}
