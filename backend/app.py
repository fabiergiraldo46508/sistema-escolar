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
        return conn


def init_db():
    """Inicializa las tablas de estudiantes y profesores con datos de prueba si están vacías."""
    if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
        try:
            conn = get_db()
            cur = conn.cursor()
            # Tabla estudiantes
            cur.execute('''
                CREATE TABLE IF NOT EXISTS estudiantes (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(150) NOT NULL,
                    documento VARCHAR(50) NOT NULL UNIQUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            # Tabla profesores
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
            conn.commit()
            cur.close()
            conn.close()
            print("[OK] [PostgreSQL] Tablas 'estudiantes' y 'profesores' verificadas correctamente.")
        except Exception as e:
            print(f"[AVISO] [PostgreSQL] Error al inicializar base de datos: {e}")
    else:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        
        # Tabla estudiantes
        cur.execute('''
            CREATE TABLE IF NOT EXISTS estudiantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                documento TEXT NOT NULL UNIQUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        
        # Tabla profesores
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

        # Insertar registros iniciales para estudiantes si la tabla está vacía
        cur.execute('SELECT COUNT(*) FROM estudiantes;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO estudiantes (nombre, documento) VALUES (?, ?);
            ''', [
                ('Juan Pérez', '1002345678'),
                ('María Gómez', '1008765432'),
                ('Carlos Rodríguez', '1005544332')
            ])
            print("[INFO] Datos iniciales de estudiantes cargados en SQLite.")

        # Insertar registros iniciales para profesores si la tabla está vacía
        cur.execute('SELECT COUNT(*) FROM profesores;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO profesores (nombre, documento, asignatura, email) VALUES (?, ?, ?, ?);
            ''', [
                ('Dra. Elena Ramos', '2001122334', 'Matemáticas Avanzadas', 'elena.ramos@colegio.edu'),
                ('Lic. Roberto Méndez', '2004455667', 'Física Cuántica', 'roberto.mendez@colegio.edu'),
                ('Mg. Sofía Castro', '2007788990', 'Lengua y Literatura', 'sofia.castro@colegio.edu')
            ])
            print("[INFO] Datos iniciales de profesores cargados en SQLite.")

        conn.commit()
        conn.close()
        print(f"[OK] [SQLite] Base de datos lista en: {DB_FILE}")


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


# ==========================================
# ENDPOINTS API: ESTUDIANTES
# ==========================================

@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    """Retorna la lista de todos los estudiantes registrados."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM estudiantes ORDER BY id DESC;')
            estudiantes = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('SELECT * FROM estudiantes ORDER BY id DESC;')
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


# ==========================================
# ENDPOINTS API: PROFESORES
# ==========================================

@app.route('/api/profesores', methods=['GET'])
def get_profesores():
    """Retorna la lista de todos los profesores registrados."""
    try:
        conn = get_db()
        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute('SELECT * FROM profesores ORDER BY id DESC;')
            profesores = cur.fetchall()
            cur.close()
        else:
            cur = conn.cursor()
            cur.execute('SELECT * FROM profesores ORDER BY id DESC;')
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


if __name__ == '__main__':
    init_db()
    print(">> Servidor Flask corriendo en http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
