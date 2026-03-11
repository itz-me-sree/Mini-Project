let userCoords = null;

document.addEventListener('DOMContentLoaded', () => {
  buildSidebar('explore');
  renderQuickTags();
  runSearch(); // Initial search for all

  document.getElementById('searchInput').addEventListener('input', debounce(runSearch, 300));

  // Location manual search input
  const manualInput = document.getElementById('manualLocationInput');
  if (manualInput) {
    manualInput.addEventListener('input', debounce((e) => searchManualLocation(e.target.value), 400));
  }

  // Wire up filter dropdowns
  ['ratingFilter', 'statusFilter', 'sortFilter'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', runSearch);
  });
});

const QUICK_TAG_LIST = ['🔥 Trending', '📍 Nearby', '⭐ Top Rated', '💸 Budget'];

function renderQuickTags() {
  const container = document.getElementById('quickTags');
  if (!container) return;
  QUICK_TAG_LIST.forEach(tag => {
    const el = document.createElement('span');
    el.className = 'tag';
    el.textContent = tag;
    el.onclick = () => {
      const q = tag.replace(/[^\w\s]/g, '').trim();
      const searchInput = document.getElementById('searchInput');
      const sortFilter = document.getElementById('sortFilter');

      if (q.toLowerCase() === 'nearby') {
        searchInput.value = 'Nearby';
        handleNearbySearch();
      } else if (q.toLowerCase() === 'trending') {
        searchInput.value = '';
        if (sortFilter) sortFilter.value = 'trending';
        runSearch();
      } else if (q.toLowerCase() === 'top rated') {
        searchInput.value = '';
        if (sortFilter) sortFilter.value = 'rating';
        runSearch();
      } else {
        searchInput.value = q;
        runSearch();
      }
    };
    container.appendChild(el);
  });
}

function openLocationModal() {
  document.getElementById('locationModal').classList.add('open');
}

function closeLocationModal() {
  document.getElementById('locationModal').classList.remove('open');
  document.getElementById('locationSuggestions').innerHTML = '';
  document.getElementById('manualLocationInput').value = '';
}

async function requestUserLocationFromModal() {
  if (!navigator.geolocation) {
    showToast('Geolocation is not supported by your browser', '❌');
    return;
  }

  showToast('Fetching location...', '📍');

  navigator.geolocation.getCurrentPosition(async (position) => {
    userCoords = {
      lat: position.coords.latitude,
      lon: position.coords.longitude
    };

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userCoords.lat}&lon=${userCoords.lon}&format=json`);
      const data = await res.json();
      const city = data.address.city || data.address.town || data.address.village || 'Nearby Area';
      document.getElementById('locationValue').textContent = `${city}, ${data.address.state || ''}`;
      showToast(`Location set to ${city}`, '✅');
      closeLocationModal();

      // If user was looking for nearby, refresh
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if (q === 'nearby') runSearch();

    } catch (e) {
      document.getElementById('locationValue').textContent = `${userCoords.lat.toFixed(4)}, ${userCoords.lon.toFixed(4)}`;
      closeLocationModal();
    }
  }, (error) => {
    console.error('Geolocation error:', error);
    showToast('Failed to get location. Please enable GPS.', '❌');
  });
}

async function searchManualLocation(query) {
  const container = document.getElementById('locationSuggestions');
  if (!query || query.length < 3) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-muted)">Searching...</div>';

  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=5`);
    const data = await res.json();

    container.innerHTML = '';
    if (data.length === 0) {
      container.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-muted)">No places found.</div>';
      return;
    }

    data.forEach(place => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.innerHTML = `<span class="suggestion-icon">📍</span> ${place.display_name}`;
      div.onclick = () => selectManualLocation(place.lat, place.lon, place.display_name);
      container.appendChild(div);
    });
  } catch (e) {
    container.innerHTML = '<div style="padding:10px; font-size:12px; color:var(--text-muted)">Search failed.</div>';
  }
}

function selectManualLocation(lat, lon, displayName) {
  userCoords = { lat: parseFloat(lat), lon: parseFloat(lon) };

  // Format display name (usually too long)
  const parts = displayName.split(',');
  const label = parts[0] + (parts[1] ? ', ' + parts[1] : '');

  document.getElementById('locationValue').textContent = label;
  showToast('Location updated!', '✅');
  closeLocationModal();

  // Refresh search if needed
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  if (q === 'nearby') runSearch();
}

async function handleNearbySearch() {
  if (!userCoords) {
    openLocationModal();
    showToast('Please set your location first!', '📍');
    return;
  }
  runSearch();
}

async function runSearch() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  const rating = document.getElementById('ratingFilter').value || '';
  const status = document.getElementById('statusFilter').value || '';
  const sort = document.getElementById('sortFilter').value || '';
  const countEl = document.getElementById('resultsCount');

  // New logic: If search is "nearby" and we have coords, use Overpass
  if ((q === 'nearby') && userCoords) {
    return fetchNearbyFromOSM(userCoords.lat, userCoords.lon);
  }

  try {
    const url = `${API_URL}/search/restaurants?q=${q}&rating=${rating}&status=${status}&sort=${sort}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();

    if (result.success) {
      renderRestaurants(result.data);
      if (countEl) countEl.textContent = `${result.data.length} restaurants found`;
    }
  } catch (err) {
    console.error('Search error:', err);
  }
}

async function fetchNearbyFromOSM(lat, lon) {
  const grid = document.getElementById('restaurantGrid');
  const countEl = document.getElementById('resultsCount');

  // Show Skeleton Loaders
  grid.innerHTML = Array.from({ length: 6 }).map(() => `
    <div class="skeleton-card">
        <div class="skeleton-image skeleton"></div>
        <div class="skeleton-text skeleton" style="width: 70%"></div>
        <div class="skeleton-text skeleton" style="width: 40%; height: 10px;"></div>
    </div>
  `).join('');

  try {
    const response = await fetch(`${API_URL}/search/nearby?lat=${lat}&lng=${lon}`, {
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await response.json();

    if (result.success) {
      renderRestaurants(result.data);
      if (countEl) countEl.textContent = `${result.data.length} spots found near you`;
    }
  } catch (error) {
    console.error('Nearby API error:', error);
    showToast('Failed to fetch nearby spots', '❌');
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px">Search failed. Try again later.</div>';
  }
}



function renderRestaurants(list) {
  const grid = document.getElementById('restaurantGrid');
  grid.innerHTML = '';

  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--text-muted)">
            <div style="font-size:48px;margin-bottom:12px">🍽️</div>
            <div style="font-size:16px;font-weight:500">No restaurants found</div>
        </div>`;
    return;
  }

  list.forEach((r, idx) => {
    const card = document.createElement('div');
    card.className = 'resto-card';
    card.style.animationDelay = `${idx * 0.06}s`;

    const ratingNum = parseFloat(r.avg_rating || 0);
    const reviewsCount = parseInt(r.reviews_count || 0);

    const ratingHtml = ratingNum > 0
      ? `<div class="stars">${renderStars(ratingNum)}</div>
           <span class="resto-rating-num">${ratingNum.toFixed(1)}</span>
           <span style="font-size:12px;color:var(--text-muted);margin-left:5px">(${reviewsCount})</span>`
      : `<span style="font-size:12px;color:var(--text-muted);opacity:0.8">No reviews yet</span>`;

    const locationHtml = r.location && r.location !== 'Address not available'
      ? `<div class="resto-location">📍 ${r.location}</div>`
      : '';

    card.innerHTML = `
            <div class="resto-image-wrap">
                <img class="resto-image" src="${getRestaurantImageUrl(r.image, r.category)}" alt="${r.name}" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7ed9d42c7b'" loading="lazy" />
                <button class="save-resto-btn" onclick="event.stopPropagation(); toggleSaveResto(${r.id})">🤍</button>
            </div>
            <div class="resto-body">
                <div class="resto-name">${r.name}</div>
                <div class="resto-cuisine">${r.category || 'Casual'}</div>
                <div class="resto-rating-row">
                    ${ratingHtml}
                </div>
                ${locationHtml}
            </div>
        `;
    card.addEventListener('click', () => {
      window.location.href = `restaurant.html?name=${encodeURIComponent(r.name)}`;
    });
    grid.appendChild(card);
  });
}

async function toggleSaveResto(id) {
  if (CURRENT_USER.role === 'guest') return showToast('Login to save spots!', '🔒');
  try {
    const res = await fetch(`${API_URL}/social/favorite/${id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${TOKEN}` }
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, '🔖');
    }
  } catch (err) { showToast('Action failed', '❌'); }
}

function openRestoModal(r) {
  document.getElementById('modalImg').src = getRestaurantImageUrl(r.image, r.category);
  document.getElementById('modalName').textContent = r.name;
  document.getElementById('modalBody').innerHTML = `
        <div class="modal-row">📍 ${r.location}</div>
        <div class="modal-row">🍴 ${r.category || 'Casual'}</div>
        <p style="margin-top:15px; font-size:14px; color:var(--text-secondary)">${r.description || 'No description available for this restaurant.'}</p>
        <div style="display:flex; gap:10px; margin-top:20px">
            <button class="btn btn-primary" onclick="sessionStorage.setItem('tmp_osm_resto', JSON.stringify(${JSON.stringify(r).replace(/"/g, '&quot;')})); window.location.href='create-post.html?restaurantId=${r.id}'">✍️ Write Review</button>
        </div>
    `;
  document.getElementById('restoModal').classList.add('open');
}

function closeRestoModal() {
  document.getElementById('restoModal').classList.remove('open');
}

document.getElementById('restoModal').addEventListener('click', function (e) {
  if (e.target === this) closeRestoModal();
});

function debounce(func, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
}

// ── Reset all filters ──
function resetFilters() {
  document.getElementById('ratingFilter').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('sortFilter').value = 'rating';
  document.getElementById('searchInput').value = '';
  runSearch();
  showToast('Filters reset', '↺');
}

// ── Grid / List view toggle ──
function setView(type) {
  const grid = document.getElementById('restaurantGrid');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  if (type === 'grid') {
    grid.className = 'restaurant-grid';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  } else {
    grid.className = 'restaurant-list';
    gridBtn.classList.remove('active');
    listBtn.classList.add('active');
  }
}
