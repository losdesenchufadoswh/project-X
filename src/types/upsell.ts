import type { Plan } from "./plan";

export interface UpsellLog {
  id: string;
  customer_id: string;
  /** Desnormalizado para que el log sea legible sin joins */
  customer_name: string;

  from_plan_id: string;
  from_plan_name: string;
  from_price: number;

  to_plan_id: string;
  to_plan_name: string;
  to_price: number;

  /** Positivo = el cliente paga menos ("más por menos") */
  savings: number;
  /** "Cable TV incluido", "200M extra + Cable TV", etc. */
  value_add: string;

  /** Email del admin que ejecutó el cambio */
  executed_by: string;
  executed_at: string;

  created_at: string;
}

export type UpsellLogInput = Omit<UpsellLog, "id" | "created_at">;

export interface UpsellSuggestion {
  from_plan: Plan;
  to_plan: Plan;
  /** Positivo = ahorra dinero */
  savings: number;
  value_add: string;
}
