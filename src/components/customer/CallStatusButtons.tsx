"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall, PhoneMissed, PhoneOff } from "lucide-react";
import { setCallStatusAction } from "@/lib/actions/customers";
import type { CallStatus, LastCall } from "@/types/customer";

const options: Array<{
  status: CallStatus;
  label: string;
  icon: typeof PhoneCall;
  activeClass: string;
  idleClass: string;
}> = [
  {
    status: "answered",
    label: "Contestó",
    icon: PhoneCall,
    activeClass: "border-success bg-success/20 text-success shadow-[0_0_10px_rgba(47,230,183,0.5)]",
    idleClass: "border-success/40 text-success/60 hover:border-success hover:text-success",
  },
  {
    status: "no_answer",
    label: "No contestó",
    icon: PhoneMissed,
    activeClass: "border-warning bg-warning/20 text-warning shadow-[0_0_10px_rgba(255,176,46,0.5)]",
    idleClass: "border-warning/40 text-warning/60 hover:border-warning hover:text-warning",
  },
  {
    status: "disconnected",
    label: "Desconectado",
    icon: PhoneOff,
    activeClass: "border-danger bg-danger/20 text-danger shadow-[0_0_10px_rgba(255,84,104,0.5)]",
    idleClass: "border-danger/40 text-danger/60 hover:border-danger hover:text-danger",
  },
];

const statusLabels: Record<CallStatus, string> = {
  answered: "Contestó",
  no_answer: "No contestó",
  disconnected: "Desconectado",
};

function isToday(iso: string): boolean {
  return iso.slice(0, 10) === new Date().toISOString().slice(0, 10);
}

interface CallStatusButtonsProps {
  customerId: string;
  lastCall: LastCall | null;
  size?: "sm" | "md";
}

/** Marca el resultado de la llamada de hoy: verde contestó / amarillo no contestó / rojo desconectado */
export function CallStatusButtons({ customerId, lastCall, size = "sm" }: CallStatusButtonsProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const circle = size === "md" ? "h-9 w-9" : "h-7 w-7";
  const iconSize = size === "md" ? 15 : 12;

  function handleClick(status: CallStatus) {
    startTransition(async () => {
      const result = await setCallStatusAction(customerId, status);
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        {options.map(({ status, label, icon: Icon, activeClass, idleClass }) => {
          const active = lastCall?.status === status && isToday(lastCall.date);
          return (
            <button
              key={status}
              type="button"
              disabled={pending}
              onClick={() => handleClick(status)}
              title={`${label} (hoy)`}
              className={`flex ${circle} cursor-pointer items-center justify-center rounded-full border bg-surface/60 transition disabled:opacity-50 ${
                active ? activeClass : idleClass
              }`}
            >
              <Icon size={iconSize} />
            </button>
          );
        })}
      </div>
      {lastCall && (
        <p className="text-[10px] leading-tight text-muted">
          Últ:{" "}
          <span className="font-data">
            {new Date(lastCall.date).toLocaleDateString("es-PR", {
              day: "2-digit",
              month: "short",
            })}
          </span>{" "}
          · {statusLabels[lastCall.status]}
        </p>
      )}
    </div>
  );
}
