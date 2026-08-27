
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros de prueba iniciales (opcionales)
INSERT INTO estudiantes (nombre, documento) VALUES 
('Juan Pérez', '1002345678'),
('María Gómez', '1008765432'),
('Carlos Rodríguez', '1005544332')
ON CONFLICT (documento) DO NOTHING;
