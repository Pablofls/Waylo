"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Lock } from "lucide-react";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useSocial } from "@/lib/social";

export default function PagoPage() {
  const router = useRouter();
  const { subscribe } = useSocial();
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);

  const fmtNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExpiry = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

  const pay = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 3) e.name = "Escribe el nombre como aparece en la tarjeta.";
    if (number.replace(/\s/g, "").length !== 16) e.number = "El número tiene 16 dígitos.";
    const m = Number(expiry.slice(0, 2));
    if (!/^\d{2}\/\d{2}$/.test(expiry) || m < 1 || m > 12) e.expiry = "Usa el formato MM/AA.";
    if (!/^\d{3,4}$/.test(cvc)) e.cvc = "3 o 4 dígitos.";
    setErrors(e);
    if (Object.keys(e).length) return;
    setPaying(true);
    // Pago simulado: al servidor solo viajan los últimos 4 dígitos para el recibo; nunca el número completo ni el CVC.
    subscribe(number.replace(/\s/g, "").slice(-4))
      .then(({ folio }) => router.push(`/premium/confirmacion?folio=${encodeURIComponent(folio)}`))
      .catch((err) => {
        setErrors({ number: err instanceof Error ? err.message : "No pudimos registrar el pago." });
        setPaying(false);
      });
  };

  const err = (k: string) => errors[k] && <p role="alert" className="mt-1 text-xs font-semibold text-risk-red">{errors[k]}</p>;

  return (
    <>
      <ScreenHeader title="Pago" subtitle="Waylo Premium · $79 MXN al mes" back="/premium" />
      <div className="flex-1 space-y-4 overflow-y-auto bg-white px-4 pb-6 pt-3">
        <div className="rounded-xl bg-[#FCEBDD] p-3 text-sm font-semibold text-[#7A3F0C]">Pago simulado: no uses datos reales. No se realiza ningún cargo.</div>
        <div><Input label="Nombre en la tarjeta" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} />{err("name")}</div>
        <div><Input label="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" value={number} onChange={(e) => setNumber(fmtNumber(e.target.value))} placeholder="0000 0000 0000 0000" />{err("number")}</div>
        <div className="grid grid-cols-2 gap-3">
          <div><Input label="Vence" inputMode="numeric" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(fmtExpiry(e.target.value))} placeholder="MM/AA" />{err("expiry")}</div>
          <div><Input label="CVC" inputMode="numeric" autoComplete="cc-csc" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" />{err("cvc")}</div>
        </div>
        <div className="rounded-card border border-line p-4 text-sm">
          <div className="flex justify-between"><span>Waylo Premium, mensual</span><span className="font-semibold">$79.00</span></div>
          <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold"><span>Total hoy</span><span>$79.00 MXN</span></div>
          <p className="mt-2 text-xs text-muted">Se renueva cada mes. Cancela cuando quieras desde Perfil.</p>
        </div>
      </div>
      <div className="pb-safe border-t border-line bg-white px-4 pt-3">
        <Button full size="lg" disabled={paying} onClick={pay} icon={paying ? <CreditCard size={20} /> : <Lock size={18} />}>{paying ? "Procesando pago" : "Pagar $79 MXN"}</Button>
        <div className="h-3" />
      </div>
    </>
  );
}
