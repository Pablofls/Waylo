"use client";

import { useState } from "react";
import Link from "next/link";
import { Flag, MessageCircle, Send } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { ActivityCard } from "@/components/domain/ActivityCard";
import { Avatar } from "@/components/domain/Avatar";
import { ReportContentSheet } from "@/components/domain/ReportContentSheet";
import { EmptyState } from "@/components/ui/States";
import { useSocial } from "@/lib/social";
import { formatDateTime } from "@/lib/format";

interface Post {
  id: string;
  personId: string;
  name: string;
  title: string;
  km: number;
  minutes: number;
  safetyScore: number;
  at: string;
  vehicle?: "bicicleta" | "scooter";
}

export function PostDetail({ post }: { post: Post | null }) {
  const { comments, addComment, me, person, blocked } = useSocial();
  const [text, setText] = useState("");
  const [reporting, setReporting] = useState(false);

  if (!post) return (<><ScreenHeader title="Actividad" back="/inicio" /><EmptyState icon={<MessageCircle size={26} />} title="No encontramos esta actividad" text="Puede que la hayan eliminado." /></>);

  const author = person(post.personId);
  const list = comments.filter((c) => c.activityId === post.id && !blocked.includes(c.personId));
  const nameOf = (id: string) => (id === me.id ? me.name : person(id)?.name ?? "Persona de Waylo");
  const send = () => {
    if (!text.trim()) return;
    addComment(post.id, text.trim());
    setText("");
  };

  return (
    <>
      <ScreenHeader title="Actividad" back="/inicio" />
      <div className="flex-1 overflow-y-auto bg-white">
        <ActivityCard id={post.id} baseKudos={post.vehicle ? 2 : 3} personId={post.personId} name={author?.name ?? post.name} title={post.title} km={post.km} minutes={post.minutes} safetyScore={post.safetyScore} at={post.at} vehicle={post.vehicle} />
        <h2 className="px-4 pt-4 text-lg font-bold">Comentarios {list.length > 0 && <span className="text-muted">({list.length})</span>}</h2>
        {list.length === 0 ? (
          <p className="px-4 pb-6 pt-2 text-sm text-muted">Sé la primera persona en comentar.</p>
        ) : (
          <ul className="px-4 pb-4">
            {list.map((c) => (
              <li key={c.id} className="flex gap-3 border-b border-line py-3">
                <Avatar name={nameOf(c.personId)} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm"><Link href={c.personId === me.id ? "/perfil" : `/personas/${c.personId}`} className="font-semibold">{nameOf(c.personId)}</Link> <span className="text-muted">· {formatDateTime(c.at)}</span></p>
                  <p className="mt-0.5 text-[15px]">{c.text}</p>
                </div>
                {c.personId !== me.id && <button aria-label="Reportar comentario" onClick={() => setReporting(true)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted"><Flag size={16} /></button>}
              </li>
            ))}
          </ul>
        )}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="pb-safe flex items-center gap-2 border-t border-line bg-white px-4 pt-3">
        <input value={text} onChange={(e) => setText(e.target.value)} maxLength={200} aria-label="Escribe un comentario" placeholder="Escribe un comentario" className="min-h-[48px] min-w-0 flex-1 rounded-full border border-line px-4 text-base outline-none placeholder:text-[#8A929C] focus:border-brand-600" />
        <button type="submit" disabled={!text.trim()} aria-label="Enviar comentario" className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white disabled:opacity-40"><Send size={20} /></button>
      </form>
      <div className="h-3 bg-white" />
      <ReportContentSheet open={reporting} title="Reportar comentario" reasons={["Es ofensivo", "Es spam", "Información falsa", "Otro"]} onClose={() => setReporting(false)} />
    </>
  );
}
