"use client";

import { useEffect, useState } from "react";
import { Copy, Trash2, Phone, MessageSquare, X, Star } from "lucide-react";
import { telcoRegistros, countActive } from "@/lib/telco-data";

const registros = telcoRegistros;

type CallRecord = { fecha: string; hora: string; estado: "answered" | "missed" };
type NoteRecord = { texto: string; fecha: string };
type RegistroData = { llamadas: CallRecord[]; notas: NoteRecord[] };

export default function TelcoPage() {
  const [data, setData] = useState<Record<string, RegistroData>>({});
  const [discarded, setDiscarded] = useState<Set<string>>(new Set());
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("todos");
  const [starOnly, setStarOnly] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"parciales" | "completos" | "inactivos" | "descartados">("parciales");
  const [modalOpen, setModalOpen] = useState<{ type: "call" | "note"; id: string } | null>(null);
  const [callInput, setCallInput] = useState({ fecha: "", hora: "", estado: "answered" as "answered" | "missed" });
  const [noteInput, setNoteInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("telco-data");
    const storedDiscarded = localStorage.getItem("telco-discarded");
    const storedDeleted = localStorage.getItem("telco-deleted");
    if (stored) setData(JSON.parse(stored));
    if (storedDiscarded) setDiscarded(new Set(JSON.parse(storedDiscarded)));
    if (storedDeleted) setDeleted(new Set(JSON.parse(storedDeleted)));
  }, []);

  useEffect(() => {
    localStorage.setItem("telco-data", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem("telco-discarded", JSON.stringify([...discarded]));
  }, [discarded]);

  useEffect(() => {
    localStorage.setItem("telco-deleted", JSON.stringify([...deleted]));
  }, [deleted]);

  const getRegistrosByTab = () => {
    const active: string[] = [];
    const parcial: string[] = [];
    const inactivo: string[] = [];

    registros.forEach((r, i) => {
      const id = r[1];
      if (deleted.has(id) || discarded.has(id)) return;
      const count = countActive(r[4], r[5], r[6]);
      if (count === 3) active.push(id);
      else if (count > 0) parcial.push(id);
      else inactivo.push(id);
    });

    if (selectedTab === "descartados") {
      return registros.filter((r) => discarded.has(r[1]) && !deleted.has(r[1])).map((r) => r[1]);
    }
    if (selectedTab === "completos") return active;
    if (selectedTab === "inactivos") return inactivo;
    return parcial;
  };

  // Candidato para añadir: no tiene los 3 servicios activos → hay algo que venderle
  const canAddMore = (r: (typeof registros)[number]) => countActive(r[4], r[5], r[6]) < 3;

  const filtered = getRegistrosByTab().filter((id) => {
    const r = registros.find((x) => x[1] === id)!;
    const count = countActive(r[4], r[5], r[6]);
    if (starOnly && !canAddMore(r)) return false;
    if (filter === "1" && count !== 1) return false;
    if (filter === "2" && count !== 2) return false;
    return true;
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

  const handleDelete = (id: string) => {
    if (!confirm("¿Borrar este registro permanentemente del app? No se puede recuperar.")) return;
    setDeleted((prev) => new Set(prev).add(id));
    setDiscarded((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteNote = (id: string, index: number) => {
    setData((prev) => ({
      ...prev,
      [id]: { ...prev[id], notas: (prev[id]?.notas || []).filter((_, i) => i !== index) },
    }));
  };

  const handleDeleteCall = (id: string, index: number) => {
    setData((prev) => ({
      ...prev,
      [id]: { ...prev[id], llamadas: (prev[id]?.llamadas || []).filter((_, i) => i !== index) },
    }));
  };

  const available = (r: (typeof registros)[number]) => !deleted.has(r[1]) && !discarded.has(r[1]);
  const counts = {
    parciales: registros.filter((r) => {
      const c = countActive(r[4], r[5], r[6]);
      return available(r) && (c === 1 || c === 2);
    }).length,
    completos: registros.filter((r) => available(r) && countActive(r[4], r[5], r[6]) === 3).length,
    inactivos: registros.filter((r) => available(r) && countActive(r[4], r[5], r[6]) === 0).length,
    descartados: [...discarded].filter((id) => !deleted.has(id)).length,
    candidatos: registros.filter((r) => available(r) && countActive(r[4], r[5], r[6]) > 0 && countActive(r[4], r[5], r[6]) < 3).length,
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
          <span className="text-danger">{counts.descartados} Descartados</span> ·{" "}
          <span className="text-warning">⭐ {counts.candidatos} con oportunidad</span>
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

        {selectedTab !== "descartados" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setStarOnly((v) => !v);
                setPage(0);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                starOnly
                  ? "border-warning bg-warning/15 text-warning"
                  : "border-muted/30 bg-surface text-muted hover:border-warning/60 hover:text-warning"
              }`}
            >
              <Star size={14} className={starOnly ? "fill-warning" : ""} />
              Solo con oportunidad
            </button>
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
                    <td className="py-3 px-2 text-xs">
                      <span className="flex items-center gap-1.5">
                        {canAddMore(r) && (
                          <Star
                            size={13}
                            className="fill-warning text-warning shrink-0"
                            aria-label="Se le puede añadir un servicio"
                          />
                        )}
                        {r[0]}
                      </span>
                    </td>
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
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleDiscard(id)}
                          title={discarded.has(id) ? "Recuperar" : "Descartar"}
                          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded transition ${
                            discarded.has(id)
                              ? "bg-success/15 text-success hover:bg-success/25"
                              : "bg-warning/15 text-warning hover:bg-warning/25"
                          }`}
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(id)}
                          title="Borrar permanentemente"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-danger/15 text-danger hover:bg-danger/30 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
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
                {(data[modalOpen.id]?.llamadas?.length ?? 0) > 0 && (
                  <div className="mb-4 max-h-40 overflow-y-auto space-y-1.5 border-b border-primary/15 pb-3">
                    {data[modalOpen.id].llamadas.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 text-xs bg-background/50 rounded px-2 py-1.5"
                      >
                        <span className="flex items-center gap-2">
                          <span className={c.estado === "answered" ? "text-success" : "text-warning"}>●</span>
                          <span className="font-data">{c.fecha} {c.hora}</span>
                          <span className="text-muted">{c.estado === "answered" ? "Contestó" : "No contestó"}</span>
                        </span>
                        <button
                          onClick={() => handleDeleteCall(modalOpen.id, i)}
                          className="text-muted hover:text-danger"
                          title="Borrar llamada"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                <h2 className="font-semibold mb-4 text-primary">Notas</h2>
                {(data[modalOpen.id]?.notas?.length ?? 0) > 0 ? (
                  <div className="mb-4 max-h-48 overflow-y-auto space-y-2 border-b border-primary/15 pb-3">
                    {data[modalOpen.id].notas.map((n, i) => (
                      <div key={i} className="flex items-start justify-between gap-2 bg-background/50 rounded px-2 py-2">
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap break-words">{n.texto}</p>
                          <p className="mt-1 font-data text-[10px] text-muted">{n.fecha}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteNote(modalOpen.id, i)}
                          className="text-muted hover:text-danger shrink-0"
                          title="Borrar nota"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-4 text-xs text-muted">Aún no hay notas. Escribe la primera abajo.</p>
                )}
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
                      Cerrar
                    </button>
                    <button
                      onClick={() => handleAddNote(modalOpen.id)}
                      className="flex-1 px-3 py-1.5 rounded bg-primary text-foreground hover:bg-primary/80 text-sm"
                    >
                      Agregar
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
