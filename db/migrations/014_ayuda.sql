-- 014: comentarios sobre la app y mensajes de soporte. Las preguntas frecuentes son contenido
-- estático de la app y no se guardan. usuario_id pasa a NULL al borrar la cuenta.
SET search_path = waylo, public;

CREATE TABLE comentario_app (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid REFERENCES usuario (id) ON DELETE SET NULL,
  tipo_clave    text NOT NULL REFERENCES cat_tipo_comentario (clave) ON DELETE RESTRICT,
  calificacion  smallint NOT NULL CHECK (calificacion BETWEEN 1 AND 5),
  mensaje       text NOT NULL CHECK (char_length(btrim(mensaje)) BETWEEN 10 AND 500),
  enviado_en    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comentario_app_fecha_idx ON comentario_app (enviado_en DESC);

CREATE TABLE mensaje_soporte (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid REFERENCES usuario (id) ON DELETE SET NULL,
  tema_clave  text NOT NULL REFERENCES cat_tema_soporte (clave) ON DELETE RESTRICT,
  mensaje     text NOT NULL CHECK (btrim(mensaje) <> ''),
  enviado_en  timestamptz NOT NULL DEFAULT now(),
  atendido_en timestamptz
);
CREATE INDEX mensaje_soporte_pendiente_idx ON mensaje_soporte (enviado_en) WHERE atendido_en IS NULL;
