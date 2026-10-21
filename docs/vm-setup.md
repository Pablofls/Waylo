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

Si aparece un paquete `postgis` compatible con PostgreSQL 16:

```bash
sudo dnf install -y postgis postgresql-contrib
```

Verifica (pide la contraseña de `postgres`):

```bash
psql -h 127.0.0.1 -U postgres -tAc "select name, default_version from pg_available_extensions where name like 'postgis%'"
```

Si no hay paquete compatible, avisa antes de seguir: el esquema usará `double precision` en vez de PostGIS (ver `docs/arquitectura.md`).

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

```bash
sudo dnf install -y certbot python3-certbot-nginx
```

Primero crea `/etc/nginx/conf.d/waylo.conf` con el bloque de `deploy/nginx/waylo.conf` (lo entrega la sesión de despliegue), valida y recarga:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

```bash
sudo certbot --nginx -d 34-51-108-167.sslip.io
```

Notas:
- El bloque de Waylo usa `server_name` propio; el bloque existente `server_name _` no se modifica.
- Como Nginx hace proxy a puertos locales, en CentOS hace falta permitirlo en SELinux (si no está ya):

```bash
sudo setsebool -P httpd_can_network_connect 1
```

- Reserva la IP como **estática** en Google Cloud (VPC, Direcciones IP) para que no cambie al reiniciar la VM.
- El firewall de Google Cloud ya debe permitir 80 y 443 (el otro proyecto usa el 443).

## 5. Procesos

Dos servicios systemd (`waylo-web`, `waylo-realtime`) bajo tu usuario, con variables en `/etc/waylo/waylo.env` (permisos 600). Los archivos de unidad los entrega la sesión de despliegue.

## 6. Actualizar la VM

```bash
cd ~/Waylo && git pull && ./deploy/deploy.sh
```

## Lista de verificación

- [ ] PostGIS instalado y extensión creada en `waylo_db`
- [ ] Roles `waylo_user` y `waylo_app` creados
- [ ] Repositorio clonado en `~/Waylo`
- [ ] `sudo nginx -t` sin errores y bloque de Waylo cargado
- [ ] Certificado emitido para el nombre de host
- [ ] `curl https://34-51-108-167.sslip.io/health/waylo` responde `ok`
- [ ] IP estática reservada
