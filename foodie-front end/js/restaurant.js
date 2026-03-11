/* ── restaurant.js — Restaurant Detail Page Logic ── */

let RESTAURANT_NAME = '';
let SELECTED_STAR = 0;
let ALL_PHOTOS = [];
let REPLY_TARGET = {};  // { reviewId: commentId }
let CURRENT_STATS = {
    avg_rating: 0,
    total_reviews: 0,
    total_photos: 0,
    r5: 0, r4: 0, r3: 0, r2: 0, r1: 0
};

// ── Boot ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('explore');

    const params = new URLSearchParams(window.location.search);
    RESTAURANT_NAME = decodeURIComponent(params.get('name') || '');

    if (!RESTAURANT_NAME) {
        window.location.href = 'explore.html';
        return;
    }

    document.title = `${RESTAURANT_NAME} — Foodie`;
    document.getElementById('pageTitle').textContent = `${RESTAURANT_NAME} — Foodie`;

    // Set writer info
    if (CURRENT_USER && CURRENT_USER.role !== 'guest') {
        document.getElementById('writerAvatar').src = CURRENT_USER.profile_pic ? `${API_URL.replace('/api', '')}/uploads/${CURRENT_USER.profile_pic}` : 'https://i.pravatar.cc/150?img=68';
        document.getElementById('writerName').textContent = CURRENT_USER.username || 'You';
    } else {
        document.getElementById('writeReviewCard').style.display = 'none';
        document.getElementById('guestReviewPrompt').style.display = 'block';
    }

    loadRestaurantDetail();
    loadReviews();
});

// ── Load Detail ─────────────────────────────────────────────────────────────
async function loadRestaurantDetail() {
    try {
        const res = await fetch(`${API_URL}/restaurants/detail?name=${encodeURIComponent(RESTAURANT_NAME)}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();

        if (result.success) {
            renderHero(result.data);
            renderInfo(result.data.restaurant);
            renderGallery(result.data.photos);

            // Initial stats from backend (includes all historical data)
            renderStats(result.data.stats);
        }
    } catch (err) {
        console.error('Failed to load restaurant:', err);
    }
}

// ── Render Hero ─────────────────────────────────────────────────────────────
function renderHero(data) {
    const { restaurant, stats, photos } = data;

    document.getElementById('heroName').textContent = RESTAURANT_NAME;
    document.getElementById('heroLocationText').textContent = restaurant?.location || restaurant?.address || 'Unknown location';
    document.getElementById('heroRating').textContent = stats.avg_rating > 0 ? stats.avg_rating : '—';
    document.getElementById('heroReviewCount').textContent =
        `${stats.total_reviews} reviews · ${stats.total_photos} photos · ${stats.followers_count} followers`;

    // Set cover image from admin-provided restaurant image or default category fallback
    const coverImg = document.getElementById('heroCover');
    coverImg.src = getRestaurantImageUrl(restaurant?.image, restaurant?.category);
    coverImg.onerror = () => { coverImg.src = `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&h=400&fit=crop`; };

    // Save state only (Follow removed)
    updateSaveBtn(stats.is_saved);
}

// ── Render Info ─────────────────────────────────────────────────────────────
function renderInfo(resto) {
    if (!resto) return;
    document.getElementById('infoAddress').textContent = resto.address || resto.location || 'Not available';
    document.getElementById('infoHours').textContent = resto.opening_hours || 'Not available';
    document.getElementById('infoPhone').innerHTML = resto.phone ? `<a href="tel:${resto.phone}">${resto.phone}</a>` : 'Not available';
    document.getElementById('infoWebsite').innerHTML = resto.website ? `<a href="${resto.website}" target="_blank" rel="noopener">${resto.website}</a>` : 'Not available';
}

// ── Render Gallery ──────────────────────────────────────────────────────────
function renderGallery(photos) {
    const grid = document.getElementById('galleryGrid');
    ALL_PHOTOS = photos || [];

    if (!ALL_PHOTOS.length) {
        grid.innerHTML = '<div class="gallery-empty">No photos yet. Be the first to add one!</div>';
        return;
    }

    const shown = ALL_PHOTOS.slice(0, 3);
    grid.innerHTML = shown.map(p => {
        const url = p.url.startsWith('http') ? p.url : `${API_URL.replace('/api', '')}/uploads/${p.url}`;
        return `<div class="gallery-item"><img src="${url}" alt="photo" loading="lazy" onerror="this.style.display='none'" /></div>`;
    }).join('');

    const moreBtn = document.getElementById('galleryMoreBtn');
    if (ALL_PHOTOS.length > 3) {
        moreBtn.style.display = 'block';
        moreBtn.textContent = `View All ${ALL_PHOTOS.length} Photos`;
    }
}

function showAllPhotos() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = ALL_PHOTOS.map(p => {
        const url = p.url.startsWith('http') ? p.url : `${API_URL.replace('/api', '')}/uploads/${p.url}`;
        return `<div class="gallery-item"><img src="${url}" alt="photo" loading="lazy" /></div>`;
    }).join('');
    document.getElementById('galleryMoreBtn').style.display = 'none';
}

// ── Render Stats ─────────────────────────────────────────────────────────────
function renderStats(stats) {
    // Merge into global stats object
    if (stats) {
        CURRENT_STATS = { ...CURRENT_STATS, ...stats };
    }

    const avg = parseFloat(CURRENT_STATS.avg_rating) || 0;
    const avgEl = document.getElementById('statsAvg');
    if (avgEl) avgEl.innerHTML = `${avg > 0 ? avg.toFixed(1) : '—'}<span class="stats-avg-star">★</span>`;

    const labelEl = document.getElementById('statsTotalLabel');
    if (labelEl) labelEl.innerHTML = `${CURRENT_STATS.total_reviews} ratings<br>${CURRENT_STATS.total_reviews} reviews`;

    const photosEl = document.getElementById('statsTotalPhotos');
    if (photosEl) photosEl.textContent = `${CURRENT_STATS.total_photos} photos`;

    const total = Math.max(CURRENT_STATS.total_reviews, 1);
    const barsEl = document.getElementById('statsBars');
    if (!barsEl) return;

    const labels = ['5 ★', '4 ★', '3 ★', '2 ★', '1 ★'];
    const classes = ['r5', 'r4', 'r3', 'r2', 'r1'];
    const counts = [CURRENT_STATS.r5 || 0, CURRENT_STATS.r4 || 0, CURRENT_STATS.r3 || 0, CURRENT_STATS.r2 || 0, CURRENT_STATS.r1 || 0];

    barsEl.innerHTML = labels.map((label, i) => `
        <div class="rating-bar-row">
            <span class="rating-bar-label">${label}</span>
            <div class="rating-bar-track">
                <div class="rating-bar-fill ${classes[i]}" style="width:${Math.round((counts[i] / total) * 100)}%"></div>
            </div>
            <span class="rating-bar-count">${counts[i].toLocaleString()}</span>
        </div>
    `).join('');
}

// ── Recalculate avg rating from current reviews list ──────────────────────────
function recalcAvgFromReviews(reviews) {
    if (!reviews || !reviews.length) return;

    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + Number(r.rating || 0), 0);
    const avg = (sum / total).toFixed(1);
    const counts = [5, 4, 3, 2, 1].map(s => reviews.filter(r => Number(r.rating) === s).length);

    // Update global state and render
    renderStats({
        avg_rating: avg,
        total_reviews: total,
        r5: counts[0], r4: counts[1], r3: counts[2], r2: counts[3], r1: counts[4]
    });

    // Also update hero rating badge
    const heroRatingEl = document.getElementById('heroRating');
    if (heroRatingEl) heroRatingEl.textContent = avg;
    const heroCountEl = document.getElementById('heroReviewCount');
    if (heroCountEl) heroCountEl.textContent = `${total} reviews`;
}

// ── Star Picker ─────────────────────────────────────────────────────────────
function selectStar(val) {
    SELECTED_STAR = val;
    document.querySelectorAll('.star-pick').forEach(s => {
        const sv = parseInt(s.dataset.val);
        s.textContent = sv <= val ? '★' : '☆';
        s.classList.toggle('selected', sv <= val);
    });
}

// ── Submit Review ────────────────────────────────────────────────────────────
async function submitReview() {
    if (CURRENT_USER.role === 'guest') return showToast('Login to post a review!', '🔒');
    if (!SELECTED_STAR) return showToast('Please select a star rating', '⭐');

    const reviewText = document.getElementById('reviewText').value.trim();
    const imgInput = document.getElementById('reviewImageInput');

    const formData = new FormData();
    formData.append('rating', SELECTED_STAR);
    formData.append('review_text', reviewText);
    if (imgInput.files[0]) formData.append('image', imgInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/restaurants/reviews?name=${encodeURIComponent(RESTAURANT_NAME)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            showToast('Review posted!', '✅');
            document.getElementById('reviewText').value = '';
            document.getElementById('reviewImgPreview').style.display = 'none';
            selectStar(0);
            SELECTED_STAR = 0;
            loadReviews();
            loadRestaurantDetail();
        } else {
            showToast(result.message || 'Failed to post', '❌');
        }
    } catch (err) {
        showToast('Failed to post review', '❌');
    }
}

function previewReviewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => {
            const prev = document.getElementById('reviewImgPreview');
            prev.src = e.target.result;
            prev.style.display = 'block';
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// ── Load Reviews (includes user posts for this restaurant) ───────────────────
async function loadReviews() {
    const filter = document.getElementById('reviewFilter')?.value || 'smart';
    const listEl = document.getElementById('reviewsList');
    listEl.innerHTML = '<div class="loading-pill">Loading reviews...</div>';

    try {
        const [revRes, postRes] = await Promise.all([
            fetch(`${API_URL}/restaurants/reviews?name=${encodeURIComponent(RESTAURANT_NAME)}&filter=${filter}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            }),
            fetch(`${API_URL}/posts?restaurant_name=${encodeURIComponent(RESTAURANT_NAME)}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            })
        ]);

        const revResult = await revRes.json();
        const postResult = postRes.ok ? await postRes.json() : { success: false };

        // Normalize matching posts into review shape
        const postReviews = ((postResult.success && postResult.data) ? postResult.data : [])
            .filter(p => p.restaurant_name === RESTAURANT_NAME)
            .map(p => ({
                id: `post-${p.id}`,
                user_id: p.user_id,
                username: p.username,
                profile_pic: p.profile_pic,
                rating: Number(p.rating) || 5,
                review_text: p.caption || '',
                image: p.image,
                created_at: p.created_at,
                likes_count: p.likes_count || 0,
                user_liked: !!p.liked,
                comments_count: p.comments_count || 0,
                is_post: true
            }));

        const reviews = revResult.success ? revResult.data : [];
        let all = [...reviews, ...postReviews];

        switch (filter) {
            case 'smart':
                all.sort((a, b) => ((b.likes_count || 0) + (b.comments_count || 0)) - ((a.likes_count || 0) + (a.comments_count || 0)));
                break;
            case 'friends':
                all.sort((a, b) => (b.is_friend ? 1 : 0) - (a.is_friend ? 1 : 0) || new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'top':
                all.sort((a, b) => (b.author_followers || b.likes_count || 0) - (a.author_followers || a.likes_count || 0));
                break;
            case 'liked':
                all.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0) || new Date(b.created_at) - new Date(a.created_at));
                break;
            case 'oldest':
                all.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'newest':
            default:
                all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
        }

        if (!all.length) {
            listEl.innerHTML = '<div class="loading-pill">No reviews yet. Be the first! 🌟</div>';
        } else {
            listEl.innerHTML = all.map(r => generateReviewCard(r)).join('');
            recalcAvgFromReviews(all);
        }
    } catch (err) {
        listEl.innerHTML = '<div class="loading-pill" style="color:red">Failed to load reviews.</div>';
    }
}

// ── Generate Review Card (Meesho-style) ──────────────────────────────────────
const RATING_LABELS = { 5: 'Very Good', 4: 'Good', 3: 'Ok-Ok', 2: 'Bad', 1: 'Very Bad' };
const BADGE_COLORS = { 5: '#1a7a5e', 4: '#2d9e6b', 3: '#d4900a', 2: '#d4600a', 1: '#c62828' };

function generateReviewCard(r) {
    const rating = Number(r.rating) || 5;
    const ratingLabel = RATING_LABELS[rating] || '';
    const badgeColor = BADGE_COLORS[rating] || '#1a7a5e';
    const postedDate = new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const isPost = r.is_post;
    const imgUrl = r.image
        ? (r.image.startsWith('http') ? r.image : `${API_URL.replace('/api', '')}/uploads/${r.image}`)
        : null;

    const reviewTextFull = r.review_text || '';
    const SHORT_LEN = 110;
    const isLong = reviewTextFull.length > SHORT_LEN;
    const shortText = isLong ? reviewTextFull.slice(0, SHORT_LEN) + '...' : reviewTextFull;
    const textHtml = reviewTextFull ? `
        <div class="rv-text" id="rvt-${r.id}">
            <div class="rv-text-short">${shortText}${isLong ? ` <span class="rv-read-more" onclick="expandReview('${r.id}')">Read More</span>` : ''}</div>
            ${isLong ? `<div class="rv-text-full" style="display:none">${reviewTextFull}</div>` : ''}
        </div>` : '';

    const imgSection = imgUrl ? `
        <div class="rv-images">
            <div class="rv-img-item"><img src="${imgUrl}" alt="review" onerror="this.parentElement.style.display='none'" /></div>
        </div>` : '';

    const postTag = isPost ? `<span class="rv-post-tag">📸 Post</span>` : '';

    const helpfulClass = r.user_liked ? 'rv-helpful-btn helpful-liked' : 'rv-helpful-btn';
    const helpfulFill = r.user_liked ? 'currentColor' : 'none';
    const helpfulCount = r.likes_count > 0 ? ` (${r.likes_count})` : '';
    const helpfulClick = !isPost ? `onclick="handleReviewLike(${r.id}, this)"` : '';
    const helpfulBtn = `
        <button class="review-action-btn ${helpfulClass}" id="rl-${r.id}" ${helpfulClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="${helpfulFill}" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
          Helpful${helpfulCount}
        </button>`;

    const commentClick = !isPost ? `onclick="toggleReviewComments(${r.id})"` : '';
    const commentBtn = `<button class="review-action-btn" ${commentClick}>💬 ${r.comments_count > 0 ? r.comments_count : 'Comment'}</button>`;

    const reportBtn = !isPost
        ? `<button class="review-action-btn rv-report-inline" onclick="reportReviewItem(${r.id})">🚩 Report</button>`
        : '';

    return `
    <div class="review-card" id="review-${r.id}">
      <div class="rv-top-row">
        <div class="rv-badge" style="background:${badgeColor}">
          <span>${rating}</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <span class="rv-label">${ratingLabel}</span>${postTag}
        <span class="rv-dot">·</span>
        <span class="rv-date">Posted ${postedDate}</span>
      </div>

      <div class="rv-body-row">
        <div class="rv-body-left">
          ${textHtml}
          <div class="rv-username">~${r.username}</div>
        </div>
        ${imgSection}
      </div>

      <div class="review-action-row" style="margin-left:0; margin-top:8px;">
        ${helpfulBtn}
        ${commentBtn}
        ${reportBtn}
      </div>
      ${!isPost ? `<div id="rc-${r.id}" class="review-comment-section" style="display:none"></div>` : ''}
    </div>`;
}

function expandReview(id) {
    const block = document.getElementById(`rvt-${id}`);
    if (!block) return;
    block.querySelector('.rv-text-short').style.display = 'none';
    block.querySelector('.rv-text-full').style.display = 'block';
}


// ── Review Like ───────────────────────────────────────────────────────────────
async function handleReviewLike(reviewId, btn) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to like!', '🔒');
    try {
        const res = await fetch(`${API_URL}/restaurants/reviews/${reviewId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            btn.classList.toggle('liked', result.liked);
            const svg = btn.querySelector('svg');
            svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
            svg.style.color = result.liked ? '#ed4956' : '';

            // Count is embedded in button text as "Helpful (N)" or "Helpful"
            // Parse existing count from text content after SVG
            const currentText = btn.textContent.trim(); // e.g. "Helpful (3)" or "Helpful"
            const countMatch = currentText.match(/\((\d+)\)/);
            let c = countMatch ? parseInt(countMatch[1]) : 0;
            c = result.liked ? c + 1 : Math.max(c - 1, 0);

            // Update button text: keep SVG, update text node
            const textNode = Array.from(btn.childNodes).find(n => n.nodeType === Node.TEXT_NODE);
            if (textNode) {
                textNode.textContent = c > 0 ? ` Helpful (${c})` : ' Helpful';
            } else {
                // Fallback: append text after SVG
                btn.innerHTML = btn.innerHTML.replace(/Helpful.*$/, '') + `Helpful${c > 0 ? ` (${c})` : ''}`;
            }
        }
    } catch (e) { console.error('Review like error:', e); }
}


// ── Review Comments ───────────────────────────────────────────────────────────
async function toggleReviewComments(reviewId) {
    const section = document.getElementById(`rc-${reviewId}`);
    if (section.style.display === 'none') {
        section.style.display = 'block';
        await loadReviewComments(reviewId);
    } else {
        section.style.display = 'none';
    }
}

async function loadReviewComments(reviewId) {
    const section = document.getElementById(`rc-${reviewId}`);
    section.innerHTML = '<div class="loading-pill" style="padding:10px 0; font-size:12px;">Loading...</div>';

    try {
        const res = await fetch(`${API_URL}/restaurants/reviews/${reviewId}/comments`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();

        let html = '';
        if (result.success && result.data.length) {
            html = result.data.map(c => generateCommentMarkup(c, reviewId)).join('');
        } else {
            html = '<div style="font-size:12px; color:var(--text-muted); padding:8px 0;">No comments yet.</div>';
        }

        // Add input row
        const isGuest = CURRENT_USER.role === 'guest';
        html += `
            ${!isGuest ? `
            <div class="review-comment-input-row" id="ci-row-${reviewId}">
              <img src="${document.getElementById('writerAvatar').src}" style="width:28px; height:28px; border-radius:50%;" />
              <input class="review-comment-input" id="ci-${reviewId}" placeholder="Add a comment..." />
              <button class="review-comment-submit" onclick="submitReviewComment(${reviewId})">Post</button>
            </div>` : '<div style="font-size:12px; color:var(--text-muted); padding:8px 0;"><a href="login.html" style="color:var(--brand-primary)">Login</a> to comment</div>'}
        `;

        section.innerHTML = html;
    } catch (err) {
        section.innerHTML = '<div style="font-size:12px; color:red;">Failed to load.</div>';
    }
}

// ── Comment Markup ────────────────────────────────────────────────────────────
function generateCommentMarkup(c, reviewId, isReply = false) {
    const avatarSrc = c.profile_pic
        ? `${API_URL.replace('/api', '')}/uploads/${c.profile_pic}`
        : 'https://i.pravatar.cc/150?img=68';

    const viewRepliesHtml = (c.replies_count > 0 && !isReply)
        ? `<div class="view-replies-row" onclick="loadCommentReplies(${c.id}, ${reviewId}, this)">
               <div class="view-replies-line"></div>View replies (${c.replies_count})
           </div>
           <div id="creplies-${c.id}"></div>`
        : '';

    const replyBtnHtml = !isReply
        ? `<button class="rev-comment-btn" onclick="initiateReviewReply(${reviewId}, ${c.id}, '${c.username.replace(/'/g, "\\'")}')">Reply</button>`
        : '';

    let formattedText = c.comment || '';
    formattedText = formattedText.replace(/(@\w+)/g, '<span style="color:#a8c7fa;">$1</span>');

    return `
    <div class="rev-comment-item ${isReply ? 'is-reply' : ''}" id="rc-item-${c.id}">
      <div class="rev-comment-left">
        <img class="rev-comment-avatar" src="${avatarSrc}" onclick="window.location.href='profile.html?id=${c.user_id}'" />
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:6px;">
            <span class="rev-comment-username" style="cursor:pointer;" onclick="window.location.href='profile.html?id=${c.user_id}'">${c.username}</span>
            <span class="rev-comment-timestamp">${timeAgo(c.created_at)}</span>
          </div>
          <div class="rev-comment-text">${formattedText}</div>
          <div class="rev-comment-action-row">
            ${replyBtnHtml}
            <button class="rev-comment-btn" onclick="reportReviewComment(${c.id})">Report</button>
          </div>
          ${viewRepliesHtml}
        </div>
      </div>
      <div class="rev-comment-like">
        <button class="rev-comment-like-btn" onclick="likeReviewComment(${c.id}, this)">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="${c.user_liked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" style="color:${c.user_liked ? '#ed4956' : 'var(--text-muted)'}"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
        <span class="rev-comment-like-count">${c.likes_count > 0 ? c.likes_count : ''}</span>
      </div>
    </div>`;
}

// ── Submit Review Comment ─────────────────────────────────────────────────────
async function submitReviewComment(reviewId) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to comment!', '🔒');
    const input = document.getElementById(`ci-${reviewId}`);
    const comment = input.value.trim();
    if (!comment) return;

    const parentId = REPLY_TARGET[reviewId] || null;

    try {
        const res = await fetch(`${API_URL}/restaurants/reviews/${reviewId}/comments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ comment, parent_id: parentId })
        });
        const result = await res.json();
        if (result.success) {
            showToast(parentId ? 'Reply posted!' : 'Comment posted!', '💬');
            input.value = '';
            input.placeholder = 'Add a comment...';
            delete REPLY_TARGET[reviewId];
            loadReviewComments(reviewId);
        }
    } catch (e) {
        showToast('Failed', '❌');
    }
}

// ── Initiate Reply ────────────────────────────────────────────────────────────
function initiateReviewReply(reviewId, commentId, username) {
    REPLY_TARGET[reviewId] = commentId;
    const input = document.getElementById(`ci-${reviewId}`);
    if (input) {
        input.placeholder = `Replying to @${username}...`;
        input.focus();
    }
}

// ── Load Comment Replies ──────────────────────────────────────────────────────
async function loadCommentReplies(commentId, reviewId, triggerEl) {
    const container = document.getElementById(`creplies-${commentId}`);
    if (container.innerHTML) { container.innerHTML = ''; return; }

    container.innerHTML = '<div style="font-size:11px; color:var(--text-muted); padding:5px;">Loading...</div>';
    try {
        const res = await fetch(`${API_URL}/restaurants/reviews/${reviewId}/comments/${commentId}/replies`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            container.innerHTML = result.data.map(r => generateCommentMarkup(r, reviewId, true)).join('');
        }
    } catch (e) {
        container.innerHTML = '<div style="font-size:11px; color:red;">Failed.</div>';
    }
}

// ── Like Review Comment (reuse social comment_likes table) ───────────────────
async function likeReviewComment(commentId, btn) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to like!', '🔒');
    try {
        const res = await fetch(`${API_URL}/social/comment/like/${commentId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            const svg = btn.querySelector('svg');
            const countEl = btn.parentElement.querySelector('.rev-comment-like-count');
            svg.style.color = result.liked ? '#ed4956' : 'var(--text-muted)';
            svg.setAttribute('fill', result.liked ? 'currentColor' : 'none');
            let c = parseInt(countEl.textContent || '0');
            c = result.liked ? c + 1 : c - 1;
            countEl.textContent = c > 0 ? c : '';
        }
    } catch (e) { }
}

// ── Save / Follow ─────────────────────────────────────────────────────────────
async function handleToggleSave() {
    if (CURRENT_USER.role === 'guest') return showToast('Login to save!', '🔒');
    try {
        const res = await fetch(`${API_URL}/restaurants/save?name=${encodeURIComponent(RESTAURANT_NAME)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, result.saved ? '🔖' : '🔲');
            updateSaveBtn(result.saved);
        }
    } catch (e) { showToast('Failed', '❌'); }
}

async function handleToggleFollow() {
    if (CURRENT_USER.role === 'guest') return showToast('Login to follow!', '🔒');
    try {
        const res = await fetch(`${API_URL}/restaurants/follow?name=${encodeURIComponent(RESTAURANT_NAME)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, result.following ? '🔔' : '🔕');
            updateFollowBtn(result.following);
        }
    } catch (e) { showToast('Failed', '❌'); }
}

function updateSaveBtn(saved) {
    const btn = document.getElementById('saveBtn');
    document.getElementById('saveBtnIcon').textContent = saved ? '❤️' : '🤍';
    document.getElementById('saveBtnText').textContent = saved ? 'Saved' : 'Favourite';
    btn.classList.toggle('active-save', saved);
}

function updateFollowBtn(following) {
    const btn = document.getElementById('followBtn');
    document.getElementById('followBtnIcon').textContent = following ? '✅' : '➕';
    document.getElementById('followBtnText').textContent = following ? 'Following' : 'Follow';
    btn.classList.toggle('active-follow', following);
}

// ── Photo Upload ──────────────────────────────────────────────────────────────
async function handlePhotoUpload(input) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to add photos!', '🔒');
    if (!input.files[0]) return;

    const formData = new FormData();
    formData.append('image', input.files[0]);

    try {
        const res = await fetch(`${API_URL}/restaurants/photos?name=${encodeURIComponent(RESTAURANT_NAME)}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            showToast('Photo added!', '📸');
            loadRestaurantDetail();
        }
    } catch (e) { showToast('Failed to upload', '❌'); }
}

// ── Report ────────────────────────────────────────────────────────────────────
function reportRestaurant() {
    if (CURRENT_USER.role === 'guest') return showToast('Login to report!', '🔒');
    const reason = prompt('Reason for reporting this restaurant?');
    if (!reason) return;
    showToast('Report submitted. Thank you!', '✅');
}

async function reportReviewItem(reviewId) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to report!', '🔒');
    const reason = prompt('Reason for reporting this review?');
    if (!reason) return;
    try {
        const res = await fetch(`${API_URL}/social/report`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reported_type: 'comment', reported_id: reviewId, reason })
        });
        const result = await res.json();
        if (result.success) showToast(result.message, '✅');
    } catch (e) { }
}

async function reportReviewComment(commentId) {
    if (CURRENT_USER.role === 'guest') return showToast('Login to report!', '🔒');
    const reason = prompt('Reason for reporting this comment?');
    if (!reason) return;
    try {
        const res = await fetch(`${API_URL}/social/report`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ reported_type: 'comment', reported_id: commentId, reason })
        });
        const result = await res.json();
        if (result.success) showToast(result.message, '✅');
    } catch (e) { }
}

// ── Share ─────────────────────────────────────────────────────────────────────
function shareRestaurant() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        showToast('Link copied!', '🔗');
    });
}

// ── Time Ago ──────────────────────────────────────────────────────────────────
function timeAgo(dateString) {
    if (!dateString) return '';
    const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return new Date(dateString).toLocaleDateString();
}
