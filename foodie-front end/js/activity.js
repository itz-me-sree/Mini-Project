/* ── Activity JS ── */

let ALL_ACTIVITIES = [];
let CURRENT_FILTER = 'all';

document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('activity');
    fetchActivities();
});

async function fetchActivities() {
    const list = document.getElementById('activityList');
    list.innerHTML = `
        <div style="text-align:center;padding:60px 20px;">
            <div class="activity-spinner"></div>
            <p style="color:var(--text-muted)">Loading your activity...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/social/activities`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        const result = await response.json();

        if (result.success) {
            ALL_ACTIVITIES = result.data;
            renderActivity(CURRENT_FILTER);
        } else {
            showToast(result.message || 'Failed to load activity', '❌');
            list.innerHTML = `<p style="text-align:center;padding:40px;color:var(--error)">${result.message || 'Error loading activity'}</p>`;
        }
    } catch (err) {
        console.error('Fetch error:', err);
        showToast('Server connection failed', '📡');
        list.innerHTML = `<p style="text-align:center;padding:40px;color:var(--error)">Unable to connect to server</p>`;
    }
}

function renderActivity(filter = 'all') {
    CURRENT_FILTER = filter;
    const list = document.getElementById('activityList');
    list.innerHTML = '';

    const filtered = ALL_ACTIVITIES.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'likes') return n.type === 'like';
        if (filter === 'comments') return n.type === 'comment';
        if (filter === 'mentions') return n.type === 'mention';
        if (filter === 'follows') return n.type === 'follow';
        return true;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-muted)">
            <div style="font-size:40px;margin-bottom:12px">🔔</div>
            <p>No activity yet in this category</p>
        </div>`;
        return;
    }

    filtered.forEach(n => {
        const item = document.createElement('div');
        item.className = `activity-item ${!n.is_read ? 'unread' : ''}`;

        let iconClass = `icon-${n.type}`;
        let iconHtml = n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'follow' ? '👤' : '🏷️';

        const safeActorName = (n.actor_name || 'Someone').replace(/</g, "&lt;").replace(/>/g, "&gt;");

        let contentHtml = '';
        if (n.type === 'like') {
            contentHtml = `<b>${safeActorName}</b> liked your post`;
        } else if (n.type === 'comment') {
            const safeText = (n.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            contentHtml = `<b>${safeActorName}</b> commented on your post: "${safeText}"`;
        } else if (n.type === 'follow') {
            contentHtml = `<b>${safeActorName}</b> started following you`;
        } else if (n.type === 'mention') {
            const safeText = (n.text || '').replace(/</g, "&lt;").replace(/>/g, "&gt;");
            contentHtml = `<b>${safeActorName}</b> mentioned you: "${safeText}"`;
        }

        const avatarUrl = getAvatarUrl(n.actor_avatar);

        const postImageUrl = n.post_image
            ? (n.post_image.startsWith('http') ? n.post_image : `${API_URL.replace('/api', '')}/uploads/${n.post_image}`)
            : null;

        const inlineSafeActorName = (n.actor_name || '').replace(/'/g, "\\'");

        item.innerHTML = `
            <img src="${avatarUrl}" class="avatar avatar-md" alt="${safeActorName}">
            <div class="activity-content">
                <div class="activity-text">${contentHtml}</div>
                <div class="activity-time">${formatTimeAgo(n.created_at)}</div>
                ${n.type === 'follow' ? `
                    <div class="activity-action-btns">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); handleFollowBack(${n.actor_id}, '${inlineSafeActorName}')">Follow Back</button>
                    </div>
                ` : ''}
            </div>
            <div class="activity-icon-wrap ${iconClass}">${iconHtml}</div>
            ${postImageUrl ? `<img src="${postImageUrl}" class="activity-preview" alt="Post preview">` : ''}
        `;

        item.onclick = () => {
            if (!n.is_read) {
                n.is_read = true;
                item.classList.remove('unread');
            }
            // Navigate to relevant page
            if (n.type === 'follow') {
                window.location.href = `profile.html?id=${n.actor_id}`;
            } else if (n.post_id) {
                window.location.href = `post.html?id=${n.post_id}`;
            }
        };

        list.appendChild(item);
    });
}

function filterActivity(filter) {
    document.querySelectorAll('.activity-tab').forEach(btn => {
        const text = btn.textContent.toLowerCase();
        btn.classList.toggle('active', text.includes(filter) || (filter === 'all' && text === 'all'));
    });
    renderActivity(filter);
}

async function markAllAsRead() {
    try {
        const response = await fetch(`${API_URL}/social/activities/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        const result = await response.json();
        if (result.success) {
            ALL_ACTIVITIES.forEach(n => n.is_read = true);
            renderActivity(CURRENT_FILTER);
            showToast('All notifications marked as read', '🧹');

            // Update sidebar unread badge
            const badge = document.querySelector('.nav-badge');
            if (badge) badge.remove();
        }
    } catch (err) {
        showToast('Failed to mark read', '❌');
    }
}

async function handleFollowBack(userId, name) {
    try {
        const response = await fetch(`${API_URL}/social/follow/${userId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        const result = await response.json();
        if (result.success) {
            showToast(`Now following ${name}`, '👥');
        }
    } catch (err) {
        showToast('Follow failed', '❌');
    }
}

function formatTimeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay}d ago`;
    if (diffHour > 0) return `${diffHour}h ago`;
    if (diffMin > 0) return `${diffMin}m ago`;
    return 'Just now';
}
