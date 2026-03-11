/* ── Create Post JS ── */
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('create');
    initStarPickers();
    initMiniStarPickers();
    initRestaurantSearch();
    initVisitOptions();
    checkUrlParams();
});

let selectedRating = 0;
let subRatings = { foodQuality: 0, serviceRating: 0, ambienceRating: 0, valueRating: 0 };
let selectedRestaurant = null;
let selectedFile = null;

async function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const rid = params.get('restaurantId');
    console.log("Initializing Create Post with RestaurantID:", rid);
    if (rid) {
        if (typeof rid === 'string' && rid.startsWith('osm-')) {
            try {
                const osmData = sessionStorage.getItem('tmp_osm_resto');
                if (osmData) {
                    const parsed = JSON.parse(osmData);
                    selectRestaurant(parsed);
                    showToast(`Auto-selected: ${parsed.name}`, '📍');
                    sessionStorage.removeItem('tmp_osm_resto');
                    return;
                }
            } catch (e) {
                console.error("OSM cache read failed", e);
            }
        }

        try {
            const res = await fetch(`${API_URL}/search/restaurants?id=${rid}`);
            const result = await res.json();
            console.log("Restaurant fetch result:", result);
            if (result.success && result.data.length) {
                selectRestaurant(result.data[0]);
                showToast(`Auto-selected: ${result.data[0].name}`, '📍');
            } else {
                console.warn("Restaurant not found for ID:", rid);
            }
        } catch (e) { console.error("Param init failed", e); }
    }
}

// ── Steps ──
function goToStep(n) {
    if (n === 2 && !validateStep1()) return;

    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`formStep${n}`).classList.remove('hidden');

    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.toggle('active', i + 1 === n);
        s.classList.toggle('done', i + 1 < n);
    });
}

function validateStep1() {
    if (!selectedRestaurant) { showToast('Please select a restaurant', '⚠️'); return false; }
    if (selectedRating === 0) { showToast('Please rate your experience', '⭐'); return false; }
    return true;
}

// ── Restaurant Search ──
function initRestaurantSearch() {
    const input = document.getElementById('restoSearch');
    const dropdown = document.getElementById('restoDropdown');

    input.addEventListener('input', async () => {
        const q = input.value.trim();
        if (!q) { dropdown.classList.remove('visible'); return; }

        try {
            const res = await fetch(`${API_URL}/search/restaurants?q=${q}`);
            const result = await res.json();
            if (result.success) {
                dropdown.innerHTML = result.data.map(r => `
                    <div class="resto-option" onclick="selectRestaurant(${JSON.stringify(r).replace(/"/g, '&quot;')})">
                        <img class="resto-option-img" src="${getRestaurantImageUrl(r.image, r.category)}" />
                        <div>
                            <div class="resto-option-name">${r.name}</div>
                            <div class="resto-option-meta">${r.category} · ${r.location}</div>
                        </div>
                    </div>
                `).join('');
                dropdown.classList.add('visible');
            }
        } catch (err) { console.error('Search failed', err); }
    });
}

function selectRestaurant(r) {
    selectedRestaurant = r;
    document.getElementById('restoSearch').value = '';
    document.getElementById('restoDropdown').classList.remove('visible');
    document.getElementById('selectedRestoCard').style.display = 'flex';
    document.getElementById('selectedRestoImg').src = getRestaurantImageUrl(r.image, r.category);
    document.getElementById('selectedRestoName').textContent = r.name;
    document.getElementById('selectedRestoCuisine').textContent = r.category;
}

function clearSelectedResto() {
    selectedRestaurant = null;
    document.getElementById('selectedRestoCard').style.display = 'none';
}

// ── Star Picker ──
function initStarPickers() {
    const stars = document.querySelectorAll('.star-pick');
    stars.forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.val);
            stars.forEach(s => s.classList.toggle('filled', parseInt(s.dataset.val) <= selectedRating));
            document.getElementById('ratingLabel').textContent = [' Terrible', ' Bad', ' Okay', ' Good', ' Amazing!'][selectedRating - 1];
        });
    });
}

function initMiniStarPickers() {
    document.querySelectorAll('.mini-star-row').forEach(row => {
        const id = row.id;
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = 'mini-star';
            star.textContent = '★';
            star.dataset.val = i;
            star.onclick = () => {
                subRatings[id] = i;
                row.querySelectorAll('.mini-star').forEach(s => s.classList.toggle('filled', parseInt(s.dataset.val) <= i));
                buildPreview();
            };
            row.appendChild(star);
        }
    });
}

// ── File Upload ──
function handlePhotoUpload(event) {
    selectedFile = event.target.files[0];
    if (selectedFile) {
        const reader = new FileReader();
        reader.onload = e => {
            document.getElementById('photoPreviews').innerHTML = `
                <div class="preview-thumb">
                    <img src="${e.target.result}" />
                </div>
            `;
        };
        reader.readAsDataURL(selectedFile);
    }
}

function initVisitOptions() {
    document.querySelectorAll('.visit-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.visit-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ── Submit ──
async function submitReview(e) {
    e.preventDefault();
    if (!selectedRestaurant) return;

    const caption = document.getElementById('reviewText').value.trim();
    if (!caption) return showToast('Please write a review', '⚠️');

    const dish_name = document.getElementById('dishName').value.trim();
    const visibility = document.querySelector('.vis-opt.active')?.dataset.val || 'public';
    const recommend = document.getElementById('yesBtn').classList.contains('active');
    const visit_type = document.querySelector('.visit-opt.active')?.dataset.val || 'dine-in';

    const formData = new FormData();
    formData.append('restaurant_id', selectedRestaurant.id);
    formData.append('caption', caption);
    formData.append('rating', selectedRating);
    formData.append('dish_name', dish_name);
    formData.append('tags', JSON.stringify(tags));
    formData.append('recommend', recommend ? 1 : 0);
    formData.append('visibility', visibility);
    formData.append('visit_type', visit_type);
    formData.append('food_rating', subRatings.foodQuality);
    formData.append('service_rating', subRatings.serviceRating);
    formData.append('ambience_rating', subRatings.ambienceRating);
    formData.append('value_rating', subRatings.valueRating);

    if (selectedFile) {
        formData.append('image', selectedFile);
    }

    const btn = e.target.querySelector('button[type="submit"]');
    btn.innerHTML = '⏳ Posting...';
    btn.disabled = true;

    try {
        const res = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        const result = await res.json();
        if (result.success) {
            showToast('Review posted successfully!', '🎉');
            document.getElementById('successModal').classList.add('open');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showToast(result.message, '❌');
            btn.textContent = '🚀 Post Review';
            btn.disabled = false;
        }
    } catch (err) {
        showToast('Submission failed', '❌');
        btn.textContent = '🚀 Post Review';
        btn.disabled = false;
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'successModal') window.location.href = 'index.html';
}

// ── Character counter ──
function updateCharCount() {
    const text = document.getElementById('reviewText').value;
    document.getElementById('charCount').textContent = `${text.length} / 500`;
}

// ── Tags ──
let tags = [];
function addTag() {
    const input = document.getElementById('tagInput');
    const tag = input.value.trim().replace(/^#/, '');
    if (!tag || tags.includes(tag)) { input.value = ''; return; }
    tags.push(tag);
    input.value = '';
    renderTags();
}
function removeTag(tag) {
    tags = tags.filter(t => t !== tag);
    renderTags();
}
function renderTags() {
    document.getElementById('tagsRow').innerHTML = tags.map(t =>
        `<span class="tag-chip">#${t} <button type="button" onclick="removeTag('${t}')">✕</button></span>`
    ).join('');
}

// ── Recommend toggle ──
function setRecommend(val) {
    document.getElementById('yesBtn').classList.toggle('active', val);
    document.getElementById('noBtn').classList.toggle('active', !val);
}

// ── Visibility toggle ──
function setVis(btn) {
    document.querySelectorAll('.vis-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

// ── Live Preview builder ──
function buildPreview() {
    const caption = document.getElementById('reviewText').value.trim();
    const dish_name = document.getElementById('dishName').value.trim();
    const preview = document.getElementById('livePreview');
    const restoName = selectedRestaurant ? selectedRestaurant.name : 'Restaurant';
    const imageHtml = selectedFile
        ? `<img src="${URL.createObjectURL(selectedFile)}" style="width:100%;border-radius:8px;margin-bottom:8px;" />`
        : `<div style="height:100px;background:var(--surface-2);border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:8px;">📷 No photo</div>`;

    const starsHtml = '⭐'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);

    preview.innerHTML = `
        <div style="padding:10px;font-size:13px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div style="font-weight:700;">@${CURRENT_USER.name || 'You'}</div>
                <div style="color:var(--brand-primary); font-weight:600;">${starsHtml}</div>
            </div>
            <div style="color:var(--text-muted);font-size:11px;margin-bottom:4px;">📍 ${restoName}</div>
            ${dish_name ? `<div style="font-weight:600; font-size:14px; margin-bottom:8px;">🍜 ${dish_name}</div>` : ''}
            ${imageHtml}
            <p style="margin-top:6px; color:var(--text-secondary); line-height:1.4;">${caption || 'No review text yet...'}</p>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:8px;">
                ${tags.map(t => `<span style="font-size:11px; color:var(--brand-primary)">#${t}</span>`).join('')}
            </div>
            <div style="margin-top:10px; display:grid; grid-template-columns: 1fr 1fr; gap:5px; font-size:10px; color:var(--text-muted);">
                <div>Food: ${subRatings.foodQuality}/5</div>
                <div>Service: ${subRatings.serviceRating}/5</div>
                <div>Ambience: ${subRatings.ambienceRating}/5</div>
                <div>Value: ${subRatings.valueRating}/5</div>
            </div>
        </div>
    `;
    showToast('Preview updated!', '👁️');
}
