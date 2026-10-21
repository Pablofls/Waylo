# Inventario de pantallas de Waylo

Estado de las pantallas antes de pasar a base de datos y lógica (fase 2 y 3).
Prioridad: P0 imprescindible para un uso completo, P1 importante, P2 deseable.

## Construidas (fase 1)

| Área | Pantalla | Ruta |
|---|---|---|
| Acceso | Bienvenida, inicio de sesión, registro y onboarding | `/`, `/login`, `/registro` |
| Inicio | Inicio: mis rodadas, comunidad y amigos | `/inicio` |
| Mapa | Mapa con riesgo, destino y 3 rutas; desglose del Safety Score | `/mapa`, `/rutas/[id]` |
| Rodada | Comenzar (libre o guiada) y resumen | `/rodada`, `/rodada/resumen` |
| Reportes | Reporte rápido, mis reportes y detalle | `/reportes`, `/reportes/[id]` |
| Amigos | Lista, solicitudes, búsqueda y perfil de personas | `/amigos`, `/personas/[id]` |
| Rodadas grupales | Lista con filtros, detalle, asistentes, crear y editar | `/comunidad`, `/rodadas/[id]`, `/rodadas/[id]/asistentes`, `/rodadas/nueva`, `/rodadas/[id]/editar` |
| Cuenta | Perfil, editar perfil, configuración y Premium | `/perfil`, `/perfil/editar`, `/configuracion`, `/premium` |
| Cuenta | Recuperar contraseña | `/recuperar` |
| Permisos | Ubicación desactivada | `/permisos/ubicacion` |
| Mapa | Lugares guardados | `/lugares` |
| Rodada | Detalle de rodada pasada | `/actividad/[id]` |
| Reportes | Completar reporte y reporte de la comunidad (confirmar) | `/reportes/[id]/completar`, `/reportes-comunidad/[id]` |
| Notificaciones | Centro de notificaciones | `/notificaciones` |
| Sistema | Página no encontrada, error, sin conexión y esqueletos de carga | `not-found.tsx`, `error.tsx`, `/sin-conexion`, `loading.tsx` |
| Cuenta | Verificar correo, cambiar contraseña, términos y privacidad | `/verificar`, `/configuracion/contrasena`, `/legal/[doc]` |
| Permisos | Notificaciones | `/permisos/notificaciones` |
| Mapa | Rutas guardadas, filtros del mapa, preferencias de ruta | `/rutas-guardadas`, `/mapa`, `/configuracion/rutas` |
| Rodada | Compartir viaje, recalcular ruta, emergencia y alerta de caída; contactos de emergencia | `/rodada`, `/configuracion/emergencia` |
| Reportes | Editar y cancelar un reporte propio | `/reportes/[id]` |
| Social | Bloquear y reportar usuario, bloqueados; insignias | `/personas/[id]`, `/configuracion/bloqueados`, `/insignias` |
| Notificaciones | Preferencias detalladas | `/configuracion/notificaciones` |
| Premium | Pago, confirmación, suscripción y aviso de función bloqueada | `/premium/pago`, `/premium/confirmacion`, `/premium/suscripcion` |
| Ayuda | Centro de ayuda, contacto y guía del Safety Score | `/ayuda`, `/ayuda/contacto`, `/ayuda/safety-score` |

| Cuenta | Sesión vencida | `/sesion-vencida` |
| Mapa | Historial de búsquedas (en el buscador del Mapa) | `/mapa` |
| Mapa | Mapas sin conexión, seguridad por zona y detalle de zona (Premium) | `/mapas-sin-conexion`, `/zonas`, `/zonas/[id]` |
| Rodada | Compartir ubicación en vivo y vista de quien te sigue | `/compartir-ubicacion`, `/seguimiento/[id]` |
| Reportes | Reglas de reporte y reportar contenido inapropiado | `/ayuda/reglas-reportes`, `/reportes-comunidad/[id]` |
| Social | Reacciones y comentarios en actividad | `/publicacion/[id]` |
| Social | Retos, ranking mensual y clubes (lista, detalle, crear) | `/retos`, `/comunidad`, `/clubes/[id]`, `/clubes/nuevo` |
| Premium | Historial de pagos y recibo | `/premium/pagos`, `/premium/pagos/[id]` |
| Ayuda | Enviar comentarios, acerca de y licencias | `/ayuda/comentarios`, `/acerca-de`, `/acerca-de/licencias` |

## Pendientes

Ninguna pantalla pendiente de la fase 1. Siguen siendo de demostración (datos en memoria o simulados): pagos, códigos de verificación, descargas de mapas, detección de caídas, reacciones, comentarios y clubes. Se conectan a datos reales en las fases 2 y 3.
