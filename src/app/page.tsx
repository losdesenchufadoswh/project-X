import { Zap } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="hud-panel w-full max-w-sm bg-surface p-8">
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center">
            <span className="hud-spin-slow absolute inset-0 rounded-full border border-dashed border-primary/50" />
            <span className="hud-spin-rev-slow absolute inset-2 rounded-full border border-primary/30" />
            <Zap size={26} className="text-primary" />
          </div>
          <h1 className="hud-title font-heading text-2xl font-bold">Project X</h1>
          <p className="mt-1 text-sm text-muted">Pricing Engine — acceso solo para admins</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
