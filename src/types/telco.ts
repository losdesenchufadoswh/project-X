// Estado del visor de Servicios Telefónicos, persistido en Firestore (doc único
// compartido) para que no se pierda y se vea igual en todos los dispositivos.

export interface TelcoCall {
  fecha: string;
  hora: string;
  estado: "answered" | "missed";
}

export interface TelcoNote {
  texto: string;
  fecha: string;
}

export interface TelcoRecordData {
  llamadas: TelcoCall[];
  notas: TelcoNote[];
}

export interface TelcoAddTags {
  telefono: boolean;
  internet: boolean;
  voice: boolean;
}

export interface TelcoState {
  /** IDs marcados con estrella (candidatos a upgrade) */
  starred: string[];
  /** IDs ya convertidos en venta */
  sold: string[];
  /** IDs descartados (recuperables) */
  discarded: string[];
  /** IDs borrados permanentemente */
  deleted: string[];
  /** Qué producto pienso añadirle a cada registro */
  addTags: Record<string, TelcoAddTags>;
  /** Llamadas y notas por registro */
  data: Record<string, TelcoRecordData>;
}

export const emptyTelcoState: TelcoState = {
  starred: [],
  sold: [],
  discarded: [],
  deleted: [],
  addTags: {},
  data: {},
};
