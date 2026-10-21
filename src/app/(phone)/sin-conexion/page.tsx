import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SinConexionPage() {
  return (
    <div className="pt-safe pb-safe flex flex-1 flex-col items-center justify-center bg-white px-6 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas text-muted"><WifiOff size={30} /></span>
      <h1 className="mt-5 text-3xl font-bold">Sin conexión</h1>
      <p className="mt-2 max-w-xs text-muted">Puedes seguir grabando tu rodada: la sincronizamos cuando vuelvas a tener internet. El mapa y los reportes nuevos necesitan conexión.</p>
      <ul className="mt-6 space-y-2 text-left text-sm">
        <li>Disponible: grabar rodada y ver tu historial.</li>
        <li>Con Premium: mapas descargados para usar sin internet.</li>
        <li>No disponible: planear rutas, reportes nuevos y amigos.</li>
      </ul>
      <Button href="/inicio" className="mt-8">Reintentar</Button>
    </div>
  );
}
