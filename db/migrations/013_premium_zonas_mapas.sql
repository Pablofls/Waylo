-- 013: Premium (planes, suscripciones, pagos), zonas, y mapas sin conexión.
-- Sin guardar: IVA ni subtotal (se calculan en v_pago_recibo), estado de suscripción
-- (se deduce de vigente_hasta y cancelada_en), score/tendencia/estadísticas de zona (vistas).
SET search_path = waylo, public;

CREATE TABLE plan (
  clave         text PRIMARY KEY,
  nombre        text NOT NULL UNIQUE,
  precio_total  numeric(10,2) NOT NULL CHECK (precio_total > 0),
  duracion_meses smallint NOT NULL CHECK (duracion_meses > 0)
);
-- Precio con IVA incluido (MXN), como se muestra en la app.
INSERT INTO plan (clave, nombre, precio_total, duracion_meses) VALUES
  ('premium_mensual', 'Waylo Premium, mensual', 79.00, 1)
ON CONFLICT DO NOTHING;

-- usuario_id pasa a NULL al borrar la cuenta: los comprobantes de pago se conservan anonimizados.
CREATE TABLE suscripcion (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id    uuid REFERENCES usuario (id) ON DELETE SET NULL,
  plan_clave    text NOT NULL REFERENCES plan (clave) ON DELETE RESTRICT,
  inicia_en     timestamptz NOT NULL DEFAULT now(),
  vigente_hasta timestamptz NOT NULL,
  cancelada_en  timestamptz,
  CHECK (vigente_hasta > inicia_en),
  CHECK (cancelada_en IS NULL OR cancelada_en >= inicia_en)
);
CREATE INDEX suscripcion_usuario_idx ON suscripcion (usuario_id, vigente_hasta DESC);

-- Nunca se guarda el número de tarjeta: solo los últimos 4 dígitos para el recibo.
CREATE TABLE pago (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suscripcion_id   uuid NOT NULL REFERENCES suscripcion (id) ON DELETE RESTRICT,
  folio            text NOT NULL UNIQUE CHECK (btrim(folio) <> ''),
  pagado_en        timestamptz NOT NULL DEFAULT now(),
  metodo_clave     text NOT NULL REFERENCES cat_metodo_pago (clave) ON DELETE RESTRICT,
  tarjeta_ultimos4 char(4) CHECK (tarjeta_ultimos4 ~ '^[0-9]{4}$'),
  monto_total      numeric(10,2) NOT NULL CHECK (monto_total > 0),
  tasa_iva         numeric(4,3) NOT NULL DEFAULT 0.160 CHECK (tasa_iva >= 0 AND tasa_iva < 1),
  CHECK ((metodo_clave = 'tarjeta') = (tarjeta_ultimos4 IS NOT NULL))
);
CREATE INDEX pago_suscripcion_idx ON pago (suscripcion_id, pagado_en DESC);

-- Zona de seguridad: polígono en el que se cuentan los reportes (ST_Covers).
CREATE TABLE zona (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre          text NOT NULL UNIQUE,
  detalle         text,
  municipio_clave text NOT NULL REFERENCES municipio (clave) ON DELETE RESTRICT,
  area            geography(Polygon, 4326) NOT NULL,
  descripcion     text NOT NULL DEFAULT ''
);
CREATE INDEX zona_area_gix ON zona USING gist (area);

-- Áreas descargables para mapas sin conexión.
CREATE TABLE area_mapa (
  clave      text PRIMARY KEY,
  nombre     text NOT NULL UNIQUE,
  tamano_mb  integer NOT NULL CHECK (tamano_mb > 0)
);
INSERT INTO area_mapa (clave, nombre, tamano_mb) VALUES
  ('san_pedro',  'San Pedro Garza García',        85),
  ('mty_centro', 'Monterrey Centro',             140),
  ('san_nicolas','San Nicolás de los Garza',     110),
  ('guadalupe',  'Guadalupe',                     95),
  ('amm',        'Área metropolitana completa',  520)
ON CONFLICT DO NOTHING;

CREATE TABLE mapa_descargado (
  usuario_id    uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  area_clave    text NOT NULL REFERENCES area_mapa (clave) ON DELETE RESTRICT,
  descargado_en timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (usuario_id, area_clave)
);
