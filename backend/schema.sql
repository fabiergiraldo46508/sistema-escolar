-- =====================================================
-- TABLA: estudiantes
-- =====================================================
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros de prueba iniciales para estudiantes
INSERT INTO estudiantes (nombre, documento) VALUES 
('Juan Pérez', '1002345678'),
('María Gómez', '1008765432'),
('Carlos Rodríguez', '1005544332')
ON CONFLICT (documento) DO NOTHING;

-- =====================================================
-- TABLA: profesores
-- =====================================================
CREATE TABLE IF NOT EXISTS profesores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    asignatura VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros de prueba iniciales para profesores
INSERT INTO profesores (nombre, documento, asignatura, email) VALUES 
('Dra. Elena Ramos', '2001122334', 'Matemáticas Avanzadas', 'elena.ramos@colegio.edu'),
('Lic. Roberto Méndez', '2004455667', 'Física Cuántica', 'roberto.mendez@colegio.edu'),
('Mg. Sofía Castro', '2007788990', 'Lengua y Literatura', 'sofia.castro@colegio.edu')
ON CONFLICT (documento) DO NOTHING;

