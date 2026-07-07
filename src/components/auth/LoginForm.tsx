"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { LogIn } from "lucide-react";
import { getClientAuth } from "@/lib/firebase/client";
import { createSessionAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const auth = getClientAuth();
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credential.user.getIdToken();

      const result = await createSessionAction(idToken);
      if (!result.success) {
        await signOut(auth);
        setError(result.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch (err) {
      // TODO: revertir a mensaje genérico una vez diagnosticado el login en producción
      const code = err instanceof Error ? err.message : String(err);
      setError(`Error de login: ${code}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-muted">
          Email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@tuempresa.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-muted">
          Contraseña
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        <LogIn size={16} />
        {loading ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
