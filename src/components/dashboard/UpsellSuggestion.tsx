import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/utils";

interface UpsellSuggestionProps {
  fromName: string;
  fromPrice: number;
  toName: string;
  toPrice: number;
  savings: number;
  valueAdd: string;
}

export function UpsellSuggestion({
  fromName,
  fromPrice,
  toName,
  toPrice,
  savings,
  valueAdd,
}: UpsellSuggestionProps) {
  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex items-center gap-2 text-sm">
        <div className="text-muted">
          <span>{fromName}</span>{" "}
          <span className="font-data">{formatMoney(fromPrice)}</span>
        </div>
        <ArrowRight size={14} className="shrink-0 text-primary" />
        <div className="font-semibold text-foreground">
          <span>{toName}</span>{" "}
          <span className="font-data text-primary">{formatMoney(toPrice)}</span>
        </div>
        {savings > 0 && <Badge variant="success">¡Ahorra {formatMoney(savings)}!</Badge>}
        {savings === 0 && <Badge variant="primary">Mismo precio</Badge>}
      </div>
      <p className="mt-1 text-xs text-muted">Incluye: {valueAdd}</p>
    </div>
  );
}
