import { adminDb } from "@/lib/firebase/server";
import { emptyTelcoState, type TelcoState } from "@/types/telco";

// Un solo documento compartido guarda todo el estado del visor telco.
const COLLECTION = "telco_state";
const DOC_ID = "shared";

function docRef() {
  return adminDb().collection(COLLECTION).doc(DOC_ID);
}

export async function getTelcoState(): Promise<TelcoState> {
  try {
    const doc = await docRef().get();
    if (!doc.exists) return emptyTelcoState;
    const d = (doc.data() ?? {}) as Partial<TelcoState>;
    return {
      starred: d.starred ?? [],
      sold: d.sold ?? [],
      discarded: d.discarded ?? [],
      deleted: d.deleted ?? [],
      addTags: d.addTags ?? {},
      data: d.data ?? {},
    };
  } catch {
    // Si Firestore falla, no rompemos la página: cargamos vacío (se muestra la lista completa).
    return emptyTelcoState;
  }
}

export async function saveTelcoState(state: TelcoState): Promise<void> {
  await docRef().set(state);
}
