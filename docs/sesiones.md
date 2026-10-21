# Sesiones de trabajo paralelas

El trabajo se divide en sesiones independientes, **cada una en su propia rama**. La **sesión principal** (la de coordinación) revisa e integra cada rama a `main`; ninguna otra sesión toca `main`.

Todas deben leer primero `docs/arquitectura.md`, `docs/vm-setup.md` y [`prompts/reglas-comunes.md`](prompts/reglas-comunes.md) (ramas, propiedad de archivos, orden de integración y reglas generales).

## Cómo se usa

1. Crea una carpeta de trabajo propia para la sesión y ábrela ahí (cada prompt trae sus dos pasos en la sección "Cómo abrir esta sesión"): un `git worktree` desde `main`, y en la sesión nueva escribe "Ejecuta `docs/prompts/<archivo>.md`".
2. La sesión crea su rama desde `main`, trabaja y sube sus cambios a esa rama.
3. Al terminar te avisa con la rama, el resumen y los comandos para la VM.
4. Vuelves a la sesión principal y se integra la rama a `main` (pull request o merge revisado).
5. En la VM: `git pull` en `main` y los comandos que haya entregado la sesión.

## Sesiones

| Sesión | Prompt | Rama | Depende de |
|---|---|---|---|
| A. Base de datos (normalizada a 4FN) | [`prompts/sesion-a-base-de-datos.md`](prompts/sesion-a-base-de-datos.md) | `db-esquema` | Nada |
| B. Servicio en tiempo real (GPS real) | [`prompts/sesion-b-tiempo-real.md`](prompts/sesion-b-tiempo-real.md) | `realtime` | A (para guardar `ride_points`) |
| B2. Persistencia y validación de rodadas (seguimiento de B) | [`prompts/sesion-b2-persistencia.md`](prompts/sesion-b2-persistencia.md) | `realtime-persistencia` | A y B en `main` (ya) |
| D. Despliegue en la VM | [`prompts/sesion-d-despliegue.md`](prompts/sesion-d-despliegue.md) | `despliegue` | Nada |
| C. App con datos reales | [`prompts/sesion-c-app-datos.md`](prompts/sesion-c-app-datos.md) | `app-datos` | A y B en `main` |

Orden de integración: A y D primero, luego B y, al final, C.

## Integrar una rama (sesión principal)

```bash
git fetch origin && git checkout main && git pull
git merge --no-ff origin/<rama>
git push origin main
```

Antes de integrar: revisar el diff, comprobar que solo se tocaron los archivos propios de esa sesión (tabla de `reglas-comunes.md`) y que no hay secretos.
