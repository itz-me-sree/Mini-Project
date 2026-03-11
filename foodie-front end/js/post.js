/* ── Post Detail Page Logic ── */
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('home');
    initPostDetail();

    const submitBtn = document.getElementById('postCommentSubmit');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitNewComment);
    }

    const filterSelect = document.getElementById('commentFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const postId = urlParams.get('id');
            if (postId) fetchComments(postId);
        });
    }
});

let activeReplyTarget = null; // local state for this page

async function initPostDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    if (!postId) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json();

        if (result.success && result.data) {
            renderPostContent(result.data);
            fetchComments(postId);

            // Update comment input avatar
            updateUserAvatar();
        } else {
            renderNotFound();
        }
    } catch (err) {
        console.error('Post Error:', err);
        showToast('Failed to load post', '❌');
    }
}

function renderPostContent(post) {
    document.getElementById('postImage').src = post.image && post.image.startsWith('http') ? post.image : `${API_URL.replace('/api', '')}/uploads/${post.image}`;
    const authorAvatar = document.getElementById('authorAvatar');
    authorAvatar.src = getAvatarUrl(post.profile_pic);
    authorAvatar.onclick = () => window.location.href = `profile.html?id=${post.user_id}`;
    authorAvatar.style.cursor = 'pointer';

    document.getElementById('authorName').textContent = post.username;
    document.getElementById('authorName').onclick = () => window.location.href = `profile.html?id=${post.user_id}`;
    document.getElementById('authorName').style.cursor = 'pointer';

    document.getElementById('postLocation').textContent = post.restaurant_name;
    document.getElementById('postLocation').onclick = () => window.location.href = `restaurant.html?name=${encodeURIComponent(post.restaurant_name)}`;
    document.getElementById('postLocation').style.cursor = 'pointer';

    document.getElementById('authorHandle').textContent = `@${post.username}`;
    document.getElementById('authorHandle').onclick = () => window.location.href = `profile.html?id=${post.user_id}`;
    document.getElementById('authorHandle').style.cursor = 'pointer';
    document.getElementById('postCaptionText').textContent = post.caption;
    document.getElementById('postTimestamp').textContent = new Date(post.created_at).toLocaleDateString();
    document.getElementById('likeCountDisplay').textContent = formatNumber(post.likes_count || 0);

    const moreBtn = document.querySelector('.post-more-btn');
    if (moreBtn) {
        moreBtn.onclick = () => reportContent('post', post.id);
    }

    // 3-dot menu logic for the author
    const optionsContainer = document.getElementById('postOptionsContainer');
    const optionsBtn = document.getElementById('postOptionsBtn');
    const optionsMenu = document.getElementById('postOptionsMenu');
    const editOption = document.getElementById('editPostOption');
    const deleteOption = document.getElementById('deletePostOption');

    if (optionsContainer && CURRENT_USER && CURRENT_USER.id === post.user_id) {
        optionsContainer.style.display = 'block';

        // Toggle menu
        optionsBtn.onclick = (e) => {
            e.stopPropagation();
            const isShowing = optionsMenu.style.display === 'block';
            optionsMenu.style.display = isShowing ? 'none' : 'block';
        };

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            if (optionsMenu.style.display === 'block') {
                optionsMenu.style.display = 'none';
            }
        });

        // Edit Action
        if (editOption) {
            editOption.onclick = () => {
                openEditModal(post.id, post.caption);
            };
        }

        // Delete Action
        if (deleteOption) {
            deleteOption.onclick = () => {
                handleDeletePost(post.id);
            };
        }
    }

    const actionsRow = document.getElementById('postActionsRow');
    actionsRow.innerHTML = `
        <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="handleLike(${post.id}, this)">
          <span class="action-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="${post.liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </span> 
          <span>Like</span>
        </button>
        <button class="action-btn" onclick="document.getElementById('postCommentInput').focus()">
          <span class="action-icon">💬</span> Comment
        </button>
        <button class="action-btn" onclick="sharePost()">
          <span class="action-icon">🔗</span> Share
        </button>
        <button class="action-btn report-btn" onclick="reportContent('post', ${post.id})">
          <span class="action-icon">🚩</span> Report
        </button>
    `;
}

// Global modal state
let currentReportType = null;
let currentReportId = null;

async function fetchComments(postId) {
    const commentsList = document.getElementById('commentsList');
    const filter = document.getElementById('commentFilter')?.value || 'smart';

    commentsList.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">Loading comments...</div>';

    try {
        const res = await fetch(`${API_URL}/social/comment/${postId}?filter=${filter}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            if (result.data.length === 0) {
                commentsList.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">No comments yet.</div>';
            } else {
                commentsList.innerHTML = result.data.map(c => generateCommentMarkup(postId, c)).join('');
            }
        }
    } catch (err) { console.error('Comments error:', err); }
}

function timeAgoShort(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd';
    return Math.floor(diff / 604800) + 'w';
}

function generateCommentMarkup(postId, c, isReply = false) {
    const margin = isReply ? "margin-left: 45px; margin-top: 15px;" : "margin-bottom: 20px;";
    const replyBtn = `<button style="background:none; border:none; padding:0; font-size:12px; color:var(--text-muted); font-weight:600; cursor:pointer;" onclick="initiateReply(${c.id}, '${c.username.replace(/'/g, "\\'")}')">Reply</button>`;
    const reportBtn = `<button style="background:none; border:none; padding:0; font-size:12px; color:var(--text-muted); font-weight:600; cursor:pointer; margin-left:12px;" onclick="reportContent('comment', ${c.id})">Report</button>`;
    const viewRepliesBtn = (c.replies_count > 0 && !isReply) ? `
    <div id="view-replies-btn-${c.id}" style="margin-top:10px; font-size:12px; cursor:pointer; color:var(--text-muted); font-weight:600; display:flex; align-items:center; gap:10px;" onclick="viewReplies(${c.id}, ${postId})">
      <div style="height:1px; width:25px; background:var(--text-muted);"></div>
      <span class="btn-text">View replies (${c.replies_count})</span>
    </div>` : '';

    let formattedText = c.comment;
    if (formattedText.includes('@')) {
        formattedText = formattedText.replace(/(@\w+)/g, '<span style="color:#a8c7fa;">$1</span>');
    }

    return `
      <div style="display:flex; align-items:flex-start; justify-content:space-between; ${margin}" id="comment-${c.id}">
        <div style="display:flex; gap:12px; flex:1;">
            <img class="avatar" src="${getAvatarUrl(c.profile_pic)}" 
                 onerror="this.src='https://i.pravatar.cc/150?img=68'"
                 onclick="window.location.href='profile.html?id=${c.user_id}'"
                 style="width:36px; height:36px; border-radius:50%; object-fit:cover; flex-shrink:0; cursor:pointer;" />
            <div style="flex:1;">
               <div style="display:flex; align-items:center; gap:6px;">
                 <span style="font-size:13px; font-weight:600; color:var(--text-primary); cursor:pointer;" onclick="window.location.href='profile.html?id=${c.user_id}'">${c.username}</span>
                 <span style="font-size:12px; color:var(--text-muted);">${timeAgoShort(c.created_at)}</span>
               </div>
               <div style="font-size:14px; margin-top:2px; margin-bottom:6px; line-height:1.4; word-break:break-word; color:var(--text-primary);">
                 ${formattedText}
               </div>
               <div style="display:flex; align-items:center;">
                 ${replyBtn}
                 ${reportBtn}
               </div>
               ${viewRepliesBtn}
               <div id="replies-${c.id}" style="display:none; margin-top:15px;"></div>
            </div>
        </div>
        
        <div style="display:flex; flex-direction:column; align-items:center; margin-left:15px; min-width:30px; margin-top:4px;">
            <button class="btn-icon ${c.user_liked ? 'liked' : ''}" style="padding:0; height:auto; margin-bottom:4px;" onclick="toggleCommentLike(${c.id}, this)">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${c.user_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart" style="${c.user_liked ? 'color:#ed4956;' : 'color:var(--text-muted);'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <span class="like-count" style="font-size:11px; color:var(--text-muted); font-weight:500;">${c.likes_count > 0 ? c.likes_count : ''}</span>
        </div>
      </div>
    `;
}

function initiateReply(commentId, username) {
    activeReplyTarget = commentId;
    const input = document.getElementById('postCommentInput');
    input.placeholder = `Replying to @${username}...`;
    input.focus();
}

async function viewReplies(commentId, postId) {
    const container = document.getElementById(`replies-${commentId}`);
    const btn = document.getElementById(`view-replies-btn-${commentId}`);
    const btnText = btn?.querySelector('.btn-text');

    if (container.style.display === 'none') {
        // Store original text to restore count later
        if (!btn.dataset.originalText && btnText) {
            btn.dataset.originalText = btnText.textContent;
        }
        container.innerHTML = '<div style="font-size:12px; padding:10px; color:var(--text-muted);">Loading replies...</div>';
        container.style.display = 'block';
        if (btnText) btnText.textContent = 'Hide replies';

        try {
            const res = await fetch(`${API_URL}/social/comment/replies/${commentId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const result = await res.json();
            if (result.success) {
                container.innerHTML = result.data.map(r => generateCommentMarkup(postId, r, true)).join('');
            }
        } catch (e) {
            container.innerHTML = '<div style="font-size:12px; color:red;">Failed to load.</div>';
        }
    } else {
        container.style.display = 'none';
        if (btnText && btn.dataset.originalText) {
            btnText.textContent = btn.dataset.originalText;
        } else if (btnText) {
            btnText.textContent = 'View replies';
        }
    }
}

async function toggleCommentLike(commentId, btn) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to like!', '🔒');
    try {
        const res = await fetch(`${API_URL}/social/comment/like/${commentId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            btn.classList.toggle('liked', result.liked);
            const svg = btn.querySelector('svg');
            const parent = btn.parentElement;
            const countSpan = parent.querySelector('.like-count');

            svg.style.color = result.liked ? '#ed4956' : 'var(--text-muted)';
            svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');

            let count = parseInt(countSpan.textContent || '0');
            count = result.liked ? count + 1 : count - 1;
            countSpan.textContent = count > 0 ? count : '';
        }
    } catch (e) { }
}

async function reportContent(type, id) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to report!', '🔒');

    currentReportType = type;
    currentReportId = id;

    document.getElementById('reportModalTitle').textContent = `Report ${type === 'post' ? 'Post' : 'Comment'}`;
    document.getElementById('reportModalDesc').textContent = `Are you sure you want to report this ${type}? Please provide a reason below.`;
    document.getElementById('reportReasonInput').value = '';

    document.getElementById('reportModal').classList.add('open');

    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.onclick = handleReportSubmit;
}

function closeReportModal() {
    document.getElementById('reportModal').classList.remove('open');
    currentReportType = null;
    currentReportId = null;
}

async function handleReportSubmit() {
    const reason = document.getElementById('reportReasonInput').value.trim();
    if (!reason) {
        showToast('Please provide a reason', '⚠️');
        return;
    }

    const submitBtn = document.getElementById('submitReportBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
        const res = await fetch(`${API_URL}/social/report`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reported_type: currentReportType, reported_id: currentReportId, reason })
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, '✅');
            closeReportModal();
        } else {
            showToast(result.message, '❌');
        }
    } catch (e) {
        showToast('Reporting failed', '❌');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Report';
    }
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
            const countEl = document.getElementById('likeCountDisplay');
            if (countEl) {
                let count = parseInt(countEl.textContent.replace(/[^0-9]/g, '') || '0');
                countEl.textContent = formatNumber(result.liked ? count + 1 : count - 1);
            }
            showToast(result.message, '❤️');
        }
    } catch (err) { showToast('Failed to like', '❌'); }
}

async function submitNewComment() {
    if (CURRENT_USER.role === 'guest') return showToast('Login to comment!', '🔒');
    const input = document.getElementById('postCommentInput');
    const comment = input.value.trim();
    if (!comment) return;

    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('id');

    const parentId = activeReplyTarget;

    try {
        const res = await fetch(`${API_URL}/social/comment/${postId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({ comment, parent_id: parentId })
        });
        const result = await res.json();
        if (result.success) {
            showToast(parentId ? 'Reply posted!' : 'Comment posted!', '💬');
            input.value = '';
            input.placeholder = 'Add a comment...';
            activeReplyTarget = null;
            fetchComments(postId);
        }
    } catch (err) { showToast('Failed to comment', '❌'); }
}

function updateUserAvatar() {
    const avatarEl = document.getElementById('currentUserAvatar');
    if (avatarEl) {
        if (isAuthenticated()) {
            avatarEl.src = getAvatarUrl(CURRENT_USER.profile_pic);
            avatarEl.style.display = 'block';
            avatarEl.onerror = () => { avatarEl.src = 'https://i.pravatar.cc/150?img=68'; };
        } else {
            avatarEl.style.display = 'none';
        }
    }
}

function renderNotFound() {
    document.querySelector('.post-page-container').innerHTML = `
        <div style="text-align:center; padding:100px;">
            <h1>Post not found! 🕵️‍♂️</h1>
            <a href="index.html" class="btn btn-primary">Back to Feed</a>
        </div>
    `;
}

function sharePost() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied!', '🔗');
    });
}

// --- Edit and Delete Logic ---

let currentEditingPostId = null;

function openEditModal(postId, currentCaption) {
    currentEditingPostId = postId;
    const modal = document.getElementById('editPostModal');
    const input = document.getElementById('editCaptionInput');

    input.value = currentCaption || '';
    modal.classList.add('open');

    const saveBtn = document.getElementById('saveEditBtn');
    saveBtn.onclick = handleSaveEdit;
}

function closeEditModal() {
    document.getElementById('editPostModal').classList.remove('open');
    currentEditingPostId = null;
}

async function handleSaveEdit() {
    if (!currentEditingPostId) return;

    const input = document.getElementById('editCaptionInput');
    const newCaption = input.value.trim();
    const saveBtn = document.getElementById('saveEditBtn');

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        const res = await fetch(`${API_URL}/posts/${currentEditingPostId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({ caption: newCaption })
        });

        const result = await res.json();
        if (result.success) {
            showToast('Review updated', '✏️');
            document.getElementById('postCaptionText').textContent = newCaption;
            closeEditModal();
        } else {
            showToast(result.message || 'Update failed', '❌');
        }
    } catch (err) {
        console.error(err);
        showToast('Update failed', '❌');
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
    }
}

async function handleDeletePost(postId) {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
        return;
    }

    try {
        const res = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });

        const result = await res.json();
        if (result.success) {
            showToast('Post deleted', '🗑️');
            setTimeout(() => {
                window.location.href = `profile.html?id=${CURRENT_USER.id}`; // Redirect to user's profile
            }, 1000);
        } else {
            showToast(result.message || 'Deletion failed', '❌');
        }
    } catch (err) {
        console.error(err);
        showToast('Deletion failed', '❌');
    }
}
