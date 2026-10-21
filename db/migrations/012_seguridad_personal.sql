-- 012: contactos de emergencia, detección de caídas y eventos de emergencia.
SET search_path = waylo, public;

CREATE TABLE contacto_emergencia (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  nombre     text NOT NULL CHECK (btrim(nombre) <> ''),
  telefono   text NOT NULL CHECK (telefono ~ '^[0-9 +()-]{8,20}$'),
  parentesco text NOT NULL CHECK (btrim(parentesco) <> ''),
  UNIQUE (usuario_id, telefono)
);
CREATE INDEX contacto_emergencia_usuario_idx ON contacto_emergencia (usuario_id);

-- Una fila por persona; segundos_espera es la cuenta regresiva antes de avisar a los contactos.
CREATE TABLE config_caidas (
  usuario_id      uuid PRIMARY KEY REFERENCES usuario (id) ON DELETE CASCADE,
  activa          boolean NOT NULL DEFAULT true,
  segundos_espera smallint NOT NULL DEFAULT 15 CHECK (segundos_espera BETWEEN 5 AND 120)
);

-- resultado NULL = el evento sigue abierto.
CREATE TABLE evento_emergencia (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  tipo_clave  text NOT NULL REFERENCES cat_tipo_evento_emergencia (clave) ON DELETE RESTRICT,
  rodada_id   uuid REFERENCES rodada (id) ON DELETE SET NULL,
  geog        geography(Point, 4326),
  ocurrido_en timestamptz NOT NULL DEFAULT now(),
  cerrado_en  timestamptz,
  resultado   text CHECK (resultado IN ('falsa_alarma', 'contactos_avisados')),
  CHECK ((cerrado_en IS NULL) = (resultado IS NULL)),
  CHECK (cerrado_en IS NULL OR cerrado_en >= ocurrido_en)
);
CREATE INDEX evento_emergencia_usuario_idx ON evento_emergencia (usuario_id, ocurrido_en DESC);

-- A qué contactos se avisó en cada evento (hecho multivaluado propio).
CREATE TABLE evento_emergencia_aviso (
  evento_id   uuid NOT NULL REFERENCES evento_emergencia (id) ON DELETE CASCADE,
  contacto_id uuid NOT NULL REFERENCES contacto_emergencia (id) ON DELETE CASCADE,
  avisado_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (evento_id, contacto_id)
);
