"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { NotebookPen, Plus } from "lucide-react";
import { addCustomerNoteAction } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { CustomerNote } from "@/types/customer";

interface CustomerNotesProps {
  customerId: string;
  notesLog: CustomerNote[];
  /** Nota vieja sin fecha (clientes creados antes de la bitácora) */
  legacyNote: string;
}

/** Bitácora de notas del cliente — cada nota queda con la fecha en que se escribió */
export function CustomerNotes({ customerId, notesLog, legacyNote }: CustomerNotesProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const sorted = [...notesLog].sort((a, b) => b.created_at.localeCompare(a.created_at));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addCustomerNoteAction(customerId, text);
      if (result.success) {
        setText("");
        router.refresh();
      } else {
        setError(result.error ?? "Error desconocido");
      }
    });
  }

  return (
    <div className="hud-panel p-4">
      <p className="mb-3 flex items-center gap-1.5 font-data text-[10px] uppercase tracking-[0.25em] text-primary">
        <NotebookPen size={12} />
        Bitácora de notas
      </p>

      <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe una nota — queda fechada automáticamente..."
          disabled={pending}
        />
        <Button type="submit" disabled={pending || !text.trim()}>
          <Plus size={16} />
          {pending ? "..." : "Anotar"}
        </Button>
      </form>

      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {sorted.length === 0 && !legacyNote && (
        <p className="text-xs text-muted">Sin notas todavía. Escribe la primera arriba.</p>
      )}

      <ul className="space-y-2">
        {sorted.map((note, i) => (
          <li
            key={`${note.created_at}-${i}`}
            className="flex flex-col gap-0.5 border-l-2 border-primary/40 pl-3"
          >
            <span className="font-data text-[10px] uppercase text-primary">
              {formatDate(note.created_at)}
            </span>
            <span className="text-sm text-foreground">{note.text}</span>
          </li>
        ))}
        {legacyNote && (
          <li className="flex flex-col gap-0.5 border-l-2 border-muted/40 pl-3">
            <span className="font-data text-[10px] uppercase text-muted">Nota anterior (sin fecha)</span>
            <span className="text-sm text-muted">{legacyNote}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
