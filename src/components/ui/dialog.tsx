"use client";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Dialog({ open, onClose, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="hud-panel max-h-[90vh] w-full max-w-lg overflow-y-auto bg-surface p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-heading text-lg font-bold text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}
