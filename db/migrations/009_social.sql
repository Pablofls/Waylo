-- 009: amistades (vía solicitudes), reacciones, comentarios, notificaciones y denuncias.
SET search_path = waylo, public;

-- ÚNICA fuente del hecho "son amigos": las solicitudes aceptadas y no terminadas. No existe una
-- tabla amistad; v_amistad es una vista. Así "ser amigos" no puede contradecirse entre dos tablas
-- y el historial (quién envió, cuándo se aceptó, cuándo terminó) se conserva.
CREATE TABLE solicitud_amistad (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emisor_id             uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  receptor_id           uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  enviada_en            timestamptz NOT NULL DEFAULT now(),
  respondida_en         timestamptz,
  resultado             text CHECK (resultado IN ('aceptada', 'rechazada', 'cancelada')),
  amistad_terminada_en  timestamptz,
  CHECK (emisor_id <> receptor_id),
  CHECK ((respondida_en IS NULL) = (resultado IS NULL)),
  CHECK (respondida_en IS NULL OR respondida_en >= enviada_en),
  CHECK (amistad_terminada_en IS NULL OR (resultado = 'aceptada' AND amistad_terminada_en >= respondida_en))
);
-- Un solo vínculo vigente por par no ordenado: solicitud pendiente o amistad aceptada y no terminada.
-- Una solicitud rechazada, cancelada o una amistad terminada NO impide enviar una nueva.
CREATE UNIQUE INDEX solicitud_amistad_par_vigente_uq ON solicitud_amistad (LEAST(emisor_id, receptor_id), GREATEST(emisor_id, receptor_id))
  WHERE resultado IS NULL OR (resultado = 'aceptada' AND amistad_terminada_en IS NULL);
CREATE INDEX solicitud_amistad_emisor_idx ON solicitud_amistad (emisor_id);
CREATE INDEX solicitud_amistad_receptor_idx ON solicitud_amistad (receptor_id);

-- Actividad = rodadas finalizadas (las de amigos y de la comunidad se obtienen con vistas).
CREATE TABLE reaccion_rodada (
  rodada_id  uuid NOT NULL REFERENCES rodada (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  creada_en  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (rodada_id, usuario_id)
);
CREATE INDEX reaccion_rodada_usuario_idx ON reaccion_rodada (usuario_id);

CREATE TABLE comentario_rodada (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rodada_id  uuid NOT NULL REFERENCES rodada (id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  texto      text NOT NULL CHECK (btrim(texto) <> ''),
  creado_en  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comentario_rodada_rodada_idx ON comentario_rodada (rodada_id, creado_en);
CREATE INDEX comentario_rodada_usuario_idx ON comentario_rodada (usuario_id);

-- Notificación: EXACTAMENTE una clave de destino. El tipo (alerta, reporte, amistad, rodada) se
-- deduce del destino y el texto lo arma la app; no se guardan tipo, título, texto ni enlace.
--   reporte_id             -> alerta de un reporte nuevo en la ruta de la persona
--   historial_estado_id    -> cambio de estado de un reporte propio
--   solicitud_amistad_id   -> solicitud de amistad (ver v_notificacion para recibida vs aceptada)
--   rodada_grupal_id       -> recordatorio de una rodada grupal
CREATE TABLE notificacion (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id           uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  reporte_id           uuid REFERENCES reporte (id) ON DELETE CASCADE,
  historial_estado_id  uuid REFERENCES reporte_historial_estado (id) ON DELETE CASCADE,
  solicitud_amistad_id uuid REFERENCES solicitud_amistad (id) ON DELETE CASCADE,
  rodada_grupal_id     uuid REFERENCES rodada_grupal (id) ON DELETE CASCADE,
  creada_en            timestamptz NOT NULL DEFAULT now(),
  leida_en             timestamptz,
  CHECK (num_nonnulls(reporte_id, historial_estado_id, solicitud_amistad_id, rodada_grupal_id) = 1)
);
CREATE INDEX notificacion_usuario_fecha_idx ON notificacion (usuario_id, creada_en DESC);
CREATE INDEX notificacion_no_leida_idx ON notificacion (usuario_id) WHERE leida_en IS NULL;
CREATE UNIQUE INDEX notificacion_reporte_uq ON notificacion (usuario_id, reporte_id) WHERE reporte_id IS NOT NULL;
CREATE UNIQUE INDEX notificacion_historial_uq ON notificacion (usuario_id, historial_estado_id) WHERE historial_estado_id IS NOT NULL;
CREATE UNIQUE INDEX notificacion_solicitud_uq ON notificacion (usuario_id, solicitud_amistad_id) WHERE solicitud_amistad_id IS NOT NULL;
CREATE UNIQUE INDEX notificacion_rodada_uq ON notificacion (usuario_id, rodada_grupal_id) WHERE rodada_grupal_id IS NOT NULL;

-- Denuncia de contenido: exactamente un objeto denunciado (reporte, comentario o persona).
CREATE TABLE denuncia_contenido (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  denunciante_id      uuid NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
  motivo_clave        text NOT NULL REFERENCES cat_motivo_denuncia (clave) ON DELETE RESTRICT,
  reporte_id          uuid REFERENCES reporte (id) ON DELETE CASCADE,
  comentario_id       uuid REFERENCES comentario_rodada (id) ON DELETE CASCADE,
  usuario_denunciado_id uuid REFERENCES usuario (id) ON DELETE CASCADE,
  detalle             text,
  creada_en           timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(reporte_id, comentario_id, usuario_denunciado_id) = 1),
  CHECK (usuario_denunciado_id IS NULL OR usuario_denunciado_id <> denunciante_id)
);
CREATE INDEX denuncia_contenido_denunciante_idx ON denuncia_contenido (denunciante_id);
CREATE UNIQUE INDEX denuncia_reporte_uq ON denuncia_contenido (denunciante_id, reporte_id) WHERE reporte_id IS NOT NULL;
CREATE UNIQUE INDEX denuncia_comentario_uq ON denuncia_contenido (denunciante_id, comentario_id) WHERE comentario_id IS NOT NULL;
CREATE UNIQUE INDEX denuncia_usuario_uq ON denuncia_contenido (denunciante_id, usuario_denunciado_id) WHERE usuario_denunciado_id IS NOT NULL;
