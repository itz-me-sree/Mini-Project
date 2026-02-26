/* ── Home Page Logic ── */
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar('home');
  renderStories();
  renderFeedTabs();
  renderFeed(MOCK_POSTS);
  renderTrendingRestaurants();
  renderSuggestedUsers();
});

function renderStories() {
  const bar = document.getElementById('storiesBar');
  const storyImages = [
    'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400',
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=400',
  ];

  // Add story
  bar.innerHTML = `
    <div class="story-bubble" onclick="showToast('Story creation coming soon!', '📸')">
      <div class="story-add">➕</div>
      <span class="story-name">Add Story</span>
    </div>
  `;

  MOCK_USERS.forEach((u, i) => {
    if (!u.hasStory) return;
    const el = document.createElement('div');
    el.className = 'story-bubble';
    el.innerHTML = `
      <div class="story-ring" id="ring-${u.id}">
        <img class="story-inner" src="${u.avatar}" alt="${u.name}" />
      </div>
      <span class="story-name">${u.name.split(' ')[0]}</span>
    `;
    el.addEventListener('click', () => openStory(u, storyImages[i % storyImages.length]));
    bar.appendChild(el);
  });
}

let storyTimer = null;
let storyProgress = 0;

function openStory(user, image) {
  document.getElementById('storyAvatar').src = user.avatar;
  document.getElementById('storyUsername').textContent = user.name;
  document.getElementById('storyTime').textContent = 'Today • Featured dish';
  document.getElementById('storyImage').src = image;
  document.getElementById('storyCaption').textContent = `Check out this amazing dish at ${MOCK_RESTAURANTS[Math.floor(Math.random() * MOCK_RESTAURANTS.length)].name}! 🍽️`;
  document.getElementById('storyModal').classList.add('open');
  startStoryProgress();
}

function closeStory() {
  document.getElementById('storyModal').classList.remove('open');
  clearInterval(storyTimer);
  storyProgress = 0;
  document.getElementById('storyProgress').style.width = '0%';
}

function startStoryProgress() {
  storyProgress = 0;
  clearInterval(storyTimer);
  storyTimer = setInterval(() => {
    storyProgress += 0.5;
    document.getElementById('storyProgress').style.width = storyProgress + '%';
    if (storyProgress >= 100) closeStory();
  }, 25);
}

document.getElementById('storyModal').addEventListener('click', function (e) {
  if (e.target === this) closeStory();
});

const FEED_TABS = ['For You', 'Following', 'Liked', 'Saved'];

function renderFeedTabs() {
  const container = document.getElementById('feedTabs');
  FEED_TABS.forEach((tab, i) => {
    const el = document.createElement('button');
    el.className = `feed-tab ${i === 0 ? 'active' : ''}`;
    el.textContent = tab;
    el.addEventListener('click', () => {
      document.querySelectorAll('.feed-tabs .feed-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      filterFeedByTab(tab);
    });
    container.appendChild(el);
  });
}

function filterFeedByTab(tab) {
  let filtered = [];
  if (tab === 'For You') {
    filtered = MOCK_POSTS;
  } else if (tab === 'Following') {
    // Show posts from users other than self (simulating followed users)
    filtered = MOCK_POSTS.filter(p => p.user.id !== 0);
  } else if (tab === 'Liked') {
    // Show posts with high like counts for demo
    filtered = MOCK_POSTS.filter(p => p.likes > 800);
  } else if (tab === 'Saved') {
    // Show saved posts
    filtered = MOCK_POSTS.filter(p => p.saved === true);
  }
  renderFeed(filtered);
}

function renderFeed(posts) {
  const feed = document.getElementById('feed');
  feed.innerHTML = '';
  if (!posts.length) {
    feed.innerHTML = `<div style="text-align:center;padding:48px;color:var(--text-muted)">No posts found for this filter 😅</div>`;
    return;
  }
  posts.forEach((post, idx) => {
    const el = document.createElement('article');
    el.className = 'post-card';
    el.style.animationDelay = `${idx * 0.08}s`;
    const captionShort = post.caption.length > 160 ? post.caption.slice(0, 160) + '…' : post.caption;
    el.innerHTML = `
      <div class="post-header">
        <img class="avatar avatar-md" src="${post.user.avatar}" alt="${post.user.name}" />
        <div class="post-user-info">
          <div class="post-username">
            ${post.user.name}
            ${post.user.verified ? '<span class="verified-badge">✓</span>' : ''}
          </div>
          <div class="post-meta">
            <a href="explore.html" style="color:var(--brand-primary)">${post.restaurant.name}</a>
            · ${post.timestamp}
          </div>
        </div>
        <button class="post-more-btn" onclick="event.stopPropagation()">···</button>
      </div>
      <div class="post-image-wrap" onclick="window.location.href='post.html?id=${post.id}'">
        <img class="post-image" src="${post.image}" alt="${post.dish}" loading="lazy" />
        <div class="post-rating-badge">⭐ ${post.rating}.0</div>
        <div class="post-restaurant-tag">📍 ${post.restaurant.name}</div>
        <div class="dish-badge">🍽️ ${post.dish}</div>
      </div>
      <div class="post-body" onclick="window.location.href='post.html?id=${post.id}'">
        <p class="post-caption">
          <strong>${post.user.handle}</strong> ${captionShort}
          ${post.caption.length > 160 ? '<span class="show-more">show more</span>' : ''}
        </p>
      </div>
      <div class="post-actions" onclick="event.stopPropagation()">
        <button class="action-btn like-btn ${post.likes > 900 ? 'liked' : ''}" onclick="toggleLike(this)">
          <span class="action-icon">❤️</span>
          <span class="like-count" data-count="${post.likes}">${formatNumber(post.likes)}</span>
        </button>
        <button class="action-btn" onclick="toggleComments(${post.id})">
          <span class="action-icon">💬</span>
          ${post.comments}
        </button>
        <button class="action-btn" onclick="showToast('Link copied!','🔗')">
          <span class="action-icon">🔗</span> Share
        </button>
        <button class="action-btn save-btn ${post.saved ? 'saved' : ''}" onclick="toggleSave(this, ${post.id})">
          ${post.saved ? '🔖' : '🔲'}
        </button>
      </div>
      <div class="comments-section" id="comments-${post.id}" style="display:none" onclick="event.stopPropagation()">
        <div class="comment-item">
          <img class="avatar avatar-sm" src="${MOCK_USERS[1].avatar}" alt="" />
          <div class="comment-text"><span class="comment-author">${MOCK_USERS[1].handle}</span> This looks so delicious! I need to try it 😍</div>
        </div>
        <div class="comment-input-row">
          <img class="avatar avatar-sm" src="${CURRENT_USER.avatar}" alt="" />
          <input class="comment-input" placeholder="Add a comment..." id="ci-${post.id}" />
          <button class="comment-submit" onclick="submitComment(${post.id})">➤</button>
        </div>
      </div>
    `;
    feed.appendChild(el);
  });
}


function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  if (section.style.display === 'none') {
    section.style.display = 'block';
    section.classList.add('fade-in');
  } else {
    section.style.display = 'none';
  }
}

function submitComment(postId) {
  const input = document.getElementById(`ci-${postId}`);
  if (!input.value.trim()) return;
  const section = document.getElementById(`comments-${postId}`);
  const newComment = document.createElement('div');
  newComment.className = 'comment-item fade-in';
  newComment.innerHTML = `
    <img class="avatar avatar-sm" src="${CURRENT_USER.avatar}" alt="" />
    <div class="comment-text"><span class="comment-author">${CURRENT_USER.handle}</span> ${input.value}</div>
  `;
  section.insertBefore(newComment, section.querySelector('.comment-input-row'));
  input.value = '';
  showToast('Comment posted!', '💬');
}

function renderTrendingRestaurants() {
  const container = document.getElementById('trendingRestaurants');
  MOCK_RESTAURANTS.slice(0, 4).forEach(r => {
    const el = document.createElement('div');
    el.className = 'trend-resto';
    el.innerHTML = `
      <img class="trend-resto-img" src="${r.image}" alt="${r.name}" />
      <div class="trend-resto-info">
        <div class="trend-resto-name">${r.name}</div>
        <div class="trend-resto-meta">${r.cuisine} · ${r.distance}</div>
      </div>
      <span class="trend-resto-rating">★ ${r.rating}</span>
    `;
    el.addEventListener('click', () => window.location.href = 'explore.html');
    container.appendChild(el);
  });
}

function renderSuggestedUsers() {
  const container = document.getElementById('suggestedUsers');
  MOCK_USERS.slice(0, 4).forEach(u => {
    const el = document.createElement('div');
    el.className = 'suggested-user';
    el.innerHTML = `
      <img class="avatar avatar-sm" src="${u.avatar}" alt="${u.name}" />
      <div class="suggested-user-info">
        <div class="suggested-name">${u.name}</div>
        <div class="suggested-handle">${formatNumber(u.followers)} followers</div>
      </div>
      <button class="follow-btn" onclick="handleFollow(this)">Follow</button>
    `;
    container.appendChild(el);
  });
}

function handleFollow(btn) {
  const isFollowing = btn.classList.toggle('following');
  btn.textContent = isFollowing ? 'Following' : 'Follow';
  showToast(isFollowing ? 'Now following!' : 'Unfollowed', isFollowing ? '👥' : '👤');
}


// Feed search
document.getElementById('feedSearch').addEventListener('input', function () {
  const q = this.value.toLowerCase();
  if (!q) { renderFeed(MOCK_POSTS); return; }
  const filtered = MOCK_POSTS.filter(p =>
    p.caption.toLowerCase().includes(q) ||
    p.dish.toLowerCase().includes(q) ||
    p.restaurant.name.toLowerCase().includes(q) ||
    p.user.name.toLowerCase().includes(q)
  );
  renderFeed(filtered);
});
