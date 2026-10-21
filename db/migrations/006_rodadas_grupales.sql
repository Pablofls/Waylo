-- 006: rodadas grupales. Vehículos permitidos, reglas, asistentes e invitaciones son hechos
-- multivaluados independientes entre sí: cada uno vive en su propia tabla (4FN).
-- No hay columna de estado: se deduce de cancelada_en y de programada_en (ver v_rodada_grupal).
SET search_path = waylo, public;

CREATE TABLE rodada_grupal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizador_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  titulo          text NOT NULL CHECK (btrim(titulo) <> ''),
  descripcion     text NOT NULL DEFAULT '',
  programada_en   timestamptz NOT NULL,
  lugar_salida_id uuid NOT NULL REFERENCES lugar (id) ON DELETE NO ACTION,
  nivel_clave     text NOT NULL REFERENCES cat_nivel_rodada (clave) ON DELETE RESTRICT,
  ritmo_clave     text NOT NULL REFERENCES cat_ritmo_rodada (clave) ON DELETE RESTRICT,
  distancia_km    numeric(5,1) NOT NULL CHECK (distancia_km > 0),
  cupo            smallint CHECK (cupo IS NULL OR cupo > 0),
  privacidad      text NOT NULL DEFAULT 'publica' CHECK (privacidad IN ('publica', 'amigos')),
  cancelada_en    timestamptz,
  creada_en       timestamptz NOT NULL DEFAULT now(),
  actualizado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER rodada_grupal_actualizado_en BEFORE UPDATE ON rodada_grupal
  FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();
CREATE INDEX rodada_grupal_fecha_idx ON rodada_grupal (programada_en);
CREATE INDEX rodada_grupal_organizador_idx ON rodada_grupal (organizador_id);

CREATE TABLE rodada_grupal_vehiculo (
  rodada_grupal_id    uuid NOT NULL REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  tipo_vehiculo_clave text NOT NULL REFERENCES cat_tipo_vehiculo (clave) ON DELETE RESTRICT,
  PRIMARY KEY (rodada_grupal_id, tipo_vehiculo_clave)
);

CREATE TABLE rodada_grupal_regla (
  rodada_grupal_id uuid NOT NULL REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  regla_clave      text NOT NULL REFERENCES cat_regla_rodada (clave) ON DELETE RESTRICT,
  PRIMARY KEY (rodada_grupal_id, regla_clave)
);

CREATE TABLE rodada_grupal_asistente (
  rodada_grupal_id uuid NOT NULL REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  usuario_id       uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  se_unio_en       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rodada_grupal_id, usuario_id)
);
CREATE INDEX rodada_grupal_asistente_usuario_idx ON rodada_grupal_asistente (usuario_id);

CREATE TABLE rodada_grupal_invitacion (
  rodada_grupal_id uuid NOT NULL REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  invitado_id      uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  invitada_en      timestamptz NOT NULL DEFAULT now(),
  respondida_en    timestamptz,
  resultado        text CHECK (resultado IN ('aceptada', 'rechazada')),
  PRIMARY KEY (rodada_grupal_id, invitado_id),
  CHECK ((respondida_en IS NULL) = (resultado IS NULL))
);
CREATE INDEX rodada_grupal_invitacion_invitado_idx ON rodada_grupal_invitacion (invitado_id);
