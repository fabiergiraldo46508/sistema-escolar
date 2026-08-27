import os
import sqlite3
# pyrefly: ignore [missing-import]
from flask import Flask, jsonify, request
from flask_cors import CORS
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv

# Opcional: intentar importar psycopg2 si el usuario desea PostgreSQL
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
    """Retorna una conexión activa a SQLite o PostgreSQL según configuración"""
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
    """Crea la base de datos y la tabla de estudiantes automáticamente con datos de prueba"""
    if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
        try:
            conn = get_db()
            cur = conn.cursor()
            cur.execute('''
                CREATE TABLE IF NOT EXISTS estudiantes (
                    id SERIAL PRIMARY KEY,
                    nombre VARCHAR(150) NOT NULL,
                    documento VARCHAR(50) NOT NULL UNIQUE,
                    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            ''')
            conn.commit()
            cur.close()
            conn.close()
            print("[OK] [PostgreSQL] Base de datos y tabla 'estudiantes' conectadas con exito.")
        except Exception as e:
            print(f"[AVISO] [PostgreSQL] Error de conexion: {e}")
    else:
        conn = sqlite3.connect(DB_FILE)
        cur = conn.cursor()
        cur.execute('''
            CREATE TABLE IF NOT EXISTS estudiantes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                documento TEXT NOT NULL UNIQUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')
        # Insertar registros iniciales de demostración si la tabla está vacía
        cur.execute('SELECT COUNT(*) FROM estudiantes;')
        if cur.fetchone()[0] == 0:
            cur.executemany('''
                INSERT INTO estudiantes (nombre, documento) VALUES (?, ?);
            ''', [
                ('Juan Perez', '1002345678'),
                ('Maria Gomez', '1008765432'),
                ('Carlos Rodriguez', '1005544332')
            ])
            print("[INFO] Datos iniciales de demostracion cargados en la base de datos.")
        conn.commit()
        conn.close()
        print(f"[OK] [SQLite] Base de datos lista en: {DB_FILE}")

# ==========================================
# RUTAS DE INTERFAZ Y API REST
# ==========================================

# pyrefly: ignore [missing-import]
from flask import send_from_directory

@app.route('/')
def index():
    """Sirve la interfaz web directamente"""
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/api/health')
def health():
    return jsonify({
        "mensaje": "API Servidor Escolar Activa",
        "status": "online",
        "base_de_datos": "PostgreSQL" if (DB_TYPE == 'postgres' and POSTGRES_AVAILABLE) else "SQLite (Integrada)"
    })


@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
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
        return jsonify({'error': f'Error al consultar base de datos: {str(e)}'}), 500

@app.route('/api/estudiantes', methods=['POST'])
def create_estudiante():
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se enviaron datos en la solicitud'}), 400

        nombre = (datos.get('nombre') or '').strip()
        documento = (datos.get('documento') or '').strip()

        if not nombre or not documento:
            return jsonify({'error': 'El nombre y el documento son campos requeridos'}), 400

        conn = get_db()
        cur = conn.cursor()

        if DB_TYPE == 'postgres' and POSTGRES_AVAILABLE:
            cur.execute(
                'INSERT INTO estudiantes (nombre, documento) VALUES (%s, %s) RETURNING id;',
                (nombre, documento)
            )
            nuevo_id = cur.fetchone()[0]
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
            'mensaje': 'Estudiante registrado exitosamente'
        }), 201
    except Exception as e:
        if 'unique' in str(e).lower() or 'duplicate' in str(e).lower():
            return jsonify({'error': f'Ya existe un estudiante con el documento {documento}'}), 400
        return jsonify({'error': f'Error al guardar estudiante: {str(e)}'}), 500

@app.route('/api/estudiantes/<int:id>', methods=['DELETE'])
def delete_estudiante(id):
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
        return jsonify({'error': f'Error al eliminar: {str(e)}'}), 500

if __name__ == '__main__':
    init_db()
    print(">> Servidor Flask corriendo en http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)


