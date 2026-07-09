interface HudGaugeProps {
  value: number;
  max: number;
  label: string;
}

/** Gauge circular estilo JARVIS: anillo de progreso con glow + anillo punteado giratorio */
export function HudGauge({ value, max, label }: HudGaugeProps) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = max > 0 ? Math.min(value / max, 1) : 0;

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-24 w-24">
        <span className="hud-spin-slow absolute inset-0 rounded-full border border-dashed border-primary/40" />
        <svg viewBox="0 0 100 100" className="absolute inset-1 -rotate-90">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="rgba(47, 157, 255, 0.15)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={`${pct * circumference} ${circumference}`}
            style={{ filter: "drop-shadow(0 0 6px rgba(47, 157, 255, 0.8))" }}
          />
        </svg>
        <span className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-data text-2xl leading-none text-primary">{value}</span>
          <span className="mt-0.5 text-[8px] text-muted">/ {max}</span>
        </span>
      </div>
      <span className="font-data text-[10px] uppercase tracking-widest text-muted">{label}</span>
    </div>
  );
}
