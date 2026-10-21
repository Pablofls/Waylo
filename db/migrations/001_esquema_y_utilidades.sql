-- 001: esquema propio, permisos del rol de la app y utilidades.
-- Requisitos previos (los crea docs/vm-setup.md, no las migraciones):
--   rol waylo_user (dueño de la base), rol waylo_app, extensión postgis en waylo_db.
-- Las migraciones corren como waylo_user y nunca usan el esquema public.

CREATE SCHEMA IF NOT EXISTS waylo;
SET search_path = waylo, public;

-- waylo_app: solo uso del esquema y DML. Sin CREATE (no hay DDL).
GRANT USAGE ON SCHEMA waylo TO waylo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA waylo GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO waylo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA waylo GRANT USAGE, SELECT ON SEQUENCES TO waylo_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA waylo GRANT EXECUTE ON FUNCTIONS TO waylo_app;

-- La tabla schema_migrations la crea db/apply.sh antes de la primera migración;
-- esta línea cubre el permiso si ya existía.
GRANT SELECT ON waylo.schema_migrations TO waylo_app;

-- Único trigger del esquema: mantiene actualizado_en en tablas con datos editables.
CREATE OR REPLACE FUNCTION waylo.fn_tocar_actualizado_en()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.actualizado_en := now();
  RETURN NEW;
END;
$$;
