-- 010: clubes. El dueño es un miembro con rol 'propietario' (un solo propietario por club),
-- no una columna aparte, para no duplicar el hecho en dos lugares.
SET search_path = waylo, public;

CREATE TABLE club (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL CHECK (btrim(nombre) <> ''),
  descripcion     text NOT NULL DEFAULT '',
  municipio_clave text NOT NULL REFERENCES municipio (clave) ON DELETE RESTRICT,
  privacidad      text NOT NULL DEFAULT 'publico' CHECK (privacidad IN ('publico', 'privado')),
  creado_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX club_nombre_uq ON club (lower(nombre));
CREATE TRIGGER club_actualizado_en BEFORE UPDATE ON club
  FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();

CREATE TABLE club_miembro (
  club_id    uuid NOT NULL REFERENCES club (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  rol        text NOT NULL DEFAULT 'miembro' CHECK (rol IN ('propietario', 'administrador', 'miembro')),
  se_unio_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (club_id, usuario_id)
);
CREATE UNIQUE INDEX club_un_propietario_uq ON club_miembro (club_id) WHERE rol = 'propietario';
CREATE INDEX club_miembro_usuario_idx ON club_miembro (usuario_id);

-- Solicitudes de ingreso a clubes privados.
CREATE TABLE club_solicitud_ingreso (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  club_id       uuid NOT NULL REFERENCES club (id) ON DELETE CASCADE,
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  solicitada_en timestamptz NOT NULL DEFAULT now(),
  respondida_en timestamptz,
  resultado     text CHECK (resultado IN ('aceptada', 'rechazada')),
  CHECK ((respondida_en IS NULL) = (resultado IS NULL))
);
CREATE UNIQUE INDEX club_solicitud_pendiente_uq ON club_solicitud_ingreso (club_id, usuario_id) WHERE respondida_en IS NULL;
CREATE INDEX club_solicitud_usuario_idx ON club_solicitud_ingreso (usuario_id);

CREATE TABLE club_rodada (
  club_id          uuid NOT NULL REFERENCES club (id) ON DELETE CASCADE,
  rodada_grupal_id uuid NOT NULL REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  PRIMARY KEY (club_id, rodada_grupal_id)
);
CREATE INDEX club_rodada_rodada_idx ON club_rodada (rodada_grupal_id);
