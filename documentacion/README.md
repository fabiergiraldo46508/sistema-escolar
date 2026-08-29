# 📚 Sistema Escolar - Panel de Administración y Gestión Integral

Aplicación web Full-Stack moderna para la administración escolar desarrollada con **Python (Flask)**, **PostgreSQL** / **SQLite**, y **Frontend Vanilla (HTML5, CSS3, JavaScript ES6+)** con diseño tipo **Dashboard Profesional**.

---

## 🗂️ Estructura del Proyecto

```text
sistema-escolar/
├── backend/
│   ├── app.py                # Servidor Flask con API RESTful (Estudiantes y Profesores)
│   ├── sistema_escolar.db    # Base de datos SQLite integrada (desarrollo rápido)
│   ├── requirements.txt      # Dependencias de Python
│   ├── schema.sql            # Script DDL para PostgreSQL (Estudiantes y Profesores)
│   ├── .env                  # Configuración de base de datos
│   └── .env.example          # Plantilla de variables de entorno
├── frontend/
│   ├── index.html            # Dashboard administrativo modular (Sidebar + Vistas)
│   ├── styles.css            # Hoja de estilos moderna, responsiva y temática
│   └── app.js                # Lógica del cliente, sincronización Fetch y KPIs
├── iniciar_servidor.bat      # Acceso directo para arrancar el backend en Windows
└── documentacion/
    └── README.md             # Guía técnica de instalación y endpoints
```

---

## 🚀 Inicio Rápido

El sistema cuenta con una **base de datos integrada lista para usar**.

### 1. Iniciar el Backend (Flask)
Ejecuta el archivo [iniciar_servidor.bat](file:///c:/Users/ASUS/sistema-escolar/iniciar_servidor.bat) o desde la terminal:

```powershell
cd backend
.\venv\Scripts\activate
python app.py
```
> El servidor iniciará en: `http://127.0.0.1:5000`

### 2. Acceder al Dashboard Frontend
Abre directamente en tu navegador el archivo [frontend/index.html](file:///c:/Users/ASUS/sistema-escolar/frontend/index.html) o navega a `http://127.0.0.1:5000/`.

---

## 🐘 Esquema de Base de Datos (PostgreSQL)

El archivo [backend/schema.sql](file:///c:/Users/ASUS/sistema-escolar/backend/schema.sql) contiene las definiciones DDL oficiales:

```sql
-- Tabla: estudiantes
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: profesores
CREATE TABLE IF NOT EXISTS profesores (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    documento VARCHAR(50) NOT NULL UNIQUE,
    asignatura VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📡 Endpoints de la API REST

### Estado del Servidor
| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Estado del servidor y tipo de base de datos conectada |

### Módulo de Estudiantes
| Método | Endpoint | Payload / Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/estudiantes` | Lista todos los estudiantes registrados |
| `POST` | `/api/estudiantes` | `{ "nombre": "...", "documento": "..." }` |
| `DELETE` | `/api/estudiantes/<id>` | Elimina un estudiante por su ID |

### Módulo de Profesores
| Método | Endpoint | Payload / Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/profesores` | Lista todos los profesores registrados |
| `POST` | `/api/profesores` | `{ "nombre": "...", "documento": "...", "asignatura": "...", "email": "..." }` |
| `DELETE` | `/api/profesores/<id>` | Elimina un profesor por su ID |

---

## ✨ Características del Rediseño UI/UX
- **Navegación Modular**: Menú lateral (Sidebar) para alternar fluidamente entre el Módulo de Estudiantes y el Módulo de Profesores.
- **Métricas en Tiempo Real (KPIs)**: Indicadores de Total de Estudiantes, Total de Profesores, Especialidades activas y Estado del Backend.
- **Búsqueda Dinámica**: Filtro en tiempo real por nombre, documento, asignatura o email.
- **Experiencia de Usuario Pulida**: Toasts animados de notificación, modales de confirmación para borrado seguro y avatares con iniciales automáticas.
