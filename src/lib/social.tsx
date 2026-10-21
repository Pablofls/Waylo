"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { GroupRide, Person, Relation, RideDraft, User } from "@/types";

interface SocialCtx {
  me: User;
  people: Person[];
  rides: GroupRide[];
  friends: Person[];
  received: Person[];
  sent: Person[];
  person: (id: string) => Person | undefined;
  ride: (id: string) => GroupRide | undefined;
  setRelation: (id: string, r: Relation) => void;
  join: (rideId: string) => void;
  leave: (rideId: string) => void;
  createRide: (d: RideDraft, invited: string[]) => string;
  updateRide: (id: string, d: RideDraft) => void;
  cancelRide: (id: string) => void;
}

const Ctx = createContext<SocialCtx | null>(null);

export function useSocial() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSocial debe usarse dentro de SocialProvider");
  return c;
}

/**
 * Estado cliente de amigos y rodadas grupales, sembrado con los mocks.
 * Los cambios viven solo hasta recargar; en fase 3 se reemplaza por la base de datos.
 */
export function SocialProvider({ me, people: initialPeople, rides: initialRides, children }: { me: User; people: Person[]; rides: GroupRide[]; children: React.ReactNode }) {
  const [people, setPeople] = useState(initialPeople);
  const [rides, setRides] = useState(initialRides);

  const setRelation = useCallback((id: string, relation: Relation) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, relation } : p))), []);
  const patchRide = useCallback((id: string, fn: (r: GroupRide) => GroupRide) => setRides((rs) => rs.map((r) => (r.id === id ? fn(r) : r))), []);

  const value = useMemo<SocialCtx>(
    () => ({
      me,
      people,
      rides,
      friends: people.filter((p) => p.relation === "amigo"),
      received: people.filter((p) => p.relation === "solicitud_recibida"),
      sent: people.filter((p) => p.relation === "solicitud_enviada"),
      person: (id) => people.find((p) => p.id === id),
      ride: (id) => rides.find((r) => r.id === id),
      setRelation,
      join: (rideId) => patchRide(rideId, (r) => (r.attendeeIds.includes(me.id) ? r : { ...r, attendeeIds: [...r.attendeeIds, me.id] })),
      leave: (rideId) => patchRide(rideId, (r) => ({ ...r, attendeeIds: r.attendeeIds.filter((a) => a !== me.id) })),
      createRide: (d, invited) => {
        const id = `g_new_${Date.now()}`;
        setRides((rs) => [{ ...d, id, organizerId: me.id, attendeeIds: [me.id, ...invited], status: "programada" }, ...rs]);
        return id;
      },
      updateRide: (id, d) => patchRide(id, (r) => ({ ...r, ...d })),
      cancelRide: (id) => patchRide(id, (r) => ({ ...r, status: "cancelada" })),
    }),
    [me, people, rides, setRelation, patchRide],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Datos mínimos para mostrar a cualquier asistente, incluido el usuario. */
export function useAttendees(ids: string[]) {
  const { me, people } = useSocial();
  return ids
    .map((id) => (id === me.id ? { id, name: me.name, city: me.city, isMe: true } : people.find((p) => p.id === id) ? { id, name: people.find((p) => p.id === id)!.name, city: people.find((p) => p.id === id)!.city, isMe: false } : null))
    .filter((x): x is { id: string; name: string; city: string; isMe: boolean } => x !== null);
}
