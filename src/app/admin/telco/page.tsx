import { TelcoViewer } from "@/components/telco/TelcoViewer";
import { getTelcoState } from "@/lib/db/telco";

export const dynamic = "force-dynamic";

export default async function TelcoPage() {
  // Estado telco: marcados/vendidos/notas desde Firestore. La venta rápida desde aquí
  // solo captura contacto (nombre/pueblo/teléfono/crédito); el plan se asigna luego.
  const telcoState = await getTelcoState();
  return <TelcoViewer initialState={telcoState} />;
}
