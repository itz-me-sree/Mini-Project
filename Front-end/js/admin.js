/* ========================================
   ADMIN DASHBOARD LOGIC (SPA-STYLE)
   ======================================== */

// ── State Management ──
let ADMIN_USERS = [...MOCK_USERS,
{ id: 99, name: 'Bad Actor', handle: '@spam_bot', role: 'user', status: 'suspended', joined: '2024-01-10' },
{ id: 100, name: 'Troll King', handle: '@trololo', role: 'user', status: 'active', joined: '2024-02-15' }
];

let ADMIN_RESTAURANTS = [...MOCK_RESTAURANTS];

let ADMIN_REPORTS = [
    { id: 1, type: 'post', target: 'Seoul Kitchen Galbi', author: '@jordanwok', reporter: '@alexfoods', reason: 'Misleading content', status: 'pending', date: '2h ago' },
    { id: 2, type: 'user', target: '@spam_bot', reporter: 'System', reason: 'High frequency posting', status: 'resolved', date: '5h ago' },
    { id: 3, type: 'comment', target: 'That ramen was terrible...', author: '@foodie_newbie', reporter: '@marcusbites', reason: 'Harassment', status: 'pending', date: '1d ago' }
];

document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('Admin Dashboard Initializing...');
        checkAdminAuth();
        initAdminNavigation();
        loadDashboardSection('overview');
        console.log('Admin Dashboard Ready.');
    } catch (error) {
        console.error('Admin Init Error:', error);
        alert('Critical Error Initializing Admin Dashboard: ' + error.message);
    }
});

// ── Authentication Checks ──

function checkAdminAuth() {
    const adminSession = JSON.parse(localStorage.getItem('foodie_admin_session'));
    if (!adminSession || adminSession.role !== 'admin') {
        window.location.href = 'admin-login.html';
        return;
    }
    document.getElementById('adminNameDisplay').textContent = adminSession.name;
    document.getElementById('adminProfileIcon').src = adminSession.avatar;
}

function handleAdminLogout() {
    localStorage.removeItem('foodie_admin_session');
    const currentSession = JSON.parse(localStorage.getItem('foodie_session'));
    if (currentSession && currentSession.role === 'admin') {
        localStorage.removeItem('foodie_session');
    }
    window.location.href = 'admin-login.html';
}

// ── Navigation Logic ──

function initAdminNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            loadDashboardSection(item.dataset.section);
        });
    });

    document.getElementById('adminLogout').addEventListener('click', (e) => {
        e.preventDefault();
        handleAdminLogout();
    });
}

// ── Dynamic Content Loading ──

function loadDashboardSection(section) {
    const content = document.getElementById('adminContent');
    content.innerHTML = '<div class="loader">Refreshing data...</div>';

    setTimeout(() => {
        switch (section) {
            case 'overview': renderOverview(); break;
            case 'users': renderUserManagement(); break;
            case 'posts': renderPostModeration(); break;
            case 'restaurants': renderRestaurantManagement(); break;
            case 'reports': renderReportsQueue(); break;
            case 'analytics': renderAnalytics(); break;
            default: renderOverview();
        }
    }, 400);
}

// ── 1. Overview Section ──

function renderOverview() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>Dashboard Overview</h1>
                <p>Metrics as of ${new Date().toLocaleDateString()}</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="showToast('Refreshing metrics...', '🔄')">Refresh Data</button>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon" style="color:#FFB700">👥</div>
                <div class="stat-info">
                    <span class="value">${ADMIN_USERS.length + 1420}</span>
                    <span class="label">Total Users</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color:#FF6B35">📝</div>
                <div class="stat-info">
                    <span class="value">5,840</span>
                    <span class="label">Total Posts</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color:#2EC4B6">🏪</div>
                <div class="stat-info">
                    <span class="value">${ADMIN_RESTAURANTS.length + 120}</span>
                    <span class="label">Restaurants</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon" style="color:#E63946">🚩</div>
                <div class="stat-info">
                    <span class="value">${ADMIN_REPORTS.filter(r => r.status === 'pending').length}</span>
                    <span class="label">Pending Reports</span>
                </div>
            </div>
        </div>

        <div class="grid-layout-2-1" style="display:grid; grid-template-columns: 2fr 1fr; gap:24px;">
            <div class="admin-card">
                <div class="card-header">
                    <h3 class="card-title">Recent Activity</h3>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Target</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>@jordanwok</td>
                                <td>Posted Review</td>
                                <td>Seoul Kitchen</td>
                                <td>2m ago</td>
                            </tr>
                            <tr>
                                <td>@alexfoods</td>
                                <td>Liked Post</td>
                                <td>#1042</td>
                                <td>14m ago</td>
                            </tr>
                            <tr>
                                <td>System</td>
                                <td>New Registration</td>
                                <td>@foodie_newbie</td>
                                <td>42m ago</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-header">
                    <h3 class="card-title">Server Status</h3>
                </div>
                <div style="padding: 24px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-size:12px; color:var(--text-muted)">API Latency</span>
                        <span style="font-size:12px; color:var(--brand-green); font-weight:700">42ms</span>
                    </div>
                    <div style="height:4px; background:#222; border-radius:4px; margin-bottom:24px;">
                        <div style="width:15%; height:100%; background:var(--brand-green); border-radius:4px;"></div>
                    </div>

                    <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span style="font-size:12px; color:var(--text-muted)">Cloud Storage</span>
                        <span style="font-size:12px; color:var(--brand-gold); font-weight:700">68%</span>
                    </div>
                    <div style="height:4px; background:#222; border-radius:4px;">
                        <div style="width:68%; height:100%; background:var(--brand-gold); border-radius:4px;"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ── 2. User Management ──

function renderUserManagement() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>User Management</h1>
                <p>Manage access levels and account status</p>
            </div>
            <div style="display:flex; gap:12px;">
                <input type="text" id="userSearch" placeholder="Filter by name or handle..." class="admin-input" style="width:280px" oninput="filterUsersTable(this.value)">
                <button class="btn btn-outline btn-sm" onclick="showToast('Exporting CSV...', '📥')">Export</button>
            </div>
        </div>

        <div class="admin-card">
            <div class="admin-table-wrap">
                <table class="admin-table" id="usersTable">
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${renderUsersRows(ADMIN_USERS)}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function renderUsersRows(users) {
    return users.map(u => `
        <tr data-handle="${u.handle}">
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${u.avatar || 'https://i.pravatar.cc/150?u=' + u.id}" class="avatar avatar-sm">
                    <div>
                        <div class="fw-700">${u.name}</div>
                        <div class="text-muted" style="font-size:11px">${u.handle}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge ${u.role === 'admin' ? 'red' : 'silver'}">${u.role || 'user'}</span></td>
            <td><span class="status-pill ${u.status === 'suspended' ? 'suspended' : 'active'}">${u.status || 'active'}</span></td>
            <td>${u.joined || '2023-11-20'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-table" title="Edit Profile" onclick="showToast('Edit ${u.handle}', '✏️')">✏️</button>
                    ${u.status === 'suspended' ?
            `<button class="btn-table" onclick="toggleUserStatus('${u.handle}', 'active')" title="Activate">✅</button>` :
            `<button class="btn-table danger" onclick="toggleUserStatus('${u.handle}', 'suspended')" title="Suspend">🚫</button>`
        }
                    <button class="btn-table danger" onclick="deleteUser('${u.handle}')" title="Delete">🗑️</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterUsersTable(query) {
    const filtered = ADMIN_USERS.filter(u =>
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.handle.toLowerCase().includes(query.toLowerCase())
    );
    document.querySelector('#usersTable tbody').innerHTML = renderUsersRows(filtered);
}

function toggleUserStatus(handle, newStatus) {
    const user = ADMIN_USERS.find(u => u.handle === handle);
    if (user) {
        user.status = newStatus;
        showToast(`User ${handle} is now ${newStatus}`, '🛡️');
        renderUserManagement();
    }
}

function deleteUser(handle) {
    if (confirm(`Are you sure you want to permanently delete user ${handle}?`)) {
        ADMIN_USERS = ADMIN_USERS.filter(u => u.handle !== handle);
        showToast(`User ${handle} deleted.`, '🗑️');
        renderUserManagement();
    }
}

// ── 3. Post Moderation ──

function renderPostModeration() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>Post Moderation</h1>
                <p>Review and manage community content</p>
            </div>
        </div>
        <div class="admin-card">
             <div class="card-header">
                <h3 class="card-title">Recent Flagged Content</h3>
            </div>
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Post Preview</th>
                            <th>Author</th>
                            <th>Reason</th>
                            <th>Reports</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${MOCK_POSTS.map(p => `
                            <tr>
                                <td style="width:240px">
                                    <div style="display:flex; gap:12px; align-items:center;">
                                        <img src="${p.image}" style="width:60px; height:60px; border-radius:8px; object-fit:cover;">
                                        <div class="text-truncate" style="max-width:140px; font-size:12px">
                                            <div class="fw-700">${p.restaurant.name}</div>
                                            <div class="text-muted">${p.caption}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>${p.user.handle}</td>
                                <td><span style="font-size:12px; color:var(--brand-accent)">Spam / Low Quality</span></td>
                                <td><span class="badge red">${Math.floor(Math.random() * 20) + 5}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-table" onclick="window.open('post.html?id=${p.id}')" title="View Full">👁️</button>
                                        <button class="btn-table" onclick="showToast('Post shadow-hidden', '👻')" title="Hide">🫣</button>
                                        <button class="btn-table danger" onclick="showToast('Post removed', '🗑️')" title="Remove">🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ── 4. Restaurant Management ──

function renderRestaurantManagement() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>Restaurants</h1>
                <p>Manage restaurant database and photos</p>
            </div>
            <button class="btn btn-primary btn-sm" onclick="showAddRestaurantModal()">+ Add Restaurant</button>
        </div>
        <div class="stats-grid" id="restaurantsGrid">
             ${ADMIN_RESTAURANTS.map(r => `
                <div class="admin-card" style="padding:16px;">
                    <img src="${r.image}" style="width:100%; height:120px; object-fit:cover; border-radius:8px; margin-bottom:12px;">
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h4 style="font-size:14px; margin-bottom:4px;">${r.name}</h4>
                            <p style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">${r.cuisine} • ${r.address}</p>
                        </div>
                        <span style="font-size:11px; font-weight:700; color:var(--brand-gold)">★ ${r.rating}</span>
                    </div>
                    <div class="action-btns">
                        <button class="btn btn-secondary btn-sm" style="flex:1" onclick="showToast('Editing ${r.name}', '🛠️')">Edit</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--brand-accent)" onclick="deleteRestaurant(${r.id})">Delete</button>
                    </div>
                </div>
             `).join('')}
        </div>
    `;
}

function showAddRestaurantModal() {
    // Frontend-only modal simulation
    const name = prompt("Enter Restaurant Name:");
    if (name) {
        const cuisine = prompt("Enter Cuisine Type:");
        const newR = {
            id: ADMIN_RESTAURANTS.length + 1,
            name: name,
            cuisine: cuisine || 'General',
            rating: 5.0,
            address: 'Added via Admin',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'
        };
        ADMIN_RESTAURANTS.unshift(newR);
        renderRestaurantManagement();
        showToast('Restaurant added successfully!', '✨');
    }
}

function deleteRestaurant(id) {
    if (confirm("Delete this restaurant from database?")) {
        ADMIN_RESTAURANTS = ADMIN_RESTAURANTS.filter(r => r.id !== id);
        renderRestaurantManagement();
        showToast('Restaurant removed', '✂️');
    }
}

// ── 5. Reports Queue ──

function renderReportsQueue() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>Reports Queue</h1>
                <p>Address community concerns</p>
            </div>
            <div class="tabs">
                <button class="btn btn-sm btn-primary">Active</button>
                <button class="btn btn-sm btn-outline">Resolved</button>
            </div>
        </div>

        <div class="admin-card">
            <div class="admin-table-wrap">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Target</th>
                            <th>Reporter</th>
                            <th>Reason</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${ADMIN_REPORTS.map(r => `
                            <tr>
                                <td>#${r.id}</td>
                                <td>
                                    <div class="fw-700">${r.target}</div>
                                    <div style="font-size:10px; color:var(--text-muted)">Type: ${r.type}</div>
                                </td>
                                <td>${r.reporter}</td>
                                <td>${r.reason}</td>
                                <td><span class="status-pill ${r.status === 'resolved' ? 'active' : 'suspended'}">${r.status}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-table" onclick="resolveReport(${r.id})" title="Resolve">✅</button>
                                        <button class="btn-table danger" onclick="showToast('Ignored report', '⚠️')" title="Dismiss">❌</button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function resolveReport(id) {
    const r = ADMIN_REPORTS.find(rep => rep.id === id);
    if (r) {
        r.status = 'resolved';
        showToast('Report marked as resolved', '📥');
        renderReportsQueue();
    }
}

// ── 6. Analytics Section ──

function renderAnalytics() {
    const content = document.getElementById('adminContent');
    content.innerHTML = `
        <div class="section-header">
            <div class="section-title">
                <h1>Platform Analytics</h1>
                <p>Growth and engagement trends</p>
            </div>
            <select class="admin-input" style="width:160px">
                <option>Last 30 Days</option>
                <option>Last 12 Months</option>
                <option>All Time</option>
            </select>
        </div>

        <div class="stats-grid">
             <div class="admin-card" style="padding:24px;">
                <h4 style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">User Growth</h4>
                <div style="height:150px; display:flex; align-items:flex-end; gap:8px;">
                    ${Array.from({ length: 12 }).map((_, i) => `
                        <div style="flex:1; background:var(--brand-accent); height:${Math.random() * 100 + 20}%; border-radius:4px 4px 0 0; opacity:${0.3 + (i / 12)}"></div>
                    `).join('')}
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:12px; font-size:10px; color:var(--text-muted)">
                    <span>Jan</span><span>Dec</span>
                </div>
             </div>

             <div class="admin-card" style="padding:24px;">
                <h4 style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">Top Restaurants (Visits)</h4>
                ${ADMIN_RESTAURANTS.slice(0, 4).map(r => `
                    <div style="margin-bottom:12px;">
                        <div style="display:flex; justify-content:space-between; font-size:11px; margin-bottom:4px;">
                            <span>${r.name}</span>
                            <span>${Math.floor(Math.random() * 1000)}k</span>
                        </div>
                         <div style="height:6px; background:#222; border-radius:3px;">
                            <div style="width:${Math.random() * 80 + 20}%; height:100%; background:var(--brand-green); border-radius:3px;"></div>
                        </div>
                    </div>
                `).join('')}
             </div>
        </div>
    `;
}
