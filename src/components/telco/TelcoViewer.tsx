"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2, Phone, MessageSquare, X, Star, DollarSign, Search } from "lucide-react";
import { telcoRegistros, countActive } from "@/lib/telco-data";
import { createCustomerAction, type NewCustomerInput } from "@/lib/actions/customers";
import { saveTelcoStateAction } from "@/lib/actions/telco";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { TelcoState, TelcoRecordData, TelcoAddTags } from "@/types/telco";

const registros = telcoRegistros;
// Índice id → registro. Con ~1,800 registros, buscar con .find() en cada fila y en
// cada render pone el app lento; el Map hace la búsqueda instantánea (O(1)).
const byId = new Map(registros.map((r) => [r[1], r]));
// Conteo de activos por id, precalculado una sola vez (no en cada render).
const activeById = new Map(registros.map((r) => [r[1], countActive(r[4], r[5], r[6])]));

type RegistroData = TelcoRecordData;
type AddTags = TelcoAddTags;
const ADD_PRODUCTS: { key: keyof AddTags; label: string }[] = [
  { key: "telefono", label: "Tel" },
  { key: "internet", label: "Int" },
  { key: "voice", label: "Voz" },
];

/** "URB BAIROA, A2 CALLE G, CAGUAS" → "Caguas" (el pueblo es siempre el último segmento) */
function townFromAddress(address: string): string {
  const last = address.split(",").pop()?.trim() ?? "";
  return last ? last.charAt(0).toUpperCase() + last.slice(1).toLowerCase() : "";
}

const emptySale: NewCustomerInput = {
  name: "",
  email: "",
  phone: "",
  type: "B2C",
  town: "",
  creditCode: "",
  hasInternetToday: true,
  competitorSpeedMbps: 100,
  competitorPrice: 0,
  assignedPlanId: "",
  addedInternet: false,
  addedVideo: false,
  addedVoice: false,
  notes: "",
};

export function TelcoViewer({ initialState }: { initialState: TelcoState }) {
  const router = useRouter();
  // Estado inicial desde Firestore (server). La verdad vive en Firebase, no en el navegador.
  const [data, setData] = useState<Record<string, RegistroData>>(initialState.data);
  const [discarded, setDiscarded] = useState<Set<string>>(new Set(initialState.discarded));
  const [deleted, setDeleted] = useState<Set<string>>(new Set(initialState.deleted));
  const [starred, setStarred] = useState<Set<string>>(new Set(initialState.starred));
  const [sold, setSold] = useState<Set<string>>(new Set(initialState.sold));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addTags, setAddTags] = useState<Record<string, AddTags>>(initialState.addTags);
  const [filter, setFilter] = useState("todos");
  // Si ya tienes marcados, el app abre mostrando SOLO esos (tu lista de prospectos).
  // Si no hay ninguno, abre la lista completa para que puedas empezar a marcar.
  const [starOnly, setStarOnly] = useState(initialState.starred.length > 0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"parciales" | "completos" | "inactivos" | "vendidos" | "descartados">("parciales");
  const [modalOpen, setModalOpen] = useState<{ type: "call" | "note"; id: string } | null>(null);
  const [callInput, setCallInput] = useState({ fecha: "", hora: "", estado: "answered" as "answered" | "missed" });
  const [noteInput, setNoteInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [saleFor, setSaleFor] = useState<string | null>(null);
  const [saleForm, setSaleForm] = useState<NewCustomerInput>(emptySale);
  const [saleError, setSaleError] = useState<string | null>(null);
  const [savingSale, startSale] = useTransition();
  const [saveError, setSaveError] = useState(false);

  // Guarda TODO el estado en Firestore (debounced). No guardamos en el primer
  // render (sería re-guardar lo que acabamos de cargar). La verdad vive en
  // Firebase → no se pierde por bug, ni al limpiar el navegador, ni por dispositivo.
  const firstRun = useRef(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTelcoStateAction({
        starred: [...starred],
        sold: [...sold],
        discarded: [...discarded],
        deleted: [...deleted],
        addTags,
        data,
      })
        .then((r) => setSaveError(!r.success))
        .catch(() => setSaveError(true));
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [starred, sold, discarded, deleted, addTags, data]);

  // Búsqueda: cuando hay texto, busca en TODOS los registros (por dirección o ID),
  // sin importar la pestaña — así siempre encuentras la urb que buscas.
  const searchTerm = search.trim().toLowerCase();

  // La lista visible se recalcula solo cuando cambia algo que la afecta (no en cada
  // render), lo que mantiene el app ágil aún con ~1,800 registros.
  const filtered = useMemo(() => {
    if (searchTerm) {
      return registros
        .filter(
          (r) =>
            !deleted.has(r[1]) &&
            (r[0].toLowerCase().includes(searchTerm) || r[1].includes(searchTerm))
        )
        .map((r) => r[1]);
    }
    if (starOnly) {
      // Solo marcados: muestra TODOS los marcados, sin importar la pestaña
      return registros.filter((r) => !deleted.has(r[1]) && starred.has(r[1])).map((r) => r[1]);
    }
    if (selectedTab === "vendidos") {
      return registros.filter((r) => sold.has(r[1]) && !deleted.has(r[1])).map((r) => r[1]);
    }
    if (selectedTab === "descartados") {
      return registros.filter((r) => discarded.has(r[1]) && !deleted.has(r[1])).map((r) => r[1]);
    }
    return registros
      .filter((r) => {
        const id = r[1];
        if (deleted.has(id) || discarded.has(id) || sold.has(id)) return false;
        const count = activeById.get(id) ?? 0;
        if (selectedTab === "completos") return count === 3;
        if (selectedTab === "inactivos") return count === 0;
        // parciales
        if (count !== 1 && count !== 2) return false;
        if (filter === "1" && count !== 1) return false;
        if (filter === "2" && count !== 2) return false;
        return true;
      })
      .map((r) => r[1]);
  }, [searchTerm, starOnly, selectedTab, filter, deleted, discarded, sold, starred]);

  const maxPages = Math.max(1, Math.ceil(filtered.length / 10));
  // Si la lista se encoge (al borrar/descartar/buscar) y quedaste en una página que
  // ya no existe, regresa a una válida — evita ver la tabla "vacía" por error.
  useEffect(() => {
    if (page > 0 && page >= maxPages) setPage(maxPages - 1);
  }, [page, maxPages]);
  const paginated = filtered.slice(page * 10, (page + 1) * 10);

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

  /** Abre el formulario de venta con lo que ya sabemos del registro telco */
  const openSale = (id: string) => {
    const r = byId.get(id)!;
    setSaleForm({
      ...emptySale,
      town: townFromAddress(r[0]),
      // La dirección y el ID del registro quedan en la bitácora del cliente para trazabilidad
      notes: `Venta desde Servicios Telefónicos — ${r[0]} (ID ${id})`,
    });
    setSaleError(null);
    setSaleFor(id);
  };

  const submitSale = (e: FormEvent) => {
    e.preventDefault();
    if (!saleFor) return;
    setSaleError(null);
    const id = saleFor;
    startSale(async () => {
      const result = await createCustomerAction(saleForm);
      if (!result.success) {
        setSaleError(result.error ?? "Error desconocido");
        return;
      }
      // Solo lo movemos a "Vendido" si el cliente se creó de verdad en Firebase
      setSold((prev) => new Set(prev).add(id));
      setSaleFor(null);
      router.refresh();
    });
  };

  const handleStar = (id: string) => {
    setStarred((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Selecciona/deselecciona todos los registros visibles en la página actual
  const allPageSelected = paginated.length > 0 && paginated.every((id) => selected.has(id));
  const toggleSelectPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) paginated.forEach((id) => next.delete(id));
      else paginated.forEach((id) => next.add(id));
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (selected.size === 0) return;
    if (!confirm(`¿Borrar permanentemente ${selected.size} registro(s)? No se puede recuperar.`)) return;
    setDeleted((prev) => new Set([...prev, ...selected]));
    setDiscarded((prev) => {
      const next = new Set(prev);
      selected.forEach((id) => next.delete(id));
      return next;
    });
    setSelected(new Set());
  };

  // Borra todos los registros que NO marcaste (deja marcados + vendidos). Reversible.
  const unmarkedCount = useMemo(
    () =>
      registros.filter((r) => !deleted.has(r[1]) && !starred.has(r[1]) && !sold.has(r[1])).length,
    [deleted, starred, sold]
  );
  const handleDeleteUnmarked = () => {
    if (unmarkedCount === 0) return;
    if (
      !confirm(
        `¿Borrar los ${unmarkedCount} registros que NO marcaste? Tus ⭐ marcados y 💵 vendidos se quedan. Es reversible con "Recuperar borrados".`
      )
    )
      return;
    setDeleted((prev) => {
      const next = new Set(prev);
      registros.forEach((r) => {
        if (!starred.has(r[1]) && !sold.has(r[1])) next.add(r[1]);
      });
      return next;
    });
    setSelected(new Set());
  };

  const handleRestoreDeleted = () => {
    if (deleted.size === 0) return;
    if (!confirm(`¿Recuperar los ${deleted.size} registros borrados?`)) return;
    setDeleted(new Set());
  };

  const toggleAddTag = (id: string, key: keyof AddTags) => {
    setAddTags((prev) => {
      const current = prev[id] ?? { telefono: false, internet: false, voice: false };
      return { ...prev, [id]: { ...current, [key]: !current[key] } };
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

  const counts = useMemo(() => {
    const available = (id: string) => !deleted.has(id) && !discarded.has(id) && !sold.has(id);
    let parciales = 0,
      completos = 0,
      inactivos = 0;
    for (const r of registros) {
      const id = r[1];
      if (!available(id)) continue;
      const c = activeById.get(id) ?? 0;
      if (c === 1 || c === 2) parciales++;
      else if (c === 3) completos++;
      else inactivos++;
    }
    return {
      parciales,
      completos,
      inactivos,
      descartados: [...discarded].filter((id) => !deleted.has(id)).length,
      marcados: [...starred].filter((id) => !deleted.has(id)).length,
      vendidos: [...sold].filter((id) => !deleted.has(id)).length,
    };
  }, [deleted, discarded, sold, starred]);

  const renderStatus = (status: string) => {
    if (status === "ACTIVE") return <span className="text-success">●</span>;
    if (status === "DISCO") return <span className="text-warning">●</span>;
    return <span className="text-muted">●</span>;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="hud-title font-heading text-2xl font-bold mb-1">Servicios Telefónicos</h1>

        {saveError && (
          <div className="mb-3 rounded-lg border border-danger/50 bg-danger/10 px-3 py-2 text-sm text-danger">
            ⚠️ No se pudo guardar el último cambio en la nube. Revisa tu conexión — no cierres
            la página hasta que desaparezca este aviso.
          </div>
        )}

        <p className="text-sm text-muted mb-3">
          {counts.parciales} disponibles ·{" "}
          <span className="text-warning">⭐ {counts.marcados} marcados</span> ·{" "}
          <span className="text-success">💵 {counts.vendidos} vendidos</span> ·{" "}
          <span className="text-danger">{counts.descartados} descartados</span>
        </p>

        {/* Limpiar la lista: dejar solo lo marcado; reversible */}
        <div className="mb-4 flex flex-wrap gap-2">
          {unmarkedCount > 0 && (counts.marcados > 0 || counts.vendidos > 0) && (
            <button
              onClick={handleDeleteUnmarked}
              className="inline-flex items-center gap-1.5 rounded-lg border border-danger/40 bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition hover:bg-danger/20"
            >
              <Trash2 size={13} />
              Borrar los {unmarkedCount} no marcados
            </button>
          )}
          {deleted.size > 0 && (
            <button
              onClick={handleRestoreDeleted}
              className="inline-flex items-center gap-1.5 rounded-lg border border-muted/30 bg-surface px-3 py-1.5 text-xs text-muted transition hover:border-primary/60 hover:text-primary"
            >
              ♻️ Recuperar {deleted.size} borrados
            </button>
          )}
        </div>

        {/* Buscador global: por dirección/urbanización o ID, en todos los registros */}
        <div className="relative mb-4">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Buscar urbanización, dirección o ID…"
            className="h-11 w-full rounded-lg border border-primary/30 bg-surface pl-9 pr-9 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(0);
              }}
              title="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-foreground"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {searchTerm && (
          <p className="mb-4 text-xs text-muted">
            Buscando en <span className="text-primary">todos</span> los registros —{" "}
            <span className="font-data text-foreground">{filtered.length}</span> resultado(s) para “
            {search.trim()}”.
          </p>
        )}

        {!searchTerm && starOnly && (
          <p className="mb-4 text-xs text-muted">
            Mostrando tus <span className="text-warning">⭐ marcados</span> —{" "}
            <span className="font-data text-foreground">{filtered.length}</span> registro(s). Apaga
            el botón <span className="text-warning">“Solo marcados ⭐”</span> para ver la lista
            completa y marcar nuevos.
          </p>
        )}

        {!searchTerm && (
        <div className="flex flex-wrap gap-2 mb-6 border-b border-primary/20">
          {(["parciales", "completos", "inactivos", "vendidos", "descartados"] as const).map((tab) => (
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
              {tab === "parciales"
                ? "⚠️ Parciales"
                : tab === "completos"
                  ? "✅ Completos"
                  : tab === "inactivos"
                    ? "❌ Inactivos"
                    : tab === "vendidos"
                      ? "💵 Vendido"
                      : "🗑️ Descartados"}
            </button>
          ))}
        </div>
        )}

        {!searchTerm && selectedTab !== "descartados" && selectedTab !== "vendidos" && (
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
              Solo marcados ⭐
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

        {selected.size > 0 && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2">
            <span className="text-sm text-foreground">
              <span className="font-data text-danger">{selected.size}</span> seleccionado(s)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="rounded border border-muted/30 px-3 py-1.5 text-xs hover:border-primary/60"
              >
                Limpiar
              </button>
              <button
                onClick={handleBulkDelete}
                className="inline-flex items-center gap-1.5 rounded bg-danger px-3 py-1.5 text-xs font-semibold text-background transition hover:bg-danger/80"
              >
                <Trash2 size={13} />
                Borrar seleccionados
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary/15 text-xs font-semibold text-muted">
                <th className="py-2 px-2">
                  <input
                    type="checkbox"
                    checked={allPageSelected}
                    onChange={toggleSelectPage}
                    className="h-4 w-4 accent-primary"
                    title="Seleccionar todos en esta página"
                  />
                </th>
                <th className="text-left py-2 px-2">#</th>
                <th className="text-left py-2 px-2">Dirección</th>
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-center py-2 px-2">VIDEO</th>
                <th className="text-center py-2 px-2">INTERNET</th>
                <th className="text-center py-2 px-2">VOICE</th>
                <th className="text-center py-2 px-2">Añadir</th>
                <th className="text-center py-2 px-2">Llamadas</th>
                <th className="text-center py-2 px-2">Notas</th>
                <th className="text-center py-2 px-2">Acción</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((id, idx) => {
                const r = byId.get(id)!;
                const meta = data[id];
                const rowNum = page * 10 + idx + 1;
                return (
                  <tr
                    key={id}
                    className={`border-b border-primary/10 transition ${
                      selected.has(id) ? "bg-danger/5" : "hover:bg-primary/5"
                    }`}
                  >
                    <td className="py-3 px-2 text-center">
                      <input
                        type="checkbox"
                        checked={selected.has(id)}
                        onChange={() => toggleSelect(id)}
                        className="h-4 w-4 accent-primary"
                      />
                    </td>
                    <td className="py-3 px-2 font-data text-muted">{rowNum}</td>
                    <td className="py-3 px-2 text-xs">
                      <span className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleStar(id)}
                          title={starred.has(id) ? "Quitar marca de upgrade" : "Marcar como upgrade"}
                          className={`shrink-0 transition ${
                            starred.has(id)
                              ? "text-warning"
                              : "text-muted/40 hover:text-warning"
                          }`}
                        >
                          <Star size={14} className={starred.has(id) ? "fill-warning" : ""} />
                        </button>
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
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        {ADD_PRODUCTS.map(({ key, label }) => {
                          const on = addTags[id]?.[key] ?? false;
                          return (
                            <button
                              key={key}
                              onClick={() => toggleAddTag(id, key)}
                              title={`Marcar para añadir ${label}`}
                              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition ${
                                on
                                  ? "bg-primary text-background"
                                  : "bg-primary/10 text-muted hover:bg-primary/20 hover:text-primary"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </td>
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
                        {sold.has(id) ? (
                          <span
                            className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-1 text-xs text-success"
                            title="Ya se convirtió en cliente"
                          >
                            <DollarSign size={12} />
                            Vendido
                          </span>
                        ) : (
                          <button
                            onClick={() => openSale(id)}
                            title="Pasar a venta (crea el cliente)"
                            className="inline-flex items-center gap-1 rounded bg-success/15 px-2 py-1 text-xs text-success transition hover:bg-success/30"
                          >
                            <DollarSign size={12} />
                            Vender
                          </button>
                        )}
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

      {/* Pasar un registro a venta: crea el cliente real en Firebase y lo mueve a "Vendido" */}
      <Dialog open={saleFor !== null} onClose={() => setSaleFor(null)} title="Pasar a venta">
        <form onSubmit={submitSale} className="space-y-3">
          {saleFor && (
            <p className="rounded-lg border border-primary/25 bg-primary/5 px-3 py-2 text-xs text-muted">
              {byId.get(saleFor)?.[0]}
              <span className="ml-1 font-data text-primary">({saleFor})</span>
            </p>
          )}

          <div>
            <label className="mb-1 block text-xs text-muted">Nombre</label>
            <Input
              value={saleForm.name}
              onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Pueblo</label>
              <Input
                value={saleForm.town}
                onChange={(e) => setSaleForm({ ...saleForm, town: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Teléfono</label>
              <Input
                type="tel"
                inputMode="tel"
                value={saleForm.phone}
                onChange={(e) => setSaleForm({ ...saleForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-muted">Letra del crédito</label>
            <Input
              value={saleForm.creditCode}
              onChange={(e) => setSaleForm({ ...saleForm, creditCode: e.target.value.toUpperCase() })}
              placeholder="Ej. AB"
              className="font-data uppercase"
            />
          </div>

          {saleError && <p className="text-sm text-danger">{saleError}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setSaleFor(null)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={savingSale}>
              {savingSale ? "Guardando..." : "Marcar vendido"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
