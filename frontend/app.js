/**
 * SISTEMA ESCOLAR - PANEL DE ADMINISTRACIÓN
 * Gestión de Estudiantes y Profesores
 */

// ==========================================
// CONFIGURACIÓN DE APIS Y ESTADO GLOBAL
// ==========================================
const API_BASE_URL = (window.location.origin && window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://127.0.0.1:5000';

const API_ESTUDIANTES = `${API_BASE_URL}/api/estudiantes`;
const API_PROFESORES = `${API_BASE_URL}/api/profesores`;
const API_HEALTH = `${API_BASE_URL}/api/health`;

// Estado de datos
let estudiantes = [];
let profesores = [];
let deleteTarget = null; // { type: 'estudiante'|'profesor', id: number, name: string }

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

// Navegación y Vistas
const navEstudiantes = document.getElementById('nav-estudiantes');
const navProfesores = document.getElementById('nav-profesores');
const viewEstudiantes = document.getElementById('view-estudiantes');
const viewProfesores = document.getElementById('view-profesores');
const currentViewTitle = document.getElementById('current-view-title');
const currentViewSubtitle = document.getElementById('current-view-subtitle');

// Menú Móvil
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// KPIs y Badges
const kpiTotalEstudiantes = document.getElementById('kpi-total-estudiantes');
const kpiTotalProfesores = document.getElementById('kpi-total-profesores');
const kpiTotalEspecialidades = document.getElementById('kpi-total-especialidades');
const kpiDbType = document.getElementById('kpi-db-type');
const badgeCountEstudiantes = document.getElementById('badge-count-estudiantes');
const badgeCountProfesores = document.getElementById('badge-count-profesores');
const serverStatusEl = document.getElementById('server-status');
const currentDateEl = document.getElementById('current-date');

// Formulario Estudiantes
const studentForm = document.getElementById('student-form');
const inputStudentNombre = document.getElementById('student-nombre');
const inputStudentDocumento = document.getElementById('student-documento');
const btnSubmitStudent = document.getElementById('btn-submit-student');
const studentSpinner = document.getElementById('student-spinner');

// Tabla Estudiantes
const studentsTableBody = document.getElementById('students-table-body');
const studentsLoader = document.getElementById('students-loader');
const studentsEmpty = document.getElementById('students-empty');
const studentsNoResults = document.getElementById('students-no-results');
const studentSearchInput = document.getElementById('student-search-input');
const studentClearSearch = document.getElementById('student-clear-search');
const btnReloadStudents = document.getElementById('btn-reload-students');
const studentsCounter = document.getElementById('students-counter');

// Formulario Profesores
const teacherForm = document.getElementById('teacher-form');
const inputTeacherNombre = document.getElementById('teacher-nombre');
const inputTeacherDocumento = document.getElementById('teacher-documento');
const inputTeacherAsignatura = document.getElementById('teacher-asignatura');
const inputTeacherEmail = document.getElementById('teacher-email');
const btnSubmitTeacher = document.getElementById('btn-submit-teacher');
const teacherSpinner = document.getElementById('teacher-spinner');

// Tabla Profesores
const teachersTableBody = document.getElementById('teachers-table-body');
const teachersLoader = document.getElementById('teachers-loader');
const teachersEmpty = document.getElementById('teachers-empty');
const teachersNoResults = document.getElementById('teachers-no-results');
const teacherSearchInput = document.getElementById('teacher-search-input');
const teacherClearSearch = document.getElementById('teacher-clear-search');
const btnReloadTeachers = document.getElementById('btn-reload-teachers');
const teachersCounter = document.getElementById('teachers-counter');

// Modal de Eliminación
const deleteModal = document.getElementById('delete-modal');
const modalTitle = document.getElementById('modal-title');
const modalDeleteMessage = document.getElementById('modal-delete-message');
const btnCancelDelete = document.getElementById('btn-cancel-delete');
const btnConfirmDelete = document.getElementById('btn-confirm-delete');

// Toasts
const toastContainer = document.getElementById('toast-container');

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initDateDisplay();
    setupNavigation();
    setupEventListeners();
    
    // Carga inicial
    checkServerHealth();
    cargarEstudiantes();
    cargarProfesores();
});

/**
 * Muestra la fecha formateada en la barra superior
 */
function initDateDisplay() {
    if (!currentDateEl) return;
    const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('es-ES', options);
}

// ==========================================
// NAVEGACIÓN ENTRE MÓDULOS
// ==========================================
function setupNavigation() {
    navEstudiantes.addEventListener('click', () => switchModule('estudiantes'));
    navProfesores.addEventListener('click', () => switchModule('profesores'));

    // Control del menú lateral en móviles
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => toggleMobileSidebar(true));
    }
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', () => toggleMobileSidebar(false));
    }
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => toggleMobileSidebar(false));
    }
}

function toggleMobileSidebar(open) {
    if (open) {
        sidebar.classList.add('open');
        sidebarOverlay.classList.remove('hidden');
    } else {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
    }
}

function switchModule(moduleName) {
    if (moduleName === 'estudiantes') {
        navEstudiantes.classList.add('active');
        navProfesores.classList.remove('active');
        viewEstudiantes.classList.add('active');
        viewProfesores.classList.remove('active');
        currentViewTitle.textContent = 'Módulo de Estudiantes';
        currentViewSubtitle.textContent = 'Administración de matrículas y alumnos';
    } else if (moduleName === 'profesores') {
        navProfesores.classList.add('active');
        navEstudiantes.classList.remove('active');
        viewProfesores.classList.add('active');
        viewEstudiantes.classList.remove('active');
        currentViewTitle.textContent = 'Módulo de Profesores';
        currentViewSubtitle.textContent = 'Cuerpo docente y especialidades académicas';
    }
    toggleMobileSidebar(false);
}

// ==========================================
// EVENT LISTENERS GENERALES
// ==========================================
function setupEventListeners() {
    // Estudiantes Form & Search
    studentForm.addEventListener('submit', handleStudentSubmit);
    studentSearchInput.addEventListener('input', handleStudentSearch);
    studentClearSearch.addEventListener('click', () => {
        studentSearchInput.value = '';
        studentClearSearch.classList.add('hidden');
        renderEstudiantesTable(estudiantes);
    });
    btnReloadStudents.addEventListener('click', () => {
        btnReloadStudents.classList.add('spinning');
        cargarEstudiantes().finally(() => {
            setTimeout(() => btnReloadStudents.classList.remove('spinning'), 500);
        });
    });

    // Profesores Form & Search
    teacherForm.addEventListener('submit', handleTeacherSubmit);
    teacherSearchInput.addEventListener('input', handleTeacherSearch);
    teacherClearSearch.addEventListener('click', () => {
        teacherSearchInput.value = '';
        teacherClearSearch.classList.add('hidden');
        renderProfesoresTable(profesores);
    });
    btnReloadTeachers.addEventListener('click', () => {
        btnReloadTeachers.classList.add('spinning');
        cargarProfesores().finally(() => {
            setTimeout(() => btnReloadTeachers.classList.remove('spinning'), 500);
        });
    });

    // Modal de Confirmación
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', confirmDeleteAction);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
            closeDeleteModal();
        }
    });
}

// ==========================================
// COMPROBAR SALUD DEL SERVIDOR
// ==========================================
async function checkServerHealth() {
    const dot = serverStatusEl.querySelector('.status-dot');
    const text = serverStatusEl.querySelector('.status-text');

    try {
        const res = await fetch(API_HEALTH);
        if (res.ok) {
            const data = await res.json();
            serverStatusEl.className = 'server-status-pill online';
            text.textContent = 'En Línea';
            kpiDbType.textContent = data.base_de_datos || 'Conectado';
        } else {
            throw new Error('Servidor no disponible');
        }
    } catch (e) {
        serverStatusEl.className = 'server-status-pill offline';
        text.textContent = 'Sin conexión';
        kpiDbType.textContent = 'Desconectado';
    }
}

// ==========================================
// MÓDULO: ESTUDIANTES (CRUD)
// ==========================================
async function cargarEstudiantes() {
    showStudentsLoading(true);
    try {
        const res = await fetch(API_ESTUDIANTES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        estudiantes = await res.json();
        renderEstudiantesTable(estudiantes);
        updateKPIs();
    } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        showToast('No se pudo conectar con el servidor para obtener estudiantes.', 'error');
        renderEstudiantesTable([]);
    } finally {
        showStudentsLoading(false);
    }
}

function renderEstudiantesTable(list) {
    studentsTableBody.innerHTML = '';

    if (estudiantes.length === 0) {
        studentsEmpty.classList.remove('hidden');
        studentsNoResults.classList.add('hidden');
        studentsCounter.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        studentsEmpty.classList.add('hidden');
        studentsNoResults.classList.remove('hidden');
        studentsCounter.textContent = '0 resultados encontrados';
        return;
    }

    studentsEmpty.classList.add('hidden');
    studentsNoResults.classList.add('hidden');
    studentsCounter.textContent = `Mostrando ${list.length} de ${estudiantes.length} estudiante(s)`;

    list.forEach(est => {
        const tr = document.createElement('tr');
        const initials = getInitials(est.nombre);
        
        tr.innerHTML = `
            <td><span class="id-pill">#${est.id}</span></td>
            <td>
                <div class="user-cell">
                    <span class="user-avatar">${initials}</span>
                    <span>${escapeHTML(est.nombre)}</span>
                </div>
            </td>
            <td>
                <span class="doc-chip">
                    <i class="fa-regular fa-id-badge"></i> ${escapeHTML(est.documento)}
                </span>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-delete-action" 
                    onclick="triggerDelete('estudiante', ${est.id}, '${escapeQuote(est.nombre)}')"
                    title="Eliminar estudiante"
                >
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            </td>
        `;
        studentsTableBody.appendChild(tr);
    });
}

async function handleStudentSubmit(e) {
    e.preventDefault();
    const nombre = inputStudentNombre.value.trim();
    const documento = inputStudentDocumento.value.trim();

    if (!nombre || !documento) {
        showToast('Completa todos los campos obligatorios.', 'error');
        return;
    }

    setSubmittingStudent(true);

    try {
        const res = await fetch(API_ESTUDIANTES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, documento })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Estudiante registrado con éxito', 'success');
            studentForm.reset();
            inputStudentNombre.focus();
            await cargarEstudiantes();
        } else {
            showToast(data.error || 'Error al registrar estudiante.', 'error');
        }
    } catch (err) {
        console.error('Error al guardar estudiante:', err);
        showToast('Error de comunicación con el servidor.', 'error');
    } finally {
        setSubmittingStudent(false);
    }
}

function handleStudentSearch() {
    const term = studentSearchInput.value.toLowerCase().trim();
    if (term.length > 0) {
        studentClearSearch.classList.remove('hidden');
    } else {
        studentClearSearch.classList.add('hidden');
    }

    const filtrados = estudiantes.filter(est => {
        const matchNom = est.nombre && est.nombre.toLowerCase().includes(term);
        const matchDoc = est.documento && est.documento.toString().toLowerCase().includes(term);
        const matchId = est.id && est.id.toString().includes(term);
        return matchNom || matchDoc || matchId;
    });

    renderEstudiantesTable(filtrados);
}

function showStudentsLoading(loading) {
    if (loading) {
        studentsLoader.classList.remove('hidden');
        studentsEmpty.classList.add('hidden');
        studentsNoResults.classList.add('hidden');
    } else {
        studentsLoader.classList.add('hidden');
    }
}

function setSubmittingStudent(submitting) {
    btnSubmitStudent.disabled = submitting;
    const btnText = btnSubmitStudent.querySelector('.btn-text');
    if (submitting) {
        btnText.classList.add('hidden');
        studentSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        studentSpinner.classList.add('hidden');
    }
}

// ==========================================
// MÓDULO: PROFESORES (CRUD)
// ==========================================
async function cargarProfesores() {
    showTeachersLoading(true);
    try {
        const res = await fetch(API_PROFESORES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        profesores = await res.json();
        renderProfesoresTable(profesores);
        updateKPIs();
    } catch (error) {
        console.error('Error al cargar profesores:', error);
        showToast('No se pudo conectar con el servidor para obtener profesores.', 'error');
        renderProfesoresTable([]);
    } finally {
        showTeachersLoading(false);
    }
}

function renderProfesoresTable(list) {
    teachersTableBody.innerHTML = '';

    if (profesores.length === 0) {
        teachersEmpty.classList.remove('hidden');
        teachersNoResults.classList.add('hidden');
        teachersCounter.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        teachersEmpty.classList.add('hidden');
        teachersNoResults.classList.remove('hidden');
        teachersCounter.textContent = '0 resultados encontrados';
        return;
    }

    teachersEmpty.classList.add('hidden');
    teachersNoResults.classList.add('hidden');
    teachersCounter.textContent = `Mostrando ${list.length} de ${profesores.length} profesor(es)`;

    list.forEach(prof => {
        const tr = document.createElement('tr');
        const initials = getInitials(prof.nombre);

        tr.innerHTML = `
            <td><span class="id-pill">#${prof.id}</span></td>
            <td>
                <div class="user-cell">
                    <span class="user-avatar avatar-teacher">${initials}</span>
                    <span>${escapeHTML(prof.nombre)}</span>
                </div>
            </td>
            <td>
                <span class="doc-chip">
                    <i class="fa-regular fa-id-badge"></i> ${escapeHTML(prof.documento)}
                </span>
            </td>
            <td>
                <span class="subject-badge">
                    <i class="fa-solid fa-book-open"></i> ${escapeHTML(prof.asignatura)}
                </span>
            </td>
            <td>
                <a href="mailto:${escapeHTML(prof.email)}" class="email-link" title="Enviar correo">
                    <i class="fa-regular fa-envelope"></i> ${escapeHTML(prof.email)}
                </a>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-delete-action" 
                    onclick="triggerDelete('profesor', ${prof.id}, '${escapeQuote(prof.nombre)}')"
                    title="Eliminar profesor"
                >
                    <i class="fa-solid fa-trash-can"></i> Eliminar
                </button>
            </td>
        `;
        teachersTableBody.appendChild(tr);
    });
}

async function handleTeacherSubmit(e) {
    e.preventDefault();
    const nombre = inputTeacherNombre.value.trim();
    const documento = inputTeacherDocumento.value.trim();
    const asignatura = inputTeacherAsignatura.value.trim();
    const email = inputTeacherEmail.value.trim();

    if (!nombre || !documento || !asignatura || !email) {
        showToast('Todos los campos son obligatorios.', 'error');
        return;
    }

    setSubmittingTeacher(true);

    try {
        const res = await fetch(API_PROFESORES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, documento, asignatura, email })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Profesor registrado con éxito', 'success');
            teacherForm.reset();
            inputTeacherNombre.focus();
            await cargarProfesores();
        } else {
            showToast(data.error || 'Error al registrar profesor.', 'error');
        }
    } catch (err) {
        console.error('Error al guardar profesor:', err);
        showToast('Error de comunicación con el servidor.', 'error');
    } finally {
        setSubmittingTeacher(false);
    }
}

function handleTeacherSearch() {
    const term = teacherSearchInput.value.toLowerCase().trim();
    if (term.length > 0) {
        teacherClearSearch.classList.remove('hidden');
    } else {
        teacherClearSearch.classList.add('hidden');
    }

    const filtrados = profesores.filter(prof => {
        const matchNom = prof.nombre && prof.nombre.toLowerCase().includes(term);
        const matchDoc = prof.documento && prof.documento.toString().toLowerCase().includes(term);
        const matchAsig = prof.asignatura && prof.asignatura.toLowerCase().includes(term);
        const matchEmail = prof.email && prof.email.toLowerCase().includes(term);
        const matchId = prof.id && prof.id.toString().includes(term);
        return matchNom || matchDoc || matchAsig || matchEmail || matchId;
    });

    renderProfesoresTable(filtrados);
}

function showTeachersLoading(loading) {
    if (loading) {
        teachersLoader.classList.remove('hidden');
        teachersEmpty.classList.add('hidden');
        teachersNoResults.classList.add('hidden');
    } else {
        teachersLoader.classList.add('hidden');
    }
}

function setSubmittingTeacher(submitting) {
    btnSubmitTeacher.disabled = submitting;
    const btnText = btnSubmitTeacher.querySelector('.btn-text');
    if (submitting) {
        btnText.classList.add('hidden');
        teacherSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        teacherSpinner.classList.add('hidden');
    }
}

// ==========================================
// MODAL GLOBAL DE ELIMINACIÓN
// ==========================================
window.triggerDelete = function(type, id, name) {
    deleteTarget = { type, id, name };
    const entityLabel = type === 'profesor' ? 'al profesor' : 'al estudiante';
    modalTitle.textContent = `¿Eliminar ${type === 'profesor' ? 'Profesor' : 'Estudiante'}?`;
    modalDeleteMessage.innerHTML = `¿Estás seguro de que deseas eliminar ${entityLabel} <strong>${escapeHTML(name)}</strong> (ID #${id})?`;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteTarget = null;
    deleteModal.classList.add('hidden');
}

async function confirmDeleteAction() {
    if (!deleteTarget) return;

    const { type, id } = deleteTarget;
    const endpoint = type === 'profesor' ? `${API_PROFESORES}/${id}` : `${API_ESTUDIANTES}/${id}`;
    closeDeleteModal();

    try {
        const res = await fetch(endpoint, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Registro eliminado correctamente', 'success');
            if (type === 'profesor') {
                await cargarProfesores();
            } else {
                await cargarEstudiantes();
            }
        } else {
            showToast(data.error || 'No se pudo eliminar el registro', 'error');
        }
    } catch (err) {
        console.error('Error al eliminar:', err);
        showToast('Error al intentar comunicarse con el servidor', 'error');
    }
}

// ==========================================
// ACTUALIZACIÓN DE KPIS Y MÉTRICAS
// ==========================================
function updateKPIs() {
    // Estudiantes
    const totalEst = estudiantes.length;
    kpiTotalEstudiantes.textContent = totalEst;
    badgeCountEstudiantes.textContent = totalEst;

    // Profesores
    const totalProf = profesores.length;
    kpiTotalProfesores.textContent = totalProf;
    badgeCountProfesores.textContent = totalProf;

    // Especialidades / Asignaturas únicas
    const especialidades = new Set(
        profesores.map(p => (p.asignatura || '').trim().toLowerCase()).filter(Boolean)
    );
    kpiTotalEspecialidades.textContent = especialidades.size;
}

// ==========================================
// SISTEMA DE NOTIFICACIONES TOAST
// ==========================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <div class="toast-msg">${escapeHTML(message)}</div>
        <button type="button" class="toast-close-btn" title="Cerrar">&times;</button>
    `;

    toast.querySelector('.toast-close-btn').addEventListener('click', () => toast.remove());

    toastContainer.appendChild(toast);

    // Auto eliminar a los 4 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.28s ease';
            setTimeout(() => toast.remove(), 280);
        }
    }, 4000);
}

// ==========================================
// UTILIDADES
// ==========================================
function getInitials(name) {
    if (!name) return 'U';
    // Limpiar títulos honoríficos comunes (Dra., Lic., Mg., Prof., etc.)
    const cleanName = name.replace(/^(dr|dra|lic|mg|prof|ing)\.?\s+/i, '');
    const parts = cleanName.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeQuote(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/'/g, "\\'");
}
