/* ==========================================
   FOODIE ADMIN DASHBOARD - REAL API VERSION
   ========================================== */

const API_URL = 'http://localhost:5000/api';
let ADMIN_DATA = {
    stats: {},
    users: [],
    posts: [],
    restaurants: [],
    reports: []
};

// ── Sorting State ──
// order: 0 = none, 1 = asc, 2 = desc
let CURRENT_RESTO_SORT = { column: null, order: 0 };

// ── Auth Check ──
function getAdminToken() {
    const session = JSON.parse(localStorage.getItem('foodie_admin_session'));
    if (!session || !session.token) {
        window.location.href = 'admin-login.html';
        return null;
    }
    return session.token;
}

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getAdminToken()}`
});

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
    if (!getAdminToken()) return;

    initNavigation();
    initSidebarToggle();
    initModals();
    loadSection('dashboard');
});

// ── Navigation ──
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', e => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            document.getElementById('topbarTitle').textContent = item.dataset.title;
            loadSection(item.dataset.section);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Logout of admin session?')) {
            localStorage.removeItem('foodie_admin_session');
            window.location.href = 'admin-login.html';
        }
    });
}

async function loadSection(section) {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = '<div class="loader">Loading...</div>';

    try {
        switch (section) {
            case 'dashboard': await fetchStats(); renderDashboard(); break;
            case 'users': await fetchUsers(); renderUsers(); break;
            case 'posts': await fetchPosts(); renderPosts(); break;
            case 'restaurants': await fetchRestaurants(); renderRestaurants(); break;
            case 'reports': await fetchReports(); renderReports(); break;
            default: await fetchStats(); renderDashboard();
        }
        viewArea.classList.add('fade-in');
        setTimeout(() => viewArea.classList.remove('fade-in'), 600);
    } catch (err) {
        viewArea.innerHTML = `<div class="error-box">Error loading data: ${err.message}</div>`;
    }
}

// ── API Helpers ──
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: { ...headers(), ...options.headers }
    });

    if (!res.ok) {
        let errorMsg = `Server Error: ${res.status}`;
        try {
            const errData = await res.json();
            errorMsg = errData.message || errorMsg;
        } catch (e) {
            // Not JSON
        }
        throw new Error(errorMsg);
    }

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return res.json();
    }
    return null;
}

// ── API Calls ──
async function fetchStats() {
    const data = await apiFetch('/admin/stats');
    if (data && data.success) ADMIN_DATA.stats = data.data;
}

async function fetchUsers() {
    const data = await apiFetch('/admin/users');
    if (data && data.success) ADMIN_DATA.users = data.data;
}

async function fetchPosts() {
    const data = await apiFetch('/admin/posts');
    if (data && data.success) ADMIN_DATA.posts = data.data;
}

async function fetchRestaurants() {
    const data = await apiFetch('/admin/restaurants');
    if (data && data.success) ADMIN_DATA.restaurants = data.data;
}

async function fetchReports() {
    const data = await apiFetch('/admin/reports');
    if (data && data.success) ADMIN_DATA.reports = data.data;
}

// ── 1. Dashboard ──
function renderDashboard() {
    const { userCount = 0, postCount = 0, restaurantCount = 0, suspendedCount = 0 } = ADMIN_DATA.stats;

    document.getElementById('viewArea').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Overview</h1>
                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="card stat-card">
                <div class="stat-icon-box" style="background:rgba(46,196,182,0.12);color:#2ec4b6;">👥</div>
                <div>
                    <span class="stat-value">${userCount}</span>
                    <span class="stat-label">Total Users</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon-box" style="background:rgba(255,107,53,0.12);color:#ff6b35;">📝</div>
                <div>
                    <span class="stat-value">${postCount}</span>
                    <span class="stat-label">Total Posts</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon-box" style="background:rgba(255,183,0,0.12);color:#ffb700;">🏪</div>
                <div>
                    <span class="stat-value">${restaurantCount}</span>
                    <span class="stat-label">Restaurants</span>
                </div>
            </div>
            <div class="card stat-card">
                <div class="stat-icon-box" style="background:rgba(230,57,70,0.12);color:#e63946;">🚫</div>
                <div>
                    <span class="stat-value">${suspendedCount}</span>
                    <span class="stat-label">Suspended Users</span>
                </div>
            </div>
        </div>

        <div class="table-card">
            <div class="table-header">
                <span class="table-title">Recent System Health</span>
            </div>
            <table class="data-table">
                <thead><tr><th>Resource</th><th>Status</th></tr></thead>
                <tbody>
                    <tr>
                        <td>Backend API</td>
                        <td><span class="badge badge-active">Operational</span></td>
                    </tr>
                    <tr>
                        <td>Database Connection</td>
                        <td><span class="badge badge-active">Operational</span></td>
                    </tr>
                    <tr>
                        <td>Active Users</td>
                        <td><span class="badge badge-pending">Normal</span></td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;
}

// ── 2. Users ──
function renderUsers() {
    document.getElementById('viewArea').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>User Management</h1>
                <p>Manage real accounts</p>
            </div>
        </div>

        <div class="table-card">
            <div class="table-header">
                <span class="table-title">All Users (${ADMIN_DATA.users.length})</span>
                <input type="text" class="form-control search-inline" placeholder="Search..." oninput="filterUsers(this.value)" style="width:200px">
            </div>
            <table class="data-table" id="usersTable">
                <thead>
                    <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>${renderUserRows(ADMIN_DATA.users)}</tbody>
            </table>
        </div>
    `;
}

function renderUserRows(users) {
    return users.map(u => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div class="user-avatar-letter">${u.username[0].toUpperCase()}</div>
                    <div>
                        <div style="font-weight:600">${u.full_name || u.username}</div>
                        <div style="font-size:11px;color:var(--text-muted)">@${u.username}</div>
                    </div>
                </div>
            </td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : 'badge-pending'}">${u.role}</span></td>
            <td><span class="badge ${u.status === 'active' ? 'badge-active' : 'badge-danger'}">${u.status}</span></td>
            <td>
                <div style="display:flex;gap:6px;">
                    <button class="btn-icon-small" title="${u.status === 'active' ? 'Suspend' : 'Activate'}"
                        onclick="toggleUser(${u.id}, '${u.status}')">${u.status === 'active' ? '🚫' : '✅'}</button>
                    <button class="btn-icon-small" title="Delete" style="color:var(--brand-accent)"
                        onclick="showPrompt('Delete user @${u.username}?', () => deleteUser(${u.id}))">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsers(q) {
    const filtered = ADMIN_DATA.users.filter(u =>
        (u.full_name?.toLowerCase().includes(q.toLowerCase())) ||
        u.username.toLowerCase().includes(q.toLowerCase()) ||
        u.email.toLowerCase().includes(q.toLowerCase())
    );
    document.querySelector('#usersTable tbody').innerHTML = renderUserRows(filtered);
}

async function toggleUser(id, currentStatus) {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    await apiFetch(`/admin/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    await fetchUsers();
    renderUsers();
}

async function deleteUser(id) {
    await apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
    await fetchUsers();
    renderUsers();
}

// ── 3. Posts Moderation ──
function renderPosts() {
    document.getElementById('viewArea').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Posts Moderation</h1>
                <p>Real-time community content</p>
            </div>
        </div>

        <div class="posts-grid">
            ${ADMIN_DATA.posts.map(p => `
                <div class="card post-mod-card">
                    <img src="${p.image.startsWith('http') ? p.image : 'http://localhost:5000/uploads/' + p.image}" alt="post" class="post-mod-img">
                    <div class="post-mod-body">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <span style="font-weight:600;font-size:13px;">@${p.username}</span>
                            <span class="badge badge-active">★ ${p.rating}</span>
                        </div>
                        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:6px;font-style:italic;">${p.restaurant_name}</p>
                        <p style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;">${p.caption}</p>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-danger btn-sm"
                                onclick="showPrompt('Permanently delete this post?', () => deletePost(${p.id}))">Delete Post</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function deletePost(id) {
    await apiFetch(`/admin/posts/${id}`, { method: 'DELETE' });
    await fetchPosts();
    renderPosts();
}

// ── 4. Restaurants ──
function renderRestaurants() {
    let displayData = [...ADMIN_DATA.restaurants];

    // Apply Sorting
    if (CURRENT_RESTO_SORT.order !== 0 && CURRENT_RESTO_SORT.column) {
        displayData.sort((a, b) => {
            let valA = a[CURRENT_RESTO_SORT.column];
            let valB = b[CURRENT_RESTO_SORT.column];

            if (typeof valA === 'string') valA = valA.toLowerCase();
            if (typeof valB === 'string') valB = valB.toLowerCase();

            if (valA < valB) return CURRENT_RESTO_SORT.order === 1 ? -1 : 1;
            if (valA > valB) return CURRENT_RESTO_SORT.order === 1 ? 1 : -1;
            return 0;
        });
    }

    const sortIcon = (col) => {
        if (CURRENT_RESTO_SORT.column !== col) return '';
        if (CURRENT_RESTO_SORT.order === 1) return ' ↑';
        if (CURRENT_RESTO_SORT.order === 2) return ' ↓';
        return '';
    };

    document.getElementById('viewArea').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Restaurants</h1>
                <p>Official restaurant database</p>
            </div>
            <button class="btn btn-primary" id="openAddModal">+ Add Restaurant</button>
        </div>

        <div class="table-card">
            <table class="data-table">
                <thead>
                    <tr>
                        <th class="sortable-header" onclick="handleRestoSort('name')">Name${sortIcon('name')}</th>
                        <th class="sortable-header" onclick="handleRestoSort('category')">Cuisine${sortIcon('category')}</th>
                        <th class="sortable-header" onclick="handleRestoSort('location')">Location${sortIcon('location')}</th>
                        <th class="sortable-header" onclick="handleRestoSort('avg_rating')">Avg Rating${sortIcon('avg_rating')}</th>
                        <th class="sortable-header" onclick="handleRestoSort('review_count')">Reviews${sortIcon('review_count')}</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(r => `
                        <tr>
                            <td style="font-weight:600">${r.name}</td>
                            <td>${r.category}</td>
                            <td style="color:var(--text-muted)">${r.location}</td>
                            <td style="color:var(--brand-gold);font-weight:700">★ ${r.avg_rating}</td>
                            <td>${r.review_count}</td>
                            <td>
                                <button class="btn-icon-small" title="Delete" style="color:var(--brand-accent)"
                                    onclick="showPrompt('Remove ${r.name}?', () => deleteRestaurant(${r.id}))">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    document.getElementById('openAddModal').addEventListener('click', () => {
        document.getElementById('restaurantModal').classList.add('open');
    });
}

function handleRestoSort(column) {
    if (CURRENT_RESTO_SORT.column === column) {
        CURRENT_RESTO_SORT.order = (CURRENT_RESTO_SORT.order + 1) % 3;
    } else {
        CURRENT_RESTO_SORT.column = column;
        CURRENT_RESTO_SORT.order = 1;
    }
    renderRestaurants();
}

async function deleteRestaurant(id) {
    await apiFetch(`/admin/restaurants/${id}`, { method: 'DELETE' });
    await fetchRestaurants();
    renderRestaurants();
}

// ── 5. Reports ──
function renderReports() {
    document.getElementById('viewArea').innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Community Reports</h1>
                <p>Manage user-submitted reports for posts and comments</p>
            </div>
        </div>

        <div class="table-card">
            <table class="data-table">
                <thead>
                    <tr><th>User</th><th>Target</th><th>Reason</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${ADMIN_DATA.reports.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:40px;">No reports found.</td></tr>' : ''}
                    ${ADMIN_DATA.reports.map(r => `
                        <tr>
                            <td>
                                <div style="font-weight:600">@${r.reporter_username}</div>
                            </td>
                            <td>
                                <span class="badge badge-pending" style="text-transform:capitalize;">${r.reported_type}</span>
                                <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">ID: ${r.reported_id}</div>
                            </td>
                            <td>
                                <div style="max-width:280px;white-space:normal;font-size:13px;color:var(--text-secondary);">
                                    ${r.reason}
                                </div>
                            </td>
                            <td style="color:var(--text-muted);font-size:12px;">${new Date(r.created_at).toLocaleDateString()}</td>
                            <td>
                                <span class="badge ${r.status === 'resolved' ? 'badge-active' : (r.status === 'dismissed' ? 'badge-danger' : 'badge-pending')}">
                                    ${r.status}
                                </span>
                            </td>
                            <td>
                                ${r.status === 'pending' ? `
                                <div style="display:flex;gap:6px;">
                                    <button class="btn-icon-small" title="Mark Resolved" style="color:var(--brand-green)"
                                        onclick="updateReportStatus(${r.id}, 'resolved')">✓</button>
                                    <button class="btn-icon-small" title="Dismiss Report" style="color:var(--brand-accent)"
                                        onclick="updateReportStatus(${r.id}, 'dismissed')">✕</button>
                                </div>
                                ` : '<span style="color:var(--text-muted);font-size:12px;">Closed</span>'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function updateReportStatus(id, newStatus) {
    await apiFetch(`/admin/reports/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
    });
    await fetchReports();
    renderReports();
}

// ── Sidebar Toggle ──
function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('toggleSidebar');
    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggle.textContent = sidebar.classList.contains('collapsed') ? '⇉' : '☰';
    });
}

// ── Modals ──
function initModals() {
    // Restaurant modal
    const rModal = document.getElementById('restaurantModal');
    document.getElementById('closeRestaurantModal').onclick = () => rModal.classList.remove('open');
    document.getElementById('restaurantForm').onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(e.target);

        const res = await fetch(`${API_URL}/admin/restaurants`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                name: fd.get('name'),
                category: fd.get('cuisine'),
                location: fd.get('address')
            })
        });

        if (res.ok) {
            rModal.classList.remove('open');
            e.target.reset();
            await fetchRestaurants();
            renderRestaurants();
        } else {
            const data = await res.json();
            alert('Error adding restaurant: ' + data.message);
        }
    };

    // Confirm modal
    window.showPrompt = (message, onConfirm) => {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMessage').textContent = message;
        modal.classList.add('open');
        document.getElementById('cancelAction').onclick = () => modal.classList.remove('open');
        document.getElementById('proceedAction').onclick = () => {
            modal.classList.remove('open');
            onConfirm();
        };
    };

    // Close modals on backdrop click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', e => {
            if (e.target === overlay) overlay.classList.remove('open');
        });
    });
}
