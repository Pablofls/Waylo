"use client";

import { useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  open: boolean;
  title: string;
  text: string;
  url: string;
  onClose: () => void;
}

export function ShareSheet({ open, title, text, url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* sin permiso de portapapeles: solo mostramos el enlace */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <button aria-label="Cerrar" className="absolute inset-0 bg-ink/50" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="pb-safe relative rounded-t-3xl bg-white p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="text-sm text-muted">{text}</p>
          </div>
          <button aria-label="Cerrar" onClick={onClose} className="-mr-2 -mt-1 flex h-11 w-11 items-center justify-center"><X size={22} /></button>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas px-4 py-3">
          <span className="min-w-0 flex-1 truncate font-mono text-sm">{url}</span>
        </div>
        <Button full size="lg" className="mt-3" onClick={copy} icon={copied ? <Check size={20} /> : <Copy size={20} />}>
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </Button>
      </div>
    </div>
  );
}
