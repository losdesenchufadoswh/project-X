import { MONTHLY_TOTAL_GOAL } from "@/lib/sales-goals";

export interface WeeklyGoalWeek {
  weekNumber: number;
  target: number;
  actual: number;
  isCurrent: boolean;
  met: boolean;
}

function mondayKeyOf(date: Date): string {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

/**
 * Divide la meta mensual en 4 semanas (lunes a domingo). Si una semana no llega a
 * su objetivo, la diferencia se suma a la meta de la semana siguiente; si hay
 * excedente, se resta (nunca baja de 0). La deuda/excedente vive solo dentro del
 * mes — cada mes nuevo arranca limpio en la meta base, sin importar cómo cerró el anterior.
 */
export function computeWeeklyGoal(
  saleUnitDatesThisMonth: string[],
  today: Date,
  monthlyGoal: number = MONTHLY_TOTAL_GOAL
): WeeklyGoalWeek[] {
  const weeklyBase = Math.ceil(monthlyGoal / 4);

  const actualByWeek = new Map<string, number>();
  for (const iso of saleUnitDatesThisMonth) {
    const key = mondayKeyOf(new Date(iso));
    actualByWeek.set(key, (actualByWeek.get(key) ?? 0) + 1);
  }

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const todayKey = mondayKeyOf(today);

  const weekKeys: string[] = [];
  const seen = new Set<string>();
  const cursor = new Date(monthStart);
  while (cursor <= today) {
    const key = mondayKeyOf(cursor);
    if (!seen.has(key)) {
      seen.add(key);
      weekKeys.push(key);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  let carry = 0;
  return weekKeys.map((key, idx) => {
    const isCurrent = key === todayKey;
    const target = Math.max(weeklyBase + carry, 0);
    const actual = actualByWeek.get(key) ?? 0;
    if (!isCurrent) carry = target - actual;
    return { weekNumber: idx + 1, target, actual, isCurrent, met: actual >= target };
  });
}
