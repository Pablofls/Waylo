-- 003: jerarquía geográfica. municipio -> colonia. Las calles NO son tabla propia:
-- reporte y lugar guardan una referencia en texto libre y la FK a colonia, así el
-- municipio nunca se repite como texto (no hay dependencia transitiva).
SET search_path = waylo, public;

CREATE TABLE municipio (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
-- Los 18 municipios del Área Metropolitana de Monterrey (dato de referencia, no de demostración).
INSERT INTO municipio (clave, nombre) VALUES
  ('abasolo',                'Abasolo'),
  ('apodaca',                'Apodaca'),
  ('cadereyta_jimenez',      'Cadereyta Jiménez'),
  ('el_carmen',              'El Carmen'),
  ('cienega_de_flores',      'Ciénega de Flores'),
  ('garcia',                 'García'),
  ('general_escobedo',       'General Escobedo'),
  ('general_zuazua',         'General Zuazua'),
  ('guadalupe',              'Guadalupe'),
  ('hidalgo',                'Hidalgo'),
  ('juarez',                 'Juárez'),
  ('monterrey',              'Monterrey'),
  ('pesqueria',              'Pesquería'),
  ('salinas_victoria',       'Salinas Victoria'),
  ('san_nicolas',            'San Nicolás de los Garza'),
  ('san_pedro',              'San Pedro Garza García'),
  ('santa_catarina',         'Santa Catarina'),
  ('santiago',               'Santiago')
ON CONFLICT DO NOTHING;

CREATE TABLE colonia (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  municipio_clave text NOT NULL REFERENCES municipio (clave) ON DELETE RESTRICT,
  nombre         text NOT NULL CHECK (btrim(nombre) <> ''),
  UNIQUE (municipio_clave, nombre)
);
