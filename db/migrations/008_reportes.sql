-- 008: reportes. El estado actual se deduce del último renglón de reporte_historial_estado;
-- las confirmaciones, los "pendientes por completar" y la autoría visible se calculan (v_reporte).
-- Borrado de cuenta: reporte.usuario_id pasa a NULL (el reporte ya enviado se anonimiza y se conserva).
SET search_path = waylo, public;

CREATE TABLE reporte (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id      uuid REFERENCES usuario (id) ON DELETE SET NULL,
  categoria_clave text NOT NULL REFERENCES cat_categoria_reporte (clave) ON DELETE RESTRICT,
  geog            geography(Point, 4326) NOT NULL,
  colonia_id      uuid REFERENCES colonia (id) ON DELETE SET NULL,
  referencia      text,
  gravedad_clave  text REFERENCES cat_gravedad_reporte (clave) ON DELETE RESTRICT,
  nota            text,
  foto_url        text,
  rodada_id       uuid REFERENCES rodada (id) ON DELETE SET NULL,
  creado_en       timestamptz NOT NULL DEFAULT now(),
  cancelado_en    timestamptz,
  actualizado_en  timestamptz NOT NULL DEFAULT now(),
  CHECK (cancelado_en IS NULL OR cancelado_en >= creado_en),
  CHECK (ST_Y(geog::geometry) BETWEEN 25.4 AND 26.0 AND ST_X(geog::geometry) BETWEEN -100.7 AND -100.0)
);
CREATE TRIGGER reporte_actualizado_en BEFORE UPDATE ON reporte
  FOR EACH ROW EXECUTE FUNCTION fn_tocar_actualizado_en();
CREATE INDEX reporte_geog_gix ON reporte USING gist (geog);
CREATE INDEX reporte_usuario_fecha_idx ON reporte (usuario_id, creado_en DESC);
CREATE INDEX reporte_fecha_idx ON reporte (creado_en DESC) WHERE cancelado_en IS NULL;
CREATE INDEX reporte_categoria_idx ON reporte (categoria_clave);

-- Línea de tiempo. Cada estado se registra una sola vez por reporte.
CREATE TABLE reporte_historial_estado (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporte_id    uuid NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
  estado_clave  text NOT NULL REFERENCES cat_estado_reporte (clave) ON DELETE RESTRICT,
  registrado_en timestamptz NOT NULL DEFAULT now(),
  texto         text,
  UNIQUE (reporte_id, estado_clave)
);
CREATE INDEX reporte_historial_reporte_idx ON reporte_historial_estado (reporte_id, registrado_en DESC);

-- "Sigue ahí" o "Ya no está"; una respuesta por persona y reporte (se puede cambiar).
CREATE TABLE reporte_confirmacion (
  reporte_id    uuid NOT NULL REFERENCES reporte (id) ON DELETE CASCADE,
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  resultado     text NOT NULL CHECK (resultado IN ('sigue', 'resuelto')),
  confirmado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (reporte_id, usuario_id)
);
CREATE INDEX reporte_confirmacion_usuario_idx ON reporte_confirmacion (usuario_id);
