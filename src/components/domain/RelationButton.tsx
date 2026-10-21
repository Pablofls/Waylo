"use client";

import { useState } from "react";
import { Check, UserCheck, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmSheet } from "./ConfirmSheet";
import { useSocial } from "@/lib/social";
import type { Person } from "@/types";

/** Botón de relación según el estado de amistad. `row` es compacto; `full` ocupa el ancho. */
export function RelationButton({ person, size = "row" }: { person: Person; size?: "row" | "full" }) {
  const { setRelation } = useSocial();
  const [confirm, setConfirm] = useState(false);
  const full = size === "full";
  const small = "!min-h-[44px] !px-4 text-sm";

  switch (person.relation) {
    case "ninguna":
      return <Button full={full} className={full ? "" : small} onClick={() => setRelation(person.id, "solicitud_enviada")}>Agregar</Button>;
    case "solicitud_enviada":
      return (
        <Button full={full} variant="secondary" className={full ? "" : small} onClick={() => setRelation(person.id, "ninguna")} aria-label={`Cancelar solicitud a ${person.name}`}>
          {full ? "Solicitud enviada · Cancelar" : "Enviada"}
        </Button>
      );
    case "solicitud_recibida":
      return full ? (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setRelation(person.id, "ninguna")}>Rechazar</Button>
          <Button icon={<Check size={18} />} onClick={() => setRelation(person.id, "amigo")}>Aceptar</Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button aria-label={`Rechazar a ${person.name}`} onClick={() => setRelation(person.id, "ninguna")} className="flex h-11 w-11 items-center justify-center rounded-full border border-line"><X size={20} /></button>
          <button aria-label={`Aceptar a ${person.name}`} onClick={() => setRelation(person.id, "amigo")} className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-600 text-white"><Check size={20} strokeWidth={3} /></button>
        </div>
      );
    case "amigo":
      return full ? (
        <>
          <Button full variant="secondary" icon={<UserCheck size={18} />} onClick={() => setConfirm(true)}>Amigos</Button>
          <ConfirmSheet open={confirm} danger title={`¿Dejar de ser amigo de ${person.name.split(" ")[0]}?`} text="Dejarás de ver su actividad y él o ella dejará de ver la tuya." confirmLabel="Dejar de ser amigos" onConfirm={() => setRelation(person.id, "ninguna")} onClose={() => setConfirm(false)} />
        </>
      ) : (
        <span className="flex items-center gap-1 text-xs font-semibold text-brand-700"><UserCheck size={16} />Amigos</span>
      );
  }
}
