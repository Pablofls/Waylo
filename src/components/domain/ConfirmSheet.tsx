"use client";

import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmSheet({ open, title, text, confirmLabel, cancelLabel = "Volver", danger, onConfirm, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="pb-safe relative rounded-t-3xl bg-white p-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{text}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
