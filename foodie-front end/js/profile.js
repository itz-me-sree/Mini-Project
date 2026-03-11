/* ── Profile Page JS ── */

// Global State
let profileUserId = null;
let isOwnProfile = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Profile Page Initializing...');

    if (!CURRENT_USER || CURRENT_USER.id === -1) {
        console.warn('User not logged in, redirecting...');
        window.location.href = 'login.html';
        return;
    }

    // Initialize user IDs
    const urlParams = new URLSearchParams(window.location.search);
    const rawId = urlParams.get('userId') || urlParams.get('id');

    // Ensure we compare as strings/numbers correctly
    profileUserId = rawId ? rawId.toString() : CURRENT_USER.id.toString();
    isOwnProfile = (profileUserId == CURRENT_USER.id.toString());

    console.log(`Viewing Profile: ${profileUserId} | Is Own: ${isOwnProfile}`);

    buildSidebar('profile');
    loadProfileData();
    initEventListeners();
    initSettings();

    // Handle window resize for tab indicator
    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.profile-tab.active');
        if (activeTab) updateTabIndicator(activeTab);
    });
});

// --- DATA FETCHING ---

async function loadProfileData() {
    try {
        const response = await fetch(`${API_URL}/users/profile/${profileUserId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();

        if (result.success) {
            renderProfileHeader(result.data);
            loadLevelData(profileUserId);

            // Setup tabs visibility
            const savedTabBtn = document.querySelector('.profile-tab[data-tab="saved"]');
            if (savedTabBtn) {
                savedTabBtn.style.display = isOwnProfile ? 'block' : 'none';
            }

            // Setup initial tab (Load initial tab content)
            const urlParams = new URLSearchParams(window.location.search);
            const activeTab = urlParams.get('tab') || 'posts';

            // Wait slightly for layout to settle before positioning indicator
            setTimeout(() => switchTab(activeTab), 50);
        } else {
            showToast('User not found', '❌');
            console.error('Profile Load Error:', result.message);
        }
    } catch (err) {
        console.error('Profile Connection Error:', err);
        showToast('Connection failed', '❌');
    }
}

// --- RENDERING ---

function renderProfileHeader(viewUser) {
    document.getElementById('profileAvatar').src = getAvatarUrl(viewUser.profile_pic);
    document.getElementById('profileName').textContent = viewUser.full_name || viewUser.username;
    document.getElementById('profileBio').textContent = viewUser.bio || 'No bio yet.';

    const idEl = document.querySelector('.foodie-id');
    if (idEl) idEl.textContent = `@${viewUser.username}`;

    document.getElementById('statFollowers').textContent = formatNumber(viewUser.followersCount || 0);
    document.getElementById('statFollowing').textContent = formatNumber(viewUser.followingCount || 0);
    document.getElementById('statPosts').textContent = viewUser.postsCount || 0;
    document.getElementById('statLikes').textContent = formatNumber(viewUser.totalLikesCount || 0);

    const buttonsRow = document.querySelector('.profile-buttons-row');
    const settingsGroup = document.querySelector('.header-actions-group');
    if (!buttonsRow) return;

    if (settingsGroup) {
        settingsGroup.style.display = isOwnProfile ? 'block' : 'none';
    }

    if (isOwnProfile) {
        buttonsRow.innerHTML = `
            <button class="btn-img-red" onclick="openModal('editProfileModal')">Edit Profile</button>
            <button class="btn-img-dark" onclick="shareProfile()">Share Profile</button>
        `;
        // Populate edit modal fields
        document.getElementById('editName').value = viewUser.full_name || viewUser.username;
        document.getElementById('editHandle').value = viewUser.username;
        document.getElementById('editBio').value = viewUser.bio || '';
        document.getElementById('editAvatarPreview').src = getAvatarUrl(viewUser.profile_pic);
    } else {
        const followBtnClass = viewUser.isFollowing ? 'following' : '';
        const followBtnText = viewUser.isFollowing ? 'Following' : 'Follow';
        const followBtnStyle = viewUser.isFollowing ? 'background: #222; border-color: rgba(255,255,255,0.1);' : '';

        buttonsRow.innerHTML = `
            <button class="btn-img-red ${followBtnClass}" style="${followBtnStyle}" onclick="handleFollowDirect(this, ${viewUser.id})">${followBtnText}</button>
            <button class="btn-img-dark" onclick="showToast('Messaging coming soon!', '💬')">Message</button>
        `;
    }
}

// --- TABS & CONTENT ---

function switchTab(tabName, el) {
    const tabs = document.querySelectorAll('.profile-tab');
    tabs.forEach(t => t.classList.remove('active'));

    const targetTab = el || document.querySelector(`.profile-tab[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
        updateTabIndicator(targetTab);
    }

    const content = document.getElementById('tabContent');
    if (!content) return;

    // Remove old animation class if exists to re-trigger it
    content.classList.remove('tab-pane-animate');
    void content.offsetWidth; // Force reflow
    content.classList.add('tab-pane-animate');

    // Create a fresh grid container
    content.innerHTML = `<div class="${tabName === 'reviews' ? 'reviews-list' : 'posts-grid'}" id="postsGrid"></div>`;

    let fetchPath = '';
    switch (tabName) {
        case 'posts':
            fetchPath = `${API_URL}/users/${profileUserId}/posts`;
            loadTabContent(fetchPath, 'grid');
            break;
        case 'liked':
            fetchPath = `${API_URL}/users/${profileUserId}/liked`;
            loadTabContent(fetchPath, 'grid', '❤️', 'No liked posts yet');
            break;
        case 'saved':
            if (isOwnProfile) {
                fetchPath = `${API_URL}/users/${profileUserId}/saved`;
                loadTabContent(fetchPath, 'grid', '🔖', 'No saved posts yet');
            } else {
                content.innerHTML = `<div style="text-align:center;padding:60px 20px;color:rgba(255,255,255,0.3)">Private content</div>`;
            }
            break;
        case 'reviews':
            fetchPath = `${API_URL}/users/${profileUserId}/all-reviews`;
            loadTabContent(fetchPath, 'list');
            break;
    }
}

function updateTabIndicator(activeTab) {
    const indicator = document.getElementById('tabIndicator');
    if (!indicator || !activeTab) return;

    // Use offsetLeft and offsetWidth for consistent relative positioning
    // Wait for layout to be stable
    requestAnimationFrame(() => {
        indicator.style.width = `${activeTab.offsetWidth}px`;
        indicator.style.left = `${activeTab.offsetLeft}px`;
    });
}

async function loadTabContent(url, viewType, emptyIcon = '📸', emptyText = 'No posts yet') {
    const grid = document.getElementById('postsGrid');
    if (!grid) return;

    try {
        const res = await fetch(url, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();

        if (result.success) {
            if (!result.data || !result.data.length) {
                grid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align:center; padding:60px 20px; color:rgba(255,255,255,0.4)">
                        <div style="font-size:40px; margin-bottom:12px">${emptyIcon}</div>
                        <p>${emptyText}</p>
                    </div>`;
                return;
            }

            if (viewType === 'grid') {
                grid.innerHTML = result.data.map(post => `
                    <div class="post-grid-item" onclick="window.location.href='post.html?id=${post.id}'">
                        <img class="post-grid-img" src="${getSafePostImageUrl(post.image)}" alt="post">
                        <div class="post-grid-overlay">
                            <div class="post-grid-stat">⭐ ${post.rating || 5}.0</div>
                        </div>
                    </div>
                `).join('');
            } else {
                grid.innerHTML = result.data.map(review => {
                    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const date = new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                    // Use restaurant image as fallback if dish image is null or if specifically requested
                    // The user said: "provide rest at the position of review-resto-img"
                    const displayImg = getRestaurantImageUrl(review.restaurant_image, review.restaurant_category);

                    // Handle link: posts go to post.html, reviews might just show info for now or go to restaurant.html
                    const clickAction = review.type === 'post'
                        ? `window.location.href='post.html?id=${review.id}'`
                        : `window.location.href='restaurant.html?name=${encodeURIComponent(review.restaurant_name)}'`;

                    return `
                        <div class="review-item" onclick="${clickAction}">
                            <img class="review-resto-img" src="${displayImg}" alt="${review.restaurant_name}">
                            <div class="review-body">
                                <div class="review-resto-name">${review.restaurant_name}</div>
                                <div class="review-dish">${review.dish_name || 'Experience'}</div>
                                <div class="review-rating" style="color:#ffb100; margin-bottom:8px; font-size:14px;">${stars}</div>
                                <p class="review-text">${review.text}</p>
                                <div class="review-date">${date}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (err) {
        console.error('Error loading tab content:', err);
    }
}

// --- ACTIONS ---

async function handleFollowDirect(btn, userId) {
    if (userId == CURRENT_USER.id) return;
    try {
        const res = await fetch(`${API_URL}/social/follow/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            // Immediate UI feedback
            const isNowFollowing = btn.textContent.trim() === 'Follow';
            btn.textContent = isNowFollowing ? 'Following' : 'Follow';
            btn.classList.toggle('following', isNowFollowing);
            btn.style.background = isNowFollowing ? '#222' : '#ff3b30';
            btn.style.borderColor = isNowFollowing ? 'rgba(255,255,255,0.1)' : 'transparent';

            showToast(result.message, isNowFollowing ? '👥' : '👤');

            // Sync with server data (refreshes stats)
            setTimeout(loadProfileData, 500);
        }
    } catch (err) { showToast('Action failed', '❌'); }
}

async function saveProfile() {
    const name = document.getElementById('editName').value.trim();
    const username = document.getElementById('editHandle').value.trim().replace(/^@/, '');
    const bio = document.getElementById('editBio').value.trim();
    const fileInput = document.getElementById('profilePicInput');

    const formData = new FormData();
    formData.append('full_name', name);
    formData.append('username', username);
    formData.append('bio', bio);
    if (fileInput.files[0]) {
        formData.append('profile_pic', fileInput.files[0]);
    }

    try {
        const res = await fetch(`${API_URL}/users/profile`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });

        const result = await res.json();
        if (result.success) {
            showToast('Profile updated!', '✅');
            if (result.data) {
                const session = JSON.parse(localStorage.getItem('foodie_session') || '{}');
                localStorage.setItem('foodie_session', JSON.stringify({ ...session, ...result.data }));
            }
            setTimeout(() => window.location.reload(), 1500);
        } else {
            showToast(result.message || 'Update failed', '❌');
        }
    } catch (err) { showToast('Update failed', '❌'); }
}

function shareProfile() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showToast('Profile link copied!', '🔗');
    });
}

function previewProfilePic(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => document.getElementById('editAvatarPreview').src = e.target.result;
        reader.readAsDataURL(input.files[0]);
    }
}

// --- MODALS (Followers/Following) ---

async function loadFollowers() {
    openModal('followersModal');
    const list = document.getElementById('followersList');
    if (!list) return;
    list.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.4)">Loading...</div>';

    try {
        const res = await fetch(`${API_URL}/social/followers/${profileUserId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) renderUserList(result.data, 'followersList');
    } catch (err) { console.error(err); }
}

async function loadFollowing() {
    openModal('followingModal');
    const list = document.getElementById('followingList');
    if (!list) return;
    list.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.4)">Loading...</div>';

    try {
        const res = await fetch(`${API_URL}/social/following/${profileUserId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) renderUserList(result.data, 'followingList');
    } catch (err) { console.error(err); }
}

function renderUserList(users, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!users || !users.length) {
        container.innerHTML = `<div style="padding:40px; text-align:center; color:rgba(255,255,255,0.4)">No users found</div>`;
        return;
    }
    container.innerHTML = users.map(u => `
        <div class="user-list-item" style="display:flex; align-items:center; gap:12px; padding:12px; cursor:pointer;" onclick="window.location.href='profile.html?userId=${u.id}'">
            <img src="${getAvatarUrl(u.profile_pic)}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
            <div>
                <div style="font-weight:600; font-size:14px; color:#fff;">${u.username}</div>
                <div style="font-size:12px; color:rgba(255,255,255,0.4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; width:180px;">${u.bio || ''}</div>
            </div>
        </div>
    `).join('');
}

// --- LEVEL & ACHIEVEMENTS ---

async function loadLevelData(userId) {
    try {
        const res = await fetch(`${API_URL}/users/${userId}/level`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            renderLevelCard(result.data);
            renderAchievements(result.data);
            if (isOwnProfile) checkLevelUp(result.data.current_level, result.data.level_title);
        }
    } catch (err) { console.error('Level load error:', err); }
}

function renderLevelCard(data) {
    const lvlEl = document.getElementById('levelNumber');
    if (lvlEl) lvlEl.textContent = data.current_level;

    document.getElementById('levelTitle').textContent = data.level_title;
    document.getElementById('levelWatermark').textContent = data.current_level.toString().padStart(2, '0');

    const xpInLevel = data.total_xp - data.xp_current_level;
    const xpRange = data.xp_next_level - data.xp_current_level;
    const percent = xpRange > 0 ? Math.min((xpInLevel / xpRange) * 100, 100) : 100;
    const xpNeeded = data.xp_next_level - data.total_xp;

    const neededEl = document.getElementById('levelXpNeeded');
    if (neededEl) {
        neededEl.textContent = data.next_level_title !== 'Max Level'
            ? `+${xpNeeded} XP to reach ${data.next_level_title}`
            : 'Ultimate level reached! 🏆';
    }

    setTimeout(() => {
        const fill = document.getElementById('levelProgressFill');
        if (fill) fill.style.width = `${percent}%`;
    }, 200);

    document.getElementById('levelXpProgress').textContent = `${data.total_xp} / ${data.xp_next_level} XP`;
    document.getElementById('levelXpPercent').textContent = `${Math.floor(percent)}%`;
    document.getElementById('levelNextTitle').textContent = data.next_level_title !== 'Max Level' ? data.next_level_title : 'MAX';
}

function renderAchievements(data) {
    const badges = data.all_badges || [];
    const earnedBadges = badges.filter(b => b.earned);

    const headerBadges = document.getElementById('headerBadges');
    if (headerBadges) {
        headerBadges.innerHTML = earnedBadges.map(b => `
            <span class="img-badge">
                <span class="badge-icon">${b.icon}</span> 
                ${b.name}
            </span>
        `).join('');
    }

    const categoryMap = {
        influence: { icon: '🏆', title: 'Influence' },
        reviewer: { icon: '🍽', title: 'Reviewer' },
        behavior: { icon: '🎯', title: 'Behavior' },
        special: { icon: '🛡', title: 'Special' }
    };

    const earnedGrid = document.getElementById('achievementsGrid');
    const sections = groupByCategory(badges);

    let gridHTML = '';
    for (const [cat, catBadges] of Object.entries(sections)) {
        const catInfo = categoryMap[cat] || { icon: '🏅', title: cat };
        const catEarned = catBadges.filter(b => b.earned);

        if (catEarned.length > 0) {
            gridHTML += `
                <div class="badge-category">
                    <div class="badge-category-header">
                        <span class="badge-category-icon">${catInfo.icon}</span>
                        <span class="badge-category-title">${catInfo.title}</span>
                    </div>
                    <div class="badge-grid">
                        ${catEarned.map(b => renderBadge(b, true)).join('')}
                    </div>
                </div>`;
        }
    }

    earnedGrid.innerHTML = gridHTML || '<p style="color:rgba(255,255,255,0.2);text-align:center;padding:20px;">No achievements earned yet.</p>';

    // Locked Container
    const lockedContainer = document.getElementById('lockedBadgesContainer');
    let lockedHTML = '';
    for (const [cat, catBadges] of Object.entries(sections)) {
        const catLocked = catBadges.filter(b => !b.earned);
        if (catLocked.length > 0) {
            const catInfo = categoryMap[cat] || { icon: '🏅', title: cat };
            lockedHTML += `
                <div class="badge-category">
                    <div class="badge-category-header">
                        <span class="badge-category-title">${catInfo.title} (Locked)</span>
                    </div>
                    <div class="badge-grid">
                        ${catLocked.map(b => renderBadge(b, false)).join('')}
                    </div>
                </div>`;
        }
    }
    lockedContainer.innerHTML = lockedHTML;
}

function groupByCategory(badges) {
    return badges.reduce((acc, b) => {
        if (!acc[b.category]) acc[b.category] = [];
        acc[b.category].push(b);
        return acc;
    }, {});
}

function renderBadge(badge, earned) {
    return `
        <div class="img-badge ${earned ? 'earned' : 'locked'}">
            <div class="badge-tooltip">${badge.condition}</div>
            <span class="badge-icon">${badge.icon}</span>
            <span class="badge-name">${badge.name}</span>
        </div>
    `;
}

function toggleLockedBadges() {
    const container = document.getElementById('lockedBadgesContainer');
    const isExpanded = container.classList.toggle('expanded');
    document.getElementById('lockedBtnArrow').classList.toggle('rotated');
    document.getElementById('lockedBtnText').textContent = isExpanded ? 'Hide Locked Achievements' : 'Show Locked Achievements';
}

function checkLevelUp(currentLevel, title) {
    const storedLevel = localStorage.getItem('foodie_level');
    if (storedLevel && parseInt(storedLevel) < currentLevel) {
        const popup = document.getElementById('levelUpPopup');
        document.getElementById('levelUpText').textContent = `Level Up! You are now Level ${currentLevel} – ${title}`;
        popup.classList.add('show');
        setTimeout(() => popup.classList.remove('show'), 3500);
    }
    localStorage.setItem('foodie_level', currentLevel);
}

// --- UTILS ---

function initEventListeners() {
    const fers = document.getElementById('statFollowers');
    const fing = document.getElementById('statFollowing');
    if (fers) fers.parentElement.onclick = loadFollowers;
    if (fing) fing.parentElement.onclick = loadFollowing;
}

function getSafePostImageUrl(pic) {
    const baseUrl = API_URL.replace(/\/api$/, '');
    if (!pic || pic === 'null' || pic === 'undefined') return `${baseUrl}/uploads/profile_pic-1772205025364-612489142.png`;

    // Convert pic to string to safely use startsWith
    const sPic = pic.toString();
    if (sPic.startsWith('http')) return sPic;
    return `${baseUrl}/uploads/${sPic}`;
}

function initSettings() {
    const themeToggle = document.getElementById('themeToggle');
    const privateAccountToggle = document.getElementById('privateAccountToggle');
    const showLocationToggle = document.getElementById('showLocationToggle');
    const defaultCityInput = document.getElementById('defaultCityInput');

    // Load from localStorage
    const savedTheme = localStorage.getItem('foodie_theme') || 'dark';
    if (themeToggle) themeToggle.checked = (savedTheme === 'dark');
    applyTheme(savedTheme);

    const savedSettings = JSON.parse(localStorage.getItem('foodie_settings') || '{}');
    if (privateAccountToggle) privateAccountToggle.checked = !!savedSettings.privateAccount;
    if (showLocationToggle) showLocationToggle.checked = (savedSettings.showLocation !== false);
    if (defaultCityInput) defaultCityInput.value = savedSettings.defaultCity || '';
}

function toggleTheme(checkbox) {
    const theme = checkbox.checked ? 'dark' : 'light';
    localStorage.setItem('foodie_theme', theme);
    applyTheme(theme);
    showToast(`${theme.charAt(0).toUpperCase() + theme.slice(1)} Mode activated`, '🌓');
}

function applyTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

function updateSetting(key, value) {
    const settings = JSON.parse(localStorage.getItem('foodie_settings') || '{}');
    settings[key] = value;
    localStorage.setItem('foodie_settings', JSON.stringify(settings));
    showToast('Setting saved', '⚙️');
}

async function handlePasswordChange() {
    const currentPass = document.getElementById('currentPassword').value;
    const newPass = document.getElementById('newPassword').value;
    const confirmPass = document.getElementById('confirmNewPassword').value;

    if (!currentPass || !newPass || !confirmPass) {
        return showToast('Please fill all fields', '⚠️');
    }
    if (newPass !== confirmPass) {
        return showToast('Passwords do not match', '❌');
    }

    try {
        const res = await fetch(`${API_URL}/users/change-password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });

        const result = await res.json();
        if (result.success) {
            showToast('Password updated!', '✅');
            closeModal('changePasswordModal');
        } else {
            showToast(result.message || 'Update failed', '❌');
        }
    } catch (err) {
        showToast('Update failed', '❌');
    }
}

async function confirmDeleteAccount() {
    if (confirm('Are you absolutely sure? This will permanently delete your account and all data.')) {
        try {
            const res = await fetch(`${API_URL}/users/account`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });

            const result = await res.json();
            if (result.success) {
                showToast('Account deleted. Goodbye!', '🗑️');
                localStorage.clear();
                setTimeout(() => window.location.href = 'index.html', 2000);
            } else {
                showToast('Action failed', '❌');
            }
        } catch (err) {
            showToast('Action failed', '❌');
        }
    }
}
