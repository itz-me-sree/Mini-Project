/* ========================================
   ADMIN DASHBOARD STANDALONE LOGIC
   ======================================== */

// ── 1. Mock Data State ──
let STATE = {
    users: [
        { id: 1, name: 'Alex Rivera', email: 'alex@example.com', handle: '@alexfoods', role: 'Admin', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=1' },
        { id: 2, name: 'Priya Sharma', email: 'priya@example.com', handle: '@priyaeats', role: 'User', status: 'Active', avatar: 'https://i.pravatar.cc/150?u=2' },
        { id: 3, name: 'Marcus Chen', email: 'marcus@example.com', handle: '@marcusbites', role: 'User', status: 'Suspended', avatar: 'https://i.pravatar.cc/150?u=3' },
        { id: 4, name: 'Bad Actor', email: 'spam@bot.com', handle: '@spam_king', role: 'User', status: 'Suspended', avatar: 'https://i.pravatar.cc/150?u=4' },
    ],
    posts: [
        { id: 101, user: '@alexfoods', caption: 'The sushi here is amazing! 🍣', image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', reports: 0 },
        { id: 102, user: '@priyaeats', caption: 'Best burger in town. Hands down.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', reports: 5 },
        { id: 103, user: '@marcusbites', caption: 'Avoid this place, service was terrible.', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400', reports: 12 },
    ],
    restaurants: [
        { id: 1, name: 'Sakura Ramen House', cuisine: 'Japanese', address: '42 Noodle Lane', rating: 4.8, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400' },
        { id: 2, name: 'The Burger Lab', cuisine: 'American', address: '22 Patty Place', rating: 4.3, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
    ],
    reports: [
        { id: 1, target: 'Post #103', type: 'Abusive Content', by: '@alexfoods', date: '2h ago', status: 'Pending' },
        { id: 2, target: 'User @spam_king', type: 'Spamming', by: 'System', date: '5h ago', status: 'Pending' },
    ]
};

// ── 2. Initialization ──
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initSidebarToggle();
    initThemeToggle();
    initModals();
    loadSection('dashboard');
});

// ── 3. Navigation & Section Loading ──
function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-section]');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');

            // UI Update
            navItems.forEach(ni => ni.classList.remove('active'));
            item.classList.add('active');

            loadSection(section);
        });
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        if (confirm('Logout of administrative session?')) {
            window.location.href = 'admin-login.html';
        }
    });
}

function loadSection(section) {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = '<div class="loader">Loading...</div>';

    // Simulate Network Latency
    setTimeout(() => {
        viewArea.classList.add('fade-in');
        switch (section) {
            case 'dashboard': renderDashboard(); break;
            case 'users': renderUsers(); break;
            case 'posts': renderPosts(); break;
            case 'restaurants': renderRestaurants(); break;
            case 'reports': renderReports(); break;
            case 'analytics': renderAnalytics(); break;
            case 'settings': renderSettings(); break;
            default: renderDashboard();
        }
        // Remove animation class after it plays
        setTimeout(() => viewArea.classList.remove('fade-in'), 600);
    }, 300);
}

// ── 4. Rendering Modules ──

function renderDashboard() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Overview</h1>
                <p>Metrics for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            </div>
            <button class="btn btn-primary" onclick="loadSection('dashboard')">Update Data</button>
        </div>

        <div class="stats-grid">
            <div class="card">
                <div class="stat-icon-box" style="background: rgba(46, 196, 182, 0.1); color: var(--brand-green);">👥</div>
                <span class="stat-value">${STATE.users.length + 1200}</span>
                <span class="stat-label">Total Users</span>
            </div>
            <div class="card">
                <div class="stat-icon-box" style="background: rgba(230, 57, 70, 0.1); color: var(--brand-accent);">📝</div>
                <span class="stat-value">${STATE.posts.length + 5400}</span>
                <span class="stat-label">Total Posts</span>
            </div>
            <div class="card">
                <div class="stat-icon-box" style="background: rgba(255, 183, 0, 0.1); color: var(--brand-gold);">⭐</div>
                <span class="stat-value">12.4K</span>
                <span class="stat-label">Total Reviews</span>
            </div>
            <div class="card">
                <div class="stat-icon-box" style="background: rgba(69, 123, 157, 0.1); color: var(--brand-blue);">🏪</div>
                <span class="stat-value">${STATE.restaurants.length + 80}</span>
                <span class="stat-label">Restaurants</span>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div class="table-card">
                <div class="table-header">
                    <span class="table-title">Recent Platform Activity</span>
                </div>
                <table class="data-table">
                    <thead>
                        <tr><th>User</th><th>Action</th><th>Target</th><th>Time</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>@jordanwok</td><td>Posted Review</td><td>Seoul Kitchen</td><td>2m ago</td></tr>
                        <tr><td>@alexfoods</td><td>Liked Post</td><td>Post #8432</td><td>14m ago</td></tr>
                        <tr><td>@foodie_newbie</td><td>Followed</td><td>@priyaeats</td><td>42m ago</td></tr>
                    </tbody>
                </table>
            </div>

            <div class="card">
                <h3 style="margin-bottom: 20px; font-size: 16px;">Platform Growth</h3>
                <div class="chart-container">
                    <div class="bar" style="height: 40%;" data-value="40%"></div>
                    <div class="bar" style="height: 65%;" data-value="65%"></div>
                    <div class="bar" style="height: 50%;" data-value="50%"></div>
                    <div class="bar" style="height: 85%;" data-value="85%"></div>
                    <div class="bar" style="height: 95%;" data-value="95%"></div>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 10px; color: var(--text-muted); font-size: 10px;">
                    <span>MON</span><span>WED</span><span>FRI</span><span>SUN</span>
                </div>
            </div>
        </div>
    `;
}

function renderUsers() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Users Management</h1>
                <p>Address security and platform access</p>
            </div>
        </div>

        <div class="table-card">
            <div class="table-header">
                <div style="display: flex; gap: 12px;">
                    <input type="text" class="form-control" placeholder="Search handles/emails..." style="width: 250px;">
                    <select class="form-control" style="width: 150px;">
                        <option>All Roles</option>
                        <option>Admin</option>
                        <option>User</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-sm">Export Data</button>
            </div>
            <table class="data-table">
                <thead>
                    <tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${STATE.users.map(u => `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <img src="${u.avatar}" style="width: 32px; height: 32px; border-radius: 8px;">
                                    <div>
                                        <div class="fw-700">${u.name}</div>
                                        <div style="font-size: 11px; color: var(--text-muted)">${u.handle}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${u.email}</td>
                            <td><span class="badge ${u.role === 'Admin' ? 'badge-danger' : 'badge-pending'}">${u.role}</span></td>
                            <td><span class="badge ${u.status === 'Active' ? 'badge-active' : 'badge-danger'}">${u.status}</span></td>
                            <td>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn-icon-small" onclick="showPrompt('Suspend ${u.handle}?')">🚫</button>
                                    <button class="btn-icon-small" style="color: var(--brand-accent)" onclick="showPrompt('Delete ${u.handle} permanently?')">🗑️</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderPosts() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Posts Moderation</h1>
                <p>Remove or hide community content</p>
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">
            ${STATE.posts.map(p => `
                <div class="card" style="padding: 12px;">
                    <img src="${p.image}" style="width: 100%; height: 180px; object-fit: cover; border-radius: 12px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 700; font-size: 13px;">${p.user}</span>
                        ${p.reports > 0 ? `<span class="badge badge-danger">🚩 ${p.reports} Reports</span>` : ''}
                    </div>
                    <p style="font-size: 12px; color: var(--text-secondary); height: 36px; overflow: hidden; margin-bottom: 16px;">${p.caption}</p>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 11px; border: 1px solid var(--border-subtle);">Hide</button>
                        <button class="btn btn-danger btn-sm" style="flex: 1; font-size: 11px; background: var(--brand-accent); color: white;" onclick="showPrompt('Remove this post?')">Delete</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderRestaurants() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Restaurants Management</h1>
                <p>Update database and ratings</p>
            </div>
            <button class="btn btn-primary" id="openAddMod">Add Restaurant</button>
        </div>

        <div class="stats-grid">
            ${STATE.restaurants.map(r => `
                <div class="card" style="padding: 0; overflow: hidden;">
                    <img src="${r.image}" style="width: 100%; height: 140px; object-fit: cover;">
                    <div style="padding: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                            <h3 style="font-size: 16px;">${r.name}</h3>
                            <span style="color: var(--brand-gold); font-size: 12px;">★ ${r.rating}</span>
                        </div>
                        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">${r.cuisine} • ${r.address}</p>
                        <div style="display: flex; gap: 8px;">
                            <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 11px; border: 1px solid var(--border-subtle);">Edit</button>
                            <button class="btn btn-outline btn-sm" style="flex: 1; font-size: 11px; color: var(--brand-accent); border: 1px solid var(--border-subtle);" onclick="showPrompt('Remove ${r.name}?')">Delete</button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add Event Listener for the dynamic button
    document.getElementById('openAddMod').addEventListener('click', () => {
        document.getElementById('restaurantModal').classList.add('open');
    });
}

function renderReports() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Security Reports</h1>
                <p>Pending review queue</p>
            </div>
        </div>

        <div class="table-card">
            <table class="data-table">
                <thead>
                    <tr><th>Target</th><th>Type</th><th>Reporter</th><th>Time</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                    ${STATE.reports.map(r => `
                        <tr>
                            <td class="fw-700">${r.target}</td>
                            <td>${r.type}</td>
                            <td>${r.by}</td>
                            <td>${r.date}</td>
                            <td><span class="badge ${r.status === 'Pending' ? 'badge-pending' : 'badge-active'}">${r.status}</span></td>
                            <td>
                                <div style="display: flex; gap: 8px;">
                                    <button class="btn btn-primary btn-sm" style="padding: 6px 12px; font-size: 11px;">Triage</button>
                                    <button class="btn btn-outline btn-sm" style="padding: 6px 12px; font-size: 11px; border: 1px solid var(--border-subtle);">Dismiss</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAnalytics() {
    const viewArea = document.getElementById('viewArea');
    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Analytics</h1>
                <p>System metrics and growth trends</p>
            </div>
        </div>

        <div class="stats-grid">
            <div class="card" style="grid-column: span 2;">
                <h3>Active Users (Last 24h)</h3>
                <div class="chart-container" style="height: 250px;">
                    ${Array.from({ length: 12 }).map((_, i) => `
                        <div class="bar" style="height: ${Math.random() * 80 + 20}%; background: var(--brand-blue);" data-value="${Math.floor(Math.random() * 500)}"></div>
                    `).join('')}
                </div>
            </div>
            
            <div class="card">
                <h3>Top Active Reviewers</h3>
                <div style="margin-top: 20px;">
                    ${STATE.users.slice(0, 3).map(u => `
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                            <div style="display: flex; align-items: center; gap: 12px;">
                                <img src="${u.avatar}" style="width: 32px; height: 32px; border-radius: 50%;">
                                <span style="font-weight: 600; font-size: 13px;">${u.handle}</span>
                            </div>
                            <span style="font-size: 12px; color: var(--text-muted)">${Math.floor(Math.random() * 50)} posts</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderSettings() {
    const viewArea = document.getElementById('viewArea');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

    viewArea.innerHTML = `
        <div class="page-header">
            <div class="page-title">
                <h1>Settings</h1>
                <p>Configure dashboard preferences</p>
            </div>
        </div>

        <div style="max-width: 600px;">
            <div class="card" style="margin-bottom: 24px;">
                <h3 style="margin-bottom: 20px;">Interface Theme</h3>
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div>
                        <div class="fw-700">Dark Mode</div>
                        <p style="font-size: 13px; color: var(--text-muted)">Toggle between dark and light administrative themes</p>
                    </div>
                    <div class="theme-switch" id="innerThemeToggle">
                        <div class="theme-circle">${isDark ? '🌙' : '☀️'}</div>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <h3 style="margin-bottom: 20px;">Security</h3>
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" class="form-control" placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" class="form-control" placeholder="Min 8 characters">
                </div>
                <button class="btn btn-outline" style="border: 1px solid var(--border-subtle);" onclick="alert('Password reset link sent!')">Reset via Email</button>
            </div>
        </div>
    `;

    // Re-bind inner theme toggle
    document.getElementById('innerThemeToggle').onclick = () => document.getElementById('themeToggle').click();
}

// ── 5. Features Logic ──

function initSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('toggleSidebar');

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggle.innerHTML = sidebar.classList.contains('collapsed') ? '⇉' : '☰';
    });
}

function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);

        // Update circle icon
        const circle = toggle.querySelector('.theme-circle');
        circle.innerHTML = next === 'dark' ? '🌙' : '☀️';

        // Refresh settings view if open
        const activeNav = document.querySelector('.nav-item.active');
        if (activeNav && activeNav.getAttribute('data-section') === 'settings') {
            renderSettings();
        }
    });
}

function initModals() {
    // Restaurant Modal
    const rModal = document.getElementById('restaurantModal');
    document.getElementById('closeRestaurantModal').onclick = () => rModal.classList.remove('open');

    document.getElementById('restaurantForm').onsubmit = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const newR = {
            id: Date.now(),
            name: fd.get('name'),
            cuisine: fd.get('cuisine'),
            address: fd.get('address'),
            rating: '5.0',
            image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400'
        };
        STATE.restaurants.unshift(newR);
        rModal.classList.remove('open');
        renderRestaurants();
        e.target.reset();
    };

    // Prompt logic
    window.showPrompt = (message) => {
        const modal = document.getElementById('confirmModal');
        const msg = document.getElementById('confirmMessage');
        msg.textContent = message;
        modal.classList.add('open');

        document.getElementById('cancelAction').onclick = () => modal.classList.remove('open');
        document.getElementById('proceedAction').onclick = () => {
            alert('Action Executed!');
            modal.classList.remove('open');
        };
    };
}
