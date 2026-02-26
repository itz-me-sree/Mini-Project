/* ── Profile Page JS ── */
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('profile');
    renderProfileHeader();
    switchTab('posts', document.querySelector('.profile-tab'));
    renderFollowersList();
    renderFollowingList();
    prefillEditForm();
});

function renderProfileHeader() {
    if (!document.getElementById('profileAvatar')) return;

    // Simulate "Spectating" logic via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const spectateId = urlParams.get('id');
    const isSpectator = spectateId && spectateId != CURRENT_USER.id;

    // Choose user to display
    const viewUser = isSpectator ? MOCK_USERS.find(u => u.id == spectateId) || CURRENT_USER : CURRENT_USER;

    // Calculate dynamic likes from MOCK_POSTS (Total likes gotten from reviews)
    const totalLikes = MOCK_POSTS
        .filter(post => post.user.id === viewUser.id)
        .reduce((sum, post) => sum + post.likes, 0);

    document.getElementById('profileAvatar').src = viewUser.avatar;
    document.getElementById('profileName').textContent = viewUser.name;
    document.getElementById('profileBio').textContent = viewUser.bio;

    document.getElementById('statFollowers').textContent = formatNumber(viewUser.followers);
    document.getElementById('statFollowing').textContent = formatNumber(viewUser.following);
    document.getElementById('statPosts').textContent = viewUser.posts;
    document.getElementById('statLikes').textContent = formatNumber(totalLikes);

    // Toggle Buttons: Follow instead of Edit Profile for spectators
    const buttonsRow = document.querySelector('.profile-buttons-row');
    if (isSpectator) {
        buttonsRow.innerHTML = `
            <button class="btn-img-red" onclick="handleFollowDirect(this)">Follow</button>
            <button class="btn-img-dark" onclick="showToast('Message feature coming soon!','✉️')">Message</button>
        `;
        // Show Dashboard for spectators
        const dashboard = document.getElementById('achievementsCard');
        if (dashboard) dashboard.style.display = 'block';
    } else {
        buttonsRow.innerHTML = `
            <button class="btn-img-red" onclick="openModal('editProfileModal')">Edit Profile</button>
            <button class="btn-img-dark" onclick="shareProfile()">Share Profile</button>
        `;
        const dashboard = document.getElementById('achievementsCard');
        if (dashboard) dashboard.style.display = 'none';
    }
}

function handleFollowDirect(btn) {
    const isFollowing = btn.classList.toggle('following');
    btn.textContent = isFollowing ? 'Following' : 'Follow';
    btn.style.background = isFollowing ? '#222' : '#ff3b30';
    showToast(isFollowing ? 'Now following!' : 'Unfollowed', isFollowing ? '👥' : '👤');
}

function toggleMoreMenu() {
    const dropdown = document.getElementById('moreMenuDropdown');
    dropdown.classList.toggle('show');
}

// Close more menu when clicking outside
window.addEventListener('click', (e) => {
    const dropdown = document.getElementById('moreMenuDropdown');
    const btn = document.querySelector('.more-options-btn');
    if (dropdown && dropdown.classList.contains('show') && !dropdown.contains(e.target) && e.target !== btn) {
        dropdown.classList.remove('show');
    }
});

function toggleAchievementSection() {
    const section = document.getElementById('achievementsSection');
    const isOpen = section.classList.toggle('open');
    const btn = document.querySelector('.btn-icon[title="Achievements"]');
    if (isOpen) {
        btn.style.color = 'var(--brand-primary)';
        section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        btn.style.color = '';
    }
}

function switchTab(tabName, el) {
    document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
    const targetTab = el || document.querySelector(`.profile-tab[data-tab="${tabName}"]`);
    if (targetTab) targetTab.classList.add('active');

    const content = document.getElementById('tabContent');

    if (tabName === 'posts') {
        content.innerHTML = `<div class="posts-grid" id="postsGrid"></div>`;
        renderPostsGrid();
    } else if (tabName === 'favorites') {
        content.innerHTML = `<div class="saved-posts-grid" id="favoritesGrid"></div>`;
        renderFavorites();
    } else if (tabName === 'reviews') {
        content.innerHTML = `<div class="reviews-list" id="reviewsList"></div>`;
        renderReviews();
    } else if (tabName === 'liked-posts') {
        content.innerHTML = `<div class="posts-grid" id="likedPostsGrid"></div>`;
        renderLikedPosts();
    } else if (tabName === 'diary') {
        content.innerHTML = `<div class="diary-timeline" id="diaryTimeline"></div>`;
        renderDiary();
    }
}

// Posts in grid
function renderPostsGrid() {
    const grid = document.getElementById('postsGrid');
    MOCK_POSTS.forEach((post, i) => {
        const el = document.createElement('div');
        el.className = 'post-grid-item';
        el.style.animationDelay = `${i * 0.05}s`;
        el.className = 'post-grid-item fade-in';
        el.innerHTML = `
      <img class="post-grid-img" src="${post.image}" alt="${post.dish}" loading="lazy" />
      <div class="post-grid-overlay">
        <span class="post-grid-stat">❤️ ${formatNumber(post.likes)}</span>
        <span class="post-grid-stat">💬 ${post.comments}</span>
      </div>
      <span class="post-rating-mini">⭐ ${post.rating}.0</span>
    `;
        el.addEventListener('click', () => {
            window.location.href = `post.html?id=${post.id}`;
        });
        grid.appendChild(el);
    });
}

// Favorites (Combined Saved Items)
function renderFavorites() {
    const grid = document.getElementById('favoritesGrid');
    if (!grid) return;

    // Combine mock data for demonstration
    const favorites = [
        ...MOCK_POSTS.slice(0, 3).map(p => ({ ...p, type: 'Post' })),
        // Mocking a restaurant style entry
        { dish: 'Spicy Ramen', restaurant: { name: 'Ichiraku' }, image: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=500&h=300&fit=cover', rating: 5, type: 'Spot' }
    ];

    if (!favorites.length) {
        grid.innerHTML = emptyState('❤️', 'No favorites yet', 'Tap the heart on posts or restaurants to save them here');
        return;
    }

    favorites.forEach((item, i) => {
        const el = document.createElement('div');
        el.className = 'saved-post-card fade-in';
        el.style.animationDelay = `${i * 0.05}s`;
        el.innerHTML = `
      <img class="saved-post-img" src="${item.image}" alt="${item.dish}" loading="lazy" />
      <div class="saved-post-body">
        <div class="saved-post-title">${item.dish}</div>
        <div class="saved-post-meta">${item.type} · ${item.restaurant.name || item.restaurant}</div>
        <div class="stars" style="margin-top:6px; font-size: 10px;">${renderStars(item.rating || 5)}</div>
      </div>
    `;
        grid.appendChild(el);
    });
}

function renderLikedPosts() {
    const grid = document.getElementById('likedPostsGrid');
    if (!grid) return;
    const liked = MOCK_POSTS.slice(0, 4); // Demo data
    if (!liked.length) {
        grid.innerHTML = emptyState('❤️', 'No liked posts yet', 'Posts you like will appear here');
        return;
    }
    liked.forEach((post, i) => {
        const el = document.createElement('div');
        el.className = 'post-grid-item fade-in';
        el.style.animationDelay = `${i * 0.05}s`;
        el.innerHTML = `
      <img class="post-grid-img" src="${post.image}" alt="${post.dish}" />
      <div class="post-grid-overlay">
        <span class="post-grid-stat">❤️ ${formatNumber(post.likes)}</span>
      </div>
    `;
        grid.appendChild(el);
    });
}

// Reviews
function renderReviews() {
    const list = document.getElementById('reviewsList');
    MOCK_POSTS.forEach(post => {
        const el = document.createElement('div');
        el.className = 'review-item fade-in';
        el.innerHTML = `
      <img class="review-resto-img" src="${post.image}" alt="${post.restaurant.name}" loading="lazy" />
      <div class="review-body">
        <div class="review-resto-name">${post.restaurant.name}</div>
        <div class="review-dish">🍽️ ${post.dish}</div>
        <div class="stars">${renderStars(post.rating)}</div>
        <p class="review-text">${post.caption.slice(0, 120)}…</p>
        <div class="review-date">${post.timestamp} · ❤️ ${formatNumber(post.likes)} likes</div>
      </div>
    `;
        list.appendChild(el);
    });
}

function renderDiary() {
    const timeline = document.getElementById('diaryTimeline');
    timeline.innerHTML = `
        <div class="diary-sort" style="display:flex; justify-content:flex-end; margin-bottom: 20px;">
            <select style="background:none; border:none; color:white; font-size:11px; font-weight:700; cursor:pointer;">
                <option>SORT BY DATE</option>
                <option>SORT BY RATING</option>
            </select>
        </div>
        <div class="diary-month-label" style="padding: 10px 0; border-bottom: 1px solid #222; color: #444; font-size: 11px; font-weight: 800; letter-spacing: 2px; margin-bottom: 15px;">FEB 2026</div>
    `;

    MOCK_POSTS.forEach(post => {
        const el = document.createElement('div');
        el.className = 'diary-entry fade-in';
        el.style.display = 'flex';
        el.style.gap = '20px';
        el.style.padding = '12px 0';
        el.style.borderBottom = '1px solid #111';
        el.innerHTML = `
            <div class="diary-date" style="width: 40px; font-size: 11px; color: #444; font-weight: 700;">${post.timestamp.split(' ')[0]}</div>
            <div class="diary-content" style="flex: 1;">
                <div class="diary-name" style="font-size: 15px; font-weight: 600; margin-bottom: 4px;">${post.restaurant.name}</div>
                <div class="diary-rating" style="display: flex; align-items: center; gap: 8px;">
                    <span style="color: #00e054;">${'★'.repeat(post.rating)}</span>
                    <span style="font-size: 14px; opacity: 0.5;">❤️</span>
                    <span style="font-size: 14px; opacity: 0.5;">🔄</span>
                </div>
            </div>
        `;
        timeline.appendChild(el);
    });
}

// Post Detail (simple modal)
function openPostDetail(post) {
    showToast(`Viewing: "${post.dish}" — ${post.restaurant.name}`, '🍽️');
}

function shareProfile() {
    const url = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: `${CURRENT_USER.name}'s Profile`,
            text: `Check out ${CURRENT_USER.name}'s food reviews on Foodie!`,
            url: url
        }).then(() => {
            showToast('Profile shared successfully!', '📤');
        }).catch(() => {
            copyToClipboard(url);
        });
    } else {
        copyToClipboard(url);
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Profile link copied to clipboard!', '🔗');
    }).catch(err => {
        showToast('Failed to copy link', '❌');
    });
}

function emptyState(icon, text, sub) {
    return `<div class="empty-state" style="grid-column:1/-1">
    <div class="empty-state-icon">${icon}</div>
    <div class="empty-state-text">${text}</div>
    <div class="empty-state-sub">${sub}</div>
  </div>`;
}

// Modals
function openModal(id) {
    document.getElementById(id).classList.add('open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}

// Close modal on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('open');
    });
});

// Profile Edit
function prefillEditForm() {
    document.getElementById('editName').value = CURRENT_USER.name;
    document.getElementById('editHandle').value = CURRENT_USER.handle;
    document.getElementById('editBio').value = CURRENT_USER.bio;
}

function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const handle = document.getElementById('editHandle').value.trim();
    const bio = document.getElementById('editBio').value.trim();
    if (name) { CURRENT_USER.name = name; document.getElementById('profileName').textContent = name; }
    if (handle) { CURRENT_USER.handle = handle; document.getElementById('profileHandle').textContent = handle; }
    if (bio) { CURRENT_USER.bio = bio; document.getElementById('profileBio').textContent = bio; }
    closeModal('editProfileModal');
    showToast('Profile updated! ✅', '🎉');
}

// Followers / Following lists
function renderFollowersList() {
    const list = document.getElementById('followersList');
    MOCK_USERS.slice(0, 5).forEach(u => {
        list.appendChild(createUserListItem(u, true));
    });
}

function renderFollowingList() {
    const list = document.getElementById('followingList');
    MOCK_USERS.slice(1, 5).forEach(u => {
        list.appendChild(createUserListItem(u, false));
    });
}

function createUserListItem(u, isFollower) {
    const el = document.createElement('div');
    el.className = 'user-list-item';
    el.innerHTML = `
    <img class="avatar avatar-md" src="${u.avatar}" alt="${u.name}" />
    <div class="user-list-info">
      <div class="user-list-name">${u.name}</div>
      <div class="user-list-handle">${u.handle} · ${formatNumber(u.followers)} followers</div>
    </div>
    <button class="follow-btn ${isFollower ? '' : 'following'}" onclick="handleFollowUser(this)">${isFollower ? 'Follow' : 'Following'}</button>
  `;
    return el;
}

function handleFollowUser(btn) {
    const isNowFollowing = btn.classList.toggle('following');
    btn.textContent = isNowFollowing ? 'Following' : 'Follow';
    const delta = isNowFollowing ? 1 : -1;
    CURRENT_USER.following += delta;
    document.getElementById('statFollowing').textContent = formatNumber(CURRENT_USER.following);
    showToast(isNowFollowing ? 'Now following!' : 'Unfollowed', isNowFollowing ? '👥' : '👤');
}
