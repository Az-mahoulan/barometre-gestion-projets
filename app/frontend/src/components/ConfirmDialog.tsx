"use client";

import { useEffect, useRef } from "react";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={onCancel}
      onClick={(e) => e.target === ref.current && onCancel()}
      className="m-auto w-[min(420px,92vw)] rounded-2xl border border-line p-0 shadow-xl backdrop:bg-black/30"
    >
      <div className="p-6">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-ink-2">{message}</p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button className="btn btn-dark" onClick={onConfirm} disabled={busy}>
            {busy ? "En cours…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
