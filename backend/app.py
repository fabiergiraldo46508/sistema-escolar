import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

def get_db_connection():
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'sistema_escolar'),
        user=os.getenv('DB_USER', 'usuario_app'),
        password=os.getenv('DB_PASSWORD', 'ClaveSegura123'),
        port=os.getenv('DB_PORT', 5432)
    )
    return conn

@app.route('/')
def home():
    return jsonify({"mensaje": "API Servidor Escolar Activa"})

# ==========================================
# MÓDULO DE ESTUDIANTES
# ==========================================
@app.route('/api/estudiantes', methods=['GET'])
def get_estudiantes():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute('SELECT * FROM estudiantes;')
        estudiantes = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify(estudiantes), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/estudiantes', methods=['POST'])
def create_estudiante():
    try:
        datos = request.get_json()
        nombre = datos.get('nombre')
        documento = datos.get('documento')
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            'INSERT INTO estudiantes (nombre, documento) VALUES (%s, %s) RETURNING id;',
            (nombre, documento)
        )
        nuevo_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'id': nuevo_id, 'mensaje': 'Estudiante creado exitosamente'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/estudiantes/<int:id>', methods=['DELETE'])
def delete_estudiante(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM estudiantes WHERE id = %s;', (id,))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'mensaje': 'Estudiante eliminado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)