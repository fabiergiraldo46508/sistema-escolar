/**
 * SISTEMA ESCOLAR - GESTIÓN DE ESTUDIANTES
 * Lógica de conexión con la API Flask
 */

const API_BASE_URL = (window.location.origin && window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://127.0.0.1:5000';
const API_ESTUDIANTES = `${API_BASE_URL}/api/estudiantes`;
const API_HEALTH = `${API_BASE_URL}/api/health`;

// Estado de la aplicación
let estudiantes = [];
let studentIdToDelete = null;

// Elementos del DOM
const form = document.getElementById('student-form');
const inputNombre = document.getElementById('nombre');
const inputDocumento = document.getElementById('documento');
const btnSubmit = document.getElementById('btn-submit');
const submitSpinner = document.getElementById('submit-spinner');
const btnSubmitText = btnSubmit.querySelector('.btn-text');

const tableBody = document.getElementById('estudiantes-list');
const tableLoader = document.getElementById('table-loader');
const emptyState = document.getElementById('empty-state');
const noSearchResults = document.getElementById('no-search-results');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const btnReload = document.getElementById('btn-reload');

const totalCountEl = document.getElementById('total-count');
const activeCountEl = document.getElementById('active-count');
const showingCountEl = document.getElementById('showing-count');
const serverStatusEl = document.getElementById('server-status');

// Modal de eliminación
const deleteModal = document.getElementById('delete-modal');
const modalStudentName = document.getElementById('modal-student-name');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Toast Container
const toastContainer = document.getElementById('toast-container');

/**
 * Inicialización al cargar la página
 */
document.addEventListener('DOMContentLoaded', () => {
    checkServerHealth();
    cargarEstudiantes();
    setupEventListeners();
});

/**
 * Configurar eventos del usuario
 */
function setupEventListeners() {
    // Envío del formulario (Crear estudiante)
    form.addEventListener('submit', handleFormSubmit);

    // Búsqueda en tiempo real
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hidden');
        renderTable(estudiantes);
    });

    // Botón de recarga manual
    btnReload.addEventListener('click', () => {
        btnReload.classList.add('spinning');
        checkServerHealth();
        cargarEstudiantes().finally(() => {
            setTimeout(() => btnReload.classList.remove('spinning'), 500);
        });
    });

    // Eventos del modal de confirmación
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', confirmDeleteEstudiante);

    // Cerrar modal al hacer clic en el fondo
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Cerrar modal con la tecla Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
            closeDeleteModal();
        }
    });
}

/**
 * Comprobar estado de la conexión con el servidor
 */
async function checkServerHealth() {
    const dot = serverStatusEl.querySelector('.status-dot');
    const text = serverStatusEl.querySelector('.status-text');

    try {
        const response = await fetch(API_HEALTH, { method: 'GET' });
        if (response.ok) {
            const data = await response.json();
            serverStatusEl.className = 'server-status-pill online';
            text.textContent = `Servidor en línea (${data.base_de_datos || 'Puerto 5000'})`;
        } else {
            throw new Error('Servidor no disponible');
        }
    } catch (error) {
        serverStatusEl.className = 'server-status-pill offline';
        text.textContent = 'Sin conexión con el backend';
    }
}

/**
 * Obtener lista de estudiantes desde la API
 */
async function cargarEstudiantes() {
    showLoading(true);

    try {
        const response = await fetch(API_ESTUDIANTES);
        if (!response.ok) {
            throw new Error(`Error en el servidor: ${response.status}`);
        }

        estudiantes = await response.json();
        renderTable(estudiantes);
        updateCounters(estudiantes.length, estudiantes.length);
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        showToast('No se pudo conectar con el servidor. Asegúrate de que app.py esté corriendo.', 'error');
        renderTable([]);
    } finally {
        showLoading(false);
    }
}

/**
 * Renderizar la tabla de estudiantes
 */
function renderTable(list) {
    tableBody.innerHTML = '';

    // Manejo de estados vacíos
    if (estudiantes.length === 0) {
        emptyState.classList.remove('hidden');
        noSearchResults.classList.add('hidden');
        showingCountEl.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        emptyState.classList.add('hidden');
        noSearchResults.classList.remove('hidden');
        showingCountEl.textContent = '0 resultados coincidentes';
        return;
    }

    emptyState.classList.add('hidden');
    noSearchResults.classList.add('hidden');
    showingCountEl.textContent = `Mostrando ${list.length} de ${estudiantes.length} estudiante(s)`;

    // Construir filas
    list.forEach(est => {
        const tr = document.createElement('tr');

        // Generar iniciales para avatar
        const initials = getInitials(est.nombre || 'E');

        tr.innerHTML = `
            <td><span class="student-id-badge">#${est.id}</span></td>
            <td>
                <div class="student-name-cell">
                    <span class="avatar-bubble">${initials}</span>
                    <span>${escapeHTML(est.nombre)}</span>
                </div>
            </td>
            <td>
                <span class="student-doc-badge">
                    <i class="fa-regular fa-address-card"></i> ${escapeHTML(est.documento)}
                </span>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-delete-row" 
                    onclick="openDeleteModal(${est.id}, '${escapeHTML(est.nombre)}')"
                    title="Eliminar este estudiante"
                >
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

/**
 * Procesar envío del formulario (Crear Estudiante)
 */
async function handleFormSubmit(e) {
    e.preventDefault();

    const nombre = inputNombre.value.trim();
    const documento = inputDocumento.value.trim();

    if (!nombre || !documento) {
        showToast('Por favor completa todos los campos requeridos.', 'error');
        return;
    }

    // Validar duplicados locales
    const yaExiste = estudiantes.some(est => est.documento.toString().trim() === documento);
    if (yaExiste) {
        showToast(`Ya existe un estudiante con el documento ${documento}.`, 'error');
        return;
    }

    setSubmitting(true);

    try {
        const response = await fetch(API_ESTUDIANTES, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, documento })
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.mensaje || '¡Estudiante registrado con éxito!', 'success');
            form.reset();
            inputNombre.focus();
            await cargarEstudiantes();
        } else {
            showToast(data.error || 'Error al guardar el estudiante.', 'error');
        }
    } catch (error) {
        console.error('Error al guardar:', error);
        showToast('Error de conexión con el backend.', 'error');
    } finally {
        setSubmitting(false);
    }
}

/**
 * Abrir modal para confirmar eliminación
 */
function openDeleteModal(id, nombre) {
    studentIdToDelete = id;
    modalStudentName.innerHTML = `¿Estás seguro de que deseas eliminar a <strong>${escapeHTML(nombre)}</strong> (ID #${id})?`;
    deleteModal.classList.remove('hidden');
}

/**
 * Cerrar modal de eliminación
 */
function closeDeleteModal() {
    studentIdToDelete = null;
    deleteModal.classList.add('hidden');
}

/**
 * Confirmar y ejecutar eliminación del estudiante
 */
async function confirmDeleteEstudiante() {
    if (!studentIdToDelete) return;

    const id = studentIdToDelete;
    closeDeleteModal();

    try {
        const response = await fetch(`${API_ESTUDIANTES}/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (response.ok) {
            showToast(data.mensaje || 'Estudiante eliminado correctamente', 'success');
            await cargarEstudiantes();
        } else {
            showToast(data.error || 'No se pudo eliminar el estudiante', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar:', error);
        showToast('Error al intentar comunicarse con el servidor', 'error');
    }
}

/**
 * Filtrar estudiantes en tiempo real
 */
function handleSearch() {
    const term = searchInput.value.toLowerCase().trim();

    if (term.length > 0) {
        clearSearchBtn.classList.remove('hidden');
    } else {
        clearSearchBtn.classList.add('hidden');
    }

    const filtrados = estudiantes.filter(est => {
        const matchNombre = est.nombre && est.nombre.toLowerCase().includes(term);
        const matchDoc = est.documento && est.documento.toString().toLowerCase().includes(term);
        const matchId = est.id && est.id.toString().includes(term);
        return matchNombre || matchDoc || matchId;
    });

    renderTable(filtrados);
}

/**
 * Actualizar contadores en las tarjetas
 */
function updateCounters(total, active) {
    totalCountEl.textContent = total;
    activeCountEl.textContent = active;
}

/**
 * Mostrar / Ocultar indicador de carga de la tabla
 */
function showLoading(isLoading) {
    if (isLoading) {
        tableLoader.classList.remove('hidden');
        emptyState.classList.add('hidden');
        noSearchResults.classList.add('hidden');
    } else {
        tableLoader.classList.add('hidden');
    }
}

/**
 * Estado visual del botón durante el envío
 */
function setSubmitting(isSubmitting) {
    btnSubmit.disabled = isSubmitting;
    if (isSubmitting) {
        btnSubmitText.classList.add('hidden');
        submitSpinner.classList.remove('hidden');
    } else {
        btnSubmitText.classList.remove('hidden');
        submitSpinner.classList.add('hidden');
    }
}

/**
 * Sistema de Notificaciones Toast
 */
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-message">${escapeHTML(message)}</div>
        <button type="button" class="toast-close" title="Cerrar">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.remove();
    });

    toastContainer.appendChild(toast);

    // Auto-eliminar después de 4 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
}

/**
 * Obtener iniciales de un nombre
 */
function getInitials(name) {
    if (!name) return 'E';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Escapar caracteres HTML para prevenir inyecciones XSS
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
