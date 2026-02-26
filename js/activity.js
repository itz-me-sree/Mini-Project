/* ── Activity JS ── */
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('activity');
    renderActivity('all');
});

const MOCK_NOTIFICATIONS = [
    {
        id: 1,
        type: 'like',
        user: MOCK_USERS[1],
        postTitle: 'Lamb Biryani',
        postImage: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&auto=format&fit=crop',
        time: '2m ago',
        unread: true
    },
    {
        id: 2,
        type: 'comment',
        user: MOCK_USERS[3],
        text: 'This looks so good! Where is it?',
        postTitle: 'Margherita Pizza',
        postImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=200&auto=format&fit=crop',
        time: '15m ago',
        unread: true
    },
    {
        id: 3,
        type: 'follow',
        user: MOCK_USERS[0],
        time: '1h ago',
        unread: false
    },
    {
        id: 4,
        type: 'mention',
        user: MOCK_USERS[4],
        text: 'You should try the galbi at Seoul Kitchen next!',
        postTitle: 'Galbi BBQ',
        postImage: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=200&auto=format&fit=crop',
        time: '3h ago',
        unread: false
    },
    {
        id: 5,
        type: 'like',
        user: MOCK_USERS[2],
        postTitle: 'Street Tacos',
        postImage: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=200&auto=format&fit=crop',
        time: '5h ago',
        unread: false
    }
];

function renderActivity(filter = 'all') {
    const list = document.getElementById('activityList');
    list.innerHTML = '';

    const filtered = MOCK_NOTIFICATIONS.filter(n => {
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
        item.className = `activity-item ${n.unread ? 'unread' : ''}`;

        let iconClass = `icon-${n.type}`;
        let iconHtml = n.type === 'like' ? '❤️' : n.type === 'comment' ? '💬' : n.type === 'follow' ? '👤' : '🏷️';

        let contentHtml = '';
        if (n.type === 'like') {
            contentHtml = `<b>${n.user.name}</b> liked your post <b>"${n.postTitle}"</b>`;
        } else if (n.type === 'comment') {
            contentHtml = `<b>${n.user.name}</b> commented on your post: "${n.text}"`;
        } else if (n.type === 'follow') {
            contentHtml = `<b>${n.user.name}</b> started following you`;
        } else if (n.type === 'mention') {
            contentHtml = `<b>${n.user.name}</b> mentioned you: "${n.text}"`;
        }

        item.innerHTML = `
            <img src="${n.user.avatar}" class="avatar avatar-md" alt="${n.user.name}">
            <div class="activity-content">
                <div class="activity-text">${contentHtml}</div>
                <div class="activity-time">${n.time}</div>
                ${n.type === 'follow' ? `
                    <div class="activity-action-btns">
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); showToast('Following ${n.user.name}','👥')">Follow Back</button>
                    </div>
                ` : ''}
            </div>
            <div class="activity-icon-wrap ${iconClass}">${iconHtml}</div>
            ${n.postImage ? `<img src="${n.postImage}" class="activity-preview" alt="Post preview">` : ''}
        `;

        item.onclick = () => {
            n.unread = false;
            item.classList.remove('unread');
            showToast('Activity marked as read', '👀');
        };

        list.appendChild(item);
    });
}

function filterActivity(filter) {
    document.querySelectorAll('.activity-tab').forEach(btn => {
        btn.classList.toggle('active', btn.textContent.toLowerCase().includes(filter) || (filter === 'all' && btn.textContent === 'All'));
    });
    renderActivity(filter);
}

function markAllAsRead() {
    MOCK_NOTIFICATIONS.forEach(n => n.unread = false);
    renderActivity('all');
    showToast('All notifications marked as read', '🧹');
}
