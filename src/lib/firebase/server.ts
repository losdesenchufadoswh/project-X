import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

// Regla no negociable: FIREBASE_ADMIN_SDK_KEY solo vive en el server.
// Este módulo nunca debe importarse desde un componente de cliente.

function getAdminApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const key = process.env.FIREBASE_ADMIN_SDK_KEY;
  if (!key) {
    throw new Error(
      "FIREBASE_ADMIN_SDK_KEY no está configurada. Copia .env.example a .env.local y pega el JSON del service account."
    );
  }

  return initializeApp({ credential: cert(JSON.parse(key)) });
}

export function adminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function adminAuth(): Auth {
  return getAuth(getAdminApp());
}
