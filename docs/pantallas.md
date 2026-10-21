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
| Cuenta | Perfil y Premium | `/perfil`, `/premium` |

## Pendientes

### Cuenta y acceso
| Pantalla | Prioridad |
|---|---|
| Recuperar contraseña (correo, código, nueva contraseña) | P0 |
| Verificación de correo | P1 |
| Editar perfil (foto, nombre, bio, ciudad) | P0 |
| Cambiar contraseña | P1 |
| Cerrar sesión con confirmación | P1 |
| Eliminar cuenta | P1 |
| Términos y aviso de privacidad | P1 |
| Sesión vencida | P2 |

### Onboarding y permisos
| Pantalla | Prioridad |
|---|---|
| Permiso de notificaciones | P1 |
| Ubicación denegada: cómo activarla | P0 |
| Tutorial del Safety Score y del mapa de riesgo | P1 |

### Mapa y rutas
| Pantalla | Prioridad |
|---|---|
| Lugares guardados (casa, escuela, favoritos): ver, agregar, editar | P0 |
| Rutas guardadas y habituales | P1 |
| Historial de búsquedas | P2 |
| Compartir ruta y hora de llegada con un contacto | P1 |
| Preferencias de ruta (evitar zonas, preferir ciclovía) | P1 |
| Filtros del mapa (tipo y antigüedad de reportes) | P1 |
| Detalle de una zona e historial de seguridad (Premium) | P2 |
| Mapas sin conexión (Premium) | P2 |
| Estado sin conexión | P1 |

### Rodada
| Pantalla | Prioridad |
|---|---|
| Detalle de una rodada pasada (mapa, métricas, Score por tramo) | P0 |
| Editar o borrar una rodada | P1 |
| Compartir una rodada | P1 |
| Recalcular ruta al desviarse | P1 |
| Alerta de caída con cuenta regresiva y contactos de emergencia | P1 |
| Contactos de emergencia: gestionar | P1 |
| Compartir ubicación en vivo | P2 |

### Reportes
| Pantalla | Prioridad |
|---|---|
| Completar reporte (foto, descripción, severidad, ubicación) | P0 |
| Reportar desde el mapa (fuera de una rodada) | P0 |
| Detalle de un reporte de la comunidad con confirmar o "ya no está" | P0 |
| Editar o cancelar un reporte propio | P1 |
| Reglas de reporte (qué sí y qué no) | P2 |
| Reportar contenido inapropiado | P2 |

### Comunidad y social
| Pantalla | Prioridad |
|---|---|
| Notificaciones de amistad y rodadas | P0 |
| Reacciones y comentarios en actividad | P2 |
| Retos y ranking mensual | P2 |
| Catálogo y detalle de insignias | P1 |
| Clubes: lista, detalle, unirse, crear | P2 |
| Bloquear y reportar usuario | P1 |
| Privacidad del perfil (quién ve mis rodadas) | P1 |

### Notificaciones
| Pantalla | Prioridad |
|---|---|
| Centro de notificaciones (alertas, reportes, amigos, rodadas) | P0 |
| Preferencias detalladas | P1 |

### Premium y pagos
| Pantalla | Prioridad |
|---|---|
| Pago simulado y confirmación | P1 |
| Administrar suscripción (cambiar o cancelar) | P1 |
| Historial de pagos y recibos | P2 |
| Aviso "Disponible en Premium" en funciones bloqueadas | P1 |

### Configuración y ayuda
| Pantalla | Prioridad |
|---|---|
| Configuración general (unidades, tema, privacidad, datos) | P0 |
| Centro de ayuda y preguntas frecuentes | P1 |
| Contacto y soporte | P1 |
| Enviar comentarios | P2 |
| Acerca de, versión y licencias | P2 |

### Estados transversales
| Pantalla | Prioridad |
|---|---|
| Página no encontrada | P0 |
| Error genérico | P0 |
| Sin conexión | P1 |
| Esqueletos de carga por pantalla | P1 |
