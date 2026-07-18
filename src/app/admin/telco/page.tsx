"use client";

import { useEffect, useState } from "react";
import { Copy, Trash2, Phone, MessageSquare } from "lucide-react";

const registros = [
  ["BO BARRANCAS HATO ABAJO, CARR 653 KM 2.0, ARECIBO", "00612000203861", "AR003", "COAX", "ACTIVE", "ACTIVE", "ACTIVE"],
  ["BO HATO ABAJO, 1 ALTURAS DE ATLANTICO, ARECIBO", "00612000449266", "AR21AR01", "FIBER", "NEVER", "NEVER", "NEVER"],
  ["BO HATO ABAJO, 1 CALLE ARISTO, ARECIBO", "00612000448474", "AR21AR01", "FIBER", "ACTIVE", "ACTIVE", "ACTIVE"],
  ["BO HATO ABAJO, 1 CALLE SAN DANIEL, ARECIBO", "00612000476699", "AR15AR01", "FIBER", "NEVER", "NEVER", "NEVER"],
  ["BO HATO ABAJO, 1 CARR 492 KM 5.1, ARECIBO", "00612000396566", "AR004A", "COAX", "NEVER", "DISCO", "DISCO"],
  ["BO HATO ABAJO, 1 CALLE SAN DANIEL, ARECIBO", "00612000448193", "AR21AR01", "FIBER", "NEVER", "NEVER", "NEVER"],
  ["BO HATO ABAJO, 1 PASEO LOS HUCARES, ARECIBO", "00612000448268", "AR21AR01", "FIBER", "ACTIVE", "ACTIVE", "ACTIVE"],
  ["BO HATO ABAJO, 10 ALTURAS DE ATLANTICO, ARECIBO", "00612000449324", "AR21AR01", "FIBER", "NEVER", "NEVER", "NEVER"],
  ["BO HATO ABAJO, 10 CALLE FLAMINGO, ARECIBO", "00612000366601", "AR004A", "COAX", "DISCO", "DISCO", "DISCO"],
  ["BO HATO ABAJO, 10 CARR 653 KM 3.3 INT, ARECIBO", "00612000450157", "AR21AR01", "FIBER", "NEVER", "NEVER", "NEVER"],
];

type CallRecord = { fecha: string; hora: string; estado: "answered" | "missed" };
type NoteRecord = { texto: string; fecha: string };
type RegistroData = { llamadas: CallRecord[]; notas: NoteRecord[] };

const countActive = (video: string, internet: string, voice: string): number => {
  return (video === "ACTIVE" ? 1 : 0) + (internet === "ACTIVE" ? 1 : 0) + (voice === "ACTIVE" ? 1 : 0);
};

export default function TelcoPage() {
  const [data, setData] = useState<Record<string, RegistroData>>({});
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("todos");
  const [page, setPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"parciales" | "completos" | "inactivos" | "descartados">("parciales");
  const [modalOpen, setModalOpen] = useState<{ type: "call" | "note"; id: string } | null>(null);
  const [callInput, setCallInput] = useState({ fecha: "", hora: "", estado: "answered" as "answered" | "missed" });
  const [noteInput, setNoteInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("telco-data");
    const storedDiscarded = localStorage.getItem("telco-discarded");
    if (stored) setData(JSON.parse(stored));
    if (storedDiscarded) setDiscarded(new Set(JSON.parse(storedDiscarded)));
  }, []);

  useEffect(() => {
    localStorage.setItem("telco-data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem("telco-discarded", JSON.stringify([...discarded]));
  }, [discarded]);

  const getRegistrosByTab = () => {
    const active: string[] = [];
    const parcial: string[] = [];
    const inactivo: string[] = [];

    registros.forEach((r, i) => {
      const id = r[1];
      if (discarded.has(id)) return;
      const count = countActive(r[4], r[5], r[6]);
      if (count === 3) active.push(id);
      else if (count > 0) parcial.push(id);
      else inactivo.push(id);
    });

    if (selectedTab === "descartados") {
      return registros.filter((r) => discarded.has(r[1])).map((r) => r[1]);
    }
    if (selectedTab === "completos") return active;
    if (selectedTab === "inactivos") return inactivo;
    return parcial;
  };

  const filtered = getRegistrosByTab().filter((id) => {
    if (filter === "todos") return true;
    const r = registros.find((x) => x[1] === id)!;
    const count = countActive(r[4], r[5], r[6]);
    if (filter === "1") return count === 1;
    if (filter === "2") return count === 2;
    return false;
  });

  const paginated = filtered.slice(page * 10, (page + 1) * 10);
  const maxPages = Math.ceil(filtered.length / 10);

  const handleAddCall = (id: string) => {
    if (!callInput.fecha || !callInput.hora) return;
    setData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        llamadas: [...(prev[id]?.llamadas || []), { ...callInput }],
      },
    }));
    setCallInput({ fecha: "", hora: "", estado: "answered" });
    setModalOpen(null);
  };

  const handleAddNote = (id: string) => {
    if (!noteInput.trim()) return;
    const today = new Date().toISOString().split("T")[0];
    setData((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        notas: [...(prev[id]?.notas || []), { texto: noteInput, fecha: today }],
      },
    }));
    setNoteInput("");
    setModalOpen(null);
  };

  const copyToClipboard = async (id: string) => {
    await navigator.clipboard.writeText(id);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDiscard = (id: string) => {
    setDiscarded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const counts = {
    parciales: registros.filter((r) => !discarded.has(r[1]) && countActive(r[4], r[5], r[6]) === 1 || countActive(r[4], r[5], r[6]) === 2).length,
    completos: registros.filter((r) => !discarded.has(r[1]) && countActive(r[4], r[5], r[6]) === 3).length,
    inactivos: registros.filter((r) => !discarded.has(r[1]) && countActive(r[4], r[5], r[6]) === 0).length,
    descartados: discarded.size,
  };

  const renderStatus = (status: string) => {
    if (status === "ACTIVE") return <span className="text-success">●</span>;
    if (status === "DISCO") return <span className="text-warning">●</span>;
    return <span className="text-muted">●</span>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="hud-title font-heading text-2xl font-bold mb-1">Servicios Telefónicos</h1>
        <p className="text-sm text-muted mb-6">
          {counts.parciales} Parciales · {counts.completos} Completos · {counts.inactivos} Inactivos ·{" "}
          <span className="text-danger">{counts.descartados} Descartados</span>
        </p>

        <div className="flex gap-2 mb-6 border-b border-primary/20">
          {(["parciales", "completos", "inactivos", "descartados"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab);
                setPage(0);
              }}
              className={`pb-2 px-3 text-sm font-semibold transition ${
                selectedTab === tab
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab === "parciales" ? "⚠️ Parciales" : tab === "completos" ? "✅ Completos" : tab === "inactivos" ? "❌ Inactivos" : "🗑️ Descartados"}
            </button>
          ))}
        </div>

        {filter !== "todos" && selectedTab !== "descartados" && (
          <div className="mb-4">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(0);
              }}
              className="rounded-lg border border-muted/30 bg-surface px-3 py-2 text-sm text-foreground"
            >
              <option value="todos">Todos los estados</option>
              <option value="1">1 ACTIVE</option>
              <option value="2">2 ACTIVE</option>
            </select>
          </div>
        )}

        {selectedTab === "descartados" && (
          <div className="mb-4 text-xs text-muted">Aquí están los registros descartados. Haz clic para recuperar.</div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/15 text-xs font-semibold text-muted">
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Dirección</th>
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-center py-2 px-2">VIDEO</th>
                <th className="text-center py-2 px-2">INTERNET</th>
                <th className="text-center py-2 px-2">VOICE</th>
                <th className="text-center py-2 px-2">Llamadas</th>
                <th className="text-center py-2 px-2">Notas</th>
                <th className="text-center py-2 px-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((id, idx) => {
                const r = registros.find((x) => x[1] === id)!;
                const meta = data[id];
                const rowNum = page * 10 + idx + 1;
                return (
                  <tr key={id} className="border-b border-primary/10 hover:bg-primary/5 transition">
                    <td className="py-3 px-2 font-data text-muted">{rowNum}</td>
                    <td className="py-3 px-2 text-xs">{r[0]}</td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => copyToClipboard(id)}
                        className="font-data text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        {id}
                        <Copy size={12} />
                      </button>
                      {copied === id && <span className="ml-2 text-[10px] text-success">Copiado</span>}
                    </td>
                    <td className="py-3 px-2 text-center">{renderStatus(r[4])}</td>
                    <td className="py-3 px-2 text-center">{renderStatus(r[5])}</td>
                    <td className="py-3 px-2 text-center">{renderStatus(r[6])}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setModalOpen({ type: "call", id })}
                        className="inline-flex items-center gap-1 text-xs bg-primary/15 hover:bg-primary/25 px-2 py-1 rounded text-primary"
                      >
                        <Phone size={12} />
                        {meta?.llamadas?.length || 0}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => setModalOpen({ type: "note", id })}
                        className="inline-flex items-center gap-1 text-xs bg-primary/15 hover:bg-primary/25 px-2 py-1 rounded text-primary"
                      >
                        <MessageSquare size={12} />
                        {meta?.notas?.length || 0}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => handleDiscard(id)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                          discarded.has(id)
                            ? "bg-success/15 text-success hover:bg-success/25"
                            : "bg-danger/15 text-danger hover:bg-danger/25"
                        }`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-between items-center text-xs text-muted">
          <div>
            Mostrando {paginated.length > 0 ? page * 10 + 1 : 0} – {Math.min((page + 1) * 10, filtered.length)} de {filtered.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded border border-primary/30 hover:border-primary/60 disabled:opacity-50"
            >
              ← Ant.
            </button>
            {Array.from({ length: Math.min(maxPages, 5) }).map((_, i) => {
              const pageNum = i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-2 py-1 rounded text-xs ${
                    page === pageNum ? "bg-primary text-foreground" : "border border-primary/30 hover:border-primary/60"
                  }`}
                >
                  {pageNum + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(maxPages - 1, page + 1))}
              disabled={page >= maxPages - 1}
              className="px-3 py-1 rounded border border-primary/30 hover:border-primary/60 disabled:opacity-50"
            >
              Sig. →
            </button>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border border-primary/30 rounded-lg p-6 max-w-md w-full">
            {modalOpen.type === "call" ? (
              <>
                <h2 className="font-semibold mb-4 text-primary">Registrar Llamada</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-muted mb-1">Fecha</label>
                    <input
                      type="date"
                      value={callInput.fecha}
                      onChange={(e) => setCallInput({ ...callInput, fecha: e.target.value })}
                      className="w-full rounded border border-muted/30 bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Hora</label>
                    <input
                      type="time"
                      value={callInput.hora}
                      onChange={(e) => setCallInput({ ...callInput, hora: e.target.value })}
                      className="w-full rounded border border-muted/30 bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1">Estado</label>
                    <select
                      value={callInput.estado}
                      onChange={(e) =>
                        setCallInput({
                          ...callInput,
                          estado: e.target.value as "answered" | "missed",
                        })
                      }
                      className="w-full rounded border border-muted/30 bg-background px-2 py-1.5 text-sm"
                    >
                      <option value="answered">Verde (Contestó)</option>
                      <option value="missed">Amarillo (No contestó)</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setModalOpen(null)}
                      className="flex-1 px-3 py-1.5 rounded border border-muted/30 hover:border-primary/60 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddCall(modalOpen.id)}
                      className="flex-1 px-3 py-1.5 rounded bg-primary text-foreground hover:bg-primary/80 text-sm"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-semibold mb-4 text-primary">Agregar Nota</h2>
                <div className="space-y-3">
                  <textarea
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Escribe tu nota aquí..."
                    className="w-full rounded border border-muted/30 bg-background px-2 py-2 text-sm min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setModalOpen(null)}
                      className="flex-1 px-3 py-1.5 rounded border border-muted/30 hover:border-primary/60 text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleAddNote(modalOpen.id)}
                      className="flex-1 px-3 py-1.5 rounded bg-primary text-foreground hover:bg-primary/80 text-sm"
                    >
                      Guardar
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
