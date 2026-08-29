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

-- =====================================================
-- TABLA: materias (Módulo 4.3)
-- =====================================================
CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros de prueba iniciales para materias
INSERT INTO materias (nombre, codigo, descripcion) VALUES 
('Matemáticas Avanzadas', 'MAT-101', 'Cálculo diferencial, integral y álgebra lineal'),
('Física Cuántica', 'FIS-201', 'Mecánica moderna, ondas y principios cuánticos'),
('Lengua y Literatura', 'LIT-301', 'Análisis crítico de textos, retórica y redacción académica'),
('Química General', 'QUI-102', 'Estructura atómica, enlaces químicos y estequiometría'),
('Programación y Algoritmos', 'INF-105', 'Fundamentos de software, lógica algorítmica y Python')
ON CONFLICT (codigo) DO NOTHING;

-- =====================================================
-- TABLA INTERMEDIA: estudiante_materia (Módulo 4.4 - Asignaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS estudiante_materia (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_estudiante_materia UNIQUE (estudiante_id, materia_id)
);

-- Registros de prueba iniciales para estudiante_materia
INSERT INTO estudiante_materia (estudiante_id, materia_id) VALUES 
(1, 1), -- Juan Pérez -> Matemáticas Avanzadas
(1, 2), -- Juan Pérez -> Física Cuántica
(2, 3), -- María Gómez -> Lengua y Literatura
(2, 4), -- María Gómez -> Química General
(3, 5)  -- Carlos Rodríguez -> Programación y Algoritmos
ON CONFLICT (estudiante_id, materia_id) DO NOTHING;

-- =====================================================
-- TABLA INTERMEDIA: profesor_materia (Módulo 4.4 - Asignaciones)
-- =====================================================
CREATE TABLE IF NOT EXISTS profesor_materia (
    id SERIAL PRIMARY KEY,
    profesor_id INTEGER NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_profesor_materia UNIQUE (profesor_id, materia_id)
);

-- Registros de prueba iniciales para profesor_materia
INSERT INTO profesor_materia (profesor_id, materia_id) VALUES 
(1, 1), -- Dra. Elena Ramos -> Matemáticas Avanzadas
(2, 2), -- Lic. Roberto Méndez -> Física Cuántica
(3, 3)  -- Mg. Sofía Castro -> Lengua y Literatura
ON CONFLICT (profesor_id, materia_id) DO NOTHING;


