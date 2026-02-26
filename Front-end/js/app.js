/* ========================================
   FORKD — Shared App Data & Utilities
   ======================================== */

// ── Mock Data ──
const MOCK_USERS = [
  { id: 1, name: 'Alex Rivera', handle: '@alexfoods', avatar: 'https://i.pravatar.cc/150?img=11', bio: 'Chasing great bites 🍜 | Food critic | 500+ reviews', followers: 12400, following: 342, posts: 284, verified: true, hasStory: true },
  { id: 2, name: 'Priya Sharma', handle: '@priyaeats', avatar: 'https://i.pravatar.cc/150?img=25', bio: 'Street food lover & home cook', followers: 8900, following: 210, posts: 156, hasStory: true },
  { id: 3, name: 'Marcus Chen', handle: '@marcusbites', avatar: 'https://i.pravatar.cc/150?img=33', bio: 'From ramen to ravioli 🍝', followers: 5200, following: 390, posts: 97, hasStory: false },
  { id: 4, name: 'Sofia Patel', handle: '@sofiaplates', avatar: 'https://i.pravatar.cc/150?img=47', bio: 'Vegetarian foodie | Recipe developer', followers: 21000, following: 180, posts: 412, verified: true, hasStory: true },
  { id: 5, name: 'Jordan Kim', handle: '@jordanwok', avatar: 'https://i.pravatar.cc/150?img=52', bio: 'Asian cuisine explorer 🥢', followers: 3400, following: 560, posts: 68, hasStory: true },
  { id: 6, name: 'Emma Walsh', handle: '@emmasmenu', avatar: 'https://i.pravatar.cc/150?img=41', bio: 'Coffee & croissants kind of person ☕', followers: 9800, following: 270, posts: 203, hasStory: false },
];

const DEFAULT_GUEST = {
  id: -1, name: 'Guest User', handle: '@guest',
  avatar: 'https://i.pravatar.cc/150?img=65',
  role: 'guest', followers: 0, following: 0, posts: 0,
  likes: 0, level: 1, xp: 0
};

// Auth state initialization
let CURRENT_USER = JSON.parse(localStorage.getItem('foodie_session')) || DEFAULT_GUEST;

// ── Auth Utilities ──

/**
 * Returns true if the user is a registered user or admin.
 */
function isAuthenticated() {
  return CURRENT_USER && CURRENT_USER.role !== 'guest';
}

/**
 * Global route protection
 */
function protectRoutes() {
  const protectedPages = ['profile.html', 'create-post.html', 'activity.html'];
  const adminPages = ['admin.html', 'admin-dashboard.html'];
  const loginPages = ['login.html', 'admin-login.html', 'signup.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Skip protection for login/signup pages
  if (loginPages.includes(currentPage)) return;

  if (!isAuthenticated()) {
    if (adminPages.includes(currentPage)) {
      window.location.href = 'admin-login.html';
    } else if (protectedPages.includes(currentPage)) {
      window.location.href = 'login.html';
    }
  } else if (CURRENT_USER.role === 'user' && adminPages.includes(currentPage)) {
    window.location.href = 'index.html'; // Non-admins can't access admin pages
  }
}

// Run protection immediately
protectRoutes();

const MOCK_RESTAURANTS = [
  { id: 1, name: 'Sakura Ramen House', cuisine: 'Japanese', rating: 4.8, reviewCount: 892, priceLevel: 2, image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&auto=format&fit=crop', address: '42 Noodle Lane, Downtown', tags: ['Ramen', 'Sushi', 'Trending'], openNow: true, distance: '0.4 mi', lat: 40.71, lng: -74.00 },
  { id: 2, name: 'The Spice Route', cuisine: 'Indian', rating: 4.6, reviewCount: 1204, priceLevel: 2, image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&auto=format&fit=crop', address: '18 Curry Street, Midtown', tags: ['Curry', 'Biryani', 'Vegan Options'], openNow: true, distance: '1.1 mi' },
  { id: 3, name: 'Bella Napoli', cuisine: 'Italian', rating: 4.9, reviewCount: 2310, priceLevel: 3, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop', address: '7 Pasta Piazza, Soho', tags: ['Pizza', 'Pasta', 'Wine', 'Top Pick'], openNow: false, distance: '0.8 mi' },
  { id: 4, name: 'Seoul Kitchen', cuisine: 'Korean', rating: 4.7, reviewCount: 567, priceLevel: 2, image: 'https://images.unsplash.com/photo-1609167830220-7164aa360951?w=600&auto=format&fit=crop', address: '93 K-Food Ave, Koreatown', tags: ['BBQ', 'Bibimbap', 'Late Night'], openNow: true, distance: '1.5 mi' },
  { id: 5, name: 'Le Petit Café', cuisine: 'French', rating: 4.4, reviewCount: 431, priceLevel: 3, image: 'https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&auto=format&fit=crop', address: '3 Boulangerie Blvd, Upper East', tags: ['Pastry', 'Coffee', 'Brunch'], openNow: true, distance: '2.1 mi' },
  { id: 6, name: 'Taqueria El Sol', cuisine: 'Mexican', rating: 4.5, reviewCount: 788, priceLevel: 1, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop', address: '55 Fiesta Street, Brooklyn', tags: ['Tacos', 'Burritos', 'Budget Friendly'], openNow: true, distance: '0.6 mi' },
  { id: 7, name: 'The Burger Lab', cuisine: 'American', rating: 4.3, reviewCount: 1098, priceLevel: 2, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop', address: '22 Patty Place, Chelsea', tags: ['Burgers', 'Fries', 'Craft Beer'], openNow: false, distance: '1.9 mi' },
  { id: 8, name: 'Green Bowl', cuisine: 'Healthy', rating: 4.6, reviewCount: 342, priceLevel: 2, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop', address: '11 Wellness Way, Tribeca', tags: ['Vegan', 'Salads', 'Smoothies', 'Healthy'], openNow: true, distance: '0.3 mi' },
];

const MOCK_POSTS = [
  { id: 1, user: MOCK_USERS[0], restaurant: MOCK_RESTAURANTS[0], image: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=800&auto=format&fit=crop', caption: 'Absolutely mind-blowing tonkotsu ramen 🍜 The broth was simmered for 18 hours — you can taste every single hour of it. The chashu pork melts in your mouth. Hands down the best ramen in the city! #ramen #foodie #nyceats', rating: 5, dish: 'Tonkotsu Ramen', likes: 847, comments: 93, saved: false, timestamp: '2h ago', tags: ['#ramen', '#japanese', '#nyceats'] },
  { id: 2, user: MOCK_USERS[3], restaurant: MOCK_RESTAURANTS[2], image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop', caption: 'This margherita is poetry on a plate 🍕 Imported San Marzano tomatoes, fresh buffalo mozzarella, basil from their rooftop garden — absolute perfection. Bella Napoli never misses!', rating: 5, dish: 'Margherita Pizza', likes: 1243, comments: 147, saved: true, timestamp: '4h ago' },
  { id: 3, user: MOCK_USERS[1], restaurant: MOCK_RESTAURANTS[1], image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&auto=format&fit=crop', caption: 'The lamb biryani from The Spice Route is pure comfort food 🌶️ Layers of fragrant basmati rice, tender marinated lamb, and the most beautiful dum cooking aroma. Highly recommend the raita on the side!', rating: 4, dish: 'Lamb Biryani', likes: 562, comments: 64, saved: false, timestamp: '6h ago' },
  { id: 4, user: MOCK_USERS[4], restaurant: MOCK_RESTAURANTS[3], image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&auto=format&fit=crop', caption: 'Korean BBQ night done right! 🔥 The galbi here is absolutely insane — perfectly marinated, char-grilled table-side. Seoul Kitchen is my new favorite spot in Koreatown. Get the banchan set along with it!', rating: 5, dish: 'Galbi BBQ', likes: 728, comments: 81, saved: false, timestamp: '1d ago' },
  { id: 5, user: MOCK_USERS[5], restaurant: MOCK_RESTAURANTS[4], image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&auto=format&fit=crop', caption: '☕ Sunday mornings belong to Le Petit Café. Croissant so buttery and flaky it practically crumbles into your dreams. The café au lait is perfection. A true Parisian experience in NYC!', rating: 4, dish: 'Croissant & Café au Lait', likes: 934, comments: 102, saved: true, timestamp: '1d ago' },
  { id: 6, user: MOCK_USERS[2], restaurant: MOCK_RESTAURANTS[5], image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop', caption: 'Budget eats hall of fame: Taqueria El Sol 🌮 Three tacos for $9 and they are LOADED. Al pastor, carnitas, and the fish taco — all incredible. Topped with fresh cilantro salsa. Best value in Brooklyn!', rating: 5, dish: 'Street Tacos', likes: 1089, comments: 134, saved: false, timestamp: '2d ago' },
];

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

function buildSidebar(activePage) {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
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
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.46 3 3.21 3 5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg></span><span class="nav-label">Activity</span>
      <span class="nav-badge">2</span>
    </a>
    <a href="profile.html" class="nav-item ${activePage === 'profile' ? 'active' : ''}" data-page="profile">
      <span class="nav-icon"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><span class="nav-label">Profile</span>
    </a>
    <div class="sidebar-bottom">
      <a href="profile.html" class="sidebar-user" style="text-decoration:none;">
        <img src="${CURRENT_USER.avatar}" class="sidebar-avatar" alt="You">
        <div class="sidebar-user-info">
          <div class="sidebar-username">${CURRENT_USER.name.split(' ')[0]}</div>
          <div class="sidebar-handle">${CURRENT_USER.handle}</div>
        </div>
        <button class="btn-icon" style="color:var(--text-muted); font-size: 16px;" onclick="localStorage.removeItem('foodie_session'); showToast('Logging out...', '👋'); setTimeout(()=>window.location.reload(), 1500)">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-log-out"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
        </button>
      </a>
    </div>
  `;
}
