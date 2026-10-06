# Waylo

App web móvil (mobile-first) para ciclistas y usuarios de scooter en el Área Metropolitana de Monterrey. Prioriza llegar seguro: rutas con Safety Score, mapa de calor de riesgo y reportes de la comunidad.

**Fase 1: solo interfaces.** Todos los datos son simulados (`src/mocks`).

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # opcional
npm run dev                  # http://localhost:3000
```

- `/catalogo`: enlaces a todas las pantallas.
- `/design`: guía de estilo.
- En escritorio la app se centra en un contenedor tipo teléfono.

## Variable de entorno del mapa

`NEXT_PUBLIC_MAPTILER_KEY`: llave de MapTiler. Si está vacía se usa un estilo gratuito de respaldo (OpenFreeMap), así que el mapa siempre carga.

## Estructura

- `src/app`: rutas. `(phone)` agrupa las pantallas de la app; `(tabs)` añade la barra inferior.
- `src/components`: `ui`, `map`, `domain`, `layout`, `screens`.
- `src/lib/data`: única capa que lee los mocks; los componentes reciben datos por props.
- `src/lib/geo`: geolocalización (descarta lecturas con precisión > 30 m), simulación de rodada y Wake Lock.
- `tailwind.config.ts`: tokens de color y tipografía.

La rodada en vivo usa modo simulación por defecto (desactívalo para usar el GPS real). La simulación avanza más rápido que una rodada real para facilitar la revisión.

## Pendiente para fase 2

- Base de datos (Supabase + PostGIS): usuarios, rodadas (trazas), reportes y rodadas grupales, en lugar de `src/mocks`.
- Autenticación real (login, registro, Google y Apple, recuperar contraseña).
- Rutas reales (OpenRouteService desde API Routes) y cálculo del Safety Score por factor.
- Map matching de las trazas (GraphHopper o Valhalla).
- Mapa de calor alimentado por reportes reales.
- Envío de reportes al municipio y seguimiento de su estado.
- Reporte por voz, notificaciones y pagos de Premium.
- Reemplazar las funciones de `src/lib/data` por consultas reales.
