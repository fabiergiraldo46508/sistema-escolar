import os
import sqlite3
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

# Intentar importar soporte para PostgreSQL si está configurado
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
    POSTGRES_AVAILABLE = True
except ImportError:
    POSTGRES_AVAILABLE = False

load_dotenv()

FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)

DB_TYPE = os.getenv('DB_TYPE', 'sqlite').lower()
DB_FILE = os.path.join(os.path.dirname(__file__), 'sistema_escolar.db')


def get_db():
    """Retorna una conexión activa a SQLite o PostgreSQL según configuración."""
    if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
        return psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'sistema_escolar'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', ''),
            port=os.getenv('DB_PORT', 5432)
        )
    else:
        conn = sqlite3.connect(DB_FILE)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn


def init_db():
    """Inicializa todas las tablas (estudiantes, profesores, materias, estudiante_materia, profesor_materia)
    con datos de prueba iniciales si están vacías."""
    if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
        try:
            conn = get_db()
            cur = conn.cursor()
            
            # 1. Tabla estudiantes
            cur.execute('''
                CREATE TABLE IF NOT EXISTS estudiantes (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(150) NOT NULL,
                    documento VARCHAR(50) NOT NULL UNIQUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            
            # 2. Tabla profesores
            cur.execute('''
                CREATE TABLE IF NOT EXISTS profesores (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(150) NOT NULL,
                    documento VARCHAR(50) NOT NULL UNIQUE,
                    asignatura VARCHAR(100) NOT NULL,
                    email VARCHAR(150) NOT NULL UNIQUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # 3. Tabla materias (Módulo 4.3)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS materias (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(150) NOT NULL,
                    codigo VARCHAR(50) NOT NULL UNIQUE,
                    descripcion TEXT,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')

            # 4. Tabla intermedia: estudiante_materia (Módulo 4.4)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS estudiante_materia (
                    id SERIAL PRIMARY KEY,
                    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
                    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
                    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_estudiante_materia UNIQUE (estudiante_id, materia_id)
                );
            ''')

            # 5. Tabla intermedia: profesor_materia (Módulo 4.4)
            cur.execute('''
                CREATE TABLE IF NOT EXISTS profesor_materia (
                    id SERIAL PRIMARY KEY,
                    profesor_id INTEGER NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
                    materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
                    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT uq_profesor_materia UNIQUE (profesor_id, materia_id)
                );
            ''')

            # Registros iniciales
            cur.execute('SELECT COUNT(*) FROM estudiantes;')
            if cur.fetchone()[0] == 0:
                cur.executemany('''
                    INSERT INTO estudiantes (nombre, documento) VALUES (%s, %s);
                ''', [
                    ('Juan Pérez', '1002345678'),
                    ('María Gómez', '1008765432'),
                    ('Carlos Rodríguez', '1005544332')
                ])

            cur.execute('SELECT COUNT(*) FROM profesores;')
            if cur.fetchone()[0] == 0:
                cur.executemany('''
                    INSERT INTO profesores (nombre, documento, asignatura, email) VALUES (%s, %s, %s, %s);
                ''', [
                    ('Dra. Elena Ramos', '2001122334', 'Matemáticas Avanzadas', 'elena.ramos@colegio.edu'),
                    ('Lic. Roberto Méndez', '2004455667', 'Física Cuántica', 'roberto.mendez@colegio.edu'),
                    ('Mg. Sofía Castro', '2007788990', 'Lengua y Literatura', 'sofia.castro@colegio.edu')
                ])

            cur.execute('SELECT COUNT(*) FROM materias;')
            if cur.fetchone()[0] == 0:
                cur.executemany('''
                    INSERT INTO materias (nombre, codigo, descripcion) VALUES (%s, %s, %s);
                ''', [
                    ('Matemáticas Avanzadas', 'MAT-101', 'Cálculo diferencial, integral y álgebra lineal'),
                    ('Física Cuántica', 'FIS-201', 'Mecánica moderna, ondas y principios cuánticos'),
                    ('Lengua y Literatura', 'LIT-301', 'Análisis crítico de textos, retórica y redacción académica'),
                    ('Química General', 'QUI-102', 'Estructura atómica, enlaces químicos y estequiometría'),
                    ('Programación y Algoritmos', 'INF-105', 'Fundamentos de software, lógica algorítmica y Python')
                ])

            cur.execute('SELECT COUNT(*) FROM estudiante_materia;')
            if cur.fetchone()[0] == 0:
                cur.execute('SELECT id FROM estudiantes ORDER BY id ASC LIMIT 3;')
                est_ids = [r[0] for r in cur.fetchall()]
                cur.execute('SELECT id FROM materias ORDER BY id ASC LIMIT 5;')
                mat_ids = [r[0] for r in cur.fetchall()]
                assignments = []
                if len(est_ids) >= 1 and len(mat_ids) >= 2:
                    assignments.extend([(est_ids[0], mat_ids[0]), (est_ids[0], mat_ids[1])])
                if len(est_ids) >= 2 and len(mat_ids) >= 4:
                    assignments.extend([(est_ids[1], mat_ids[2]), (est_ids[1], mat_ids[3])])
                if len(est_ids) >= 3 and len(mat_ids) >= 5:
                    assignments.append((est_ids[2], mat_ids[4]))
                if assignments:
                    cur.executemany('''
                        INSERT INTO estudiante_materia (estudiante_id, materia_id) VALUES (%s, %s)
                        ON CONFLICT (estudiante_id, materia_id) DO NOTHING;
                    ''', assignments)

            cur.execute('SELECT COUNT(*) FROM profesor_materia;')
            if cur.fetchone()[0] == 0:
                cur.execute('SELECT id FROM profesores ORDER BY id ASC LIMIT 3;')
                prof_ids = [r[0] for r in cur.fetchall()]
                cur.execute('SELECT id FROM materias ORDER BY id ASC LIMIT 3;')
                mat_ids = [r[0] for r in cur.fetchall()]
                assignments = []
                if prof_ids and mat_ids:
                    for p_id, m_id in zip(prof_ids, mat_ids):
                        assignments.append((p_id, m_id))
                if assignments:
                    cur.executemany('''
                        INSERT INTO profesor_materia (profesor_id, materia_id) VALUES (%s, %s)
                        ON CONFLICT (profesor_id, materia_id) DO NOTHING;
                    ''', assignments)

            conn.commit()
            cur.close()
            conn.close()
            print("[OK] [PostgreSQL] Tablas y relaciones verificadas correctamente.")
        except Exception as e:
            print(f"[AVISO] [PostgreSQL] Error al inicializar base de datos: {e}")
    else:
        conn = sqlite3.connect(DB_FILE)
        conn.execute("PRAGMA foreign_keys = ON;")
        cur = conn.cursor()
        
        # 1. Tabla estudiantes
        cur.execute('''
            CREATE TABLE IF NOT EXISTS estudiantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                documento TEXT NOT NULL UNIQUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # 2. Tabla profesores
        cur.execute('''
            CREATE TABLE IF NOT EXISTS profesores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                documento TEXT NOT NULL UNIQUE,
                asignatura TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # 3. Tabla materias (Módulo 4.3)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS materias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                codigo TEXT NOT NULL UNIQUE,
                descripcion TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

        # 4. Tabla intermedia: estudiante_materia (Módulo 4.4)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS estudiante_materia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
                materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(estudiante_id, materia_id)
            );
        ''')

        # 5. Tabla intermedia: profesor_materia (Módulo 4.4)
        cur.execute('''
            CREATE TABLE IF NOT EXISTS profesor_materia (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profesor_id INTEGER NOT NULL REFERENCES profesores(id) ON DELETE CASCADE,
                materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
                fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(profesor_id, materia_id)
            );
        ''')

        # Insertar registros iniciales para estudiantes si está vacía
        cur.execute('SELECT COUNT(*) FROM estudiantes;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO estudiantes (nombre, documento) VALUES (?, ?);
            ''', [
                ('Juan Pérez', '1002345678'),
                ('María Gómez', '1008765432'),
                ('Carlos Rodríguez', '1005544332')
            ])

        # Insertar registros iniciales para profesores si está vacía
        cur.execute('SELECT COUNT(*) FROM profesores;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO profesores (nombre, documento, asignatura, email) VALUES (?, ?, ?, ?);
            ''', [
                ('Dra. Elena Ramos', '2001122334', 'Matemáticas Avanzadas', 'elena.ramos@colegio.edu'),
                ('Lic. Roberto Méndez', '2004455667', 'Física Cuántica', 'roberto.mendez@colegio.edu'),
                ('Mg. Sofía Castro', '2007788990', 'Lengua y Literatura', 'sofia.castro@colegio.edu')
            ])

        # Insertar registros iniciales para materias si está vacía
        cur.execute('SELECT COUNT(*) FROM materias;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO materias (nombre, codigo, descripcion) VALUES (?, ?, ?);
            ''', [
                ('Matemáticas Avanzadas', 'MAT-101', 'Cálculo diferencial, integral y álgebra lineal'),
                ('Física Cuántica', 'FIS-201', 'Mecánica moderna, ondas y principios cuánticos'),
                ('Lengua y Literatura', 'LIT-301', 'Análisis crítico de textos, retórica y redacción académica'),
                ('Química General', 'QUI-102', 'Estructura atómica, enlaces químicos y estequiometría'),
                ('Programación y Algoritmos', 'INF-105', 'Fundamentos de software, lógica algorítmica y Python')
            ])

        # Insertar asignaciones iniciales si están vacías
        cur.execute('SELECT COUNT(*) FROM estudiante_materia;')
        if cur.fetchone()[0] == 0:
            cur.execute('SELECT id FROM estudiantes ORDER BY id ASC LIMIT 3;')
            est_ids = [r[0] for r in cur.fetchall()]
            cur.execute('SELECT id FROM materias ORDER BY id ASC LIMIT 5;')
            mat_ids = [r[0] for r in cur.fetchall()]
            
            assignments = []
            if len(est_ids) >= 1 and len(mat_ids) >= 2:
                assignments.extend([(est_ids[0], mat_ids[0]), (est_ids[0], mat_ids[1])])
            if len(est_ids) >= 2 and len(mat_ids) >= 4:
                assignments.extend([(est_ids[1], mat_ids[2]), (est_ids[1], mat_ids[3])])
            if len(est_ids) >= 3 and len(mat_ids) >= 5:
                assignments.append((est_ids[2], mat_ids[4]))
            
            if assignments:
                cur.executemany('''
                    INSERT OR IGNORE INTO estudiante_materia (estudiante_id, materia_id) VALUES (?, ?);
                ''', assignments)

        cur.execute('SELECT COUNT(*) FROM profesor_materia;')
        if cur.fetchone()[0] == 0:
            cur.execute('SELECT id FROM profesores ORDER BY id ASC LIMIT 3;')
            prof_ids = [r[0] for r in cur.fetchall()]
            cur.execute('SELECT id FROM materias ORDER BY id ASC LIMIT 3;')
            mat_ids = [r[0] for r in cur.fetchall()]

            if prof_ids and mat_ids:
                assignments = []
                for p_id, m_id in zip(prof_ids, mat_ids):
                    assignments.append((p_id, m_id))
                if assignments:
                    cur.executemany('''
                        INSERT OR IGNORE INTO profesor_materia (profesor_id, materia_id) VALUES (?, ?);
                    ''', assignments)

        conn.commit()
        conn.close()
        print(f"[OK] [SQLite] Base de datos y tablas listas en: {DB_FILE}")


# ==========================================
# RUTAS DE INTERFAZ Y ESTADO
# ==========================================

@app.route('/')
def index():
    """Sirve la interfaz web del Dashboard."""
    return send_from_directory(FRONTEND_DIR, 'index.html')


@app.route('/api/health')
def health():
    """Endpoint para verificar el estado del servidor y la base de datos."""
    return jsonify({
        "status": "online",
        "base_de_datos": "PostgreSQL" if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else "SQLite (Integrada)"
    }), 200


@app.route('/api/stats')
def stats():
    """Retorna métricas globales de todo el sistema escolar."""
    try:
        conn = get_db()
        cur = conn.cursor()
        
        cur.execute('SELECT COUNT(*) FROM estudiantes;')
        total_estudiantes = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM profesores;')
        total_profesores = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM materias;')
        total_materias = cur.fetchone()[0]
        
        cur.execute('SELECT COUNT(*) FROM estudiante_materia;')
        total_asig_estudiantes = cur.fetchone()[0]

        cur.execute('SELECT COUNT(*) FROM profesor_materia;')
        total_asig_profesores = cur.fetchone()[0]
        
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()
        
        return jsonify({
            'total_estudiantes': total_estudiantes,
            'total_profesores': total_profesores,
            'total_materias': total_materias,
            'total_asignaciones': total_asig_estudiantes + total_asig_profesores,
            'total_asig_estudiantes': total_asig_estudiantes,
            'total_asig_profesores': total_asig_profesores
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al obtener estadísticas: {str(e)}'}), 500


# ==========================================
# ENDPOINTS API: ESTUDIANTES
# ==========================================

@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    """Retorna la lista de todos los estudiantes registrados con cantidad de materias asignadas."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT e.*, COUNT(em.id) AS total_materias
                FROM estudiantes e
                LEFT JOIN estudiante_materia em ON e.id = em.estudiante_id
                GROUP BY e.id
                ORDER BY e.id DESC;
            ''')
            estudiantes = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('''
                SELECT e.*, COUNT(em.id) AS total_materias
                FROM estudiantes e
                LEFT JOIN estudiante_materia em ON e.id = em.estudiante_id
                GROUP BY e.id
                ORDER BY e.id DESC;
            ''')
            rows = cur.fetchall()
            estudiantes = [dict(row) for row in rows]
        conn.close()
        return jsonify(estudiantes), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar estudiantes: {str(e)}'}), 500


@app.route('/api/estudiantes', methods=['POST'])
def create_estudiante():
    """Crea un nuevo registro de estudiante."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        nombre = (datos.get('nombre') or '').strip()
        documento = (datos.get('documento') or '').strip()

        if not nombre or not documento:
            return jsonify({'error': 'El nombre y el documento son campos obligatorios'}), 400

        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute(
                    'INSERT INTO estudiantes (nombre, documento) VALUES (%s, %s) RETURNING id;',
                    (nombre, documento)
                )
                nuevo_id = cur.fetchone()[0]
            except Exception as e:
                conn.rollback()
                conn.close()
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return jsonify({'error': f'Ya existe un estudiante con el documento {documento}'}), 400
                raise e
        else:
            try:
                cur.execute(
                    'INSERT INTO estudiantes (nombre, documento) VALUES (?, ?);',
                    (nombre, documento)
                )
                nuevo_id = cur.lastrowid
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({'error': f'Ya existe un estudiante con el documento {documento}'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        return jsonify({
            'id': nuevo_id,
            'nombre': nombre,
            'documento': documento,
            'mensaje': 'Estudiante registrado correctamente'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Error al guardar estudiante: {str(e)}'}), 500


@app.route('/api/estudiantes/<int:id>', methods=['DELETE'])
def delete_estudiante(id):
    """Elimina un estudiante por su identificador único."""
    try:
        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('DELETE FROM estudiantes WHERE id = %s;', (id,))
        else:
            cur.execute('DELETE FROM estudiantes WHERE id = ?;', (id,))

        filas_afectadas = cur.rowcount
        conn.commit()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Estudiante no encontrado'}), 404

        return jsonify({'mensaje': 'Estudiante eliminado correctamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al eliminar estudiante: {str(e)}'}), 500


@app.route('/api/estudiantes/<int:id>/materias', methods=['GET'])
def get_materias_de_estudiante(id):
    """Consulta las materias asignadas a un estudiante específico."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT em.id AS asignacion_id, em.fecha_asignacion,
                       m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion
                FROM estudiante_materia em
                JOIN materias m ON em.materia_id = m.id
                WHERE em.estudiante_id = %s
                ORDER BY m.nombre ASC;
            ''', (id,))
            materias = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('''
                SELECT em.id AS asignacion_id, em.fecha_asignacion,
                       m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion
                FROM estudiante_materia em
                JOIN materias m ON em.materia_id = m.id
                WHERE em.estudiante_id = ?
                ORDER BY m.nombre ASC;
            ''', (id,))
            rows = cur.fetchall()
            materias = [dict(row) for row in rows]
        conn.close()
        return jsonify(materias), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar materias del estudiante: {str(e)}'}), 500


# ==========================================
# ENDPOINTS API: PROFESORES
# ==========================================

@app.route('/api/profesores', methods=['GET'])
def get_profesores():
    """Retorna la lista de todos los profesores registrados con total de materias asignadas."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT p.*, COUNT(pm.id) AS total_materias
                FROM profesores p
                LEFT JOIN profesor_materia pm ON p.id = pm.profesor_id
                GROUP BY p.id
                ORDER BY p.id DESC;
            ''')
            profesores = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('''
                SELECT p.*, COUNT(pm.id) AS total_materias
                FROM profesores p
                LEFT JOIN profesor_materia pm ON p.id = pm.profesor_id
                GROUP BY p.id
                ORDER BY p.id DESC;
            ''')
            rows = cur.fetchall()
            profesores = [dict(row) for row in rows]
        conn.close()
        return jsonify(profesores), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar profesores: {str(e)}'}), 500


@app.route('/api/profesores', methods=['POST'])
def create_profesor():
    """Crea un nuevo registro de profesor con validación de datos."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        nombre = (datos.get('nombre') or '').strip()
        documento = (datos.get('documento') or '').strip()
        asignatura = (datos.get('asignatura') or '').strip()
        email = (datos.get('email') or '').strip()

        if not nombre or not documento or not asignatura or not email:
            return jsonify({'error': 'Todos los campos son obligatorios (nombre, documento, asignatura, email)'}), 400

        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute(
                    'INSERT INTO profesores (nombre, documento, asignatura, email) VALUES (%s, %s, %s, %s) RETURNING id;',
                    (nombre, documento, asignatura, email)
                )
                nuevo_id = cur.fetchone()[0]
            except Exception as e:
                conn.rollback()
                conn.close()
                err_msg = str(e).lower()
                if 'unique' in err_msg or 'duplicate' in err_msg:
                    if 'documento' in err_msg:
                        return jsonify({'error': f'Ya existe un profesor con el documento {documento}'}), 400
                    elif 'email' in err_msg:
                        return jsonify({'error': f'Ya existe un profesor con el email {email}'}), 400
                    return jsonify({'error': 'El documento o email ya se encuentra registrado'}), 400
                raise e
        else:
            try:
                cur.execute(
                    'INSERT INTO profesores (nombre, documento, asignatura, email) VALUES (?, ?, ?, ?);',
                    (nombre, documento, asignatura, email)
                )
                nuevo_id = cur.lastrowid
            except sqlite3.IntegrityError as e:
                conn.close()
                err_msg = str(e).lower()
                if 'documento' in err_msg:
                    return jsonify({'error': f'Ya existe un profesor con el documento {documento}'}), 400
                elif 'email' in err_msg:
                    return jsonify({'error': f'Ya existe un profesor con el email {email}'}), 400
                return jsonify({'error': 'El documento o email ya se encuentra registrado'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        return jsonify({
            'id': nuevo_id,
            'nombre': nombre,
            'documento': documento,
            'asignatura': asignatura,
            'email': email,
            'mensaje': 'Profesor registrado correctamente'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Error al guardar profesor: {str(e)}'}), 500


@app.route('/api/profesores/<int:id>', methods=['DELETE'])
def delete_profesor(id):
    """Elimina un profesor por su identificador único."""
    try:
        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('DELETE FROM profesores WHERE id = %s;', (id,))
        else:
            cur.execute('DELETE FROM profesores WHERE id = ?;', (id,))

        filas_afectadas = cur.rowcount
        conn.commit()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Profesor no encontrado'}), 404

        return jsonify({'mensaje': 'Profesor eliminado correctamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al eliminar profesor: {str(e)}'}), 500


@app.route('/api/profesores/<int:id>/materias', methods=['GET'])
def get_materias_de_profesor(id):
    """Consulta las materias asignadas a un profesor específico."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT pm.id AS asignacion_id, pm.fecha_asignacion,
                       m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion
                FROM profesor_materia pm
                JOIN materias m ON pm.materia_id = m.id
                WHERE pm.profesor_id = %s
                ORDER BY m.nombre ASC;
            ''', (id,))
            materias = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('''
                SELECT pm.id AS asignacion_id, pm.fecha_asignacion,
                       m.id AS materia_id, m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion
                FROM profesor_materia pm
                JOIN materias m ON pm.materia_id = m.id
                WHERE pm.profesor_id = ?
                ORDER BY m.nombre ASC;
            ''', (id,))
            rows = cur.fetchall()
            materias = [dict(row) for row in rows]
        conn.close()
        return jsonify(materias), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar materias del profesor: {str(e)}'}), 500


# ==========================================
# ENDPOINTS API: MATERIAS (CRUD - MÓDULO 4.3)
# ==========================================

@app.route('/api/materias', methods=['GET'])
def get_materias():
    """Retorna la lista de todas las materias registradas junto con el total de estudiantes y profesores asignados."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('''
                SELECT m.*,
                       COUNT(DISTINCT em.id) AS total_estudiantes,
                       COUNT(DISTINCT pm.id) AS total_profesores
                FROM materias m
                LEFT JOIN estudiante_materia em ON m.id = em.materia_id
                LEFT JOIN profesor_materia pm ON m.id = pm.materia_id
                GROUP BY m.id
                ORDER BY m.id DESC;
            ''')
            materias = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('''
                SELECT m.*,
                       COUNT(DISTINCT em.id) AS total_estudiantes,
                       COUNT(DISTINCT pm.id) AS total_profesores
                FROM materias m
                LEFT JOIN estudiante_materia em ON m.id = em.materia_id
                LEFT JOIN profesor_materia pm ON m.id = pm.materia_id
                GROUP BY m.id
                ORDER BY m.id DESC;
            ''')
            rows = cur.fetchall()
            materias = [dict(row) for row in rows]
        conn.close()
        return jsonify(materias), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar materias: {str(e)}'}), 500


@app.route('/api/materias/<int:id>', methods=['GET'])
def get_materia(id):
    """Retorna los datos de una materia específica por su ID."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM materias WHERE id = %s;', (id,))
            materia = cur.fetchone()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('SELECT * FROM materias WHERE id = ?;', (id,))
            row = cur.fetchone()
            materia = dict(row) if row else None
        conn.close()

        if not materia:
            return jsonify({'error': 'Materia no encontrada'}), 404

        return jsonify(materia), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar materia: {str(e)}'}), 500


@app.route('/api/materias', methods=['POST'])
def create_materia():
    """Crea un nuevo registro de materia con nombre, código y descripción."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        nombre = (datos.get('nombre') or '').strip()
        codigo = (datos.get('codigo') or '').strip().upper()
        descripcion = (datos.get('descripcion') or '').strip()

        if not nombre or not codigo:
            return jsonify({'error': 'El nombre y el código de la materia son obligatorios'}), 400

        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute(
                    'INSERT INTO materias (nombre, codigo, descripcion) VALUES (%s, %s, %s) RETURNING id;',
                    (nombre, codigo, descripcion)
                )
                nuevo_id = cur.fetchone()[0]
            except Exception as e:
                conn.rollback()
                conn.close()
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return jsonify({'error': f'Ya existe una materia con el código "{codigo}"'}), 400
                raise e
        else:
            try:
                cur.execute(
                    'INSERT INTO materias (nombre, codigo, descripcion) VALUES (?, ?, ?);',
                    (nombre, codigo, descripcion)
                )
                nuevo_id = cur.lastrowid
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({'error': f'Ya existe una materia con el código "{codigo}"'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        return jsonify({
            'id': nuevo_id,
            'nombre': nombre,
            'codigo': codigo,
            'descripcion': descripcion,
            'mensaje': 'Materia registrada correctamente'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Error al guardar materia: {str(e)}'}), 500


@app.route('/api/materias/<int:id>', methods=['PUT'])
def update_materia(id):
    """Actualiza la información de una materia existente."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        nombre = (datos.get('nombre') or '').strip()
        codigo = (datos.get('codigo') or '').strip().upper()
        descripcion = (datos.get('descripcion') or '').strip()

        if not nombre or not codigo:
            return jsonify({'error': 'El nombre y el código de la materia son obligatorios'}), 400

        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute('''
                    UPDATE materias
                    SET nombre = %s, codigo = %s, descripcion = %s
                    WHERE id = %s;
                ''', (nombre, codigo, descripcion, id))
                filas_afectadas = cur.rowcount
            except Exception as e:
                conn.rollback()
                conn.close()
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return jsonify({'error': f'Ya existe otra materia con el código "{codigo}"'}), 400
                raise e
        else:
            try:
                cur.execute('''
                    UPDATE materias
                    SET nombre = ?, codigo = ?, descripcion = ?
                    WHERE id = ?;
                ''', (nombre, codigo, descripcion, id))
                filas_afectadas = cur.rowcount
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({'error': f'Ya existe otra materia con el código "{codigo}"'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Materia no encontrada'}), 404

        return jsonify({
            'id': id,
            'nombre': nombre,
            'codigo': codigo,
            'descripcion': descripcion,
            'mensaje': 'Materia actualizada correctamente'
        }), 200
    except Exception as e:
        return jsonify({'error': f'Error al actualizar materia: {str(e)}'}), 500


@app.route('/api/materias/<int:id>', methods=['DELETE'])
def delete_materia(id):
    """Elimina una materia por su identificador único y remueve sus asignaciones en cascada."""
    try:
        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('DELETE FROM materias WHERE id = %s;', (id,))
        else:
            cur.execute('DELETE FROM materias WHERE id = ?;', (id,))

        filas_afectadas = cur.rowcount
        conn.commit()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Materia no encontrada'}), 404

        return jsonify({'mensaje': 'Materia eliminada correctamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al eliminar materia: {str(e)}'}), 500


# ==========================================
# ENDPOINTS API: ASIGNACIONES (MÓDULO 4.4)
# ==========================================

# --- ASIGNACIÓN DE ESTUDIANTES ---

@app.route('/api/asignaciones/estudiantes', methods=['GET'])
def get_asignaciones_estudiantes():
    """Retorna el listado de materias asignadas a los estudiantes con opción de filtro por estudiante_id o materia_id."""
    estudiante_id = request.args.get('estudiante_id')
    materia_id = request.args.get('materia_id')
    
    try:
        conn = get_db()
        query = '''
            SELECT em.id, em.estudiante_id, em.materia_id, em.fecha_asignacion,
                   e.nombre AS estudiante_nombre, e.documento AS estudiante_documento,
                   m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion AS materia_descripcion
            FROM estudiante_materia em
            JOIN estudiantes e ON em.estudiante_id = e.id
            JOIN materias m ON em.materia_id = m.id
            WHERE 1=1
        '''
        params = []
        
        if estudiante_id:
            query += ' AND em.estudiante_id = %s' if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else ' AND em.estudiante_id = ?'
            params.append(int(estudiante_id))
            
        if materia_id:
            query += ' AND em.materia_id = %s' if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else ' AND em.materia_id = ?'
            params.append(int(materia_id))
            
        query += ' ORDER BY em.id DESC;'

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, tuple(params))
            asignaciones = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            asignaciones = [dict(row) for row in rows]
        conn.close()
        return jsonify(asignaciones), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar asignaciones de estudiantes: {str(e)}'}), 500


@app.route('/api/asignaciones/estudiantes', methods=['POST'])
def create_asignacion_estudiante():
    """Asigna una materia a un estudiante."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        estudiante_id = datos.get('estudiante_id')
        materia_id = datos.get('materia_id')

        if not estudiante_id or not materia_id:
            return jsonify({'error': 'Debes seleccionar un estudiante y una materia'}), 400

        conn = get_db()
        cur = conn.cursor()

        # Verificar existencia de estudiante y materia
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('SELECT nombre FROM estudiantes WHERE id = %s;', (estudiante_id,))
            est = cur.fetchone()
            cur.execute('SELECT nombre FROM materias WHERE id = %s;', (materia_id,))
            mat = cur.fetchone()
        else:
            cur.execute('SELECT nombre FROM estudiantes WHERE id = ?;', (estudiante_id,))
            est = cur.fetchone()
            cur.execute('SELECT nombre FROM materias WHERE id = ?;', (materia_id,))
            mat = cur.fetchone()

        if not est:
            conn.close()
            return jsonify({'error': 'El estudiante seleccionado no existe'}), 404
        if not mat:
            conn.close()
            return jsonify({'error': 'La materia seleccionada no existe'}), 404

        est_nombre = est[0] if isinstance(est, (list, tuple)) else est['nombre']
        mat_nombre = mat[0] if isinstance(mat, (list, tuple)) else mat['nombre']

        # Insertar asignación
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute('''
                    INSERT INTO estudiante_materia (estudiante_id, materia_id)
                    VALUES (%s, %s)
                    RETURNING id, fecha_asignacion;
                ''', (estudiante_id, materia_id))
                row = cur.fetchone()
                nuevo_id = row[0]
            except Exception as e:
                conn.rollback()
                conn.close()
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return jsonify({'error': f'El estudiante {est_nombre} ya tiene asignada la materia "{mat_nombre}"'}), 400
                raise e
        else:
            try:
                cur.execute('''
                    INSERT INTO estudiante_materia (estudiante_id, materia_id)
                    VALUES (?, ?);
                ''', (estudiante_id, materia_id))
                nuevo_id = cur.lastrowid
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({'error': f'El estudiante {est_nombre} ya tiene asignada la materia "{mat_nombre}"'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        return jsonify({
            'id': nuevo_id,
            'estudiante_id': estudiante_id,
            'estudiante_nombre': est_nombre,
            'materia_id': materia_id,
            'materia_nombre': mat_nombre,
            'mensaje': f'Materia "{mat_nombre}" asignada exitosamente a {est_nombre}'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Error al registrar asignación de estudiante: {str(e)}'}), 500


@app.route('/api/asignaciones/estudiantes/<int:id>', methods=['DELETE'])
def delete_asignacion_estudiante(id):
    """Elimina una asignación entre estudiante y materia por su ID."""
    try:
        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('DELETE FROM estudiante_materia WHERE id = %s;', (id,))
        else:
            cur.execute('DELETE FROM estudiante_materia WHERE id = ?;', (id,))

        filas_afectadas = cur.rowcount
        conn.commit()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Asignación no encontrada'}), 404

        return jsonify({'mensaje': 'Asignación eliminada correctamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al eliminar asignación: {str(e)}'}), 500


# --- ASIGNACIÓN DE PROFESORES ---

@app.route('/api/asignaciones/profesores', methods=['GET'])
def get_asignaciones_profesores():
    """Retorna el listado de materias asignadas a los profesores con opción de filtro por profesor_id o materia_id."""
    profesor_id = request.args.get('profesor_id')
    materia_id = request.args.get('materia_id')
    
    try:
        conn = get_db()
        query = '''
            SELECT pm.id, pm.profesor_id, pm.materia_id, pm.fecha_asignacion,
                   p.nombre AS profesor_nombre, p.documento AS profesor_documento, p.email AS profesor_email, p.asignatura AS profesor_especialidad,
                   m.nombre AS materia_nombre, m.codigo AS materia_codigo, m.descripcion AS materia_descripcion
            FROM profesor_materia pm
            JOIN profesores p ON pm.profesor_id = p.id
            JOIN materias m ON pm.materia_id = m.id
            WHERE 1=1
        '''
        params = []
        
        if profesor_id:
            query += ' AND pm.profesor_id = %s' if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else ' AND pm.profesor_id = ?'
            params.append(int(profesor_id))
            
        if materia_id:
            query += ' AND pm.materia_id = %s' if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else ' AND pm.materia_id = ?'
            params.append(int(materia_id))
            
        query += ' ORDER BY pm.id DESC;'

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute(query, tuple(params))
            asignaciones = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute(query, tuple(params))
            rows = cur.fetchall()
            asignaciones = [dict(row) for row in rows]
        conn.close()
        return jsonify(asignaciones), 200
    except Exception as e:
        return jsonify({'error': f'Error al consultar asignaciones de profesores: {str(e)}'}), 500


@app.route('/api/asignaciones/profesores', methods=['POST'])
def create_asignacion_profesor():
    """Asigna una materia a un profesor/docente."""
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        profesor_id = datos.get('profesor_id')
        materia_id = datos.get('materia_id')

        if not profesor_id or not materia_id:
            return jsonify({'error': 'Debes seleccionar un profesor y una materia'}), 400

        conn = get_db()
        cur = conn.cursor()

        # Verificar existencia de profesor y materia
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('SELECT nombre FROM profesores WHERE id = %s;', (profesor_id,))
            prof = cur.fetchone()
            cur.execute('SELECT nombre FROM materias WHERE id = %s;', (materia_id,))
            mat = cur.fetchone()
        else:
            cur.execute('SELECT nombre FROM profesores WHERE id = ?;', (profesor_id,))
            prof = cur.fetchone()
            cur.execute('SELECT nombre FROM materias WHERE id = ?;', (materia_id,))
            mat = cur.fetchone()

        if not prof:
            conn.close()
            return jsonify({'error': 'El profesor seleccionado no existe'}), 404
        if not mat:
            conn.close()
            return jsonify({'error': 'La materia seleccionada no existe'}), 404

        prof_nombre = prof[0] if isinstance(prof, (list, tuple)) else prof['nombre']
        mat_nombre = mat[0] if isinstance(mat, (list, tuple)) else mat['nombre']

        # Insertar asignación
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            try:
                cur.execute('''
                    INSERT INTO profesor_materia (profesor_id, materia_id)
                    VALUES (%s, %s)
                    RETURNING id, fecha_asignacion;
                ''', (profesor_id, materia_id))
                row = cur.fetchone()
                nuevo_id = row[0]
            except Exception as e:
                conn.rollback()
                conn.close()
                if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
                    return jsonify({'error': f'El profesor {prof_nombre} ya tiene asignada la materia "{mat_nombre}"'}), 400
                raise e
        else:
            try:
                cur.execute('''
                    INSERT INTO profesor_materia (profesor_id, materia_id)
                    VALUES (?, ?);
                ''', (profesor_id, materia_id))
                nuevo_id = cur.lastrowid
            except sqlite3.IntegrityError:
                conn.close()
                return jsonify({'error': f'El profesor {prof_nombre} ya tiene asignada la materia "{mat_nombre}"'}), 400

        conn.commit()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        return jsonify({
            'id': nuevo_id,
            'profesor_id': profesor_id,
            'profesor_nombre': prof_nombre,
            'materia_id': materia_id,
            'materia_nombre': mat_nombre,
            'mensaje': f'Materia "{mat_nombre}" asignada exitosamente a {prof_nombre}'
        }), 201
    except Exception as e:
        return jsonify({'error': f'Error al registrar asignación de profesor: {str(e)}'}), 500


@app.route('/api/asignaciones/profesores/<int:id>', methods=['DELETE'])
def delete_asignacion_profesor(id):
    """Elimina una asignación entre profesor y materia por su ID."""
    try:
        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute('DELETE FROM profesor_materia WHERE id = %s;', (id,))
        else:
            cur.execute('DELETE FROM profesor_materia WHERE id = ?;', (id,))

        filas_afectadas = cur.rowcount
        conn.commit()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.close()
        conn.close()

        if filas_afectadas == 0:
            return jsonify({'error': 'Asignación no encontrada'}), 404

        return jsonify({'mensaje': 'Asignación eliminada correctamente'}), 200
    except Exception as e:
        return jsonify({'error': f'Error al eliminar asignación: {str(e)}'}), 500


# ==========================================
# PUNTO DE ENTRADA PRINCIPAL
# ==========================================

if __name__ == '__main__':
    init_db()
    print(">> Servidor Flask corriendo en http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
