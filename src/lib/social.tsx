"use client";

import { createContext, useCallback, useContext, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";
import type { ActivityComment, AppNotification, Club, Place, EmergencyContact, GroupRide, Person, Relation, ReportCompletion, Ride, RideDraft, SavedPlace, SavedRoute, Subscription, User } from "@/types";

interface SessionCtx {
  /** Lugares públicos (destinos y puntos de salida). */
  publicPlaces: Place[];
  /** Último error de una acción (se muestra como aviso). */
  actionError: string | null;
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
  cancelledReports: string[];
  cancelReport: (id: string) => void;
  savedRoutes: SavedRoute[];
  addSavedRoute: (r: SavedRoute, from: Place, to: Place) => void;
  removeSavedRoute: (id: string) => void;
  emergencyContacts: EmergencyContact[];
  saveEmergencyContact: (c: EmergencyContact) => void;
  removeEmergencyContact: (id: string) => void;
  fallDetection: boolean;
  setFallDetection: (v: boolean) => void;
  blocked: string[];
  block: (id: string) => void;
  unblock: (id: string) => void;
  subscription: Subscription;
  subscribe: () => void;
  cancelSubscription: () => void;
  searchHistory: Place[];
  addSearch: (p: Place) => void;
  removeSearch: (name: string) => void;
  clearSearches: () => void;
  offlineMaps: string[];
  toggleOfflineMap: (id: string) => void;
  liveShare: { with: string[]; hours: number | null } | null;
  startLiveShare: (names: string[], hours: number | null) => void;
  stopLiveShare: () => void;
  kudos: string[];
  toggleKudo: (activityId: string) => void;
  comments: ActivityComment[];
  addComment: (activityId: string, text: string) => void;
  clubs: Club[];
  joinClub: (id: string) => void;
  leaveClub: (id: string) => void;
  createClub: (d: { name: string; description: string; zone: string; privacy: Club["privacy"] }) => string;
  joinedChallenges: string[];
  toggleChallenge: (id: string) => void;
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
  savedRoutes: SavedRoute[];
  emergencyContacts: EmergencyContact[];
  searchHistory: Place[];
  comments: ActivityComment[];
  clubs: Club[];
  publicPlaces: Place[];
  children: React.ReactNode;
}

type Updater<T> = (cur: T) => T;

/**
 * Estado de sesión en el cliente. La fuente de verdad es el servidor: las props llegan del layout y cada
 * acción aplica el cambio de inmediato (optimista), llama a la API y vuelve a pedir los datos del servidor
 * (`router.refresh()`); si la API falla, el cambio se revierte y `actionError` explica por qué.
 */
export function SocialProvider({ me: initialMe, people: initialPeople, rides: initialRides, myRides: initialMyRides, savedPlaces: initialPlaces, notifications: initialNotifs, savedRoutes: initialRoutes, emergencyContacts: initialContacts, searchHistory: initialSearches, comments: initialComments, clubs: initialClubs, publicPlaces, children }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  /** Aplica `patch` al instante, ejecuta `request` y sincroniza con el servidor. */
  const act = useCallback(
    (patch: (() => void) | null, request: () => Promise<unknown>) => {
      startTransition(async () => {
        patch?.();
        try {
          await request();
          setActionError(null);
        } catch (e) {
          setActionError(errorText(e));
        }
        router.refresh();
      });
    },
    [router],
  );
  const [me, setMe] = useState(initialMe);
  const [people, setPeople] = useState(initialPeople);
  const [rides, setRides] = useState(initialRides);
  const [myRides, setMyRides] = useOptimistic<Ride[], Updater<Ride[]>>(initialMyRides, (cur, fn) => fn(cur));
  const [places, setPlaces] = useOptimistic<SavedPlace[], Updater<SavedPlace[]>>(initialPlaces, (cur, fn) => fn(cur));
  const [notifs, setNotifs] = useState(initialNotifs);
  const [completions, setCompletions] = useState<Record<string, ReportCompletion>>({});
  const [confirmations, setConfirmations] = useState<Record<string, "sigue" | "resuelto">>({});
  const [cancelledReports, setCancelledReports] = useState<string[]>([]);
  const [routes, setRoutes] = useOptimistic<SavedRoute[], Updater<SavedRoute[]>>(initialRoutes, (cur, fn) => fn(cur));
  const [contacts, setContacts] = useState(initialContacts);
  const [fallDetection, setFallDetection] = useState(true);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [subscription, setSubscription] = useState<Subscription>({ active: false });
  const [searches, setSearches] = useOptimistic<Place[], Updater<Place[]>>(initialSearches, (cur, fn) => fn(cur));
  const [offlineMaps, setOfflineMaps] = useState<string[]>([]);
  const [liveShare, setLiveShare] = useState<{ with: string[]; hours: number | null } | null>(null);
  const [kudos, setKudos] = useState<string[]>([]);
  const [comments, setComments] = useState(initialComments);
  const [clubs, setClubs] = useState(initialClubs);
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(["ch_1", "ch_2"]);

  const setRelation = useCallback((id: string, relation: Relation) => setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, relation } : p))), []);
  const patchRide = useCallback((id: string, fn: (r: GroupRide) => GroupRide) => setRides((rs) => rs.map((r) => (r.id === id ? fn(r) : r))), []);

  const value = useMemo<SessionCtx>(
    () => ({
      publicPlaces,
      actionError,
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
      renameMyRide: (id, title) => act(() => setMyRides((rs) => rs.map((r) => (r.id === id ? { ...r, title } : r))), () => api(`/api/rodadas/${id}`, "PATCH", { titulo: title })),
      deleteMyRide: (id) => act(() => setMyRides((rs) => rs.filter((r) => r.id !== id)), () => api(`/api/rodadas/${id}`, "DELETE")),
      savedPlaces: places,
      addSavedPlace: (p) => act(() => setPlaces((ps) => [...ps, p]), () => api("/api/lugares/guardados", "POST", { kind: p.kind, label: p.label, place: p.place })),
      removeSavedPlace: (id) => act(() => setPlaces((ps) => ps.filter((p) => p.id !== id)), () => api(`/api/lugares/guardados/${id}`, "DELETE")),
      notifications: notifs,
      unreadCount: notifs.filter((n) => !n.read).length,
      markRead: (id) => setNotifs((ns) => ns.map((n) => (n.id === id ? { ...n, read: true } : n))),
      markAllRead: () => setNotifs((ns) => ns.map((n) => ({ ...n, read: true }))),
      completions,
      completeReport: (id, c) => setCompletions((x) => ({ ...x, [id]: c })),
      confirmations,
      confirmReport: (id, v) => setConfirmations((x) => ({ ...x, [id]: v })),
      cancelledReports,
      cancelReport: (id) => setCancelledReports((x) => (x.includes(id) ? x : [...x, id])),
      savedRoutes: routes,
      addSavedRoute: (r, from, to) => act(() => setRoutes((x) => [...x, r]), () => api("/api/rutas/guardadas", "POST", { name: r.name, from, to, routeId: r.routeId })),
      removeSavedRoute: (id) => act(() => setRoutes((x) => x.filter((r) => r.id !== id)), () => api(`/api/rutas/guardadas/${id}`, "DELETE")),
      emergencyContacts: contacts,
      saveEmergencyContact: (c) => setContacts((x) => (x.some((y) => y.id === c.id) ? x.map((y) => (y.id === c.id ? c : y)) : [...x, c])),
      removeEmergencyContact: (id) => setContacts((x) => x.filter((c) => c.id !== id)),
      fallDetection,
      setFallDetection,
      blocked,
      block: (id) => {
        setBlocked((x) => (x.includes(id) ? x : [...x, id]));
        setRelation(id, "ninguna");
      },
      unblock: (id) => setBlocked((x) => x.filter((b) => b !== id)),
      subscription,
      subscribe: () => setSubscription({ active: true }),
      cancelSubscription: () => setSubscription({ active: true, cancelled: true, until: "2026-11-20" }),
      searchHistory: searches,
      addSearch: (p) => p.id && act(() => setSearches((x) => [p, ...x.filter((y) => y.id !== p.id)].slice(0, 6)), () => api("/api/busquedas", "POST", { lugarId: p.id })),
      removeSearch: (name) => {
        const p = searches.find((y) => y.name === name);
        if (p?.id) act(() => setSearches((x) => x.filter((y) => y.id !== p.id)), () => api(`/api/busquedas/${p.id}`, "DELETE"));
      },
      clearSearches: () => act(() => setSearches(() => []), () => api("/api/busquedas", "DELETE")),
      offlineMaps,
      toggleOfflineMap: (id) => setOfflineMaps((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id])),
      liveShare,
      startLiveShare: (names, hours) => setLiveShare({ with: names, hours }),
      stopLiveShare: () => setLiveShare(null),
      kudos,
      toggleKudo: (id) => setKudos((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id])),
      comments,
      addComment: (activityId, text) => setComments((x) => [...x, { id: `cm_${Date.now()}`, activityId, personId: me.id, text, at: new Date().toISOString() }]),
      clubs,
      joinClub: (id) => setClubs((cs) => cs.map((c) => (c.id === id && !c.memberIds.includes(me.id) ? { ...c, memberIds: [...c.memberIds, me.id] } : c))),
      leaveClub: (id) => setClubs((cs) => cs.map((c) => (c.id === id ? { ...c, memberIds: c.memberIds.filter((m) => m !== me.id) } : c))),
      createClub: (d) => {
        const id = `c_new_${Date.now()}`;
        setClubs((cs) => [{ id, ...d, ownerId: me.id, memberIds: [me.id], rideIds: [] }, ...cs]);
        return id;
      },
      joinedChallenges,
      toggleChallenge: (id) => setJoinedChallenges((x) => (x.includes(id) ? x.filter((y) => y !== id) : [...x, id])),
    }),
    [publicPlaces, actionError, act, me, people, rides, myRides, places, notifs, completions, confirmations, cancelledReports, routes, contacts, fallDetection, blocked, subscription, searches, offlineMaps, liveShare, kudos, comments, clubs, joinedChallenges, setRelation, patchRide],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      {actionError && (
        <p role="alert" onClick={() => setActionError(null)} className="pt-safe absolute inset-x-3 top-3 z-[60] rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white">
          {actionError}
        </p>
      )}
    </Ctx.Provider>
  );
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
