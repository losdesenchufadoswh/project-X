import { Zap } from "lucide-react";
import { HudDock } from "@/components/hud/HudDock";
import { requireAdmin } from "@/lib/auth/session";
import { listCustomers } from "@/lib/db/customers";
import { listPlans } from "@/lib/db/plans";
import { listUpsellLogs } from "@/lib/db/upsells";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificación real de sesión + rol admin (el middleware solo chequea que exista cookie)
  const user = await requireAdmin();

  const [customers, plans, logs] = await Promise.all([
    listCustomers(),
    listPlans(),
    listUpsellLogs(),
  ]);

  const stats: Array<[string, number]> = [
    ["Clientes", customers.length],
    ["Planes", plans.length],
    ["Upsells", logs.length],
  ];

  const today = new Date().toLocaleDateString("es-PR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen flex-col">
      {/* Regla numérica decorativa, como el borde superior del HUD */}
      <div className="hidden select-none justify-between px-8 pt-2 font-data text-[9px] tracking-widest text-primary/30 md:flex">
        {Array.from({ length: 30 }, (_, i) => String(i + 1).padStart(2, "0")).map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>

      <header className="hud-panel mx-3 mt-2 flex items-center justify-between gap-4 px-4 py-3 md:mx-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
            <span className="hud-spin-slow absolute inset-0 rounded-full border border-dashed border-primary/50" />
            <span className="hud-spin-rev-slow absolute inset-1.5 rounded-full border border-primary/30" />
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <p className="hud-title font-heading text-lg font-bold leading-tight text-foreground">
              PROJECT X
            </p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted">Pricing Engine</p>
          </div>
        </div>

        <div className="hidden items-center gap-6 lg:flex">
          {stats.map(([label, value]) => (
            <div key={label} className="text-center">
              <p className="font-data text-lg leading-none text-primary">
                {String(value).padStart(3, "0")}
              </p>
              <p className="mt-1 text-[9px] uppercase tracking-widest text-muted">{label}</p>
            </div>
          ))}
          <span className="flex items-center gap-1.5 font-data text-[10px] uppercase tracking-widest text-success">
            <span className="hud-pulse h-1.5 w-1.5 rounded-full bg-success" />
            Online
          </span>
        </div>

        <div className="text-right">
          <p className="font-data text-xs uppercase text-primary">{today}</p>
          <p className="max-w-[180px] truncate text-[10px] text-muted" title={user.email}>
            {user.email}
          </p>
        </div>
      </header>

      <main className="flex-1 p-4 pb-36 md:p-8 md:pb-36">{children}</main>

      <HudDock />
    </div>
  );
}
