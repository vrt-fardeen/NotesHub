// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Global state
let currentPage = 1;
let currentSection = 'dashboard';
let programs = [];
let semesters = [];
let notes = [];
let currentNote = null;
let currentProgram = null;
let currentSemester = null;
let currentSubject = null;

// DOM Elements
const sections = document.querySelectorAll('.section');
const navLinks = document.querySelectorAll('.nav-link');
const loadingSpinner = document.getElementById('loadingSpinner');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    loadDashboard();
    setupEventListeners();
});

// Navigation
function initializeNavigation() {
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = this.getAttribute('data-section');
            showSection(targetSection);
        });
    });
}

function showSection(sectionName) {
    // Hide all sections
    sections.forEach(section => section.classList.remove('active'));
    
    // Show target section
    document.getElementById(sectionName).classList.add('active');
    
    // Update navigation
    navLinks.forEach(link => link.classList.remove('active'));
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Load section data
    currentSection = sectionName;
    switch(sectionName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'programs':
            loadPrograms();
            break;
        case 'semesters':
            loadSemesters();
            break;
        case 'notes':
            loadNotes();
            break;
        case 'view-note':
            // Note view is handled separately
            break;
        case 'program-detail':
            // Program detail is handled separately
            break;
        case 'semester-detail':
            // Semester detail is handled separately
            break;
        case 'subject-detail':
            // Subject detail is handled separately
            break;
    }
}

// Event Listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('programForm').addEventListener('submit', handleProgramSubmit);
    document.getElementById('semesterForm').addEventListener('submit', handleSemesterSubmit);
    document.getElementById('noteForm').addEventListener('submit', handleNoteSubmit);
    
    // Search and filters
    document.getElementById('programSearch').addEventListener('input', debounce(filterPrograms, 300));
    document.getElementById('noteSearch').addEventListener('input', debounce(filterNotes, 300));
    
    // Filter changes
    document.getElementById('programFilter').addEventListener('change', filterSemesters);
    document.getElementById('yearFilter').addEventListener('change', filterSemesters);
    document.getElementById('noteProgramFilter').addEventListener('change', filterNotes);
    document.getElementById('noteSemesterFilter').addEventListener('change', filterNotes);
    document.getElementById('noteSubjectFilter').addEventListener('change', filterNotes);
    
    // Dynamic semester selection in note form
    document.getElementById('noteProgram').addEventListener('change', populateSemesterSelects);
    document.getElementById('noteSemester').addEventListener('change', populateSubjectSelects);
    
    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));
    
    // Modal close on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// API Functions
async function apiCall(endpoint, options = {}) {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'API request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        showNotification(error.message, 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// Dashboard
async function loadDashboard() {
    try {
        const [programsData, semestersData, notesData] = await Promise.all([
            apiCall('/programs'),
            apiCall('/semesters'),
            apiCall('/notes?limit=6')
        ]);
        
        updateDashboardStats(programsData.data.length, semestersData.data.length, notesData.data.length);
        displayRecentNotes(notesData.data);
    } catch (error) {
        console.error('Failed to load dashboard:', error);
    }
}

function updateDashboardStats(programsCount, semestersCount, notesCount) {
    document.getElementById('totalPrograms').textContent = programsCount;
    document.getElementById('totalSemesters').textContent = semestersCount;
    document.getElementById('totalNotes').textContent = notesCount;
    document.getElementById('totalSubjects').textContent = '0'; // Will be calculated from notes
}

function displayRecentNotes(notes) {
    const container = document.getElementById('recentNotesList');
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No notes found</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        container.appendChild(noteCard);
    });
}

// Programs
async function loadPrograms() {
    try {
        const data = await apiCall('/programs');
        programs = data.data;
        displayPrograms(programs);
        populateProgramSelects();
    } catch (error) {
        console.error('Failed to load programs:', error);
    }
}

function displayPrograms(programsToShow) {
    const container = document.getElementById('programsList');
    container.innerHTML = '';
    
    if (programsToShow.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No programs found</p>';
        return;
    }
    
    programsToShow.forEach(program => {
        const programCard = createProgramCard(program);
        container.appendChild(programCard);
    });
}

function createProgramCard(program) {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer';
    card.onclick = () => viewProgramDetail(program._id);
    card.innerHTML = `
        <div class="card-header">
            <div>
                <h3 class="card-title">${program.name}</h3>
                <p class="card-subtitle">Code: ${program.code}</p>
            </div>
            <span class="status-${program.isActive ? 'active' : 'inactive'}">
                ${program.isActive ? 'Active' : 'Inactive'}
            </span>
        </div>
        <div class="card-content">
            <p>${program.description || 'No description available'}</p>
            <p><strong>Duration:</strong> ${program.duration} semesters</p>
        </div>
        <div class="card-footer">
            <div class="card-meta">
                <span>Created: ${new Date(program.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="event.stopPropagation(); viewProgramStats('${program._id}')">
                    <i class="fas fa-chart-bar"></i> Stats
                </button>
                <button class="btn btn-danger" onclick="event.stopPropagation(); deleteProgram('${program._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

function filterPrograms() {
    const searchTerm = document.getElementById('programSearch').value.toLowerCase();
    const filtered = programs.filter(program => 
        program.name.toLowerCase().includes(searchTerm) ||
        program.code.toLowerCase().includes(searchTerm)
    );
    displayPrograms(filtered);
}

// Semesters
async function loadSemesters() {
    try {
        const data = await apiCall('/semesters');
        semesters = data.data;
        displaySemesters(semesters);
        populateYearFilter();
        
        // Also ensure programs are loaded for the note form
        if (programs.length === 0) {
            await loadPrograms();
        }
    } catch (error) {
        console.error('Failed to load semesters:', error);
    }
}

function displaySemesters(semestersToShow) {
    const container = document.getElementById('semestersList');
    container.innerHTML = '';
    
    if (semestersToShow.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No semesters found</p>';
        return;
    }
    
    semestersToShow.forEach(semester => {
        const semesterCard = createSemesterCard(semester);
        container.appendChild(semesterCard);
    });
}

function createSemesterCard(semester) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
        <div class="card-header">
            <div>
                <h3 class="card-title">${semester.name}</h3>
                <p class="card-subtitle">${semester.program.name} - ${semester.academicYear}</p>
            </div>
            <span class="status-${semester.isActive ? 'active' : 'inactive'}">
                ${semester.isActive ? 'Active' : 'Inactive'}
            </span>
        </div>
        <div class="card-content">
            <p><strong>Semester Number:</strong> ${semester.number}</p>
            <p><strong>Duration:</strong> ${new Date(semester.startDate).toLocaleDateString()} - ${new Date(semester.endDate).toLocaleDateString()}</p>
            <p><strong>Subjects:</strong> ${semester.subjects.length} subjects</p>
        </div>
        <div class="card-footer">
            <div class="card-meta">
                <span>Created: ${new Date(semester.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="viewSemesterStats('${semester._id}')">
                    <i class="fas fa-chart-bar"></i> Stats
                </button>
                <button class="btn btn-danger" onclick="deleteSemester('${semester._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

function filterSemesters() {
    const programFilter = document.getElementById('programFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    
    let filtered = semesters;
    
    if (programFilter) {
        filtered = filtered.filter(semester => semester.program._id === programFilter);
    }
    
    if (yearFilter) {
        filtered = filtered.filter(semester => semester.academicYear === yearFilter);
    }
    
    displaySemesters(filtered);
}

// Notes
async function loadNotes(page = 1) {
    try {
        const params = new URLSearchParams({
            page: page,
            limit: 12
        });
        
        const data = await apiCall(`/notes?${params}`);
        notes = data.data;
        displayNotes(notes);
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Failed to load notes:', error);
    }
}

function displayNotes(notesToShow) {
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    
    if (notesToShow.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No notes found</p>';
        return;
    }
    
    notesToShow.forEach(note => {
        const noteCard = createNoteCard(note);
        container.appendChild(noteCard);
    });
}

function createNoteCard(note) {
    const card = document.createElement('div');
    card.className = 'card';
    
    const tagsHtml = note.tags && note.tags.length > 0 
        ? `<div class="tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';
    
    card.innerHTML = `
        <div class="card-header">
            <div>
                <h3 class="card-title">${note.title}</h3>
                <p class="card-subtitle">${note.program.name} - ${note.semester.name}</p>
            </div>
            <span class="${note.isPublic ? 'public-indicator' : 'private-indicator'}">
                ${note.isPublic ? 'Public' : 'Private'}
            </span>
        </div>
        <div class="card-content">
            <p>${note.content.substring(0, 150)}${note.content.length > 150 ? '...' : ''}</p>
            <p><strong>Subject:</strong> ${note.subject}</p>
            <p><strong>Author:</strong> ${note.author}</p>
            ${tagsHtml}
        </div>
        <div class="card-footer">
            <div class="card-meta">
                <span>Created: ${new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary" onclick="viewNote('${note._id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="btn btn-danger" onclick="deleteNote('${note._id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
    return card;
}

function filterNotes() {
    const searchTerm = document.getElementById('noteSearch').value;
    const programFilter = document.getElementById('noteProgramFilter').value;
    const semesterFilter = document.getElementById('noteSemesterFilter').value;
    const subjectFilter = document.getElementById('noteSubjectFilter').value;
    
    const params = new URLSearchParams({
        page: 1,
        limit: 12
    });
    
    if (searchTerm) params.append('search', searchTerm);
    if (programFilter) params.append('program', programFilter);
    if (semesterFilter) params.append('semester', semesterFilter);
    if (subjectFilter) params.append('subject', subjectFilter);
    
    loadNotesWithParams(params);
}

async function loadNotesWithParams(params) {
    try {
        const data = await apiCall(`/notes?${params}`);
        notes = data.data;
        displayNotes(notes);
        updatePagination(data.pagination);
    } catch (error) {
        console.error('Failed to filter notes:', error);
    }
}

// Form Handlers
async function handleProgramSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiCall('/programs', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showNotification('Program created successfully!', 'success');
        closeModal('programModal');
        e.target.reset();
        loadPrograms();
        loadDashboard();
    } catch (error) {
        console.error('Failed to create program:', error);
    }
}

async function handleSemesterSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
        await apiCall('/semesters', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showNotification('Semester created successfully!', 'success');
        closeModal('semesterModal');
        e.target.reset();
        loadSemesters();
        loadDashboard();
    } catch (error) {
        console.error('Failed to create semester:', error);
    }
}

async function handleNoteSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Convert tags string to array
    if (data.tags) {
        data.tags = data.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    

    
    // Convert checkbox to boolean
    data.isPublic = e.target.querySelector('#noteIsPublic').checked;
    
    try {
        await apiCall('/notes', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showNotification('Note created successfully!', 'success');
        closeModal('noteModal');
        e.target.reset();
        loadNotes();
        loadDashboard();
    } catch (error) {
        console.error('Failed to create note:', error);
    }
}

// Modal Functions
async function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    
    // Ensure data is loaded for note modal
    if (modalId === 'noteModal') {
        if (programs.length === 0) {
            await loadPrograms();
        }
        if (semesters.length === 0) {
            await loadSemesters();
        }
    }
    
    // Populate selects if needed
    if (modalId === 'semesterModal' || modalId === 'noteModal') {
        populateProgramSelects();
    }
    
    if (modalId === 'noteModal') {
        // Don't populate semesters immediately - wait for program selection
        const semesterSelect = document.getElementById('noteSemester');
        semesterSelect.innerHTML = '<option value="">Select Semester</option>';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Utility Functions
function populateProgramSelects() {
    console.log('Populating program selects with programs:', programs);
    
    const selects = ['semesterProgram', 'noteProgram', 'programFilter', 'noteProgramFilter'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            select.innerHTML = '<option value="">Select Program</option>';
            programs.forEach(program => {
                const option = document.createElement('option');
                option.value = program._id;
                option.textContent = `${program.name} (${program.code})`;
                select.appendChild(option);
            });
            console.log(`Populated ${selectId} with ${programs.length} programs`);
        }
    });
}

function populateSemesterSelects() {
    const select = document.getElementById('noteSemester');
    const programId = document.getElementById('noteProgram').value;
    
    console.log('Populating semesters for program:', programId);
    console.log('Available semesters:', semesters);
    
    select.innerHTML = '<option value="">Select Semester</option>';
    
    if (programId) {
        const programSemesters = semesters.filter(semester => semester.program._id === programId);
        console.log('Filtered semesters for program:', programSemesters);
        
        programSemesters.forEach(semester => {
            const option = document.createElement('option');
            option.value = semester._id;
            option.textContent = `${semester.name} (${semester.academicYear})`;
            select.appendChild(option);
        });
    }
    
    // Clear subject input when program changes
    document.getElementById('noteSubject').value = '';
}


function populateSubjectSelects() {
    // This function is kept for compatibility but now just clears the subject input
    // since we're using a text input instead of dropdown
    document.getElementById('noteSubject').value = '';
}

function populateYearFilter() {
    const select = document.getElementById('yearFilter');
    const years = [...new Set(semesters.map(semester => semester.academicYear))];
    
    select.innerHTML = '<option value="">All Years</option>';
    years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    });
}

function updatePagination(pagination) {
    document.getElementById('pageInfo').textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
    document.getElementById('prevPage').disabled = !pagination.hasPrevPage;
    document.getElementById('nextPage').disabled = !pagination.hasNextPage;
}

function changePage(delta) {
    currentPage += delta;
    loadNotes(currentPage);
}

function showLoading(show) {
    if (show) {
        loadingSpinner.classList.add('active');
    } else {
        loadingSpinner.classList.remove('active');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 4000;
        animation: slideInRight 0.3s ease;
    `;
    
    if (type === 'success') {
        notification.style.background = '#38a169';
    } else if (type === 'error') {
        notification.style.background = '#e53e3e';
    } else {
        notification.style.background = '#3182ce';
    }
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Delete Functions
async function deleteProgram(programId) {
    if (!confirm('Are you sure you want to delete this program?')) return;
    
    try {
        await apiCall(`/programs/${programId}`, { method: 'DELETE' });
        showNotification('Program deleted successfully!', 'success');
        loadPrograms();
        loadDashboard();
    } catch (error) {
        console.error('Failed to delete program:', error);
    }
}

async function deleteSemester(semesterId) {
    if (!confirm('Are you sure you want to delete this semester?')) return;
    
    try {
        await apiCall(`/semesters/${semesterId}`, { method: 'DELETE' });
        showNotification('Semester deleted successfully!', 'success');
        loadSemesters();
        loadDashboard();
    } catch (error) {
        console.error('Failed to delete semester:', error);
    }
}

async function deleteNote(noteId) {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
        await apiCall(`/notes/${noteId}`, { method: 'DELETE' });
        showNotification('Note deleted successfully!', 'success');
        
        // If we're on the view note page, go back to notes
        if (currentSection === 'view-note') {
            goBackToNotes();
        }
        
        loadNotes();
        loadDashboard();
    } catch (error) {
        console.error('Failed to delete note:', error);
    }
}

// View Functions
async function viewProgramStats(programId) {
    try {
        const data = await apiCall(`/programs/${programId}/stats`);
        alert(`Program Statistics:\nTotal Notes: ${data.data.stats.totalNotes}\nPublic Notes: ${data.data.stats.publicNotes}\nPrivate Notes: ${data.data.stats.privateNotes}\nUnique Subjects: ${data.data.stats.uniqueSubjects}`);
    } catch (error) {
        console.error('Failed to load program stats:', error);
    }
}

async function viewSemesterStats(semesterId) {
    try {
        const data = await apiCall(`/semesters/${semesterId}/stats`);
        alert(`Semester Statistics:\nTotal Notes: ${data.data.stats.totalNotes}\nPublic Notes: ${data.data.stats.publicNotes}\nPrivate Notes: ${data.data.stats.privateNotes}\nUnique Subjects: ${data.data.stats.uniqueSubjects}`);
    } catch (error) {
        console.error('Failed to load semester stats:', error);
    }
}

async function viewNote(noteId) {
    try {
        const data = await apiCall(`/notes/${noteId}`);
        currentNote = data.data;
        showNoteView(currentNote);
    } catch (error) {
        console.error('Failed to load note:', error);
        showNotification('Failed to load note details', 'error');
    }
}

function showNoteView(note) {
    // Show the view note navigation link
    document.querySelector('[data-section="view-note"]').style.display = 'flex';
    
    // Switch to view note section
    showSection('view-note');
    
    // Populate the note view content
    const container = document.getElementById('noteViewContent');
    
    const tagsHtml = note.tags && note.tags.length > 0 
        ? `<div class="note-view-tags">${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>`
        : '';
    
    const statusClass = note.isPublic ? 'public-indicator' : 'private-indicator';
    const statusText = note.isPublic ? 'Public' : 'Private';
    
    container.innerHTML = `
        <div class="note-view-header">
            <h1 class="note-view-title">${note.title}</h1>
            <div class="note-view-meta">
                <div class="note-view-meta-item">
                    <i class="fas fa-graduation-cap"></i>
                    <span>${note.program.name} (${note.program.code})</span>
                </div>
                <div class="note-view-meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${note.semester.name} - ${note.semester.academicYear}</span>
                </div>
                <div class="note-view-meta-item">
                    <i class="fas fa-book"></i>
                    <span>${note.subject}</span>
                </div>
                <div class="note-view-meta-item">
                    <i class="fas fa-user"></i>
                    <span>${note.author}</span>
                </div>
                <span class="note-view-status ${statusClass}">${statusText}</span>
            </div>
        </div>
        
        <div class="note-view-content-text">${note.content}</div>
        
        ${tagsHtml}
        
        <div class="note-view-footer">
            <div class="note-view-footer-left">
                <div class="note-view-footer-item">
                    <i class="fas fa-calendar-plus"></i>
                    <span>Created: ${new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <div class="note-view-footer-item">
                    <i class="fas fa-calendar-check"></i>
                    <span>Updated: ${new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="note-view-footer-right">
                <div class="note-view-footer-item">
                    <i class="fas fa-eye"></i>
                    <span>Note ID: ${note._id}</span>
                </div>
            </div>
        </div>
    `;
}

// Program Detail Functions
async function viewProgramDetail(programId) {
    try {
        const program = programs.find(p => p._id === programId);
        if (!program) {
            showNotification('Program not found', 'error');
            return;
        }
        
        currentProgram = program;
        
        // Show the program detail navigation link
        document.querySelector('[data-section="program-detail"]').style.display = 'flex';
        
        // Switch to program detail section
        showSection('program-detail');
        
        // Load program data
        await loadProgramDetail(program);
    } catch (error) {
        console.error('Failed to load program detail:', error);
        showNotification('Failed to load program details', 'error');
    }
}

async function loadProgramDetail(program) {
    // Update program info
    document.getElementById('programDetailTitle').textContent = `Program: ${program.name}`;
    document.getElementById('programDetailName').textContent = program.name;
    document.getElementById('programDetailDescription').textContent = program.description || 'No description available';
    
    // Load program semesters
    const programSemesters = semesters.filter(semester => semester.program._id === program._id);
    document.getElementById('programSemesterCount').textContent = `${programSemesters.length} Semesters`;
    
    // Load program notes count
    try {
        const notesData = await apiCall(`/notes?program=${program._id}&limit=1`);
        document.getElementById('programNotesCount').textContent = `${notesData.pagination.totalDocs} Notes`;
    } catch (error) {
        document.getElementById('programNotesCount').textContent = '0 Notes';
    }
    
    // Display semesters
    displayProgramSemesters(programSemesters);
}

function displayProgramSemesters(programSemesters) {
    const container = document.getElementById('programSemestersList');
    container.innerHTML = '';
    
    if (programSemesters.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No semesters found for this program</p>';
        return;
    }
    
    programSemesters.forEach(semester => {
        const semesterCard = createSemesterCardForProgram(semester);
        container.appendChild(semesterCard);
    });
}

function createSemesterCardForProgram(semester) {
    const card = document.createElement('div');
    card.className = 'semester-card';
    card.onclick = () => viewSemesterDetail(semester._id);
    card.innerHTML = `
        <h3>${semester.name}</h3>
        <p>Academic Year: ${semester.academicYear}</p>
        <p>Semester Number: ${semester.number}</p>
        <div class="card-meta">
            <span>${semester.subjects.length} Subjects</span>
            <span class="status-${semester.isActive ? 'active' : 'inactive'}">
                ${semester.isActive ? 'Active' : 'Inactive'}
            </span>
        </div>
        <div class="card-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); viewSemesterDetail('${semester._id}')">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `;
    return card;
}

function goBackToPrograms() {
    // Hide the program detail navigation link
    document.querySelector('[data-section="program-detail"]').style.display = 'none';
    
    // Switch back to programs section
    showSection('programs');
    
    // Clear current program
    currentProgram = null;
}

// Semester Detail Functions
async function viewSemesterDetail(semesterId) {
    try {
        const semester = semesters.find(s => s._id === semesterId);
        if (!semester) {
            showNotification('Semester not found', 'error');
            return;
        }
        
        currentSemester = semester;
        
        // Show the semester detail navigation link
        document.querySelector('[data-section="semester-detail"]').style.display = 'flex';
        
        // Switch to semester detail section
        showSection('semester-detail');
        
        // Load semester data
        await loadSemesterDetail(semester);
    } catch (error) {
        console.error('Failed to load semester detail:', error);
        showNotification('Failed to load semester details', 'error');
    }
}

async function loadSemesterDetail(semester) {
    // Update semester info
    document.getElementById('semesterDetailTitle').textContent = `Semester: ${semester.name}`;
    document.getElementById('semesterDetailName').textContent = semester.name;
    document.getElementById('semesterDetailProgram').textContent = `Program: ${semester.program.name} (${semester.program.code})`;
    
    document.getElementById('semesterSubjectCount').textContent = `${semester.subjects.length} Subjects`;
    
    // Load semester notes count
    try {
        const notesData = await apiCall(`/notes?semester=${semester._id}&limit=1`);
        document.getElementById('semesterNotesCount').textContent = `${notesData.pagination.totalDocs} Notes`;
    } catch (error) {
        document.getElementById('semesterNotesCount').textContent = '0 Notes';
    }
    
    // Display subjects
    displaySemesterSubjects(semester.subjects);
}

function displaySemesterSubjects(subjects) {
    const container = document.getElementById('semesterSubjectsList');
    container.innerHTML = '';
    
    if (subjects.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No subjects found for this semester</p>';
        return;
    }
    
    subjects.forEach(subject => {
        const subjectCard = createSubjectCard(subject);
        container.appendChild(subjectCard);
    });
}

function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.onclick = () => viewSubjectDetail(subject.name);
    card.innerHTML = `
        <h3>${subject.name}</h3>
        <p>Code: ${subject.code}</p>
        <p>Credits: ${subject.credits}</p>
        <div class="card-meta">
            <span>Subject</span>
        </div>
        <div class="card-actions">
            <button class="btn btn-primary" onclick="event.stopPropagation(); viewSubjectDetail('${subject.name}')">
                <i class="fas fa-eye"></i> View Notes
            </button>
        </div>
    `;
    return card;
}

function goBackToProgramDetail() {
    // Hide the semester detail navigation link
    document.querySelector('[data-section="semester-detail"]').style.display = 'none';
    
    // Switch back to program detail section
    showSection('program-detail');
    
    // Clear current semester
    currentSemester = null;
}

// Subject Detail Functions
async function viewSubjectDetail(subjectName) {
    try {
        currentSubject = subjectName;
        
        // Show the subject detail navigation link
        document.querySelector('[data-section="subject-detail"]').style.display = 'flex';
        
        // Switch to subject detail section
        showSection('subject-detail');
        
        // Load subject data
        await loadSubjectDetail(subjectName);
    } catch (error) {
        console.error('Failed to load subject detail:', error);
        showNotification('Failed to load subject details', 'error');
    }
}

async function loadSubjectDetail(subjectName) {
    // Update subject info
    document.getElementById('subjectDetailTitle').textContent = `Subject: ${subjectName}`;
    document.getElementById('subjectDetailName').textContent = subjectName;
    
    if (currentSemester) {
        document.getElementById('subjectDetailProgram').textContent = `Program: ${currentSemester.program.name} (${currentSemester.program.code})`;
        document.getElementById('subjectDetailSemester').textContent = `Semester: ${currentSemester.name} - ${currentSemester.academicYear}`;
    }
    
    // Load subject notes
    await loadSubjectNotes(subjectName);
}

async function loadSubjectNotes(subjectName) {
    try {
        const params = new URLSearchParams({
            subject: subjectName,
            page: 1,
            limit: 12
        });
        
        const data = await apiCall(`/notes?${params}`);
        document.getElementById('subjectNotesCount').textContent = `${data.pagination.totalDocs} Notes`;
        displaySubjectNotes(data.data);
    } catch (error) {
        console.error('Failed to load subject notes:', error);
        document.getElementById('subjectNotesCount').textContent = '0 Notes';
        document.getElementById('subjectNotesList').innerHTML = '<p class="text-center text-muted">No notes found for this subject</p>';
    }
}

function displaySubjectNotes(notes) {
    const container = document.getElementById('subjectNotesList');
    container.innerHTML = '';
    
    if (notes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No notes found for this subject</p>';
        return;
    }
    
    notes.forEach(note => {
        const noteCard = createNoteCard(note);
        container.appendChild(noteCard);
    });
}

function goBackToSemesterDetail() {
    // Hide the subject detail navigation link
    document.querySelector('[data-section="subject-detail"]').style.display = 'none';
    
    // Switch back to semester detail section
    showSection('semester-detail');
    
    // Clear current subject
    currentSubject = null;
}

// Note View Functions
function goBackToNotes() {
    // Hide the view note navigation link
    document.querySelector('[data-section="view-note"]').style.display = 'none';
    
    // Switch back to notes section
    showSection('notes');
    
    // Clear current note
    currentNote = null;
}

function editCurrentNote() {
    if (!currentNote) {
        showNotification('No note selected for editing', 'error');
        return;
    }
    
    // TODO: Implement edit functionality
    showNotification('Edit functionality coming soon!', 'info');
}

function deleteCurrentNote() {
    if (!currentNote) {
        showNotification('No note selected for deletion', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    deleteNote(currentNote._id);
}

// Add CSS for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
