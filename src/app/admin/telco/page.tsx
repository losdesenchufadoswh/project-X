import { TelcoViewer } from "@/components/telco/TelcoViewer";
import { listPlans } from "@/lib/db/plans";
import { getTelcoState } from "@/lib/db/telco";

export const dynamic = "force-dynamic";

export default async function TelcoPage() {
  // Planes: para cerrar una venta. Estado telco: marcados/vendidos/notas desde Firestore.
  const [plans, telcoState] = await Promise.all([listPlans(), getTelcoState()]);
  return <TelcoViewer plans={plans} initialState={telcoState} />;
}
