import { ScreenHeader } from "@/components/layout/ScreenHeader";

const libs = [
  { n: "Next.js", l: "MIT", d: "Framework web" },
  { n: "React", l: "MIT", d: "Interfaz de usuario" },
  { n: "MapLibre GL JS", l: "BSD-3-Clause", d: "Mapas interactivos" },
  { n: "Tailwind CSS", l: "MIT", d: "Estilos" },
  { n: "Lucide", l: "ISC", d: "Íconos" },
  { n: "Inter y Barlow Condensed", l: "SIL Open Font License", d: "Tipografías" },
  { n: "OpenStreetMap", l: "ODbL", d: "Datos del mapa © colaboradores de OpenStreetMap" },
  { n: "OpenFreeMap y OpenMapTiles", l: "Abierta", d: "Estilo y teselas del mapa de respaldo" },
];

export default function LicenciasPage() {
  return (
    <>
      <ScreenHeader title="Licencias" subtitle="Software y datos de terceros" back="/acerca-de" />
      <ul className="flex-1 divide-y divide-line overflow-y-auto bg-white">
        {libs.map((x) => (
          <li key={x.n} className="px-4 py-3.5"><p className="font-semibold">{x.n}</p><p className="text-sm text-muted">{x.l} · {x.d}</p></li>
        ))}
      </ul>
    </>
  );
}
