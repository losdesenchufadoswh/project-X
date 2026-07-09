"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, ListChecks, LogOut, Smartphone } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";

const items = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, soon: false },
  { href: "/admin/history", label: "Historial", icon: History, soon: false },
  { href: "/admin/plans", label: "Planes", icon: ListChecks, soon: false },
  { href: "/admin/mobile", label: "Celular", icon: Smartphone, soon: true },
];

const circleBase =
  "relative flex h-12 w-12 items-center justify-center rounded-full border transition md:h-14 md:w-14";

/** Dock inferior de botones circulares, como la barra del HUD de la imagen */
export function HudDock() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-3 pt-8"
      style={{ background: "linear-gradient(to top, rgba(2, 8, 20, 0.95) 55%, transparent)" }}
    >
      <div className="pointer-events-auto flex items-start gap-3 md:gap-6">
        {items.map(({ href, label, icon: Icon, soon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="group flex flex-col items-center gap-1.5">
              <span
                className={`${circleBase} ${
                  active
                    ? "border-primary bg-primary/15 text-primary shadow-[0_0_18px_rgba(47,157,255,0.5)]"
                    : "border-primary/40 bg-surface/80 text-muted group-hover:border-primary group-hover:text-primary"
                }`}
              >
                {active && (
                  <span className="hud-spin-slow absolute -inset-1.5 rounded-full border border-dashed border-primary/60" />
                )}
                <Icon size={20} />
                {soon && (
                  <span className="absolute -right-2 -top-1 rounded-full bg-warning px-1.5 py-0.5 text-[7px] font-bold leading-none text-background">
                    PRONTO
                  </span>
                )}
              </span>
              <span
                className={`font-data text-[9px] uppercase tracking-widest ${
                  active ? "text-primary" : "text-muted group-hover:text-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}

        <form action={logoutAction} className="group flex flex-col items-center gap-1.5">
          <button
            type="submit"
            className={`${circleBase} cursor-pointer border-danger/40 bg-surface/80 text-muted group-hover:border-danger group-hover:text-danger group-hover:shadow-[0_0_18px_rgba(255,84,104,0.4)]`}
          >
            <LogOut size={20} />
          </button>
          <span className="font-data text-[9px] uppercase tracking-widest text-muted group-hover:text-danger">
            Salir
          </span>
        </form>
      </div>
    </nav>
  );
}
