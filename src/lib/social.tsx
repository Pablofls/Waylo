"use client";

import { createContext, useCallback, useContext, useMemo, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { api, errorText } from "@/lib/api";
import type { NotificacionesAjustes, RutasAjustes } from "@/server/ajustes";
import type { Privacidad } from "@/server/social";
import type { Vehicle, AppNotification, Club, Place, EmergencyContact, GroupRide, LngLat, Person, Relation, ReportCategory, ReportCompletion, Ride, RideDraft, SavedPlace, SavedRoute, Subscription, User } from "@/types";

interface SessionCtx {
  /** Lugares públicos (destinos y puntos de salida). */
  publicPlaces: Place[];
  /** Último error de una acción (se muestra como aviso). */
  actionError: string | null;
  me: User;
  people: Person[];
  rides: GroupRide[];
  friends: Person[];
  received: Person[];
  sent: Person[];
  person: (id: string) => Person | undefined;
  /** Sugerencias de amistad (amigos de amigos). */
  suggestions: Person[];
  settings: Settings;
  saveNotifications: (n: NotificacionesAjustes) => void;
  saveRoutePrefs: (r: RutasAjustes) => void;
  savePrivacy: (p: Privacidad) => void;
  saveProfile: (p: { name: string; municipality: string | null; bio: string; vehicle: Vehicle }) => Promise<void>;
  municipalities: { clave: string; nombre: string }[];
  ride: (id: string) => GroupRide | undefined;
  setRelation: (id: string, r: Relation, who?: Person) => void;
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
  /** Crea un reporte rápido en `at` ([lng, lat]). */
  createReport: (category: ReportCategory, at: LngLat, rideId?: string | null) => Promise<void>;
  completeReport: (id: string, c: Omit<ReportCompletion, "hasPhoto">, photo?: File | "quitar" | null) => Promise<void>;
  /** Tu respuesta a "¿sigue ahí?" por reporte. */
  confirmations: Record<string, "sigue" | "resuelto">;
  confirmReport: (id: string, v: "sigue" | "resuelto") => void;
  cancelReport: (id: string) => Promise<void>;
  denounceReport: (id: string, reason: string) => Promise<void>;
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
  addComment: (activityId: string, text: string) => Promise<void>;
  denounceComment: (id: string, reason: string) => Promise<void>;
  denouncePerson: (id: string, reason: string) => Promise<void>;
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
  clubs: Club[];
  publicPlaces: Place[];
  suggestions: Person[];
  blocked: string[];
  kudos: string[];
  settings: Settings;
  municipalities: { clave: string; nombre: string }[];
  confirmations: Record<string, "sigue" | "resuelto">;
  children: React.ReactNode;
}

type Updater<T> = (cur: T) => T;

export interface Settings {
  privacidad: Privacidad;
  notificaciones: NotificacionesAjustes;
  rutas: RutasAjustes;
}

async function uploadPhoto(reportId: string, file: File) {
  const res = await fetch(`/api/reportes/${reportId}/foto`, { method: "PUT", body: file, credentials: "same-origin" });
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? "No pudimos subir la foto.");
}

/**
 * Estado de sesión en el cliente. La fuente de verdad es el servidor: las props llegan del layout y cada
 * acción aplica el cambio de inmediato (optimista), llama a la API y vuelve a pedir los datos del servidor
 * (`router.refresh()`); si la API falla, el cambio se revierte y `actionError` explica por qué.
 */
export function SocialProvider({ me: initialMe, people: initialPeople, rides: initialRides, myRides: initialMyRides, savedPlaces: initialPlaces, notifications: initialNotifs, savedRoutes: initialRoutes, emergencyContacts: initialContacts, searchHistory: initialSearches, clubs: initialClubs, publicPlaces, suggestions, blocked: initialBlocked, kudos: initialKudos, settings: initialSettings, municipalities, confirmations: initialConfirmations, children }: Props) {
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
  const me = initialMe;
  const [people, setPeople] = useOptimistic<Person[], Updater<Person[]>>(initialPeople, (cur, fn) => fn(cur));
  const [settings, setSettings] = useOptimistic<Settings, Updater<Settings>>(initialSettings, (cur, fn) => fn(cur));
  const [rides, setRides] = useState(initialRides);
  const [myRides, setMyRides] = useOptimistic<Ride[], Updater<Ride[]>>(initialMyRides, (cur, fn) => fn(cur));
  const [places, setPlaces] = useOptimistic<SavedPlace[], Updater<SavedPlace[]>>(initialPlaces, (cur, fn) => fn(cur));
  const [notifs, setNotifs] = useState(initialNotifs);
  const [confirmations, setConfirmations] = useOptimistic<Record<string, "sigue" | "resuelto">, Updater<Record<string, "sigue" | "resuelto">>>(initialConfirmations, (cur, fn) => fn(cur));
  const [routes, setRoutes] = useOptimistic<SavedRoute[], Updater<SavedRoute[]>>(initialRoutes, (cur, fn) => fn(cur));
  const [contacts, setContacts] = useState(initialContacts);
  const [fallDetection, setFallDetection] = useState(true);
  const [blocked, setBlocked] = useOptimistic<string[], Updater<string[]>>(initialBlocked, (cur, fn) => fn(cur));
  const [subscription, setSubscription] = useState<Subscription>({ active: false });
  const [searches, setSearches] = useOptimistic<Place[], Updater<Place[]>>(initialSearches, (cur, fn) => fn(cur));
  const [offlineMaps, setOfflineMaps] = useState<string[]>([]);
  const [liveShare, setLiveShare] = useState<{ with: string[]; hours: number | null } | null>(null);
  const [kudos, setKudos] = useOptimistic<string[], Updater<string[]>>(initialKudos, (cur, fn) => fn(cur));
  const [clubs, setClubs] = useState(initialClubs);
  const [joinedChallenges, setJoinedChallenges] = useState<string[]>(["ch_1", "ch_2"]);

  const setRelation = useCallback(
    (id: string, relation: Relation, who?: Person) => {
      const current = people.find((p) => p.id === id) ?? who;
      if (!current) return;
      const from = current.relation;
      const accion = from === "ninguna" && relation === "solicitud_enviada" ? "enviar" : from === "solicitud_enviada" && relation === "ninguna" ? "cancelar" : from === "solicitud_recibida" && relation === "amigo" ? "aceptar" : from === "solicitud_recibida" && relation === "ninguna" ? "rechazar" : from === "amigo" && relation === "ninguna" ? "terminar" : null;
      if (!accion) return;
      act(() => setPeople((ps) => (ps.some((p) => p.id === id) ? ps.map((p) => (p.id === id ? { ...p, relation } : p)) : [...ps, { ...current, relation }])), () => api("/api/amistades", "POST", { con: id, accion }));
    },
    [people, act, setPeople],
  );
  const patchRide = useCallback((id: string, fn: (r: GroupRide) => GroupRide) => setRides((rs) => rs.map((r) => (r.id === id ? fn(r) : r))), []);

  const value = useMemo<SessionCtx>(
    () => ({
      publicPlaces,
      actionError,
      me,
      people,
      suggestions,
      settings,
      municipalities,
      saveNotifications: (n) => act(() => setSettings((s) => ({ ...s, notificaciones: n })), () => api("/api/ajustes/notificaciones", "PUT", n)),
      saveRoutePrefs: (r) => act(() => setSettings((s) => ({ ...s, rutas: r })), () => api("/api/ajustes/rutas", "PUT", r)),
      savePrivacy: (p) => act(() => setSettings((s) => ({ ...s, privacidad: p })), () => api("/api/privacidad", "PUT", p)),
      saveProfile: async (p) => {
        await api("/api/cuenta/perfil", "PATCH", { nombre: p.name, municipio: p.municipality, bio: p.bio, vehiculo: p.vehicle });
        router.refresh();
      },
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
      createReport: async (categoria, at, rodadaId) => {
        await api("/api/reportes", "POST", { categoria, lng: at[0], lat: at[1], rodadaId: rodadaId ?? undefined });
        router.refresh();
      },
      completeReport: async (id, c, photo) => {
        await api(`/api/reportes/${id}`, "PATCH", c);
        if (photo === "quitar") await api(`/api/reportes/${id}/foto`, "DELETE");
        else if (photo) await uploadPhoto(id, photo);
        router.refresh();
      },
      confirmations,
      confirmReport: (id, v) => act(() => setConfirmations((x) => ({ ...x, [id]: v })), () => api(`/api/reportes/${id}/confirmacion`, "POST", { resultado: v })),
      cancelReport: async (id) => {
        await api(`/api/reportes/${id}`, "DELETE");
        router.refresh();
      },
      denounceReport: async (id, motivo) => {
        await api(`/api/reportes/${id}/denuncia`, "POST", { motivo });
      },
      savedRoutes: routes,
      addSavedRoute: (r, from, to) => act(() => setRoutes((x) => [...x, r]), () => api("/api/rutas/guardadas", "POST", { name: r.name, from, to, routeId: r.routeId })),
      removeSavedRoute: (id) => act(() => setRoutes((x) => x.filter((r) => r.id !== id)), () => api(`/api/rutas/guardadas/${id}`, "DELETE")),
      emergencyContacts: contacts,
      saveEmergencyContact: (c) => setContacts((x) => (x.some((y) => y.id === c.id) ? x.map((y) => (y.id === c.id ? c : y)) : [...x, c])),
      removeEmergencyContact: (id) => setContacts((x) => x.filter((c) => c.id !== id)),
      fallDetection,
      setFallDetection,
      blocked,
      block: (id) =>
        act(
          () => {
            setBlocked((x) => (x.includes(id) ? x : [...x, id]));
            setPeople((ps) => ps.map((p) => (p.id === id ? { ...p, relation: "ninguna" } : p)));
          },
          () => api("/api/bloqueos", "POST", { usuarioId: id }),
        ),
      unblock: (id) => act(() => setBlocked((x) => x.filter((b) => b !== id)), () => api(`/api/bloqueos/${id}`, "DELETE")),
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
      toggleKudo: (id) => {
        const had = kudos.includes(id);
        act(() => setKudos((x) => (had ? x.filter((y) => y !== id) : [...x, id])), () => api(`/api/actividad/${id}/reaccion`, had ? "DELETE" : "PUT"));
      },
      addComment: async (activityId, texto) => {
        await api(`/api/actividad/${activityId}/comentarios`, "POST", { texto });
        router.refresh();
      },
      denounceComment: async (id, motivo) => {
        await api(`/api/comentarios/${id}/denuncia`, "POST", { motivo });
      },
      denouncePerson: async (id, motivo) => {
        await api(`/api/personas/${id}/denuncia`, "POST", { motivo });
      },
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
    [publicPlaces, suggestions, settings, municipalities, actionError, act, router, me, people, rides, myRides, places, notifs, confirmations, routes, contacts, fallDetection, blocked, subscription, searches, offlineMaps, liveShare, kudos, clubs, joinedChallenges, setRelation, patchRide],
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
