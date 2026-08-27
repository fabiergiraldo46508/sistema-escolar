# 📚 Sistema Escolar - Documentación de Instalación y Uso

Este proyecto es una aplicación web completa para la gestión escolar, compuesta por un **Frontend Web** moderno y un **Backend API REST** con **Python Flask** y base de datos integrada **SQLite** (con soporte opcional para **PostgreSQL**).

---

## 🗂️ Estructura del Proyecto

```text
sistema-escolar/
├── backend/
│   ├── app.py                # Servidor Flask con endpoints de la API
│   ├── sistema_escolar.db    # Base de datos SQLite integrada (se crea automáticamente)
│   ├── requirements.txt      # Dependencias de Python
│   ├── schema.sql            # Script de base de datos para PostgreSQL (opcional)
│   ├── .env                  # Configuración de base de datos
│   └── .env.example          # Plantilla de variables de entorno
├── frontend/
│   ├── index.html            # Interfaz gráfica de usuario
│   ├── styles.css            # Hoja de estilos moderna y responsiva
│   └── app.js                # Lógica del cliente y llamadas fetch a la API
├── iniciar_servidor.bat      # Acceso directo para iniciar el backend con 1 clic
└── documentacion/
    └── README.md             # Esta guía paso a paso
```

---

## ⚡ Inicio Rápido (Listo para Usar)

El sistema ya incluye una **base de datos integrada lista para usar**. No necesitas instalar ni configurar PostgreSQL para empezar.

### 1. Iniciar el Backend
Haz doble clic en el archivo [iniciar_servidor.bat](file:///c:/Users/ASUS/sistema-escolar/iniciar_servidor.bat) en la carpeta principal del proyecto.

*(O mediante terminal)*:
```powershell
cd c:\Users\ASUS\sistema-escolar\backend
.\venv\Scripts\activate
python app.py
```

### 2. Abrir el Frontend
Haz doble clic en [frontend/index.html](file:///c:/Users/ASUS/sistema-escolar/frontend/index.html) para abrirlo en tu navegador favorito (Chrome, Edge, Firefox).

---

## 🐘 Usar PostgreSQL (Opcional)

Si en el futuro deseas conectar PostgreSQL en lugar de SQLite:
1. Abre [backend/.env](file:///c:/Users/ASUS/sistema-escolar/backend/.env) y cambia `DB_TYPE=postgres`.
2. Configura tu usuario y contraseña de PostgreSQL.
3. Reinicia el servidor backend.

---

## 📡 Endpoints de la API

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Comprobar salud y estado de la API |
| `GET` | `/api/estudiantes` | Obtener todos los estudiantes registrados |
| `POST` | `/api/estudiantes` | Crear un nuevo estudiante (`{ "nombre": "...", "documento": "..." }`) |
| `DELETE` | `/api/estudiantes/<id>` | Eliminar un estudiante por su ID |

