/**
 * SISTEMA ESCOLAR - PANEL DE ADMINISTRACIÓN
 * Módulos:
 * - 4.1 Estudiantes (CRUD)
 * - 4.2 Profesores (CRUD)
 * - 4.3 Materias (CRUD)
 * - 4.4 Asignación (Estudiantes <-> Materias y Profesores <-> Materias)
 */

// ==========================================
// CONFIGURACIÓN DE APIS Y ESTADO GLOBAL
// ==========================================
const API_BASE_URL = (window.location.origin && window.location.origin.startsWith('http')) 
    ? window.location.origin 
    : 'http://127.0.0.1:5000';

const API_ESTUDIANTES = `${API_BASE_URL}/api/estudiantes`;
const API_PROFESORES = `${API_BASE_URL}/api/profesores`;
const API_MATERIAS = `${API_BASE_URL}/api/materias`;
const API_ASIG_ESTUDIANTES = `${API_BASE_URL}/api/asignaciones/estudiantes`;
const API_ASIG_PROFESORES = `${API_BASE_URL}/api/asignaciones/profesores`;
const API_STATS = `${API_BASE_URL}/api/stats`;
const API_HEALTH = `${API_BASE_URL}/api/health`;

// Estado de datos en memoria
let estudiantes = [];
let profesores = [];
let materias = [];
let asignacionesEstudiantes = [];
let asignacionesProfesores = [];

// Objeto para acción de eliminación o desasignación pendiente en modal
let deleteTarget = null; // { type: 'estudiante'|'profesor'|'materia'|'asig_estudiante'|'asig_profesor', id: number, name: string }

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

// Navegación Principal
const navEstudiantes = document.getElementById('nav-estudiantes');
const navProfesores = document.getElementById('nav-profesores');
const navMaterias = document.getElementById('nav-materias');
const navAsignaciones = document.getElementById('nav-asignaciones');

const viewEstudiantes = document.getElementById('view-estudiantes');
const viewProfesores = document.getElementById('view-profesores');
const viewMaterias = document.getElementById('view-materias');
const viewAsignaciones = document.getElementById('view-asignaciones');

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
const kpiTotalMaterias = document.getElementById('kpi-total-materias');
const kpiTotalAsignaciones = document.getElementById('kpi-total-asignaciones');
const kpiDbType = document.getElementById('kpi-db-type');

const badgeCountEstudiantes = document.getElementById('badge-count-estudiantes');
const badgeCountProfesores = document.getElementById('badge-count-profesores');
const badgeCountMaterias = document.getElementById('badge-count-materias');
const badgeCountAsignaciones = document.getElementById('badge-count-asignaciones');

const serverStatusEl = document.getElementById('server-status');
const currentDateEl = document.getElementById('current-date');

// Formulario & Tabla Estudiantes
const studentForm = document.getElementById('student-form');
const inputStudentNombre = document.getElementById('student-nombre');
const inputStudentDocumento = document.getElementById('student-documento');
const btnSubmitStudent = document.getElementById('btn-submit-student');
const studentSpinner = document.getElementById('student-spinner');
const studentsTableBody = document.getElementById('students-table-body');
const studentsLoader = document.getElementById('students-loader');
const studentsEmpty = document.getElementById('students-empty');
const studentsNoResults = document.getElementById('students-no-results');
const studentSearchInput = document.getElementById('student-search-input');
const studentClearSearch = document.getElementById('student-clear-search');
const btnReloadStudents = document.getElementById('btn-reload-students');
const studentsCounter = document.getElementById('students-counter');

// Formulario & Tabla Profesores
const teacherForm = document.getElementById('teacher-form');
const inputTeacherNombre = document.getElementById('teacher-nombre');
const inputTeacherDocumento = document.getElementById('teacher-documento');
const inputTeacherAsignatura = document.getElementById('teacher-asignatura');
const inputTeacherEmail = document.getElementById('teacher-email');
const btnSubmitTeacher = document.getElementById('btn-submit-teacher');
const teacherSpinner = document.getElementById('teacher-spinner');
const teachersTableBody = document.getElementById('teachers-table-body');
const teachersLoader = document.getElementById('teachers-loader');
const teachersEmpty = document.getElementById('teachers-empty');
const teachersNoResults = document.getElementById('teachers-no-results');
const teacherSearchInput = document.getElementById('teacher-search-input');
const teacherClearSearch = document.getElementById('teacher-clear-search');
const btnReloadTeachers = document.getElementById('btn-reload-teachers');
const teachersCounter = document.getElementById('teachers-counter');

// Formulario & Tabla Materias (Módulo 4.3)
const materiaForm = document.getElementById('materia-form');
const inputMateriaCodigo = document.getElementById('materia-codigo');
const inputMateriaNombre = document.getElementById('materia-nombre');
const inputMateriaDescripcion = document.getElementById('materia-descripcion');
const btnSubmitMateria = document.getElementById('btn-submit-materia');
const materiaSpinner = document.getElementById('materia-spinner');
const materiasTableBody = document.getElementById('materias-table-body');
const materiasLoader = document.getElementById('materias-loader');
const materiasEmpty = document.getElementById('materias-empty');
const materiasNoResults = document.getElementById('materias-no-results');
const materiaSearchInput = document.getElementById('materia-search-input');
const materiaClearSearch = document.getElementById('materia-clear-search');
const btnReloadMaterias = document.getElementById('btn-reload-materias');
const materiasCounter = document.getElementById('materias-counter');

// Modal Edición de Materia
const editMateriaModal = document.getElementById('edit-materia-modal');
const editMateriaForm = document.getElementById('edit-materia-form');
const editMateriaId = document.getElementById('edit-materia-id');
const editMateriaCodigo = document.getElementById('edit-materia-codigo');
const editMateriaNombre = document.getElementById('edit-materia-nombre');
const editMateriaDescripcion = document.getElementById('edit-materia-descripcion');
const btnCloseEditMateria = document.getElementById('btn-close-edit-materia');
const btnCancelEditMateria = document.getElementById('btn-cancel-edit-materia');

// Asignaciones (Módulo 4.4)
const subtabBtnEstudiantes = document.getElementById('subtab-btn-estudiantes');
const subtabBtnProfesores = document.getElementById('subtab-btn-profesores');
const subtabEstudiantes = document.getElementById('subtab-estudiantes');
const subtabProfesores = document.getElementById('subtab-profesores');
const subtabBadgeEstudiantes = document.getElementById('subtab-badge-estudiantes');
const subtabBadgeProfesores = document.getElementById('subtab-badge-profesores');

// Asignación Estudiantes Form & Tabla
const asigStudentForm = document.getElementById('asig-student-form');
const asigStudentSelect = document.getElementById('asig-student-select');
const asigStudentMateriaSelect = document.getElementById('asig-student-materia-select');
const btnSubmitAsigStudent = document.getElementById('btn-submit-asig-student');
const asigStudentSpinner = document.getElementById('asig-student-spinner');
const asigStudentTableBody = document.getElementById('asig-student-table-body');
const asigStudentLoader = document.getElementById('asig-student-loader');
const asigStudentEmpty = document.getElementById('asig-student-empty');
const asigStudentNoResults = document.getElementById('asig-student-no-results');
const asigStudentSearch = document.getElementById('asig-student-search');
const asigStudentClearSearch = document.getElementById('asig-student-clear-search');
const btnReloadAsigStudent = document.getElementById('btn-reload-asig-student');
const asigStudentCounter = document.getElementById('asig-student-counter');

// Asignación Profesores Form & Tabla
const asigTeacherForm = document.getElementById('asig-teacher-form');
const asigTeacherSelect = document.getElementById('asig-teacher-select');
const asigTeacherMateriaSelect = document.getElementById('asig-teacher-materia-select');
const btnSubmitAsigTeacher = document.getElementById('btn-submit-asig-teacher');
const asigTeacherSpinner = document.getElementById('asig-teacher-spinner');
const asigTeacherTableBody = document.getElementById('asig-teacher-table-body');
const asigTeacherLoader = document.getElementById('asig-teacher-loader');
const asigTeacherEmpty = document.getElementById('asig-teacher-empty');
const asigTeacherNoResults = document.getElementById('asig-teacher-no-results');
const asigTeacherSearch = document.getElementById('asig-teacher-search');
const asigTeacherClearSearch = document.getElementById('asig-teacher-clear-search');
const btnReloadAsigTeacher = document.getElementById('btn-reload-asig-teacher');
const asigTeacherCounter = document.getElementById('asig-teacher-counter');

// Modal Materias por Usuario
const userMateriasModal = document.getElementById('user-materias-modal');
const userMateriasModalTitle = document.getElementById('user-materias-modal-title');
const userMateriasModalSubtitle = document.getElementById('user-materias-modal-subtitle');
const userMateriasListContainer = document.getElementById('user-materias-list-container');
const btnCloseUserMaterias = document.getElementById('btn-close-user-materias');
const btnAcceptUserMaterias = document.getElementById('btn-accept-user-materias');
const userMateriasIcon = document.getElementById('user-materias-icon');

// Modal Global de Eliminación
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
    
    // Carga inicial sincronizada
    checkServerHealth();
    recargarTodo();
});

/**
 * Carga todos los datos del sistema escolar en paralelo
 */
async function recargarTodo() {
    await Promise.allSettled([
        cargarEstudiantes(),
        cargarProfesores(),
        cargarMaterias(),
        cargarAsignacionesEstudiantes(),
        cargarAsignacionesProfesores()
    ]);
    populateDropdownSelects();
    updateKPIs();
}

/**
 * Muestra la fecha formateada en la cabecera
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
    navMaterias.addEventListener('click', () => switchModule('materias'));
    navAsignaciones.addEventListener('click', () => switchModule('asignaciones'));

    // Sub-pestañas de Asignaciones
    subtabBtnEstudiantes.addEventListener('click', () => switchSubtab('estudiantes'));
    subtabBtnProfesores.addEventListener('click', () => switchSubtab('profesores'));

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
    // Reset active nav items
    [navEstudiantes, navProfesores, navMaterias, navAsignaciones].forEach(btn => btn.classList.remove('active'));
    [viewEstudiantes, viewProfesores, viewMaterias, viewAsignaciones].forEach(view => view.classList.remove('active'));

    if (moduleName === 'estudiantes') {
        navEstudiantes.classList.add('active');
        viewEstudiantes.classList.add('active');
        currentViewTitle.textContent = 'Módulo de Estudiantes';
        currentViewSubtitle.textContent = 'Administración de matrículas y alumnos';
    } else if (moduleName === 'profesores') {
        navProfesores.classList.add('active');
        viewProfesores.classList.add('active');
        currentViewTitle.textContent = 'Módulo de Profesores';
        currentViewSubtitle.textContent = 'Cuerpo docente y especialidades académicas';
    } else if (moduleName === 'materias') {
        navMaterias.classList.add('active');
        viewMaterias.classList.add('active');
        currentViewTitle.textContent = 'Módulo de Materias';
        currentViewSubtitle.textContent = 'Catálogo de asignaturas y contenidos curriculares';
    } else if (moduleName === 'asignaciones') {
        navAsignaciones.classList.add('active');
        viewAsignaciones.classList.add('active');
        currentViewTitle.textContent = 'Módulo de Asignaciones';
        currentViewSubtitle.textContent = 'Matriculación de materias a estudiantes y profesores';
        populateDropdownSelects();
    }
    toggleMobileSidebar(false);
}

function switchSubtab(subtabName) {
    if (subtabName === 'estudiantes') {
        subtabBtnEstudiantes.classList.add('active');
        subtabBtnProfesores.classList.remove('active');
        subtabEstudiantes.classList.add('active');
        subtabProfesores.classList.remove('active');
    } else {
        subtabBtnProfesores.classList.add('active');
        subtabBtnEstudiantes.classList.remove('active');
        subtabProfesores.classList.add('active');
        subtabEstudiantes.classList.remove('active');
    }
}

// ==========================================
// EVENT LISTENERS GENERALES
// ==========================================
function setupEventListeners() {
    // --- ESTUDIANTES ---
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

    // --- PROFESORES ---
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

    // --- MATERIAS (4.3) ---
    materiaForm.addEventListener('submit', handleMateriaSubmit);
    materiaSearchInput.addEventListener('input', handleMateriaSearch);
    materiaClearSearch.addEventListener('click', () => {
        materiaSearchInput.value = '';
        materiaClearSearch.classList.add('hidden');
        renderMateriasTable(materias);
    });
    btnReloadMaterias.addEventListener('click', () => {
        btnReloadMaterias.classList.add('spinning');
        cargarMaterias().finally(() => {
            setTimeout(() => btnReloadMaterias.classList.remove('spinning'), 500);
        });
    });

    // Modal Editar Materia
    editMateriaForm.addEventListener('submit', handleEditMateriaSubmit);
    btnCloseEditMateria.addEventListener('click', closeEditMateriaModal);
    btnCancelEditMateria.addEventListener('click', closeEditMateriaModal);
    editMateriaModal.addEventListener('click', (e) => {
        if (e.target === editMateriaModal) closeEditMateriaModal();
    });

    // --- ASIGNACIONES (4.4) ---
    asigStudentForm.addEventListener('submit', handleAsigStudentSubmit);
    asigStudentSearch.addEventListener('input', handleAsigStudentSearch);
    asigStudentClearSearch.addEventListener('click', () => {
        asigStudentSearch.value = '';
        asigStudentClearSearch.classList.add('hidden');
        renderAsigEstudiantesTable(asignacionesEstudiantes);
    });
    btnReloadAsigStudent.addEventListener('click', () => {
        btnReloadAsigStudent.classList.add('spinning');
        cargarAsignacionesEstudiantes().finally(() => {
            setTimeout(() => btnReloadAsigStudent.classList.remove('spinning'), 500);
        });
    });

    asigTeacherForm.addEventListener('submit', handleAsigTeacherSubmit);
    asigTeacherSearch.addEventListener('input', handleAsigTeacherSearch);
    asigTeacherClearSearch.addEventListener('click', () => {
        asigTeacherSearch.value = '';
        asigTeacherClearSearch.classList.add('hidden');
        renderAsigProfesoresTable(asignacionesProfesores);
    });
    btnReloadAsigTeacher.addEventListener('click', () => {
        btnReloadAsigTeacher.classList.add('spinning');
        cargarAsignacionesProfesores().finally(() => {
            setTimeout(() => btnReloadAsigTeacher.classList.remove('spinning'), 500);
        });
    });

    // Modal Usuario Materias
    btnCloseUserMaterias.addEventListener('click', closeUserMateriasModal);
    btnAcceptUserMaterias.addEventListener('click', closeUserMateriasModal);
    userMateriasModal.addEventListener('click', (e) => {
        if (e.target === userMateriasModal) closeUserMateriasModal();
    });

    // Modal Global de Eliminación
    btnCancelDelete.addEventListener('click', closeDeleteModal);
    btnConfirmDelete.addEventListener('click', confirmDeleteAction);
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    // Tecla ESC para modales
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
            if (!editMateriaModal.classList.contains('hidden')) closeEditMateriaModal();
            if (!userMateriasModal.classList.contains('hidden')) closeUserMateriasModal();
        }
    });
}

// ==========================================
// COMPROBAR SALUD DEL SERVIDOR
// ==========================================
async function checkServerHealth() {
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
// MÓDULO 4.1: ESTUDIANTES (CRUD)
// ==========================================
async function cargarEstudiantes() {
    showStudentsLoading(true);
    try {
        const res = await fetch(API_ESTUDIANTES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        estudiantes = await res.json();
        renderEstudiantesTable(estudiantes);
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
        const materiasCount = est.total_materias || 0;
        
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
            <td>
                <button type="button" class="btn-view-action" onclick="verMateriasUsuario('estudiante', ${est.id}, '${escapeQuote(est.nombre)}')">
                    <i class="fa-solid fa-book-bookmark"></i>
                    <span>${materiasCount} materia(s)</span>
                </button>
            </td>
            <td style="text-align: center;">
                <div class="actions-cell">
                    <button 
                        type="button" 
                        class="btn-delete-action" 
                        onclick="triggerDelete('estudiante', ${est.id}, '${escapeQuote(est.nombre)}')"
                        title="Eliminar estudiante"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
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
            await recargarTodo();
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
// MÓDULO 4.2: PROFESORES (CRUD)
// ==========================================
async function cargarProfesores() {
    showTeachersLoading(true);
    try {
        const res = await fetch(API_PROFESORES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        profesores = await res.json();
        renderProfesoresTable(profesores);
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
        const materiasCount = prof.total_materias || 0;

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
                    <i class="fa-solid fa-graduation-cap"></i> ${escapeHTML(prof.asignatura)}
                </span>
            </td>
            <td>
                <button type="button" class="btn-view-action" onclick="verMateriasUsuario('profesor', ${prof.id}, '${escapeQuote(prof.nombre)}')">
                    <i class="fa-solid fa-book-bookmark"></i>
                    <span>${materiasCount} cátedra(s)</span>
                </button>
            </td>
            <td>
                <a href="mailto:${escapeHTML(prof.email)}" class="email-link" title="Enviar correo">
                    <i class="fa-regular fa-envelope"></i> ${escapeHTML(prof.email)}
                </a>
            </td>
            <td style="text-align: center;">
                <div class="actions-cell">
                    <button 
                        type="button" 
                        class="btn-delete-action" 
                        onclick="triggerDelete('profesor', ${prof.id}, '${escapeQuote(prof.nombre)}')"
                        title="Eliminar profesor"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
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
            await recargarTodo();
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
// MÓDULO 4.3: MATERIAS (CRUD COMPLETO)
// ==========================================
async function cargarMaterias() {
    showMateriasLoading(true);
    try {
        const res = await fetch(API_MATERIAS);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        materias = await res.json();
        renderMateriasTable(materias);
    } catch (error) {
        console.error('Error al cargar materias:', error);
        showToast('No se pudo conectar con el servidor para obtener materias.', 'error');
        renderMateriasTable([]);
    } finally {
        showMateriasLoading(false);
    }
}

function renderMateriasTable(list) {
    materiasTableBody.innerHTML = '';

    if (materias.length === 0) {
        materiasEmpty.classList.remove('hidden');
        materiasNoResults.classList.add('hidden');
        materiasCounter.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        materiasEmpty.classList.add('hidden');
        materiasNoResults.classList.remove('hidden');
        materiasCounter.textContent = '0 resultados encontrados';
        return;
    }

    materiasEmpty.classList.add('hidden');
    materiasNoResults.classList.add('hidden');
    materiasCounter.textContent = `Mostrando ${list.length} de ${materias.length} materia(s)`;

    list.forEach(mat => {
        const tr = document.createElement('tr');
        const numEst = mat.total_estudiantes || 0;
        const numProf = mat.total_profesores || 0;

        tr.innerHTML = `
            <td><span class="id-pill">#${mat.id}</span></td>
            <td>
                <span class="code-chip">
                    <i class="fa-solid fa-barcode"></i> ${escapeHTML(mat.codigo)}
                </span>
            </td>
            <td>
                <strong>${escapeHTML(mat.nombre)}</strong>
            </td>
            <td>
                <span class="desc-text" title="${escapeHTML(mat.descripcion || 'Sin descripción')}">
                    ${escapeHTML(mat.descripcion || 'Sin descripción adicional')}
                </span>
            </td>
            <td style="text-align: center;">
                <span class="count-badge ${numEst > 0 ? '' : 'count-empty'}">
                    <i class="fa-solid fa-user-graduate"></i> ${numEst}
                </span>
            </td>
            <td style="text-align: center;">
                <span class="count-badge count-emerald ${numProf > 0 ? '' : 'count-empty'}">
                    <i class="fa-solid fa-chalkboard-user"></i> ${numProf}
                </span>
            </td>
            <td style="text-align: center;">
                <div class="actions-cell">
                    <button 
                        type="button" 
                        class="btn-edit-action" 
                        onclick="openEditMateriaModal(${mat.id})"
                        title="Editar materia"
                    >
                        <i class="fa-solid fa-pen"></i> Editar
                    </button>
                    <button 
                        type="button" 
                        class="btn-delete-action" 
                        onclick="triggerDelete('materia', ${mat.id}, '${escapeQuote(mat.nombre)}')"
                        title="Eliminar materia"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;
        materiasTableBody.appendChild(tr);
    });
}

async function handleMateriaSubmit(e) {
    e.preventDefault();
    const codigo = inputMateriaCodigo.value.trim().toUpperCase();
    const nombre = inputMateriaNombre.value.trim();
    const descripcion = inputMateriaDescripcion.value.trim();

    if (!codigo || !nombre) {
        showToast('El código y el nombre de la materia son obligatorios.', 'error');
        return;
    }

    setSubmittingMateria(true);

    try {
        const res = await fetch(API_MATERIAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, descripcion })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Materia registrada exitosamente', 'success');
            materiaForm.reset();
            inputMateriaCodigo.focus();
            await recargarTodo();
        } else {
            showToast(data.error || 'Error al crear materia.', 'error');
        }
    } catch (err) {
        console.error('Error al guardar materia:', err);
        showToast('Error de comunicación con el servidor.', 'error');
    } finally {
        setSubmittingMateria(false);
    }
}

function handleMateriaSearch() {
    const term = materiaSearchInput.value.toLowerCase().trim();
    if (term.length > 0) {
        materiaClearSearch.classList.remove('hidden');
    } else {
        materiaClearSearch.classList.add('hidden');
    }

    const filtrados = materias.filter(mat => {
        const matchCod = mat.codigo && mat.codigo.toLowerCase().includes(term);
        const matchNom = mat.nombre && mat.nombre.toLowerCase().includes(term);
        const matchDesc = mat.descripcion && mat.descripcion.toLowerCase().includes(term);
        const matchId = mat.id && mat.id.toString().includes(term);
        return matchCod || matchNom || matchDesc || matchId;
    });

    renderMateriasTable(filtrados);
}

function showMateriasLoading(loading) {
    if (loading) {
        materiasLoader.classList.remove('hidden');
        materiasEmpty.classList.add('hidden');
        materiasNoResults.classList.add('hidden');
    } else {
        materiasLoader.classList.add('hidden');
    }
}

function setSubmittingMateria(submitting) {
    btnSubmitMateria.disabled = submitting;
    const btnText = btnSubmitMateria.querySelector('.btn-text');
    if (submitting) {
        btnText.classList.add('hidden');
        materiaSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        materiaSpinner.classList.add('hidden');
    }
}

// --- EDICIÓN DE MATERIAS (MODAL) ---
window.openEditMateriaModal = function(id) {
    const mat = materias.find(m => m.id === id);
    if (!mat) {
        showToast('Materia no encontrada', 'error');
        return;
    }

    editMateriaId.value = mat.id;
    editMateriaCodigo.value = mat.codigo || '';
    editMateriaNombre.value = mat.nombre || '';
    editMateriaDescripcion.value = mat.descripcion || '';

    editMateriaModal.classList.remove('hidden');
    editMateriaNombre.focus();
};

function closeEditMateriaModal() {
    editMateriaForm.reset();
    editMateriaModal.classList.add('hidden');
}

async function handleEditMateriaSubmit(e) {
    e.preventDefault();
    const id = editMateriaId.value;
    const codigo = editMateriaCodigo.value.trim().toUpperCase();
    const nombre = editMateriaNombre.value.trim();
    const descripcion = editMateriaDescripcion.value.trim();

    if (!id || !codigo || !nombre) {
        showToast('Completa el código y nombre de la materia.', 'error');
        return;
    }

    try {
        const res = await fetch(`${API_MATERIAS}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo, nombre, descripcion })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Materia actualizada correctamente', 'success');
            closeEditMateriaModal();
            await recargarTodo();
        } else {
            showToast(data.error || 'No se pudo actualizar la materia', 'error');
        }
    } catch (err) {
        console.error('Error al editar materia:', err);
        showToast('Error de comunicación con el servidor', 'error');
    }
}

// ==========================================
// MÓDULO 4.4: ASIGNACIÓN DE MATERIAS
// ==========================================

/**
 * Llena las listas desplegables (selects) de estudiantes, profesores y materias
 */
function populateDropdownSelects() {
    // Select Estudiantes
    asigStudentSelect.innerHTML = '<option value="">-- Seleccionar Estudiante --</option>';
    estudiantes.forEach(est => {
        const opt = document.createElement('option');
        opt.value = est.id;
        opt.textContent = `${est.nombre} (Doc: ${est.documento})`;
        asigStudentSelect.appendChild(opt);
    });

    // Select Profesores
    asigTeacherSelect.innerHTML = '<option value="">-- Seleccionar Profesor --</option>';
    profesores.forEach(prof => {
        const opt = document.createElement('option');
        opt.value = prof.id;
        opt.textContent = `${prof.nombre} - ${prof.asignatura}`;
        asigTeacherSelect.appendChild(opt);
    });

    // Select Materias (para Estudiantes y Profesores)
    asigStudentMateriaSelect.innerHTML = '<option value="">-- Seleccionar Materia --</option>';
    asigTeacherMateriaSelect.innerHTML = '<option value="">-- Seleccionar Materia --</option>';

    materias.forEach(mat => {
        const opt1 = document.createElement('option');
        opt1.value = mat.id;
        opt1.textContent = `[${mat.codigo}] ${mat.nombre}`;
        asigStudentMateriaSelect.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = mat.id;
        opt2.textContent = `[${mat.codigo}] ${mat.nombre}`;
        asigTeacherMateriaSelect.appendChild(opt2);
    });
}

// --- ASIGNACIONES: ESTUDIANTES ---
async function cargarAsignacionesEstudiantes() {
    showAsigStudentLoading(true);
    try {
        const res = await fetch(API_ASIG_ESTUDIANTES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        asignacionesEstudiantes = await res.json();
        renderAsigEstudiantesTable(asignacionesEstudiantes);
        subtabBadgeEstudiantes.textContent = asignacionesEstudiantes.length;
    } catch (error) {
        console.error('Error al cargar asignaciones de estudiantes:', error);
        renderAsigEstudiantesTable([]);
    } finally {
        showAsigStudentLoading(false);
    }
}

function renderAsigEstudiantesTable(list) {
    asigStudentTableBody.innerHTML = '';

    if (asignacionesEstudiantes.length === 0) {
        asigStudentEmpty.classList.remove('hidden');
        asigStudentNoResults.classList.add('hidden');
        asigStudentCounter.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        asigStudentEmpty.classList.add('hidden');
        asigStudentNoResults.classList.remove('hidden');
        asigStudentCounter.textContent = '0 resultados encontrados';
        return;
    }

    asigStudentEmpty.classList.add('hidden');
    asigStudentNoResults.classList.add('hidden');
    asigStudentCounter.textContent = `Mostrando ${list.length} de ${asignacionesEstudiantes.length} asignación(es)`;

    list.forEach(asig => {
        const tr = document.createElement('tr');
        const initials = getInitials(asig.estudiante_nombre);
        const fecha = asig.fecha_asignacion ? asig.fecha_asignacion.split(' ')[0] : 'Hoy';

        tr.innerHTML = `
            <td><span class="id-pill">#${asig.id}</span></td>
            <td>
                <div class="user-cell">
                    <span class="user-avatar">${initials}</span>
                    <span>${escapeHTML(asig.estudiante_nombre)}</span>
                </div>
            </td>
            <td>
                <span class="doc-chip">
                    <i class="fa-regular fa-id-badge"></i> ${escapeHTML(asig.estudiante_documento)}
                </span>
            </td>
            <td>
                <span class="code-chip">
                    <i class="fa-solid fa-barcode"></i> ${escapeHTML(asig.materia_codigo)}
                </span>
                <strong style="margin-left: 6px;">${escapeHTML(asig.materia_nombre)}</strong>
            </td>
            <td>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${fecha}</span>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-delete-action" 
                    onclick="triggerDelete('asig_estudiante', ${asig.id}, 'Materia ${escapeQuote(asig.materia_nombre)} de ${escapeQuote(asig.estudiante_nombre)}')"
                    title="Desasignar materia"
                >
                    <i class="fa-solid fa-link-slash"></i> Quitar
                </button>
            </td>
        `;
        asigStudentTableBody.appendChild(tr);
    });
}

async function handleAsigStudentSubmit(e) {
    e.preventDefault();
    const estudiante_id = asigStudentSelect.value;
    const materia_id = asigStudentMateriaSelect.value;

    if (!estudiante_id || !materia_id) {
        showToast('Debes seleccionar un estudiante y una materia.', 'error');
        return;
    }

    setSubmittingAsigStudent(true);

    try {
        const res = await fetch(API_ASIG_ESTUDIANTES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estudiante_id: parseInt(estudiante_id), materia_id: parseInt(materia_id) })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Materia asignada al estudiante correctamente', 'success');
            asigStudentMateriaSelect.value = '';
            await recargarTodo();
        } else {
            showToast(data.error || 'Error al realizar la asignación.', 'error');
        }
    } catch (err) {
        console.error('Error al asignar materia a estudiante:', err);
        showToast('Error de comunicación con el servidor', 'error');
    } finally {
        setSubmittingAsigStudent(false);
    }
}

function handleAsigStudentSearch() {
    const term = asigStudentSearch.value.toLowerCase().trim();
    if (term.length > 0) {
        asigStudentClearSearch.classList.remove('hidden');
    } else {
        asigStudentClearSearch.classList.add('hidden');
    }

    const filtrados = asignacionesEstudiantes.filter(asig => {
        const matchNom = asig.estudiante_nombre && asig.estudiante_nombre.toLowerCase().includes(term);
        const matchDoc = asig.estudiante_documento && asig.estudiante_documento.toString().toLowerCase().includes(term);
        const matchMat = asig.materia_nombre && asig.materia_nombre.toLowerCase().includes(term);
        const matchCod = asig.materia_codigo && asig.materia_codigo.toLowerCase().includes(term);
        return matchNom || matchDoc || matchMat || matchCod;
    });

    renderAsigEstudiantesTable(filtrados);
}

function showAsigStudentLoading(loading) {
    if (loading) {
        asigStudentLoader.classList.remove('hidden');
        asigStudentEmpty.classList.add('hidden');
        asigStudentNoResults.classList.add('hidden');
    } else {
        asigStudentLoader.classList.add('hidden');
    }
}

function setSubmittingAsigStudent(submitting) {
    btnSubmitAsigStudent.disabled = submitting;
    const btnText = btnSubmitAsigStudent.querySelector('.btn-text');
    if (submitting) {
        btnText.classList.add('hidden');
        asigStudentSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        asigStudentSpinner.classList.add('hidden');
    }
}

// --- ASIGNACIONES: PROFESORES ---
async function cargarAsignacionesProfesores() {
    showAsigTeacherLoading(true);
    try {
        const res = await fetch(API_ASIG_PROFESORES);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        asignacionesProfesores = await res.json();
        renderAsigProfesoresTable(asignacionesProfesores);
        subtabBadgeProfesores.textContent = asignacionesProfesores.length;
    } catch (error) {
        console.error('Error al cargar asignaciones de profesores:', error);
        renderAsigProfesoresTable([]);
    } finally {
        showAsigTeacherLoading(false);
    }
}

function renderAsigProfesoresTable(list) {
    asigTeacherTableBody.innerHTML = '';

    if (asignacionesProfesores.length === 0) {
        asigTeacherEmpty.classList.remove('hidden');
        asigTeacherNoResults.classList.add('hidden');
        asigTeacherCounter.textContent = 'Mostrando 0 registros';
        return;
    }

    if (list.length === 0) {
        asigTeacherEmpty.classList.add('hidden');
        asigTeacherNoResults.classList.remove('hidden');
        asigTeacherCounter.textContent = '0 resultados encontrados';
        return;
    }

    asigTeacherEmpty.classList.add('hidden');
    asigTeacherNoResults.classList.add('hidden');
    asigTeacherCounter.textContent = `Mostrando ${list.length} de ${asignacionesProfesores.length} asignación(es)`;

    list.forEach(asig => {
        const tr = document.createElement('tr');
        const initials = getInitials(asig.profesor_nombre);
        const fecha = asig.fecha_asignacion ? asig.fecha_asignacion.split(' ')[0] : 'Hoy';

        tr.innerHTML = `
            <td><span class="id-pill">#${asig.id}</span></td>
            <td>
                <div class="user-cell">
                    <span class="user-avatar avatar-teacher">${initials}</span>
                    <span>${escapeHTML(asig.profesor_nombre)}</span>
                </div>
            </td>
            <td>
                <span class="subject-badge">
                    <i class="fa-solid fa-chalkboard-user"></i> ${escapeHTML(asig.profesor_especialidad || 'Docente')}
                </span>
            </td>
            <td>
                <span class="code-chip">
                    <i class="fa-solid fa-barcode"></i> ${escapeHTML(asig.materia_codigo)}
                </span>
                <strong style="margin-left: 6px;">${escapeHTML(asig.materia_nombre)}</strong>
            </td>
            <td>
                <span style="font-size: 0.8rem; color: var(--text-muted);">${fecha}</span>
            </td>
            <td style="text-align: center;">
                <button 
                    type="button" 
                    class="btn-delete-action" 
                    onclick="triggerDelete('asig_profesor', ${asig.id}, 'Cátedra ${escapeQuote(asig.materia_nombre)} de ${escapeQuote(asig.profesor_nombre)}')"
                    title="Desasignar cátedra"
                >
                    <i class="fa-solid fa-link-slash"></i> Quitar
                </button>
            </td>
        `;
        asigTeacherTableBody.appendChild(tr);
    });
}

async function handleAsigTeacherSubmit(e) {
    e.preventDefault();
    const profesor_id = asigTeacherSelect.value;
    const materia_id = asigTeacherMateriaSelect.value;

    if (!profesor_id || !materia_id) {
        showToast('Debes seleccionar un profesor y una materia.', 'error');
        return;
    }

    setSubmittingAsigTeacher(true);

    try {
        const res = await fetch(API_ASIG_PROFESORES, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profesor_id: parseInt(profesor_id), materia_id: parseInt(materia_id) })
        });

        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Materia asignada al profesor correctamente', 'success');
            asigTeacherMateriaSelect.value = '';
            await recargarTodo();
        } else {
            showToast(data.error || 'Error al realizar la asignación.', 'error');
        }
    } catch (err) {
        console.error('Error al asignar materia a profesor:', err);
        showToast('Error de comunicación con el servidor', 'error');
    } finally {
        setSubmittingAsigTeacher(false);
    }
}

function handleAsigTeacherSearch() {
    const term = asigTeacherSearch.value.toLowerCase().trim();
    if (term.length > 0) {
        asigTeacherClearSearch.classList.remove('hidden');
    } else {
        asigTeacherClearSearch.classList.add('hidden');
    }

    const filtrados = asignacionesProfesores.filter(asig => {
        const matchNom = asig.profesor_nombre && asig.profesor_nombre.toLowerCase().includes(term);
        const matchMat = asig.materia_nombre && asig.materia_nombre.toLowerCase().includes(term);
        const matchCod = asig.materia_codigo && asig.materia_codigo.toLowerCase().includes(term);
        const matchEmail = asig.profesor_email && asig.profesor_email.toLowerCase().includes(term);
        return matchNom || matchMat || matchCod || matchEmail;
    });

    renderAsigProfesoresTable(filtrados);
}

function showAsigTeacherLoading(loading) {
    if (loading) {
        asigTeacherLoader.classList.remove('hidden');
        asigTeacherEmpty.classList.add('hidden');
        asigTeacherNoResults.classList.add('hidden');
    } else {
        asigTeacherLoader.classList.add('hidden');
    }
}

function setSubmittingAsigTeacher(submitting) {
    btnSubmitAsigTeacher.disabled = submitting;
    const btnText = btnSubmitAsigTeacher.querySelector('.btn-text');
    if (submitting) {
        btnText.classList.add('hidden');
        asigTeacherSpinner.classList.remove('hidden');
    } else {
        btnText.classList.remove('hidden');
        asigTeacherSpinner.classList.add('hidden');
    }
}

// ==========================================
// CONSULTA DE MATERIAS POR USUARIO (MODAL)
// ==========================================
window.verMateriasUsuario = async function(tipo, id, nombre) {
    const endpoint = tipo === 'profesor' 
        ? `${API_PROFESORES}/${id}/materias` 
        : `${API_ESTUDIANTES}/${id}/materias`;

    const labelTipo = tipo === 'profesor' ? 'Profesor(a)' : 'Estudiante';
    userMateriasModalTitle.textContent = `Materias de ${nombre}`;
    userMateriasModalSubtitle.textContent = `${labelTipo} • ID #${id}`;

    userMateriasListContainer.innerHTML = `
        <div style="text-align: center; padding: 24px;">
            <div class="app-spinner" style="margin: 0 auto 10px auto;"></div>
            <p style="color: var(--text-muted);">Consultando materias asignadas...</p>
        </div>
    `;

    userMateriasModal.classList.remove('hidden');

    try {
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const userMaterias = await res.json();

        if (userMaterias.length === 0) {
            userMateriasListContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--text-muted);">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; color: var(--text-light);"></i>
                    <p>No tiene ninguna materia asignada actualmente.</p>
                </div>
            `;
            return;
        }

        let html = '';
        userMaterias.forEach(item => {
            html += `
                <div class="user-materia-item">
                    <div class="user-materia-info">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="code-chip">${escapeHTML(item.materia_codigo)}</span>
                            <span class="user-materia-title">${escapeHTML(item.materia_nombre)}</span>
                        </div>
                        <span class="user-materia-desc">${escapeHTML(item.descripcion || 'Sin temario detallado')}</span>
                    </div>
                    <button 
                        type="button" 
                        class="btn-delete-action" 
                        onclick="closeUserMateriasModal(); triggerDelete('${tipo === 'profesor' ? 'asig_profesor' : 'asig_estudiante'}', ${item.asignacion_id}, 'Materia ${escapeQuote(item.materia_nombre)}')"
                        title="Desasignar"
                    >
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        });
        userMateriasListContainer.innerHTML = html;
    } catch (e) {
        console.error('Error al consultar materias de usuario:', e);
        userMateriasListContainer.innerHTML = `
            <div style="color: var(--danger); text-align: center; padding: 20px;">
                <p>Error al obtener la lista de materias.</p>
            </div>
        `;
    }
};

function closeUserMateriasModal() {
    userMateriasModal.classList.add('hidden');
}

// ==========================================
// MODAL GLOBAL DE ELIMINACIÓN Y CONFIRMACIÓN
// ==========================================
window.triggerDelete = function(type, id, name) {
    deleteTarget = { type, id, name };

    let typeTitle = 'Registro';
    let entityLabel = 'el registro';

    if (type === 'estudiante') {
        typeTitle = 'Estudiante';
        entityLabel = 'al estudiante';
    } else if (type === 'profesor') {
        typeTitle = 'Profesor';
        entityLabel = 'al profesor';
    } else if (type === 'materia') {
        typeTitle = 'Materia';
        entityLabel = 'la materia';
    } else if (type.startsWith('asig_')) {
        typeTitle = 'Asignación';
        entityLabel = 'la asignación';
    }

    modalTitle.textContent = `¿Eliminar ${typeTitle}?`;
    modalDeleteMessage.innerHTML = `¿Estás seguro de que deseas eliminar ${entityLabel} <strong>${escapeHTML(name)}</strong>?`;
    deleteModal.classList.remove('hidden');
};

function closeDeleteModal() {
    deleteTarget = null;
    deleteModal.classList.add('hidden');
}

async function confirmDeleteAction() {
    if (!deleteTarget) return;

    const { type, id } = deleteTarget;
    let endpoint = '';

    if (type === 'estudiante') endpoint = `${API_ESTUDIANTES}/${id}`;
    else if (type === 'profesor') endpoint = `${API_PROFESORES}/${id}`;
    else if (type === 'materia') endpoint = `${API_MATERIAS}/${id}`;
    else if (type === 'asig_estudiante') endpoint = `${API_ASIG_ESTUDIANTES}/${id}`;
    else if (type === 'asig_profesor') endpoint = `${API_ASIG_PROFESORES}/${id}`;

    closeDeleteModal();

    try {
        const res = await fetch(endpoint, { method: 'DELETE' });
        const data = await res.json();

        if (res.ok) {
            showToast(data.mensaje || 'Operación completada con éxito', 'success');
            await recargarTodo();
        } else {
            showToast(data.error || 'No se pudo completar la eliminación', 'error');
        }
    } catch (err) {
        console.error('Error al eliminar:', err);
        showToast('Error al intentar comunicarse con el servidor', 'error');
    }
}

// ==========================================
// ACTUALIZACIÓN DE KPIS Y MÉTRICAS
// ==========================================
async function updateKPIs() {
    // Badges en Sidebar
    badgeCountEstudiantes.textContent = estudiantes.length;
    badgeCountProfesores.textContent = profesores.length;
    badgeCountMaterias.textContent = materias.length;
    badgeCountAsignaciones.textContent = asignacionesEstudiantes.length + asignacionesProfesores.length;

    // Métricas en Cabecera
    kpiTotalEstudiantes.textContent = estudiantes.length;
    kpiTotalProfesores.textContent = profesores.length;
    kpiTotalMaterias.textContent = materias.length;
    kpiTotalAsignaciones.textContent = asignacionesEstudiantes.length + asignacionesProfesores.length;

    // Intentar refrescar desde endpoint de stats
    try {
        const res = await fetch(API_STATS);
        if (res.ok) {
            const stats = await res.json();
            kpiTotalEstudiantes.textContent = stats.total_estudiantes;
            kpiTotalProfesores.textContent = stats.total_profesores;
            kpiTotalMaterias.textContent = stats.total_materias;
            kpiTotalAsignaciones.textContent = stats.total_asignaciones;
        }
    } catch (e) {
        // Fallback usa los conteos locales ya calculados
    }
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
