"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/firebase/server";
import { isAdmin, SESSION_COOKIE, SESSION_DURATION_MS } from "@/lib/auth/session";

interface AuthResult {
  success: boolean;
  error?: string;
}

/** El cliente hace login con Firebase Auth y nos manda el idToken para crear la cookie de sesión */
export async function createSessionAction(idToken: string): Promise<AuthResult> {
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    if (!(await isAdmin(decoded.uid))) {
      return { success: false, error: "Esta cuenta no tiene rol de admin." };
    }

    const sessionCookie = await adminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_DURATION_MS,
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });

    return { success: true };
  } catch {
    return { success: false, error: "No se pudo crear la sesión. Intenta de nuevo." };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}
