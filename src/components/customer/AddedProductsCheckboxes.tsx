"use client";

import { Phone, Tv, Wifi } from "lucide-react";

export interface AddedProducts {
  internet: boolean;
  video: boolean;
  voice: boolean;
}

const items: Array<{ key: keyof AddedProducts; label: string; icon: typeof Wifi; hint: string }> = [
  { key: "internet", label: "Internet", icon: Wifi, hint: "cuenta para la meta (mín. 18)" },
  { key: "video", label: "Video (TV)", icon: Tv, hint: "cuenta para la meta" },
  { key: "voice", label: "Voice (tel. de casa)", icon: Phone, hint: "bono — no cuenta para la meta" },
];

interface AddedProductsCheckboxesProps {
  value: AddedProducts;
  onChange: (value: AddedProducts) => void;
}

/** Checkboxes de "qué se agregó en esta venta" — alimenta la métrica mensual de Internet/Video/Voice */
export function AddedProductsCheckboxes({ value, onChange }: AddedProductsCheckboxesProps) {
  return (
    <div className="rounded-lg border border-muted/20 bg-background/40 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
        ¿Qué agregó en esta venta?
      </p>
      <div className="space-y-2">
        {items.map(({ key, label, icon: Icon, hint }) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-primary/5"
          >
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            <Icon size={14} className="text-primary" />
            <span className="text-sm text-foreground">{label}</span>
            <span className="ml-auto text-[10px] text-muted">{hint}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
