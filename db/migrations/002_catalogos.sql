-- 002: catálogos. Cada catálogo es una tabla con clave natural (texto estable) como llave
-- primaria; las demás tablas la referencian por FK. Los conjuntos cerrados sin atributos
-- propios (privacidad pública/amigos, rol de club, resultado de una solicitud) se dejan
-- como CHECK y se justifican en docs/base-de-datos.md.
SET search_path = waylo, public;

-- Vehículos y uso -------------------------------------------------------------
CREATE TABLE cat_tipo_vehiculo (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_tipo_vehiculo (clave, nombre) VALUES
  ('bicicleta', 'Bicicleta'),
  ('scooter',   'Scooter eléctrico')
ON CONFLICT DO NOTHING;

CREATE TABLE cat_uso_principal (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_uso_principal (clave, nombre) VALUES
  ('transporte', 'Transporte'),
  ('recreativo', 'Recreativo')
ON CONFLICT DO NOTHING;

-- Rodadas grupales ------------------------------------------------------------
CREATE TABLE cat_nivel_rodada (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE
);
INSERT INTO cat_nivel_rodada (clave, nombre, orden) VALUES
  ('principiante', 'Principiante', 1),
  ('intermedio',   'Intermedio',   2),
  ('avanzado',     'Avanzado',     3)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_ritmo_rodada (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE
);
INSERT INTO cat_ritmo_rodada (clave, nombre, orden) VALUES
  ('relajado', 'Relajado', 1),
  ('moderado', 'Moderado', 2),
  ('rapido',   'Rápido',   3)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_regla_rodada (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_regla_rodada (clave, nombre) VALUES
  ('casco',            'Casco puesto'),
  ('luces',            'Luces delantera y trasera'),
  ('semaforos',        'Respeta los semáforos'),
  ('agua',             'Lleva agua'),
  ('chaleco',          'Chaleco o ropa reflejante'),
  ('kit_reparacion',   'Kit de reparación'),
  ('bici_revisada',    'Bicicleta revisada'),
  ('credencial_udem',  'Credencial UDEM opcional')
ON CONFLICT DO NOTHING;

-- Reportes --------------------------------------------------------------------
-- peso_riesgo: aporte de un reporte de esta categoría al riesgo de una zona
-- (ver v_zona_seguridad_mensual). icono: nombre del ícono de lucide-react.
CREATE TABLE cat_categoria_reporte (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  icono       text NOT NULL,
  peso_riesgo numeric(4,2) NOT NULL CHECK (peso_riesgo > 0)
);
INSERT INTO cat_categoria_reporte (clave, nombre, icono, peso_riesgo) VALUES
  ('bache',              'Bache u obra',           'Construction', 1.0),
  ('accidente',          'Accidente',              'Siren',        3.0),
  ('calle_cerrada',      'Calle cerrada',          'Ban',          1.0),
  ('alta_velocidad',     'Autos a alta velocidad', 'Gauge',        2.0),
  ('conductor_agresivo', 'Conductor agresivo',     'CarFront',     2.0),
  ('poca_iluminacion',   'Poca iluminación',       'LightbulbOff', 1.5),
  ('robo',               'Robo o asalto',          'ShieldAlert',  3.0)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_estado_reporte (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE
);
INSERT INTO cat_estado_reporte (clave, nombre, orden) VALUES
  ('enviado',     'Enviado',                       1),
  ('en_revision', 'En revisión por el municipio',  2),
  ('atendido',    'Atendido',                      3)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_gravedad_reporte (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE
);
INSERT INTO cat_gravedad_reporte (clave, nombre, orden) VALUES
  ('leve',     'Leve',     1),
  ('moderada', 'Moderada', 2),
  ('grave',    'Grave',    3)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_motivo_denuncia (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_motivo_denuncia (clave, nombre) VALUES
  ('inapropiado',      'Contenido inapropiado'),
  ('falso_o_repetido', 'Reporte falso o repetido'),
  ('acoso',            'Acoso o trato ofensivo'),
  ('spam',             'Spam'),
  ('otro',             'Otro')
ON CONFLICT DO NOTHING;

-- Rutas y Safety Score --------------------------------------------------------
CREATE TABLE cat_tipo_ruta (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE
);
INSERT INTO cat_tipo_ruta (clave, nombre, orden) VALUES
  ('rapida',      'Más rápida',  1),
  ('equilibrada', 'Equilibrada', 2),
  ('segura',      'Más segura',  3)
ON CONFLICT DO NOTHING;

-- peso: ponderación del factor en el Safety Score de una ruta (los pesos suman 1).
CREATE TABLE cat_factor_seguridad (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  orden  smallint NOT NULL UNIQUE,
  peso   numeric(4,3) NOT NULL CHECK (peso > 0 AND peso <= 1)
);
INSERT INTO cat_factor_seguridad (clave, nombre, orden, peso) VALUES
  ('trafico',     'Tráfico y velocidad vehicular', 1, 0.250),
  ('robo',        'Robo o asalto',                 2, 0.250),
  ('iluminacion', 'Iluminación',                   3, 0.200),
  ('pavimento',   'Estado del pavimento',          4, 0.150),
  ('ciclovia',    'Presencia de ciclovía',         5, 0.150)
ON CONFLICT DO NOTHING;

CREATE TABLE cat_giro (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_giro (clave, nombre) VALUES
  ('recto',     'Seguir recto'),
  ('izquierda', 'Girar a la izquierda'),
  ('derecha',   'Girar a la derecha'),
  ('llegada',   'Llegada')
ON CONFLICT DO NOTHING;

-- Preferencias de ruta: "evitar" y "preferir" son hechos multivaluados independientes,
-- cada uno con su catálogo y su tabla (4FN).
CREATE TABLE cat_ruta_evitar (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text NOT NULL
);
INSERT INTO cat_ruta_evitar (clave, nombre, descripcion) VALUES
  ('zonas_riesgo_alto',        'Zonas de riesgo alto',              'Sectores en rojo del mapa'),
  ('calles_sin_iluminacion',   'Calles sin iluminación de noche',   'Después de las 7 p. m.'),
  ('vias_rapidas_sin_ciclovia','Vías rápidas sin ciclovía',         'Más de 50 km/h')
ON CONFLICT DO NOTHING;

CREATE TABLE cat_ruta_preferir (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text NOT NULL
);
INSERT INTO cat_ruta_preferir (clave, nombre, descripcion) VALUES
  ('ciclovias_confinadas',  'Ciclovías confinadas',  'Aunque la ruta sea más larga'),
  ('rutas_personalizadas',  'Rutas personalizadas',  'Aprende de tus recorridos habituales (Premium)')
ON CONFLICT DO NOTHING;

-- Lugares ---------------------------------------------------------------------
CREATE TABLE cat_tipo_lugar (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_tipo_lugar (clave, nombre) VALUES
  ('casa',     'Casa'),
  ('escuela',  'Escuela'),
  ('trabajo',  'Trabajo'),
  ('favorito', 'Favorito')
ON CONFLICT DO NOTHING;

-- Notificaciones: este catálogo describe lo que el usuario puede activar o apagar.
-- El tipo de cada notificación recibida se deduce de su destino (ver v_notificacion).
CREATE TABLE cat_tipo_notificacion (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  descripcion text NOT NULL
);
INSERT INTO cat_tipo_notificacion (clave, nombre, descripcion) VALUES
  ('alerta_ruta',        'Alertas en tu ruta',       'Baches, accidentes y calles cerradas cercanas'),
  ('aviso_municipio',    'Avisos del municipio',     'Obras y avisos de tu municipio'),
  ('estado_reporte',     'Estado de mis reportes',   'Cuando el municipio los revise o atienda'),
  ('solicitud_amistad',  'Solicitudes de amistad',   'Solicitudes nuevas y aceptadas'),
  ('actividad_amigos',   'Actividad de amigos',      'Cuando un amigo termina una rodada'),
  ('recordatorio_rodada','Recordatorios de rodadas', 'Aviso antes de una rodada grupal')
ON CONFLICT DO NOTHING;

-- Logros --------------------------------------------------------------------
-- Métricas calculables para retos e insignias (las evalúa fn_valor_metrica).
CREATE TABLE cat_metrica (
  clave       text PRIMARY KEY,
  nombre      text NOT NULL UNIQUE,
  unidad      text NOT NULL,
  descripcion text NOT NULL
);
INSERT INTO cat_metrica (clave, nombre, unidad, descripcion) VALUES
  ('km_recorridos',               'Kilómetros recorridos',        'km',       'Suma de km de rodadas finalizadas'),
  ('rodadas_registradas',         'Rodadas registradas',          'rodadas',  'Rodadas individuales finalizadas'),
  ('rodadas_seguras',             'Rodadas seguras',              'rodadas',  'Rodadas finalizadas con Safety Score igual o mayor al umbral'),
  ('semanas_consecutivas',        'Semanas seguidas rodando',     'semanas',  'Semanas consecutivas con al menos una rodada'),
  ('reportes_enviados',           'Reportes enviados',            'reportes', 'Reportes no cancelados; admite filtro por categoría o estado actual'),
  ('reportes_confirmados',        'Reportes confirmados',         'reportes', 'Reportes propios con al menos una confirmación "Sigue ahí"'),
  ('rodadas_grupales_asistidas',  'Rodadas grupales a las que asistió', 'rodadas', 'Rodadas grupales ya realizadas con asistencia registrada'),
  ('rodadas_grupales_organizadas','Rodadas grupales organizadas', 'rodadas',  'Rodadas grupales creadas y no canceladas')
ON CONFLICT DO NOTHING;

-- Seguridad personal ---------------------------------------------------------
CREATE TABLE cat_tipo_evento_emergencia (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_tipo_evento_emergencia (clave, nombre) VALUES
  ('caida_detectada', 'Caída detectada'),
  ('sos_manual',      'Emergencia solicitada por la persona')
ON CONFLICT DO NOTHING;

-- Pagos -----------------------------------------------------------------------
CREATE TABLE cat_metodo_pago (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_metodo_pago (clave, nombre) VALUES
  ('tarjeta', 'Tarjeta')
ON CONFLICT DO NOTHING;

-- Ayuda -----------------------------------------------------------------------
-- Las preguntas frecuentes son contenido estático de la app; no se guardan en la base.
CREATE TABLE cat_tipo_comentario (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_tipo_comentario (clave, nombre) VALUES
  ('idea',        'Idea'),
  ('no_funciona', 'Algo no funciona'),
  ('me_gusto',    'Me gustó'),
  ('otro',        'Otro')
ON CONFLICT DO NOTHING;

CREATE TABLE cat_tema_soporte (
  clave  text PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
INSERT INTO cat_tema_soporte (clave, nombre) VALUES
  ('cuenta', 'Mi cuenta'),
  ('rutas',  'Rutas y mapa'),
  ('reportes','Reportes'),
  ('pagos',  'Pagos'),
  ('otro',   'Otro')
ON CONFLICT DO NOTHING;

-- Zonas: franjas horarias del riesgo por hora (hora local de Monterrey).
CREATE TABLE cat_franja_horaria (
  clave       text PRIMARY KEY,
  etiqueta    text NOT NULL UNIQUE,
  hora_desde  smallint NOT NULL UNIQUE CHECK (hora_desde BETWEEN 0 AND 23),
  hora_hasta  smallint NOT NULL CHECK (hora_hasta BETWEEN 1 AND 24),
  CHECK (hora_hasta > hora_desde)
);
INSERT INTO cat_franja_horaria (clave, etiqueta, hora_desde, hora_hasta) VALUES
  ('6_9',   '6-9 h',   6,  9),
  ('9_12',  '9-12 h',  9,  12),
  ('12_15', '12-15 h', 12, 15),
  ('15_18', '15-18 h', 15, 18),
  ('18_21', '18-21 h', 18, 21),
  ('21_24', '21-24 h', 21, 24)
ON CONFLICT DO NOTHING;
