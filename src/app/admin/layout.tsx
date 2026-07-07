import Link from "next/link";
import { History, LayoutDashboard, ListChecks, LogOut, Zap } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/history", label: "Historial", icon: History },
  { href: "/admin/plans", label: "Planes", icon: ListChecks },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Verificación real de sesión + rol admin (el middleware solo chequea que exista cookie)
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-muted/20 bg-surface md:min-h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center gap-2 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15">
            <Zap size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-heading text-sm font-bold leading-tight">Project X</p>
            <p className="text-xs text-muted">Pricing Engine</p>
          </div>
        </div>

        <nav className="flex gap-1 px-3 pb-3 md:flex-1 md:flex-col md:pb-0">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden border-t border-muted/20 p-3 md:block">
          <p className="mb-2 truncate px-2 text-xs text-muted" title={user.email}>
            {user.email}
          </p>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-danger/10 hover:text-danger cursor-pointer"
            >
              <LogOut size={16} />
              Salir
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
