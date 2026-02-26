/* ── Search Page JS ── */
document.addEventListener('DOMContentLoaded', () => {
  buildSidebar('explore');
  renderQuickTags();
  renderRestaurants(MOCK_RESTAURANTS);
  setupFilters();
});

const QUICK_TAG_LIST = ['🔥 Trending', '📍 Nearby', '⭐ Top Rated', '💸 Budget', '👥 Friends Visited'];

function renderQuickTags() {
  const container = document.getElementById('quickTags');
  QUICK_TAG_LIST.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    el.onclick = () => {
      document.getElementById('searchInput').value = tag.replace(/[^\w\s]/g, '').trim();
      runSearch();
    };
    container.appendChild(el);
  });
}

let currentView = 'grid';

function setView(view) {
  currentView = view;
  document.getElementById('restaurantGrid').className = `restaurant-grid ${view === 'list' ? 'list-view' : ''}`;
  document.getElementById('gridViewBtn').classList.toggle('active', view === 'grid');
  document.getElementById('listViewBtn').classList.toggle('active', view === 'list');
}

function setupFilters() {
  ['ratingFilter', 'statusFilter', 'sortFilter'].forEach(id => {
    document.getElementById(id).addEventListener('change', applyFilters);
  });

  // Price buttons removed from UI, so skipping click setup
}

function applyFilters() {
  let filtered = [...MOCK_RESTAURANTS];
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const rating = parseFloat(document.getElementById('ratingFilter').value) || 0;
  const status = document.getElementById('statusFilter').value;
  const sort = document.getElementById('sortFilter').value;
  // Price filter removed

  if (q) {
    filtered = filtered.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(q);
      const addressMatch = r.address.toLowerCase().includes(q);
      const tagMatch = r.tags.some(t => t.toLowerCase().includes(q));

      // "Friends Visited" special tag logic
      if (q === 'friends visited' || q === 'visited by friends') {
        return MOCK_POSTS.some(p => p.restaurant.id === r.id);
      }
      // Special Keyword Handling
      if (q === 'top rated') return r.rating >= 4.7;
      if (q === 'budget') return r.priceLevel === 1;
      if (q === 'trending') return r.tags.includes('Trending');
      if (q === 'nearby') return parseFloat(r.distance) <= 1.0;

      return nameMatch || addressMatch || tagMatch;
    });
  }
  if (rating) filtered = filtered.filter(r => r.rating >= rating);
  if (status === 'open') filtered = filtered.filter(r => r.openNow);
  if (status === 'closed') filtered = filtered.filter(r => !r.openNow);

  // Sort
  filtered.sort((a, b) => {
    if (sort === 'rating') return b.rating - a.rating;
    if (sort === 'reviews') return b.reviewCount - a.reviewCount;
    if (sort === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
    if (sort === 'price_asc') return a.priceLevel - b.priceLevel;
    if (sort === 'price_desc') return b.priceLevel - a.priceLevel;
    return 0;
  });

  renderRestaurants(filtered);
}

function runSearch() { applyFilters(); }

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('searchInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyFilters(); });

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('ratingFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('sortFilter').value = 'rating';
  renderRestaurants(MOCK_RESTAURANTS);
}

let savedRestos = new Set();

function renderRestaurants(list) {
  const grid = document.getElementById('restaurantGrid');
  document.getElementById('resultsCount').textContent = `${list.length} restaurant${list.length !== 1 ? 's' : ''} found`;
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted)">
      <div style="font-size:48px;margin-bottom:12px">🍽️</div>
      <div style="font-size:16px;font-weight:500">No restaurants found</div>
      <div style="font-size:13px;margin-top:6px">Try adjusting your filters</div>
    </div>`;
    return;
  }

  list.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'resto-card';
    card.style.animationDelay = `${idx * 0.06}s`;
    card.innerHTML = `
      <div class="resto-image-wrap">
        <img class="resto-image" src="${r.image}" alt="${r.name}" loading="lazy" />
        <div class="resto-image-overlay"></div>
        <span class="open-badge ${r.openNow ? 'open' : 'closed'}">${r.openNow ? '● Open' : '● Closed'}</span>
        <button class="save-resto-btn ${savedRestos.has(r.id) ? 'saved' : ''}" 
          onclick="event.stopPropagation(); toggleSaveResto(this, ${r.id})">
          ${savedRestos.has(r.id) ? '🔖' : '🤍'}
        </button>
        <span class="distance-badge">📍 ${r.distance}</span>
      </div>
      <div class="resto-body">
        <div class="resto-name">${r.name}</div>
        <div class="resto-cuisine">${r.cuisine}</div>
        <div class="resto-rating-row">
          <div class="stars">${renderStars(r.rating)}</div>
          <span class="resto-rating-num">${r.rating}</span>
          <span class="resto-review-count">(${formatNumber(r.reviewCount)} reviews)</span>
          <span class="resto-price">${getPriceLabel(r.priceLevel)}</span>
        </div>
        <div class="resto-tags">
          ${r.tags.map(t => `<span class="resto-tag">${t}</span>`).join('')}
        </div>
      </div>
    `;
    card.addEventListener('click', () => openRestoModal(r));
    grid.appendChild(card);
  });
}

function toggleSaveResto(btn, id) {
  if (savedRestos.has(id)) {
    savedRestos.delete(id);
    btn.textContent = '🤍';
    btn.classList.remove('saved');
    showToast('Removed from saved spots', '💔');
  } else {
    savedRestos.add(id);
    btn.textContent = '🔖';
    btn.classList.add('saved');
    showToast('Restaurant saved! 🏪', '🔖');
  }
}

const SAMPLE_REVIEWS = [
  { user: 'Alex Rivera', avatar: 'https://i.pravatar.cc/150?img=11', text: 'Absolutely incredible! Every dish was a work of art.', rating: 5, date: '2 days ago' },
  { user: 'Priya Sharma', avatar: 'https://i.pravatar.cc/150?img=25', text: 'Great atmosphere and amazing food. Will definitely be back!', rating: 4, date: '1 week ago' },
  { user: 'Marcus Chen', avatar: 'https://i.pravatar.cc/150?img=33', text: 'Solid place, the signature dish is a must-try.', rating: 5, date: '2 weeks ago' },
];

function openRestoModal(r) {
  document.getElementById('modalImg').src = r.image;
  document.getElementById('modalName').textContent = r.name;
  document.getElementById('modalStars').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-top:4px">
      <div class="stars">${renderStars(r.rating)}</div>
      <span style="font-weight:700">${r.rating}</span>
      <span style="font-size:12px;color:var(--text-muted)">(${formatNumber(r.reviewCount)} reviews)</span>
    </div>
  `;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-row"><span class="modal-row-icon">📍</span><span>${r.address}</span></div>
    <div class="modal-row"><span class="modal-row-icon">🍴</span><span>${r.cuisine} · ${getPriceLabel(r.priceLevel)}</span></div>
    <div class="modal-row"><span class="modal-row-icon">🕐</span><span style="color:${r.openNow ? 'var(--brand-green)' : 'var(--brand-accent)'}">${r.openNow ? 'Open Now' : 'Currently Closed'}</span></div>
    <div class="modal-row"><span class="modal-row-icon">📏</span><span>${r.distance} away</span></div>
    <div class="divider"></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
    <div style="display:flex;gap:10px;margin-bottom:20px">
      <button class="btn btn-primary" style="flex:1" onclick="showToast('Directions opened!','🗺')">🗺 Directions</button>
      <button class="btn btn-secondary" style="flex:1" onclick="window.location.href='create-post.html'">✍️ Write Review</button>
    </div>
    <h4 style="font-size:14px;font-weight:700;margin-bottom:12px">Recent Reviews</h4>
    ${SAMPLE_REVIEWS.map(rev => `
      <div class="review-card">
        <div class="review-author">
          <img class="avatar avatar-sm" src="${rev.avatar}" alt="${rev.user}" />
          <div>
            <div style="font-size:13px;font-weight:600">${rev.user}</div>
            <div class="stars" style="font-size:11px">${renderStars(rev.rating)}</div>
          </div>
          <span style="margin-left:auto;font-size:11px;color:var(--text-muted)">${rev.date}</span>
        </div>
        <p style="font-size:13px;color:var(--text-secondary)">${rev.text}</p>
      </div>
    `).join('')}
  `;
  document.getElementById('restoModal').classList.add('open');
}

function closeRestoModal() {
  document.getElementById('restoModal').classList.remove('open');
}

document.getElementById('restoModal').addEventListener('click', function (e) {
  if (e.target === this) closeRestoModal();
});
