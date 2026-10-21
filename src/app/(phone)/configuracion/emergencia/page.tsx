"use client";

import { useState } from "react";
import { Phone, Plus, ShieldAlert, Trash2, UserRound } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ConfirmSheet } from "@/components/domain/ConfirmSheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import type { EmergencyContact } from "@/types";

export default function EmergenciaPage() {
  const { emergencyContacts, saveEmergencyContact, removeEmergencyContact, fallDetection, setFallDetection } = useSocial();
  const [editing, setEditing] = useState<EmergencyContact | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relation, setRelation] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<EmergencyContact | null>(null);

  const open = (c?: EmergencyContact) => {
    setEditing(c ?? { id: "", name: "", phone: "", relation: "" });
    setName(c?.name ?? ""); setPhone(c?.phone ?? ""); setRelation(c?.relation ?? ""); setError("");
  };
  const save = () => {
    if (name.trim().length < 2) return setError("Escribe el nombre del contacto.");
    if (phone.replace(/\D/g, "").length !== 10) return setError("El teléfono debe tener 10 dígitos.");
    saveEmergencyContact({ id: editing?.id || `ec_${Date.now()}`, name: name.trim(), phone: phone.trim(), relation: relation.trim() || "Contacto" });
    setEditing(null);
  };

  return (
    <>
      <ScreenHeader title="Emergencia" subtitle="Contactos y detección de caídas" back="/configuracion" />
      <div className="flex-1 overflow-y-auto bg-white pb-6">
        {editing ? (
          <div className="space-y-4 p-4">
            <h2 className="text-lg font-bold">{editing.id ? "Editar contacto" : "Nuevo contacto"}</h2>
            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Teléfono (10 dígitos)" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="81 1234 5678" />
            <Input label="Relación" value={relation} onChange={(e) => setRelation(e.target.value)} placeholder="Mamá, pareja, amigo" />
            {error && <p role="alert" className="text-sm font-semibold text-risk-red">{error}</p>}
            <div className="grid grid-cols-2 gap-3"><Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></div>
          </div>
        ) : (
          <>
            <section className="px-4 pt-3">
              <div className="flex items-center justify-between gap-3 rounded-card border border-line pl-4">
                <span className="py-3"><span className="block font-bold">Detección de caídas</span><span className="block text-sm text-muted">Si detectamos un golpe fuerte durante una rodada, te damos 15 segundos para responder antes de avisar a tus contactos.</span></span>
                <Toggle label="Detección de caídas" checked={fallDetection} onChange={setFallDetection} />
              </div>
            </section>
            <section className="pt-6">
              <h2 className="px-4 text-lg font-bold">Contactos de emergencia</h2>
              {emergencyContacts.length === 0 ? (
                <EmptyState icon={<ShieldAlert size={26} />} title="Sin contactos" text="Agrega a alguien de confianza para que reciba tu ubicación si necesitas ayuda." action={<Button onClick={() => open()}>Agregar contacto</Button>} />
              ) : (
                <>
                  <ul className="mt-2 border-t border-line">
                    {emergencyContacts.map((c) => (
                      <li key={c.id} className="flex min-h-[72px] items-center gap-2 border-b border-line pr-2">
                        <button onClick={() => open(c)} className="flex min-h-[72px] min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600"><UserRound size={20} /></span>
                          <span className="min-w-0"><span className="block truncate text-[15px] font-semibold">{c.name}</span><span className="block truncate text-sm text-muted">{c.relation} · {c.phone}</span></span>
                        </button>
                        <button aria-label={`Eliminar a ${c.name}`} onClick={() => setToDelete(c)} className="flex h-11 w-11 items-center justify-center rounded-full text-muted"><Trash2 size={20} /></button>
                      </li>
                    ))}
                  </ul>
                  <div className="p-4"><Button full variant="secondary" icon={<Plus size={18} />} onClick={() => open()}>Agregar contacto</Button></div>
                </>
              )}
            </section>
            <section className="px-4 pt-2">
              <a href="tel:911" className="flex min-h-[56px] items-center justify-center gap-2 rounded-xl bg-risk-red font-semibold text-white"><Phone size={20} />Llamar al 911</a>
            </section>
          </>
        )}
      </div>
      <ConfirmSheet open={toDelete !== null} danger title={`¿Quitar a ${toDelete?.name ?? "este contacto"}?`} text="Ya no recibirá tu ubicación en una emergencia." confirmLabel="Quitar" onConfirm={() => toDelete && removeEmergencyContact(toDelete.id)} onClose={() => setToDelete(null)} />
    </>
  );
}
