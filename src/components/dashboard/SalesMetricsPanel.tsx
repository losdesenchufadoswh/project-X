import { Gift, Target } from "lucide-react";
import { MONTHLY_INTERNET_GOAL, MONTHLY_TOTAL_GOAL } from "@/lib/sales-goals";
import type { WeeklyGoalWeek } from "@/lib/weekly-goal";

export interface SalesMetricsPanelProps {
  internetCount: number;
  videoCount: number;
  voiceCount: number;
  weeks: WeeklyGoalWeek[];
}

/** Desglose de ventas del mes por producto: Internet + Video cuentan para la meta (45,
 *  mín. 18 Internet); Voice es bono — se paga aparte pero no suma a la meta. */
export function SalesMetricsPanel({ internetCount, videoCount, voiceCount, weeks }: SalesMetricsPanelProps) {
  const total = internetCount + videoCount;
  const metGoal = total >= MONTHLY_TOTAL_GOAL;
  const metInternetGoal = internetCount >= MONTHLY_INTERNET_GOAL;
  const pastWeeks = weeks.slice(0, -1);

  return (
    <div className="hud-panel p-4">
      <p className="mb-3 flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.25em] text-primary">
        <Target size={12} />
        Desglose de ventas
      </p>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Internet</span>
            <span className={`font-data ${metInternetGoal ? "text-success" : "text-primary"}`}>
              {internetCount} / {MONTHLY_INTERNET_GOAL} mín.
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-primary/10">
            <div
              className={`h-full transition-all ${
                metInternetGoal
                  ? "bg-success shadow-[0_0_8px_rgba(47,230,183,0.7)]"
                  : "bg-primary shadow-[0_0_8px_rgba(47,157,255,0.7)]"
              }`}
              style={{ width: `${Math.min((internetCount / MONTHLY_INTERNET_GOAL) * 100, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Video</span>
          <span className="font-data text-primary">{videoCount}</span>
        </div>

        <div className="border-t border-primary/15 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted">Total (Internet + Video)</span>
            <span className={`font-data ${metGoal ? "text-success" : "text-primary"}`}>
              {total} / {MONTHLY_TOTAL_GOAL}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full bg-primary/10">
            <div
              className={`h-full transition-all ${
                metGoal
                  ? "bg-success shadow-[0_0_8px_rgba(47,230,183,0.7)]"
                  : "bg-primary shadow-[0_0_8px_rgba(47,157,255,0.7)]"
              }`}
              style={{ width: `${Math.min((total / MONTHLY_TOTAL_GOAL) * 100, 100)}%` }}
            />
          </div>
          {metGoal && (
            <p className="mt-1 text-[10px] text-success">✓ Meta cumplida este mes</p>
          )}
        </div>

        {pastWeeks.length > 0 && (
          <div className="border-t border-primary/15 pt-3">
            <p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted">Semanas anteriores</p>
            <div className="flex flex-wrap gap-1.5">
              {pastWeeks.map((w) => (
                <span
                  key={w.weekNumber}
                  className={`rounded px-1.5 py-0.5 font-data text-[10px] ${
                    w.met ? "bg-success/15 text-success" : "bg-danger/15 text-danger"
                  }`}
                >
                  S{w.weekNumber}: {w.actual}/{w.target}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          className={`mt-2 flex items-center justify-between rounded-lg border px-3 py-2 ${
            metGoal
              ? "border-warning/50 bg-warning/10 shadow-[0_0_10px_rgba(255,176,46,0.25)]"
              : "border-muted/20 bg-background/30"
          }`}
        >
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <Gift size={13} className={metGoal ? "text-warning" : "text-muted"} />
            Voice (bono)
          </span>
          <span className={`font-data ${metGoal ? "text-warning" : "text-muted"}`}>
            {voiceCount}
          </span>
        </div>
        <p className="text-[10px] text-muted">
          Voice no cuenta para la meta, pero se paga siempre que se cierre.
        </p>
      </div>
    </div>
  );
}
