/* ── Home Page Logic ── */
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar('home');
  loadHomeData();

  const searchInput = document.getElementById('feedSearch');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(handleUnifiedSearch, 300));
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) document.getElementById('searchResults')?.classList.add('open');
    });
    // Close dropdown on click outside
    document.addEventListener('click', (e) => {
      const results = document.getElementById('searchResults');
      if (results && !results.contains(e.target) && e.target !== searchInput) {
        results.classList.remove('open');
      }
    });
  }
});

async function handleUnifiedSearch(e) {
  const q = e.target.value.trim();
  const resultsDiv = document.getElementById('searchResults');
  if (!resultsDiv) return;

  if (!q) {
    resultsDiv.classList.remove('open');
    resultsDiv.innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/search/unified?q=${encodeURIComponent(q)}`);
    const result = await res.json();
    if (result.success) {
      renderSearchDropdown(result.data);
      resultsDiv.classList.add('open');
    }
  } catch (err) { console.error('Search error:', err); }
}

function renderSearchDropdown(data) {
  const resultsDiv = document.getElementById('searchResults');
  if (!resultsDiv) return;

  let html = '';

  if (data.restaurants.length > 0) {
    html += '<div class="search-category">Restaurants</div>';
    data.restaurants.forEach(r => {
      html += `
        <div class="search-item" onclick="window.location.href='restaurant.html?name=${encodeURIComponent(r.name)}'">
          <div class="search-item-icon">🍴</div>
          <div class="search-item-info">
            <div class="search-item-name">${r.name}</div>
            <div class="search-item-sub">${r.category} · ${r.location}</div>
          </div>
          <div class="search-item-arrow">↖</div>
        </div>
      `;
    });
  }

  if (data.users.length > 0) {
    html += '<div class="search-category">Users</div>';
    data.users.forEach(u => {
      html += `
        <div class="search-item" onclick="window.location.href='profile.html?id=${u.id}'">
          <img class="search-item-avatar" src="${getAvatarUrl(u.profile_pic)}" alt="${u.username}" />
          <div class="search-item-info">
            <div class="search-item-name">${u.username}</div>
            <div class="search-item-sub">${u.bio || 'Foodie'}</div>
          </div>
          <div class="search-item-arrow">↖</div>
        </div>
      `;
    });
  }

  if (!data.restaurants.length && !data.users.length) {
    html = '<div class="search-no-results">No matches found</div>';
  }

  resultsDiv.innerHTML = html;
}

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

async function loadHomeData() {
  await Promise.all([
    fetchFeed(),
    fetchTrendingRestos(),
    fetchSuggestedUsers()
  ]);
  renderFeedTabs();
}

// Global state for home
let ALL_POSTS = [];

async function fetchFeed() {
  try {
    const res = await fetch(`${API_URL}/posts`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });

    if (res.status === 401 && !isAuthenticated()) {
      renderFeed([]); // Show empty state for guest if feed is protected
      return;
    }

    const result = await res.json();
    if (result.success) {
      ALL_POSTS = result.data || [];
      renderFeed(ALL_POSTS);
    }
  } catch (err) {
    console.error('Error fetching feed:', err);
    renderFeed([]);
  }
}

async function fetchTrendingRestos() {
  const container = document.getElementById('trendingRestaurants');
  if (!container) return;
  try {
    const res = await fetch(`${API_URL}/restaurants/trending`);
    const result = await res.json();
    if (result.success && result.data) {
      container.innerHTML = '';
      result.data.forEach(r => {
        const el = document.createElement('div');
        el.className = 'trend-resto';
        el.style.cursor = 'pointer';
        el.onclick = () => window.location.href = `restaurant.html?name=${encodeURIComponent(r.name)}`;
        el.innerHTML = `
          <img class="trend-resto-img" src="${getRestaurantImageUrl(r.image, r.category)}" alt="${r.name}" />
          <div class="trend-resto-info">
            <div class="trend-resto-name">${r.name}</div>
            <div class="trend-resto-meta">${r.category || 'Casual'} · ${r.location}</div>
          </div>
          <span class="trend-resto-rating">★ ${r.avg_rating}</span>
        `;
        container.appendChild(el);
      });
    }
  } catch (err) { console.error('Error fetching trending restaurants:', err); }
}

async function fetchSuggestedUsers() {
  const container = document.getElementById('suggestedUsers');
  if (!container) return;
  try {
    const res = await fetch(`${API_URL}/users/suggestions`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    if (res.status === 401) return;
    const result = await res.json();
    if (result.success && result.data) {
      container.innerHTML = '';
      if (result.data.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--text-muted);padding:10px;">No suggestions found</div>';
        return;
      }
      result.data.forEach(u => {
        const el = document.createElement('div');
        el.className = 'suggested-user';
        el.style.cursor = 'pointer';
        el.innerHTML = `
          <img class="avatar avatar-sm" src="${getAvatarUrl(u.profile_pic)}" alt="${u.username}" onclick="window.location.href='profile.html?id=${u.id}'" />
          <div class="suggested-user-info" onclick="window.location.href='profile.html?id=${u.id}'">
            <div class="suggested-name">${u.username}</div>
            <div class="suggested-handle">${u.bio ? u.bio.slice(0, 32) + (u.bio.length > 32 ? '…' : '') : '🍴 Food Enthusiast'}</div>
          </div>
          <button class="follow-btn" onclick="event.stopPropagation(); handleFollow(this, ${u.id})">Follow</button>
        `;
        container.appendChild(el);
      });
    }
  } catch (err) { console.error('Error suggesting users:', err); }
}

async function handleFollow(btn, userId) {
  if (CURRENT_USER.role === 'guest') {
    showToast('Login to follow people! 👥', '🔒');
    return;
  }
  try {
    const res = await fetch(`${API_URL}/social/follow/${userId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();
    if (result.success) {
      const isFollowing = btn.classList.toggle('following');
      btn.textContent = isFollowing ? 'Following' : 'Follow';
      showToast(result.message, isFollowing ? '👥' : '👤');
    }
  } catch (err) { showToast('Action failed', '❌'); }
}

function renderFeed(posts) {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  if (!posts || !posts.length) {
    feed.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-muted)">No posts found 😅</div>`;
    return;
  }
  posts.forEach((post, idx) => {
    const el = document.createElement('article');
    el.className = 'post-card';
    el.style.animationDelay = `${idx * 0.08}s`;
    const timeDisplay = new Date(post.created_at).toLocaleDateString();
    el.innerHTML = `
      <div class="post-header" style="display:flex; align-items:center;">
        <img class="avatar avatar-md" src="${getAvatarUrl(post.profile_pic)}" alt="${post.username}" 
             onclick="window.location.href='profile.html?id=${post.user_id}'" 
             style="cursor:pointer;"
             onerror="this.src='${API_URL.replace(/\/api$/, '')}/uploads/profile_pic-1772205025364-612489142.png'" />
        <div class="post-user-info" style="flex:1;">
          <div class="post-username" onclick="window.location.href='profile.html?id=${post.user_id}'" style="cursor:pointer;">${post.full_name || post.username}</div>
          <div class="post-meta">
            <span onclick="window.location.href='profile.html?id=${post.user_id}'" style="cursor:pointer;">@${post.username}</span> · 
            <span style="color:var(--brand-primary); cursor:pointer;" onclick="window.location.href='restaurant.html?name=${encodeURIComponent(post.restaurant_name)}'">${post.restaurant_name}</span> 
            ${post.dish_name ? `· <span style="font-weight:600">🍜 ${post.dish_name}</span>` : ''} · 
            <span onclick="window.location.href='post.html?id=${post.id}'" style="cursor:pointer;">${timeDisplay}</span>
          </div>
        </div>
      </div>
      <div class="post-image-wrap" onclick="window.location.href='post.html?id=${post.id}'" style="cursor:pointer;">
        <img class="post-image" src="${post.image && post.image.startsWith('http') ? post.image : API_URL.replace('/api', '') + '/uploads/' + post.image}" alt="dish" loading="lazy" />
        <div class="post-rating-badge">⭐ ${post.rating}.0</div>
      </div>
      <div class="post-body" onclick="window.location.href='post.html?id=${post.id}'" style="cursor:pointer;">
        <p class="post-caption"><strong>@${post.username}</strong> ${post.caption}</p>
      </div>
      <div class="post-actions">
        <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="handleLike(${post.id}, this)">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span>
          <span class="like-count" data-count="${post.likes_count || 0}">${formatNumber(post.likes_count || 0)}</span>
        </button>
        <button class="action-btn" onclick="window.location.href='post.html?id=${post.id}'">
          <span class="action-icon">💬</span> <span class="comment-count" data-count="${post.comments_count || 0}">${formatNumber(post.comments_count || 0)}</span>
        </button>
        <button class="action-btn ${post.is_saved ? 'saved' : ''}" onclick="handleSavePost(${post.id}, this)">
          <span class="action-icon">${post.is_saved ? '🔖' : '🔲'}</span> <span>${post.is_saved ? 'Saved' : 'Save'}</span>
        </button>
      </div>
    `;
    feed.appendChild(el);
  });
}

const FEED_TABS = ['For You', 'Following'];
function renderFeedTabs() {
  const container = document.getElementById('feedTabs');
  if (!container) return;
  container.innerHTML = '<div class="tab-slider"></div>';

  FEED_TABS.forEach((tab, i) => {
    const el = document.createElement('button');
    el.className = `feed-tab ${i === 0 ? 'active' : ''}`;
    el.textContent = tab;
    el.style.zIndex = '2';
    el.addEventListener('click', async () => {
      if (el.classList.contains('active')) return;

      document.querySelectorAll('.feed-tab').forEach(b => b.classList.remove('active'));
      el.classList.add('active');

      // Update slider position
      const slider = container.querySelector('.tab-slider');
      if (slider) {
        slider.style.transform = `translateX(${i * 100}%)`;
      }

      if (tab === 'For You') {
        renderFeed(ALL_POSTS);
      } else if (tab === 'Following') {
        if (CURRENT_USER.role === 'guest') {
          showToast('Login to see friends\' posts', '🔒');
          // Revert tab
          setTimeout(() => {
            document.querySelector('.feed-tab').click();
          }, 100);
          return;
        }
        try {
          const res = await fetch(`${API_URL}/posts/following`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
          });
          const result = await res.json();
          if (result.success) renderFeed(result.data);
        } catch (e) { showToast('Failed to load following feed', '❌'); }
      }
    });
    container.appendChild(el);
  });
}

async function handleLike(postId, btn) {
  if (CURRENT_USER.role === 'guest') return showToast('Login to like!', '🔒');
  try {
    const res = await fetch(`${API_URL}/social/like/${postId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();
    if (result.success) {
      btn.classList.toggle('liked', result.liked);
      const iconWrap = btn.querySelector('.action-icon');
      if (iconWrap) {
        iconWrap.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${result.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
      }
      const countEl = btn.querySelector('.like-count');
      if (countEl) {
        let count = parseInt(countEl.dataset.count || countEl.textContent || '0');
        let newCount = result.liked ? count + 1 : count - 1;
        countEl.dataset.count = newCount;
        countEl.textContent = formatNumber(newCount);
      }
      showToast(result.message, '❤️');
    }
  } catch (err) { showToast('Failed to like', '❌'); }
}

