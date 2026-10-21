# Sesión D: Despliegue en la VM de Google Cloud

## Cómo abrir esta sesión

> Esta sesión ya se completó y se integró a `main`. Si hubiera que repetirla, usa un nombre de rama nuevo (por ejemplo `despliegue-2`).

1. En tu Mac, crea una carpeta de trabajo propia (un `git worktree`) desde `main`:

```bash
cd ~/Claude/Waylo-main && git fetch origin && git worktree add ../Waylo-despliegue -b despliegue origin/main
```

2. Después abre una sesión nueva apuntando a esa carpeta (`Waylo-despliegue`) y escribe:

```text
Ejecuta docs/prompts/sesion-d-despliegue.md
```

**Rama:** `despliegue`. Antes de empezar lee y cumple `docs/prompts/reglas-comunes.md` (crea tu rama desde `main`, no toques `main`, trabaja solo en `deploy/**` y `docs/vm-setup.md`).

## Contexto
Lee `docs/arquitectura.md` y `docs/vm-setup.md`. El servidor es **CentOS Stream 10** con Node 22, Python 3.12, Git, Nginx 1.26 y PostgreSQL 16 con PostGIS 3.5.3. **Comparte la VM con otro proyecto**: Nginx ya sirve HTTPS en el 443 con un bloque `server_name _` y proxies a los puertos 5000 a 5006 y 3000. No debes modificar esos bloques ni usar esos puertos. IP externa: 34.51.108.167; nombre de host de Waylo: `34-51-108-167.sslip.io` (provisional). Waylo usa el puerto 3100 (web) y el 5950 (tiempo real), ambos en `127.0.0.1`.

## Alcance (todo en `deploy/` y `docs/vm-setup.md`)
1. `deploy/nginx/waylo.conf`: archivo para `/etc/nginx/conf.d/` con un server propio para el nombre de host de Waylo (80 con redirección a 443 y 443 con TLS), `proxy_pass` de `/` a `127.0.0.1:3100`, de `/ws` a `127.0.0.1:5950` con cabeceras de WebSocket (`Upgrade`, `Connection`, tiempos de espera largos) y `/health/waylo` a `127.0.0.1:5950/health`. Sin tocar los bloques existentes. Cabeceras de seguridad razonables.
2. `deploy/systemd/waylo-web.service` y `waylo-realtime.service`: bajo el usuario `pablogcp26` (sin privilegios), `WorkingDirectory` en `~/Waylo`, `EnvironmentFile=/etc/waylo/waylo.env`, reinicio automático, límites básicos y registros en `journalctl`. Web: `npm run start -- -p ${WEB_PORT}` (Next.js, después de `next build`). Tiempo real: `gunicorn -w 1 -k gthread --threads 50 -b ${REALTIME_HOST}:${REALTIME_PORT} app:app` desde `services/realtime` usando su entorno virtual (**un solo worker**).
3. `deploy/deploy.sh`: `git pull` en `main`, `npm ci`, `next build`, entorno virtual de Python y `pip install -r` **solo si existe** `services/realtime`, `db/apply.sh` **solo si existe**, reinicio de los servicios, verificación de salud (`/health/waylo` y la web) y mensajes claros si falla; no debe dejar la app caída si el build falla (construir antes de reiniciar). Debe tolerar que algunas piezas aún no existan en `main`.
4. `deploy/.env.example` (producción, sin secretos) y la plantilla de `/etc/waylo/waylo.env` (propiedad `root:pablogcp26`, permisos 640).
5. Certificado: pasos con `certbot --nginx` para el nombre de host (HTTP-01 por el 80), renovación automática y verificación.
6. Compatibilidad con **SELinux** (`httpd_can_network_connect`, contextos si hace falta) y revisión del firewall de Google Cloud (80 y 443; los puertos 3100 y 5950 **no** deben quedar expuestos).
7. Actualiza `docs/vm-setup.md` con cualquier corrección y una **lista de verificación** final.

## Qué NO hacer
- No modificar ni reemplazar la configuración del otro proyecto, ni reiniciar sus servicios, ni abrir puertos nuevos al exterior.
- No poner contraseñas, secretos ni tokens en archivos del repo.
- No ejecutar nada en la VM: entrega los comandos y el usuario los corre.

## Entrega
1. Rama `despliegue` subida y actualizada con `origin/main`.
2. **Comandos exactos y en orden para la VM**, cada uno con qué hace y cómo verificarlo (instalar `waylo.conf`, `nginx -t`, recargar, certbot, crear `/etc/waylo/waylo.env`, instalar las unidades systemd, habilitarlas, primer despliegue, pruebas con `curl`).
3. Cómo ver registros, reiniciar y **revertir** (volver a la versión anterior con `git` y reiniciar) si algo falla.
4. Riesgos que veas para el otro proyecto de la VM, si hay alguno.
