"use client";

import { ShieldOff } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { PersonRow } from "@/components/domain/PersonRow";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";

export default function BloqueadosPage() {
  const { blocked, people, unblock } = useSocial();
  const list = people.filter((p) => blocked.includes(p.id));
  return (
    <>
      <ScreenHeader title="Usuarios bloqueados" subtitle="No pueden verte ni escribirte" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white">
        {list.length === 0 ? (
          <EmptyState icon={<ShieldOff size={26} />} title="No has bloqueado a nadie" text="Si bloqueas a alguien desde su perfil, aparecerá aquí y podrás desbloquearlo." />
        ) : (
          <ul>{list.map((p) => <PersonRow key={p.id} id={p.id} name={p.name} detail={p.city} right={<Button variant="outline" className="!min-h-[44px] !px-4 text-sm" onClick={() => unblock(p.id)}>Desbloquear</Button>} />)}</ul>
        )}
      </div>
    </>
  );
}
