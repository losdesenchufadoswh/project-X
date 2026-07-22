import { TelcoViewer } from "@/components/telco/TelcoViewer";
import { listPlans } from "@/lib/db/plans";

export const dynamic = "force-dynamic";

export default async function TelcoPage() {
  // Los planes se cargan aquí para poder cerrar una venta directo desde un registro
  const plans = await listPlans();
  return <TelcoViewer plans={plans} />;
}
