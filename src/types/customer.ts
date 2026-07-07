export type CustomerType = "B2B" | "B2C";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: CustomerType;
  /** FK → plans.id (ej. "PLAN_300M_ONLY") */
  current_plan_id: string;
  /** Lo que el cliente paga hoy, ej. 69.99 */
  price_paying_now: number;
  /** ISO 8601 */
  signup_date: string;
  /** ISO 8601 — null si nunca ha cambiado de plan */
  last_plan_change: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}
