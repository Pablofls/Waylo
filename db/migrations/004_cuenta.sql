-- 004: cuenta, credenciales, sesiones, preferencias y privacidad.
SET search_path = waylo, public;

CREATE TABLE usuario (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              text NOT NULL CHECK (btrim(nombre) <> ''),
  correo              text NOT NULL CHECK (correo = lower(btrim(correo)) AND correo LIKE '%_@_%'),
  ocupacion           text,
  municipio_clave     text REFERENCES municipio (clave) ON DELETE RESTRICT,
  uso_principal_clave text NOT NULL DEFAULT 'transporte' REFERENCES cat_uso_principal (clave) ON DELETE RESTRICT,
  bio                 text,
  creado_en           timestamptz NOT NULL DEFAULT now(),
  actualizado_en      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX usuario_correo_uq ON usuario (correo);
CREATE TRIGGER usuario_actualizado_en BEFORE UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();

-- Credencial en tabla aparte: la contraseña no viaja con las consultas del perfil.
CREATE TABLE credencial (
  usuario_id      uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  contrasena_hash text NOT NULL,
  cambiada_en     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sesion (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  creada_en   timestamptz NOT NULL DEFAULT now(),
  expira_en   timestamptz NOT NULL,
  revocada_en timestamptz,
  CHECK (expira_en > creada_en)
);
CREATE INDEX sesion_usuario_idx ON sesion (usuario_id);

-- Códigos de verificación: el correo verificado se deduce de una fila confirmada
-- cuyo correo coincide con el actual (v_usuario_correo_verificado).
CREATE TABLE verificacion_correo (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id   uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  correo       text NOT NULL,
  codigo_hash  text NOT NULL,
  creado_en    timestamptz NOT NULL DEFAULT now(),
  expira_en    timestamptz NOT NULL,
  confirmada_en timestamptz,
  CHECK (expira_en > creado_en)
);
CREATE INDEX verificacion_correo_usuario_idx ON verificacion_correo (usuario_id, creado_en DESC);

CREATE TABLE recuperacion_contrasena (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  creada_en   timestamptz NOT NULL DEFAULT now(),
  expira_en   timestamptz NOT NULL,
  usada_en    timestamptz,
  CHECK (expira_en > creada_en)
);
CREATE INDEX recuperacion_contrasena_usuario_idx ON recuperacion_contrasena (usuario_id);

-- Vehículos del usuario: relación N:M. "Ambos" del prototipo son dos filas.
CREATE TABLE usuario_vehiculo (
  usuario_id          uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  tipo_vehiculo_clave text NOT NULL REFERENCES cat_tipo_vehiculo (clave) ON DELETE RESTRICT,
  PRIMARY KEY (usuario_id, tipo_vehiculo_clave)
);

-- Preferencias de ruta ----------------------------------------------------------
-- 0 = prioriza la ruta más rápida, 100 = prioriza la más segura.
CREATE TABLE preferencia_ruta (
  usuario_id         uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  inclinacion_segura smallint NOT NULL DEFAULT 50 CHECK (inclinacion_segura BETWEEN 0 AND 100),
  minutos_extra_max  smallint NOT NULL DEFAULT 10 CHECK (minutos_extra_max BETWEEN 0 AND 60)
);

-- Hechos multivaluados independientes: cada uno en su tabla (no producto cruzado).
CREATE TABLE preferencia_ruta_evitar (
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  evitar_clave text NOT NULL REFERENCES cat_ruta_evitar (clave) ON DELETE RESTRICT,
  PRIMARY KEY (usuario_id, evitar_clave)
);
CREATE TABLE preferencia_ruta_preferir (
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  preferir_clave text NOT NULL REFERENCES cat_ruta_preferir (clave) ON DELETE RESTRICT,
  PRIMARY KEY (usuario_id, preferir_clave)
);

-- Notificaciones -----------------------------------------------------------------
-- Una fila por tipo; la ausencia de fila equivale a "activa" (valor por omisión de la app).
CREATE TABLE preferencia_notificacion (
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  tipo_clave  text NOT NULL REFERENCES cat_tipo_notificacion (clave) ON DELETE RESTRICT,
  activa      boolean NOT NULL,
  PRIMARY KEY (usuario_id, tipo_clave)
);
-- Atributos que solo existen para un tipo van en tablas 1:1 propias (sin columnas condicionales).
CREATE TABLE preferencia_alerta_ruta (
  usuario_id        uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  distancia_aviso_m smallint NOT NULL DEFAULT 500 CHECK (distancia_aviso_m IN (200, 500, 1000))
);
CREATE TABLE preferencia_recordatorio_rodada (
  usuario_id     uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  anticipacion_min integer NOT NULL DEFAULT 60 CHECK (anticipacion_min IN (60, 1440))
);
-- Horario silencioso: tener fila significa "No molestar" activo.
CREATE TABLE horario_silencioso (
  usuario_id uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  desde      time NOT NULL DEFAULT '22:00',
  hasta      time NOT NULL DEFAULT '06:30',
  CHECK (desde <> hasta)
);

-- Privacidad ------------------------------------------------------------------------
-- reportes_anonimos: la autoría SE GUARDA en reporte.usuario_id pero las vistas públicas no la muestran.
CREATE TABLE privacidad_usuario (
  usuario_id          uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  visibilidad_rodadas text NOT NULL DEFAULT 'amigos' CHECK (visibilidad_rodadas IN ('todos', 'amigos', 'yo')),
  perfil_visible      boolean NOT NULL DEFAULT true,
  reportes_anonimos   boolean NOT NULL DEFAULT false
);

CREATE TABLE usuario_bloqueado (
  usuario_id   uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  bloqueado_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  bloqueado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, bloqueado_id),
  CHECK (usuario_id <> bloqueado_id)
);
CREATE INDEX usuario_bloqueado_inverso_idx ON usuario_bloqueado (bloqueado_id);
