import { notFound } from "next/navigation";
import { ScreenHeader } from "@/components/layout/ScreenHeader";

const docs: Record<string, { title: string; updated: string; sections: { h: string; p: string }[] }> = {
  terminos: {
    title: "Términos y condiciones",
    updated: "1 de octubre de 2026",
    sections: [
      { h: "1. Qué es Waylo", p: "Waylo es una aplicación que sugiere rutas para bicicleta y scooter con un Safety Score y reúne reportes de la comunidad. El Safety Score es una estimación y no garantiza la seguridad de un trayecto." },
      { h: "2. Tu responsabilidad", p: "Respeta las leyes de tránsito, usa casco y luces, y no manipules la app mientras avanzas. Tú decides si seguir una ruta sugerida." },
      { h: "3. Reportes", p: "Los reportes deben ser verídicos y referirse a condiciones reales del camino. Podemos retirar contenido falso, ofensivo o repetido." },
      { h: "4. Envío al municipio", p: "Los reportes que envíes podrán compartirse con las autoridades municipales para su atención. Waylo no controla los tiempos de respuesta." },
      { h: "5. Waylo Premium", p: "Premium es una suscripción mensual que puedes cancelar en cualquier momento. Conservas los beneficios hasta el final del periodo pagado." },
      { h: "6. Cambios", p: "Podemos actualizar estos términos y te avisaremos dentro de la app antes de que entren en vigor." },
    ],
  },
  privacidad: {
    title: "Aviso de privacidad",
    updated: "1 de octubre de 2026",
    sections: [
      { h: "Qué datos recabamos", p: "Nombre, correo, tu ubicación mientras la app está abierta, tus rodadas y los reportes que envías." },
      { h: "Para qué los usamos", p: "Calcular rutas y alertas, mostrar tu historial, mantener el mapa de riesgo y avisarte del estado de tus reportes." },
      { h: "Quién puede verlos", p: "Tú decides si tus rodadas son visibles para todos, solo para amigos o solo para ti. Los reportes enviados al municipio incluyen la ubicación, no tu perfil, si activas reportes anónimos." },
      { h: "Tus derechos", p: "Puedes acceder, corregir, descargar o eliminar tus datos desde Configuración, en cualquier momento." },
      { h: "Contacto", p: "Escríbenos desde Ayuda y soporte para cualquier duda sobre tus datos personales." },
    ],
  },
};

export default async function LegalPage({ params }: { params: Promise<{ doc: string }> }) {
  const { doc } = await params;
  const d = docs[doc];
  if (!d) notFound();
  return (
    <>
      <ScreenHeader title={d.title} subtitle={`Actualizado el ${d.updated}`} back="/configuracion" />
      <article className="flex-1 overflow-y-auto bg-white px-4 pb-8 pt-3">
        <p className="mb-4 rounded-xl bg-canvas p-3 text-xs text-muted">Texto de ejemplo del prototipo. El documento legal definitivo se redactará antes del lanzamiento.</p>
        {d.sections.map((s) => (
          <section key={s.h} className="mb-5">
            <h2 className="text-lg font-bold">{s.h}</h2>
            <p className="mt-1 text-[15px] leading-relaxed">{s.p}</p>
          </section>
        ))}
      </article>
    </>
  );
}
