# Preparación de la VM (CentOS Stream 10)

La VM ya tiene Node 22, Python 3.12, Git, Nginx 1.26 y PostgreSQL 16. Comparte instancia con otro proyecto (`libreria_db`, servicios en 5000 a 5006 y 3000): **no tocar sus bases, puertos ni bloques de Nginx**.

Los comandos se corren en la VM. Las contraseñas se escriben en la terminal, nunca en el chat ni en Git.

## 1. PostGIS

PostgreSQL es el paquete de la distribución, así que PostGIS debe venir de EPEL.

```bash
sudo dnf install -y epel-release && sudo dnf config-manager --set-enabled crb
```

```bash
dnf list available '*postgis*' '*postgresql-contrib*'
```

En la VM de Waylo ya se confirmó: `postgis` 3.5.3 y `postgresql-contrib` 16.14 están en AppStream. Instala **solo** estos (no los `postgresql18-postgis`, son para otra versión de Postgres):

```bash
sudo dnf install -y postgis postgresql-contrib
```

Verifica (pide la contraseña de `postgres`; debe listar `postgis` 3.5.3):

```bash
psql -h 127.0.0.1 -U postgres -tAc "select name, default_version from pg_available_extensions where name like 'postgis%'"
```

No hace falta reiniciar PostgreSQL: la extensión se activa por base de datos con `CREATE EXTENSION` en el paso siguiente.

## 2. Base de datos y roles de Waylo

Genera dos contraseñas distintas y guárdalas en un gestor, no en el repo.

```bash
psql -h 127.0.0.1 -U postgres
```

Dentro de `psql`:

```sql
CREATE ROLE waylo_user LOGIN PASSWORD 'CAMBIA_ESTA_1';
CREATE ROLE waylo_app  LOGIN PASSWORD 'CAMBIA_ESTA_2';
CREATE DATABASE waylo_db OWNER waylo_user;
\c waylo_db
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT CONNECT ON DATABASE waylo_db TO waylo_app;
```

Las tablas y permisos de `waylo_app` los crean las migraciones de `db/`.

## 3. Clonar el repositorio

```bash
git clone git@github.com:Pablofls/Waylo.git ~/Waylo
```

(Si la VM no tiene llave SSH de GitHub, usa HTTPS con un token de acceso personal o agrega una llave de despliegue.)

## 4. HTTPS con un nombre propio

Waylo necesita su propio nombre de host con certificado válido (el GPS del teléfono exige HTTPS). Mientras no haya dominio: `34-51-108-167.sslip.io`.

El orden importa: Nginx no valida un bloque 443 sin certificado, así que primero se instala solo el bloque del puerto 80 (`deploy/nginx/waylo-http.conf`), se emite el certificado por HTTP-01 (webroot) y después se instala la configuración final. Así Certbot no edita ningún archivo de Nginx, ni los del otro proyecto.

```bash
sudo dnf install -y certbot
sudo mkdir -p /var/www/certbot
sudo cp ~/Waylo/deploy/nginx/waylo-http.conf /etc/nginx/conf.d/waylo.conf
sudo nginx -t && sudo systemctl reload nginx
```

Verifica que el desafío sea alcanzable (debe responder 404, no error de conexión):

```bash
curl -sI http://34-51-108-167.sslip.io/.well-known/acme-challenge/prueba | head -1
```

Emite el certificado:

```bash
sudo certbot certonly --webroot -w /var/www/certbot -d 34-51-108-167.sslip.io
```

Instala la configuración final, valida y recarga:

```bash
sudo cp ~/Waylo/deploy/nginx/waylo.conf /etc/nginx/conf.d/waylo.conf
sudo nginx -t && sudo systemctl reload nginx
```

Renovación automática (el paquete de Certbot instala un temporizador; la renovación recarga Nginx):

```bash
systemctl list-timers | grep -i certbot
echo -e '#!/bin/sh\nsystemctl reload nginx' | sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh >/dev/null
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
sudo certbot renew --dry-run
```

Si el temporizador no aparece: `sudo systemctl enable --now certbot-renew.timer` (o `certbot.timer`, según el paquete).

Notas:
- El bloque de Waylo usa `server_name` propio; el bloque existente `server_name _` no se modifica.
- Como Nginx hace proxy a puertos locales, en CentOS hace falta permitirlo en SELinux (si no está ya; es un ajuste global del sistema):

```bash
getsebool httpd_can_network_connect || true
sudo setsebool -P httpd_can_network_connect 1
```

- Reserva la IP como **estática** en Google Cloud (VPC, Direcciones IP) para que no cambie al reiniciar la VM.
- Firewall de Google Cloud: deben estar abiertos solo 80 y 443 (el otro proyecto ya usa el 443). Los puertos 3100 y 5950 **no** deben tener regla de entrada. Revisión desde la consola (VPC, Firewall) o con `gcloud compute firewall-rules list --format="table(name,direction,sourceRanges.list(),allowed[].map().firewall_rule().list())"`. Ambos servicios escuchan solo en `127.0.0.1`, lo que se comprueba en el paso 5.

## 5. Procesos

Dos servicios systemd (`waylo-web`, `waylo-realtime`) bajo el usuario `pablogcp26`, con variables en `/etc/waylo/waylo.env` (propiedad `root:pablogcp26`, permisos 640, para que el servicio y `deploy.sh` puedan leerlo y nadie más).

Crea el archivo desde la plantilla y llena los valores (genera cada secreto con `openssl rand -hex 32`; escribe la contraseña de `waylo_app` solo en la VM):

```bash
sudo mkdir -p /etc/waylo
sudo cp ~/Waylo/deploy/waylo.env.template /etc/waylo/waylo.env
sudo chown root:pablogcp26 /etc/waylo/waylo.env && sudo chmod 640 /etc/waylo/waylo.env
sudo nano /etc/waylo/waylo.env
```

Instala las unidades. Antes confirma la ruta de Node con `command -v npm`; si no es `/usr/bin/npm`, ajusta `ExecStart` en `waylo-web.service`.

```bash
sudo cp ~/Waylo/deploy/systemd/waylo-web.service ~/Waylo/deploy/systemd/waylo-realtime.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable waylo-web waylo-realtime
```

Permiso para que `deploy.sh` reinicie solo estos dos servicios sin contraseña:

```bash
sudo cp ~/Waylo/deploy/sudoers/waylo /etc/sudoers.d/waylo
sudo chmod 440 /etc/sudoers.d/waylo && sudo visudo -cf /etc/sudoers.d/waylo
```

Primer despliegue (construye, instala dependencias y reinicia; las unidades se inician aquí). Si `services/realtime` aún no está en `main`, el script omite esa pieza y `waylo-realtime` no arrancará todavía:

```bash
cd ~/Waylo && ./deploy/deploy.sh
```

Si `waylo-realtime` falla con `Permission denied` o `AVC` (SELinux), revisa `sudo ausearch -m avc -ts recent` y `journalctl -u waylo-realtime -n 50`.

Comprobación de que solo escuchan en local:

```bash
sudo ss -ltnp | grep -E ':(3100|5950)\b'
```

Debe mostrar `127.0.0.1:3100` y `127.0.0.1:5950`, nunca `0.0.0.0` ni `[::]`.

## 6. Actualizar, registros y revertir

Actualizar (`deploy.sh` ya hace `git pull --ff-only` en `main`):

```bash
cd ~/Waylo && ./deploy/deploy.sh
```

Registros y reinicio:

```bash
journalctl -u waylo-web -f
journalctl -u waylo-realtime -f
sudo systemctl restart waylo-web waylo-realtime
sudo systemctl status waylo-web waylo-realtime --no-pager
```

Revertir a la versión anterior (si el despliegue falló, el script imprime el commit previo):

```bash
cd ~/Waylo && git log --oneline -5
git checkout <commit-anterior> && ./deploy/deploy.sh --sin-pull
```

Para volver a seguir `main` después: `git checkout main && git pull`. Si el build falla, los servicios no se tocan y siguen con la versión que ya corría. Las migraciones de `db/` no se revierten solas: si una migración fue el problema, hay que corregirla con una migración nueva.

## Lista de verificación

- [ ] PostGIS instalado y extensión creada en `waylo_db`
- [ ] Roles `waylo_user` y `waylo_app` creados
- [ ] Repositorio clonado en `~/Waylo`
- [ ] `sudo nginx -t` sin errores y bloque de Waylo cargado
- [ ] Certificado emitido para el nombre de host y `sudo certbot renew --dry-run` correcto
- [ ] `httpd_can_network_connect` activo
- [ ] `/etc/waylo/waylo.env` con `root:pablogcp26` y permisos 640, sin `CAMBIAR` pendientes
- [ ] `waylo-web` y `waylo-realtime` habilitados y activos (`systemctl is-active`)
- [ ] `ss -ltnp` muestra 3100 y 5950 solo en `127.0.0.1`
- [ ] Firewall de Google Cloud sin reglas para 3100 ni 5950
- [ ] `curl https://34-51-108-167.sslip.io/health/waylo` responde `ok`
- [ ] `curl -I https://34-51-108-167.sslip.io/` responde 200 con cabeceras de seguridad
- [ ] El otro proyecto sigue respondiendo igual (sus puertos y su bloque de Nginx intactos)
- [ ] IP estática reservada
