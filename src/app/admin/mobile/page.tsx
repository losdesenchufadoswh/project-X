import { Smartphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MobileComingSoonPage() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center gap-8 text-center">
      {/* Arc reactor: anillos concéntricos girando en direcciones opuestas */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        <span className="hud-spin-slow absolute inset-0 rounded-full border border-dashed border-primary/40" />
        <span
          className="hud-spin-rev-slow absolute inset-5 rounded-full border border-primary/25"
          style={{ borderStyle: "dotted" }}
        />
        <span className="hud-spin-slow absolute inset-10 rounded-full border-2 border-transparent border-t-primary" />
        <span className="hud-spin-rev-slow absolute inset-14 rounded-full border border-transparent border-b-primary/60" />
        <span className="absolute inset-[76px] rounded-full bg-primary/10 shadow-[0_0_40px_rgba(47,157,255,0.4)]" />
        <Smartphone
          size={52}
          className="relative text-primary"
          style={{ filter: "drop-shadow(0 0 12px rgba(47, 157, 255, 0.8))" }}
        />
      </div>

      <div className="space-y-3">
        <h1 className="hud-title font-heading text-3xl font-bold">Clientes de Celular</h1>
        <p className="hud-flicker font-data text-sm uppercase tracking-[0.5em] text-primary">
          Coming Soon
        </p>
      </div>

      <p className="max-w-md text-sm text-muted">
        Módulo en construcción. Pronto vas a poder manejar clientes de celular desde aquí, con el
        mismo motor de ofertas y upsells.
      </p>
    </div>
  );
}
