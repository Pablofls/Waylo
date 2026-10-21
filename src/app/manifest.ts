import type { MetadataRoute } from "next";

/** Manifiesto de la app web: permite instalarla en la pantalla de inicio y abrirla sin las barras del navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Waylo",
    short_name: "Waylo",
    description: "Rutas más seguras para bici y scooter en el Área Metropolitana de Monterrey.",
    lang: "es-MX",
    start_url: "/inicio",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#072E28",
    theme_color: "#0F6B5C",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
