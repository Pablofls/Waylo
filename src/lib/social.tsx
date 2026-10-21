"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AppNotification, GroupRide, Person, Relation, ReportCompletion, Ride, RideDraft, SavedPlace, User } from "@/types";

interface SessionCtx {
  me: User;
  updateMe: (patch: Partial<User>) => void;
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
  myRides: Ride[];
  renameMyRide: (id: string, title: string) => void;
  deleteMyRide: (id: string) => void;
  savedPlaces: SavedPlace[];
  addSavedPlace: (p: SavedPlace) => void;
  removeSavedPlace: (id: string) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  completions: Record<string, ReportCompletion>;
  completeReport: (id: string, c: ReportCompletion) => void;
  confirmations: Record<string, "sigue" | "resuelto">;
  confirmReport: (id: string, v: "sigue" | "resuelto") => void;
}

const Ctx = createContext<SessionCtx | null>(null);

export function useSocial() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSocial debe usarse dentro de SocialProvider");
  return c;
}

interface Props {
  me: User;
  people: Person[];
  rides: GroupRide[];
  myRides: Ride[];
  savedPlaces: SavedPlace[];
  notifications: AppNotification[];
  children: React.ReactNode;
}

/**
 * Estado de sesión en el cliente (amigos, rodadas, lugares, notificaciones, reportes), sembrado con los mocks.
 * Los cambios viven solo hasta recargar; en fase 3 se reemplaza por la base de datos.
 */
export function SocialProvider({ me: initialMe, people: initialPeople, rides: initialRides, myRides: initialMyRides, savedPlaces: initialPlaces, notifications: initialNotifs, children }: Props) {
  const [me, setMe] = useState(initialMe);
  const [people, setPeople] = useState(initialPeople);
  const [rides, setRides] = useState(initialRides);
  const [myRides, setMyRides] = useState(initialMyRides);
  const [places, setPlaces] = useState(initialPlaces);
  const [notifs, setNotifs] = useState(initialNotifs);
  const [completions, setCompletions] = useState<Record<string, ReportCompletion>>({});
  const [confirmations, setConfirmations] = useState<Record<string, "sigue" | "resuelto">>({});

  const setRelation = useCallback((id: string, relation: Relation) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, relation } : p))), []);
  const patchRide = useCallback((id: string, fn: (r: GroupRide) => GroupRide) => setRides((rs) => rs.map((r) => (r.id === id ? fn(r) : r))), []);

  const value = useMemo<SessionCtx>(
    () => ({
      me,
      updateMe: (patch) => setMe((m) => ({ ...m, ...patch })),
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
      myRides,
      renameMyRide: (id, title) => setMyRides((rs) => rs.map((r) => (r.id === id ? { ...r, title } : r))),
      deleteMyRide: (id) => setMyRides((rs) => rs.filter((r) => r.id !== id)),
      savedPlaces: places,
      addSavedPlace: (p) => setPlaces((ps) => [...ps, p]),
      removeSavedPlace: (id) => setPlaces((ps) => ps.filter((p) => p.id !== id)),
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.read).length,
      markRead: (id) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllRead: () => setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))),
      completions,
      completeReport: (id, c) => setCompletions((x) => ({ ...x, [id]: c })),
      confirmations,
      confirmReport: (id, v) => setConfirmations((x) => ({ ...x, [id]: v })),
    }),
    [me, people, rides, myRides, places, notifs, completions, confirmations, setRelation, patchRide],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Datos mínimos para mostrar a cualquier asistente, incluido el usuario. */
export function useAttendees(ids: string[]) {
  const { me, people } = useSocial();
  return ids
    .map((id) => {
      if (id === me.id) return { id, name: me.name, city: me.city, isMe: true };
      const p = people.find((x) => x.id === id);
      return p ? { id, name: p.name, city: p.city, isMe: false } : null;
    })
    .filter((x): x is { id: string; name: string; city: string; isMe: boolean } => x !== null);
}
