import { Zap } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-muted/20 bg-surface p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
            <Zap size={28} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Project X</h1>
          <p className="mt-1 text-sm text-muted">Pricing Engine — acceso solo para admins</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
