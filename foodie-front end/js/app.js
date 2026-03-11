/* ========================================
   FORKD — Shared App Data & Utilities
   ======================================== */

// ── Global Configuration ──
const API_URL = 'http://127.0.0.1:5000/api';

// ── Theme Initialization ──
const currentTheme = localStorage.getItem('foodie_theme') || 'dark';
if (currentTheme === 'light') {
  document.body.classList.add('light-theme');
}

const DEFAULT_GUEST = {
  id: -1, name: 'Guest User', handle: '@guest',
  avatar: 'profile_pic-1772205025364-612489142.png',
  role: 'guest', followers: 0, following: 0, posts: 0,
  likes: 0, level: 1, xp: 0
};

// Auth state initialization
let sData = localStorage.getItem('foodie_session');
let CURRENT_USER = DEFAULT_GUEST;
try {
  if (sData && sData !== 'undefined') {
    CURRENT_USER = Object.assign({}, DEFAULT_GUEST, JSON.parse(sData));
    // Optional: Auto-refresh session if it's not a guest
    if (CURRENT_USER.id !== -1) {
      setTimeout(refreshSession, 100);
    }
  }
} catch (e) {
  console.error("Session parse error", e);
}

async function refreshSession() {
  if (!TOKEN || CURRENT_USER.id === -1) return;
  try {
    const res = await fetch(`${API_URL}/users/profile/${CURRENT_USER.id}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();
    if (result.success) {
      const updatedSession = { ...CURRENT_USER, ...result.data };
      localStorage.setItem('foodie_session', JSON.stringify(updatedSession));
      Object.assign(CURRENT_USER, updatedSession);
      // Update sidebar if it's already rendered
      const sidebarAvatar = document.querySelector('.sidebar-avatar');
      if (sidebarAvatar) {
        sidebarAvatar.src = getAvatarUrl(CURRENT_USER.profile_pic);
      }
    } else {
      // Token exists but user is deleted or token is invalid
      console.warn("Session invalid or user not found. Logging out.");
      localStorage.removeItem('foodie_session');
      localStorage.removeItem('foodie_token');
      window.location.href = 'login.html';
    }
  } catch (e) {
    console.warn("Failed to refresh session", e);
    // If it's a 401 from backend, clear session
    if (e.message && e.message.includes("401")) {
      localStorage.removeItem('foodie_session');
      localStorage.removeItem('foodie_token');
      window.location.href = 'login.html';
    }
  }
}

const TOKEN = localStorage.getItem('foodie_token') || null;

// ── Auth Utilities ──
function isAuthenticated() {
  return CURRENT_USER && CURRENT_USER.role !== 'guest';
}

function protectRoutes() {
  const protectedPages = ['profile.html', 'create-post.html', 'activity.html'];
  const adminPages = ['admin.html', 'admin-dashboard.html'];
  const loginPages = ['login.html', 'admin-login.html', 'signup.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  if (loginPages.includes(currentPage)) return;

  if (!isAuthenticated()) {
    if (adminPages.includes(currentPage)) {
      window.location.href = 'admin-login.html';
    } else if (protectedPages.includes(currentPage)) {
      window.location.href = 'login.html';
    }
  } else if (CURRENT_USER.role === 'user' && adminPages.includes(currentPage)) {
    window.location.href = 'index.html';
  }
}

// Run protection immediately
protectRoutes();

// ── Utilities ──
function renderStars(rating, max = 5) {
  return Array.from({ length: max }, (_, i) => {
    if (i < Math.floor(rating)) return `<span class="star filled">★</span>`;
    if (i < rating) return `<span class="star half">★</span>`;
    return `<span class="star empty">☆</span>`;
  }).join('');
}

function formatNumber(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n;
}

function getPriceLabel(level) {
  return '$'.repeat(level);
}

function getAvatarUrl(pic) {
  const defaultPic = 'profile_pic-1772205025364-612489142.png';
  if (!pic || pic === 'default_profile.png' || pic === 'null') {
    const baseUrl = API_URL.replace(/\/api$/, '');
    return `${baseUrl}/uploads/${defaultPic}`;
  }
  if (typeof pic === 'string' && pic.startsWith('http')) return pic;

  const baseUrl = API_URL.replace(/\/api$/, '');
  return `${baseUrl}/uploads/${pic}?t=${new Date().getTime()}`;
}

function getRestaurantImageUrl(image, category) {
  const images = {
    'restaurant': 'https://images.unsplash.com/photo-1514933651103-005eec06c04b',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
    'bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff',
    'fast_food': 'https://images.unsplash.com/photo-1561758033-d89a9ad46330',
    'korean': 'https://images.unsplash.com/photo-1590301157890-4810ed352733',
    'juice': 'https://images.unsplash.com/photo-1622597467827-0bb80cc66f1e',
    'dessert': 'https://images.unsplash.com/photo-1488477181946-6428a0291777',
    'ice_cream': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a',
    'american': 'https://images.unsplash.com/photo-1534422298391-e4f8c170db0a',
    'pub': 'https://images.unsplash.com/photo-1543007630-9710e4a00a20',
    'japanese': 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d',
    'indian': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe',
    'italian': 'https://images.unsplash.com/photo-1498579127083-ef40a08e068a',
    'default': 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b'
  };

  if (!image || image === 'default_restaurant.png' || image === 'null') {
    const cat = (category || '').toLowerCase();

    // Exact matches or partial matches
    for (const key in images) {
      if (key === 'default') continue;
      if (cat.includes(key)) return images[key];
    }
    return images['default'];
  }

  if (typeof image === 'string' && image.startsWith('http')) return image;

  const baseUrl = API_URL.replace(/\/api$/, '');
  return `${baseUrl}/uploads/${image}`;
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('open');
  document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = ''; // Restore scroll
}

function showToast(message, icon = '✅', duration = 3000) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, duration);
}

function initHeaderCTA() {
  const container = document.getElementById('headerAuthCTA');
  if (!container) return;

  if (CURRENT_USER.role === 'guest') {
    container.innerHTML = `
      <div style="display:flex; gap:10px;">
        <a href="login.html" class="btn btn-outline btn-sm" style="text-decoration:none;">Login</a>
        <a href="signup.html" class="btn btn-primary btn-sm" style="text-decoration:none;">Sign Up</a>
      </div>
    `;
  }
}

// Global initialization
document.addEventListener('DOMContentLoaded', () => {
  initHeaderCTA();
});

function toggleLike(btn) {
  if (CURRENT_USER.role === 'guest') {
    showToast('Login to heart reviews! ❤️', '🔒');
    return;
  }
  const isLiked = btn.classList.toggle('liked');
  const countEl = btn.querySelector('.like-count');
  if (countEl) {
    const count = parseInt(countEl.dataset.count);
    const newCount = isLiked ? count + 1 : count - 1;
    countEl.dataset.count = newCount;
    countEl.textContent = formatNumber(newCount);
  }
  btn.style.transform = 'scale(1.3)';
  setTimeout(() => btn.style.transform = 'scale(1)', 200);
}

function toggleSave(btn, id) {
  if (CURRENT_USER.role === 'guest') {
    showToast('Sign up to save posts! 🔖', '🔒');
    return;
  }
  const isSaved = btn.classList.toggle('saved');
  btn.textContent = isSaved ? '🔖' : '🔲';
  showToast(isSaved ? 'Post saved!' : 'Removed from saved', isSaved ? '🔖' : '✂️');
}

function setActivePage(pageName) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === pageName);
  });
}

async function buildSidebar(activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  let unreadCount = 0;
  if (isAuthenticated()) {
    try {
      const res = await fetch(`${API_URL}/social/activities/unread-count`, {
        headers: { 'Authorization': `Bearer ${TOKEN}` }
      });
      const result = await res.json();
      if (result.success) unreadCount = result.count;
    } catch (e) { console.error('Error fetching unread count', e); }
  }

  sidebar.innerHTML = `
    <a href="index.html" class="sidebar-logo">
      <div class="logo-icon">🍴</div>
      <span class="logo-text">Foodie</span>
    </a>
    ${CURRENT_USER.role === 'guest' ? `
    <div style="padding: 0 16px; margin-bottom: 20px;">
      <a href="login.html" class="btn btn-primary btn-sm" style="width:100%; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px;">
        <span>🔐</span> Login / Sign Up
      </a>
    </div>
    ` : ''}
    <span class="nav-section-label">Menu</span>
    <a href="index.html" class="nav-item ${activePage === 'home' ? 'active' : ''}" data-page="home">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-house"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span><span class="nav-label">Home</span>
    </a>
    <a href="explore.html" class="nav-item ${activePage === 'explore' ? 'active' : ''}" data-page="explore">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg></span><span class="nav-label">Explore</span>
    </a>
    <a href="create-post.html" class="nav-item ${activePage === 'create' ? 'active' : ''}" data-page="create">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-plus"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg></span><span class="nav-label">Post Review</span>
    </a>
    <span class="nav-section-label">Social</span>
    <a href="activity.html" class="nav-item ${activePage === 'activity' ? 'active' : ''}" data-page="activity">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span><span class="nav-label">Activity</span>
      ${unreadCount > 0 ? `<span class="nav-badge">${unreadCount}</span>` : ''}
    </a>
    <a href="profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}" data-page="profile">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><span class="nav-label">Profile</span>
    </a>
    <div class="sidebar-bottom">
      <a href="profile.html" class="sidebar-user" style="text-decoration:none;">
        <img src="${getAvatarUrl(CURRENT_USER.profile_pic)}" 
             class="sidebar-avatar" 
             alt="You" 
             onerror="this.src='${API_URL.replace(/\/api$/, '')}/uploads/profile_pic-1772205025364-612489142.png'">
        <div class="sidebar-user-info">
          <div class="sidebar-username">${(CURRENT_USER.full_name || CURRENT_USER.username || 'User').split(' ')[0]}</div>
          <div class="sidebar-handle">@${CURRENT_USER.username || 'user'}</div>
        </div>
        <button class="btn-icon" style="color:var(--text-muted); font-size: 16px;" onclick="localStorage.removeItem('foodie_session'); localStorage.removeItem('foodie_token'); showToast('Logging out...', '👋'); setTimeout(()=>window.location.reload(), 1500)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </button>
      </a>
    </div>
  `;
}

async function handleSavePost(postId, btn) {
  if (CURRENT_USER.role === 'guest') return showToast('Login to save posts! 🔖', '🔒');

  try {
    const res = await fetch(`${API_URL}/social/save-post/${postId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();
    if (result.success) {
      btn.classList.toggle('saved', result.isSaved);
      btn.innerHTML = `<span class="action-icon">${result.isSaved ? '🔖' : '🔲'}</span> ${result.isSaved ? 'Saved' : 'Save'}`;
      showToast(result.message, result.isSaved ? '🔖' : '✂️');
    }
  } catch (err) {
    showToast('Failed to toggle save', '❌');
  }
}
