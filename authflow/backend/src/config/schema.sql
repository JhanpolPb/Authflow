-- ============================================================
-- AuthFlow - Schema de Base de Datos
-- ============================================================

CREATE DATABASE IF NOT EXISTS authflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE authflow_db;

-- ------------------------------------------------------------
-- Tabla: usuarios
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100)        NOT NULL,
  apellido    VARCHAR(100)        NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  rol         ENUM('admin','empleado') NOT NULL DEFAULT 'empleado',
  activo      TINYINT(1)          NOT NULL DEFAULT 1,
  created_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tabla: registros_asistencia
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registros_asistencia (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id     INT UNSIGNED    NOT NULL,
  fecha          DATE            NOT NULL,
  hora_entrada   DATETIME        NULL,
  hora_salida    DATETIME        NULL,
  duracion_min   INT UNSIGNED    NULL COMMENT 'Duración en minutos',
  observaciones  TEXT            NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_usuario_fecha (usuario_id, fecha),
  CONSTRAINT fk_asistencia_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Tabla: refresh_tokens
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT UNSIGNED NOT NULL,
  token       VARCHAR(512) NOT NULL UNIQUE,
  expira_en   DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_token_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Usuario admin por defecto  (password: Admin1234!)
-- ------------------------------------------------------------
INSERT INTO usuarios (nombre, apellido, email, password, rol)
VALUES (
  'Admin',
  'Sistema',
  'admin@authflow.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin1234!
  'admin'
) ON DUPLICATE KEY UPDATE id = id;
