interface HudStatBarProps {
  label: string;
  value: number;
  total: number;
}

/** Barra de porcentaje estilo panel "SISTEMA" del HUD */
export function HudStatBar({ label, value, total }: HudStatBarProps) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-data text-primary">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-primary/10">
        <div
          className="h-full bg-primary shadow-[0_0_8px_rgba(47,157,255,0.7)] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
