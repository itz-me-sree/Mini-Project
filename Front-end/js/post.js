/* ── Post Detail Page Logic ── */

document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('home'); // Reuse sidebar with 'home' context
    initPostDetail();
});

function initPostDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = parseInt(urlParams.get('id'));

    if (!postId) {
        window.location.href = 'index.html';
        return;
    }

    const post = MOCK_POSTS.find(p => p.id === postId);

    if (!post) {
        document.querySelector('.post-page-container').innerHTML = `
            <div style="text-align:center; padding:100px;">
                <h1>Post not found! 🕵️‍♂️</h1>
                <p>The post you're looking for doesn't exist or has been removed.</p>
                <a href="index.html" class="btn btn-primary" style="margin-top:20px; display:inline-block; text-decoration:none;">Back to Feed</a>
            </div>
        `;
        return;
    }

    // Populate Data
    document.getElementById('postImage').src = post.image;
    document.getElementById('authorAvatar').src = post.user.avatar;
    document.getElementById('authorName').textContent = post.user.name;
    document.getElementById('postLocation').textContent = post.restaurant.name;
    document.getElementById('authorHandle').textContent = post.user.handle;
    document.getElementById('postCaptionText').textContent = post.caption;
    document.getElementById('postTimestamp').textContent = post.timestamp;
    document.getElementById('likeCountDisplay').textContent = formatNumber(post.likes);

    // Render Actions
    const actionsRow = document.getElementById('postActionsRow');
    actionsRow.innerHTML = `
        <button class="action-btn like-btn ${post.likes > 900 ? 'liked' : ''}" onclick="toggleLike(this); updateLikeCountDisplay(this)">
          <span class="action-icon">❤️</span>
          <span class="like-count" data-count="${post.likes}" style="display:none"></span>
        </button>
        <button class="action-btn" onclick="document.getElementById('postCommentInput').focus()">
          <span class="action-icon">💬</span>
        </button>
        <button class="action-btn" onclick="showToast('Link copied!','🔗')">
          <span class="action-icon">🔗</span>
        </button>
        <button class="action-btn save-btn ${post.saved ? 'saved' : ''}" onclick="toggleSave(this, ${post.id})" style="margin-left:auto">
          ${post.saved ? '🔖' : '🔲'}
        </button>
    `;

    // Render Comments
    renderCommentsSection(post.id);

    // Comment Submission
    document.getElementById('postCommentSubmit').addEventListener('click', () => {
        submitNewComment();
    });

    document.getElementById('postCommentInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') submitNewComment();
    });
}

function renderCommentsSection(postId) {
    const commentsList = document.getElementById('commentsList');

    // Handle Guest Blur Logic
    if (!isAuthenticated()) {
        const overlay = document.getElementById('guestBlurOverlay');
        if (overlay) overlay.style.display = 'flex';
        commentsList.classList.add('guest-blur');
    }

    // Using simple mock data for now, but structured for nesting
    const comments = [
        {
            id: 101,
            user: MOCK_USERS[1],
            text: `Who watching in 2026? 😂😂😂`,
            timestamp: '1 month ago',
            likes: 78,
            dislikes: 0,
            helpful: 41,
            replies: [
                { id: 201, user: MOCK_USERS[2], text: "ME 😊", timestamp: '1 month ago', likes: 1, dislikes: 0 },
                { id: 202, user: MOCK_USERS[4], text: "Me?", timestamp: '1 month ago', likes: 0, dislikes: 0 }
            ]
        },
        {
            id: 102,
            user: MOCK_USERS[3],
            text: "Adding this restaurant to my bucket list immediately! The plating looks world-class.",
            timestamp: '2 weeks ago',
            likes: 12,
            dislikes: 0,
            helpful: 5,
            replies: []
        }
    ];

    commentsList.innerHTML = comments.map(c => createCommentHTML(c)).join('');
}

function createCommentHTML(comment, isReply = false) {
    return `
        <div class="comment-thread ${isReply ? 'nested-reply' : ''}">
            <div class="comment-item" id="comment-${comment.id}">
                ${!isReply && comment.replies?.length > 0 ? '<div class="comment-tree-line"></div>' : ''}
                <img class="avatar avatar-sm" src="${comment.user.avatar}" alt="" />
                <div class="comment-content">
                    <div class="comment-meta-top">
                        <span class="comment-author">@${comment.user.handle}</span>
                        <span>${comment.timestamp}</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                    <div class="comment-actions">
                        <div class="vote-group">
                            <button class="vote-btn" onclick="voteComment(this, 'like')">👍</button>
                            <span>${comment.likes || ''}</span>
                            <button class="vote-btn" onclick="voteComment(this, 'dislike')">👎</button>
                        </div>
                        ${!isReply ? `<button class="helpful-toggle" onclick="toggleHelpful(this)">Helpful for ${comment.helpful || 0}</button>` : ''}
                        <button class="reply-btn" onclick="replyToComment('${comment.user.handle}')">Reply</button>
                        <button class="comment-more-btn" onclick="toggleMoreMenu(this)">⋮
                            <div class="more-menu-dropdown">
                                <div class="dropdown-item" onclick="reportComment()">🚩 Report</div>
                                <div class="dropdown-item">Not interested</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
            ${comment.replies && comment.replies.length > 0 ? `
                <div class="replies-container">
                    ${comment.replies.map(r => `
                        <div style="position:relative">
                            <div class="reply-line-curve"></div>
                            ${createCommentHTML(r, true)}
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function voteComment(btn, type) {
    if (!isAuthenticated()) {
        showGuestLoginModal('Login to vote on comments and help the community! 🗳️');
        return;
    }
    const group = btn.parentElement;
    const countSpan = group.querySelector('span');
    let count = parseInt(countSpan.textContent) || 0;

    if (type === 'like') {
        const isActive = btn.classList.toggle('active-like');
        countSpan.textContent = isActive ? count + 1 : Math.max(0, count - 1);
        group.querySelector('[onclick*="dislike"]').classList.remove('active-dislike');
    } else {
        btn.classList.toggle('active-dislike');
        group.querySelector('[onclick*="like"]').classList.remove('active-like');
        // Subtract from like if it was active
        if (count > 0 && group.querySelector('[onclick*="like"]').classList.contains('active-like')) {
            countSpan.textContent = count - 1;
        }
    }
}

function toggleHelpful(btn) {
    if (!isAuthenticated()) {
        showGuestLoginModal('Login to mark reviews as helpful! 👍');
        return;
    }
    const isActive = btn.classList.toggle('active');
    const parts = btn.textContent.split(' ');
    let count = parseInt(parts[parts.length - 1]);
    btn.textContent = `Helpful for ${isActive ? count + 1 : Math.max(0, count - 1)}`;
}

function toggleMoreMenu(btn) {
    const menu = btn.querySelector('.more-menu-dropdown');
    document.querySelectorAll('.more-menu-dropdown').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    menu.classList.toggle('show');

    // Close on click outside
    const closeMenu = (e) => {
        if (!btn.contains(e.target)) {
            menu.classList.remove('show');
            document.removeEventListener('click', closeMenu);
        }
    };
    document.addEventListener('click', closeMenu);
}

function updateLikeCountDisplay(btn) {
    setTimeout(() => {
        const countSpan = btn.querySelector('.like-count');
        if (countSpan) {
            document.getElementById('likeCountDisplay').textContent = formatNumber(parseInt(countSpan.dataset.count));
        }
    }, 50);
}

function submitNewComment() {
    const input = document.getElementById('postCommentInput');
    const commentsList = document.getElementById('commentsList');

    if (!input.value.trim()) return;

    const newComment = {
        id: Date.now(),
        user: CURRENT_USER,
        text: input.value,
        timestamp: 'Just now',
        likes: 0,
        dislikes: 0,
        helpful: 0,
        replies: []
    };

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = createCommentHTML(newComment);
    const newItem = tempDiv.firstElementChild;
    newItem.classList.add('fade-in');

    commentsList.appendChild(newItem);
    input.value = '';
    showToast('Comment posted!', '💬');

    newItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ── Comment Interactions ── */

function replyToComment(handle) {
    const input = document.getElementById('postCommentInput');
    input.value = `@${handle} `;
    input.focus();
}

function reportComment() {
    showToast('Report submitted. We\'ll review this shortly.', '🛡️');
}
