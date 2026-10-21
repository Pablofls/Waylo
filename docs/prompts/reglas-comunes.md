# Reglas comunes para todas las sesiones

Toda sesión de trabajo en paralelo debe leer y cumplir este documento. La **sesión principal** (la que coordina el proyecto) es la única que integra ramas en `main`.

## Ramas

1. Al empezar, actualiza y crea tu propia rama **desde `main`**, con el nombre que indica tu prompt:
   ```bash
   git fetch origin && git checkout main && git pull && git checkout -b <tu-rama>
   ```
2. Trabaja y haz commits **solo en tu rama**. Sube con `git push -u origin <tu-rama>` (puedes subir seguido).
3. **Nunca** hagas push a `main`, ni merge a `main`, ni force push.
4. Antes de avisar que terminaste, trae lo nuevo de `main` y resuelve conflictos en tu rama:
   ```bash
   git fetch origin && git merge origin/main
   ```
5. Al terminar, avisa al usuario con: nombre de la rama, resumen de lo hecho, qué archivos tocaste y los comandos exactos para correr en la VM. La sesión principal revisa e integra a `main`.

## Qué archivos son de cada sesión

Para evitar conflictos, cada sesión modifica **solo** lo suyo:

| Sesión | Rama | Archivos propios |
|---|---|---|
| A. Base de datos | `db-esquema` | `db/**`, `docs/base-de-datos.md` |
| B. Tiempo real | `realtime` | `services/realtime/**` |
| B2. Persistencia del tiempo real | `realtime-persistencia` | `services/realtime/**` (no a la vez que B) |
| D. Despliegue | `despliegue` | `deploy/**`, `docs/vm-setup.md` |
| C. App con datos reales | `app-datos` | `src/**`, `package.json`, `package-lock.json`, `README.md` |

- **No edites `docs/arquitectura.md`** (es el contrato). Si necesitas cambiarlo, descríbelo en un archivo `docs/propuestas/<tu-rama>.md` y avisa: la sesión principal decide e integra el cambio.
- Cada sesión usa su propio `.env.example` dentro de su carpeta (`db/.env.example`, `services/realtime/.env.example`, `deploy/.env.example`). No hay un `.env.example` compartido en la raíz.

## Carpeta de trabajo propia (importante)

Varias sesiones abiertas en la misma carpeta se pisan las ramas y los archivos sin commit (ya pasó). **Cada sesión nueva trabaja en su propio directorio de trabajo de git**, creado desde `origin/main`:

```bash
git worktree add ../Waylo-<rama> -b <rama> origin/main
```

y se abre la sesión en esa carpeta. Además, nunca uses `git add -A`: agrega solo las rutas de tu alcance.

## Orden de integración

1. A y D (no dependen entre sí), en cualquier orden.
2. B (necesita las tablas de A para guardar `ride_points`; si A aún no está en `main`, B usa una interfaz y se completa después).
3. C al final, cuando A y B ya están en `main`.

## Reglas generales del proyecto

- Responde y documenta en español de México. Sin emojis en la interfaz.
- **El GPS es el real del teléfono: no hay vehículos ni posiciones simuladas** (ver `docs/arquitectura.md`).
- La VM de Google Cloud es compartida con otro proyecto (`libreria_db`, servicios en los puertos 5000 a 5006 y 3000, bloques de Nginx existentes). **No toques sus bases, puertos ni configuración.**
- Nunca pongas secretos ni contraseñas en Git ni en el chat.
- El usuario corre los comandos en la VM; entrega siempre los comandos exactos, en orden, y cómo comprobar que funcionaron.
- Antes de implementar algo grande, presenta un plan breve y espera la aprobación del usuario.
