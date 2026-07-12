import { Activity, TrendingUp, UserPlus } from "lucide-react";
import { HudGauge } from "@/components/hud/HudGauge";
import { HudStatBar } from "@/components/hud/HudStatBar";
import { SalesMetricsPanel, type SalesMetricsPanelProps } from "./SalesMetricsPanel";
import { formatMoney } from "@/lib/utils";

export interface MonthSaleItem {
  id: string;
  name: string;
  planName: string;
  date: string;
}

export interface MonthUpsellItem {
  id: string;
  customerName: string;
  toPlanName: string;
  savings: number;
  date: string;
}

export interface SystemStats {
  total: number;
  withUpsell: number;
  optimized: number;
  withTv: number;
}

interface HudSidePanelsProps {
  monthLabel: string;
  sales: MonthSaleItem[];
  upsells: MonthUpsellItem[];
  stats: SystemStats;
  salesMetrics: SalesMetricsPanelProps;
}

function day(iso: string): string {
  return new Date(iso).toLocaleDateString("es-PR", { day: "2-digit", month: "short" });
}

function PanelHeader({ icon: Icon, title }: { icon: typeof Activity; title: string }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.25em] text-primary">
      <Icon size={12} />
      {title}
    </p>
  );
}

/** Columna derecha del dashboard: ventas del mes, upsells ejecutados y "sistema" */
export function HudSidePanels({
  monthLabel,
  sales,
  upsells,
  stats,
  salesMetrics,
}: HudSidePanelsProps) {
  const currentWeek = salesMetrics.weeks[salesMetrics.weeks.length - 1];

  return (
    <div className="space-y-4">
      <div className="hud-panel p-4">
        <PanelHeader icon={UserPlus} title={`Ventas del mes — ${monthLabel}`} />

        <div className="mb-4 flex justify-around">
          <HudGauge
            value={currentWeek?.actual ?? 0}
            max={currentWeek?.target || 1}
            label={currentWeek ? `Semana ${currentWeek.weekNumber}` : "Semana"}
          />
          <HudGauge value={upsells.length} max={40} label="Upsells" />
        </div>

        {sales.length === 0 ? (
          <p className="text-xs text-muted">Sin ventas nuevas este mes.</p>
        ) : (
          <ul className="space-y-2">
            {sales.slice(0, 8).map((sale) => (
              <li key={sale.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">
                  <span className="text-foreground">{sale.name}</span>{" "}
                  <span className="text-muted">· {sale.planName}</span>
                </span>
                <span className="font-data shrink-0 text-primary">{day(sale.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <SalesMetricsPanel {...salesMetrics} />

      <div className="hud-panel p-4">
        <PanelHeader icon={TrendingUp} title="Upsells ejecutados" />
        {upsells.length === 0 ? (
          <p className="text-xs text-muted">Ninguno este mes — el dashboard está lleno de oportunidades.</p>
        ) : (
          <ul className="space-y-2">
            {upsells.slice(0, 6).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate">
                  <span className="text-foreground">{u.customerName}</span>{" "}
                  <span className="text-muted">→ {u.toPlanName}</span>
                </span>
                <span
                  className={`font-data shrink-0 ${u.savings > 0 ? "text-success" : "text-muted"}`}
                >
                  {u.savings > 0 ? `-${formatMoney(u.savings)}` : "$0.00"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hud-panel p-4">
        <PanelHeader icon={Activity} title="Sistema" />
        <div className="space-y-3">
          <HudStatBar label="Con upsell disponible" value={stats.withUpsell} total={stats.total} />
          <HudStatBar label="Optimizados" value={stats.optimized} total={stats.total} />
          <HudStatBar label="Con TV" value={stats.withTv} total={stats.total} />
        </div>
      </div>
    </div>
  );
}
