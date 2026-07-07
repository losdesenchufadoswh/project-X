import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth, adminDb } from "@/lib/firebase/server";

export const SESSION_COOKIE = "session";
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5; // 5 días

export interface SessionUser {
  uid: string;
  email: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(session, true);
    return { uid: decoded.uid, email: decoded.email ?? "" };
  } catch {
    return null;
  }
}

export async function isAdmin(uid: string): Promise<boolean> {
  const doc = await adminDb().collection("admins").doc(uid).get();
  return doc.exists && doc.data()?.role === "admin";
}

/** Para layouts/páginas de /admin: redirige al login si no hay sesión admin válida */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/");
  if (!(await isAdmin(user.uid))) redirect("/");
  return user;
}
