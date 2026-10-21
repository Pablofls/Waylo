# Sesión B2: Persistencia y validación de rodadas en el tiempo real

## Cómo abrir esta sesión

1. En tu Mac, crea una carpeta de trabajo propia (un `git worktree`) desde `main`:

```bash
cd ~/Claude/Waylo-main && git fetch origin && git worktree add ../Waylo-b2 -b realtime-persistencia origin/main
```

2. Después abre una sesión nueva apuntando a esa carpeta (`Waylo-b2`) y escribe:

```text
Ejecuta docs/prompts/sesion-b2-persistencia.md
```

**Rama:** `realtime-persistencia` (desde `main`). Alcance: solo `services/realtime/**`. Antes de empezar lee y cumple `docs/prompts/reglas-comunes.md`.

## Contexto
La sesión B entregó el servicio de tiempo real (Flask + Flask-Sock) y ya corre en la VM (`waylo-realtime`, `127.0.0.1:5950`). Falta lo que dependía del esquema de la sesión A, que ya está en `main`. Lee `docs/arquitectura.md`, `docs/pendientes-integracion.md` (puntos 1 a 3), `docs/base-de-datos.md` y `db/migrations/007_rodadas_y_tiempo_real.sql` (`rodada`, `ride_points`, `comparticion_ubicacion`). **No hay vehículos simulados:** la única fuente es el GPS real de clientes autenticados.

## Alcance
1. **Validar la rodada** en cada `position`: se acepta solo si `ride_id` existe, pertenece al usuario del token y está en curso (`finalizada_en IS NULL AND eliminada_en IS NULL`). Si no, responde `error` con código `ride_invalida` (sin cerrar la conexión salvo abuso). Consulta a Postgres detrás de una interfaz (`RideRegistry`), con **caché corta** (10 s) y caché negativa breve. **Falla cerrado:** con `DATABASE_URL` definida, si no se puede verificar la rodada se rechaza el mensaje (`ride_no_verificable`), nunca se acepta por defecto.
2. **`PostgresPositionStore`** con `psycopg` 3 y `DATABASE_URL` (rol `waylo_app`, que ya trae `search_path=waylo,public`): inserta en `ride_points (ride_id, ts, geog, speed, heading, accuracy)` con `ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography` y `ON CONFLICT (ride_id, ts) DO NOTHING`. Sin `user_id` (por normalización). Una conexión por lote, con reintento ante errores transitorios y el tope de buffer que ya existe.
3. **Escribir fuera del candado del hub.** Hoy `BatchWriter.flush` corre dentro de `Hub._lock`: con Postgres lento bloquearía a todos. Usa una cola y un hilo escritor; `hub.handle_gps_message` solo encola. Vacía la cola al cerrar el proceso (señal de término del worker de gunicorn).
4. **Salud:** `/health` agrega el tipo de almacenamiento (`postgres` o `null`), puntos pendientes en cola y el último error de escritura (solo el tipo, sin datos personales).
5. **Pruebas:**
   - Unitarias con almacenamiento y registro falsos (sin base de datos): rodada ajena, finalizada, inexistente, caché, falla cerrada, cola y vaciado.
   - Una prueba de **integración** (marcada, se omite sin `TEST_DATABASE_URL`) para correr en la VM: crea una rodada de prueba con una persona de demostración, escribe puntos, comprueba filas en `ride_points` y **limpia todo lo que creó** (aun si la prueba falla).
6. Actualiza `services/realtime/README.md` y `.env.example` (sin secretos).

## Reglas de diseño
- La unidad de systemd ejecuta `/usr/bin/python3.12 -m gunicorn` con `PYTHONPATH` al entorno virtual (SELinux bloquea el enlace `.venv/bin/python`): no cambies cómo se invoca. Un solo worker.
- El mensaje de posición del cliente **no** cambia (contrato en `docs/arquitectura.md`). Si necesitas cambiar el contrato, escribe `docs/propuestas/realtime-persistencia.md`.
- **Compartir ubicación sin rodada:** toda posición requiere una rodada en curso. La pantalla "Compartir ubicación en vivo" crea una rodada ligera ("Ubicación compartida") desde la API de la app (sesión C); este servicio no crea rodadas.
- Nunca registres coordenadas ni tokens en logs: solo ids y tipos de error.

## Entrega
1. Rama `realtime-persistencia` subida y actualizada con `origin/main`.
2. Resumen de decisiones.
3. **Comandos exactos para la VM**, en orden: `git pull`, instalar `requirements.txt` en `services/realtime/.venv` si cambiaron, reiniciar `waylo-realtime`, verificar `/health` (debe decir `postgres`), correr la prueba de integración con `TEST_DATABASE_URL` (explica de dónde sacarla sin pegar contraseñas en el chat) y cómo comprobar filas en `ride_points`.
4. Cómo revertir.
