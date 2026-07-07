export type ServiceType = "internet" | "cable_tv" | "phone_lines";

export interface PlanService {
  type: ServiceType;
  /** Mbps — solo para internet */
  speed?: number;
  /** Canales — solo para cable_tv (null = paquete estándar) */
  channels?: number | null;
  /** Líneas — solo para phone_lines */
  count?: number;
  included: boolean;
}

export type BundleType = "internet_only" | "internet_cable" | "triple_play";

export interface Plan {
  id: string;
  name: string;
  description: string;
  services: PlanService[];
  /** Precio de lista (antes) */
  price_2025: number;
  /** Precio promocional vigente (lo que paga el cliente) */
  promo_price_2025: number;
  discount_code: string;
  bundle_code: string;
  is_bundle: boolean;
  bundle_type: BundleType;
  /** 1, 2, 3... para ordenar sugerencias (mayor tier = más valor) */
  tier: number;
  created_at: string;
}
