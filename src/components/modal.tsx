"use client";

import { useEffect, useRef, useState } from "react";

export function Modal({
  trigger,
  title,
  children,
}: {
  trigger: React.ReactNode;
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        className="w-full max-w-lg rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full px-2 py-1 text-sm text-muted hover:bg-background"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        <div className="max-h-[75vh] overflow-y-auto px-5 py-4">
          {open ? children(() => setOpen(false)) : null}
        </div>
      </dialog>
    </>
  );
}
