export type CustomerType = "B2B" | "B2C";

export type CallStatus = "answered" | "no_answer" | "disconnected";

export interface CustomerNote {
  text: string;
  /** ISO 8601 — cuándo se escribió la nota */
  created_at: string;
}

export interface LastCall {
  status: CallStatus;
  /** ISO 8601 — cuándo fue la llamada */
  date: string;
}

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
  /** Pueblo / municipio (ej. "Bayamón") */
  town: string;
  /** Código de crédito por letras — el admin sabe qué representa cada letra */
  credit_code: string;
  /** Fecha de instalación (YYYY-MM-DD) — null si aún no se agenda */
  install_date: string | null;
  /** Legacy: nota única sin fecha (clientes viejos) — las nuevas van a notes_log */
  notes: string;
  /** Bitácora de notas con fecha */
  notes_log?: CustomerNote[];
  /** Resultado de la última llamada al cliente */
  last_call?: LastCall | null;
  created_at: string;
  updated_at: string;
}
