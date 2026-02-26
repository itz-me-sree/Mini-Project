/* ── Create Post JS ── */
document.addEventListener('DOMContentLoaded', () => {
    buildSidebar('create');
    initStarPickers();
    initRestaurantSearch();
    initDragDrop();
    initVisitOptions();
    updateLivePreview();
});

// ── State ──
let currentStep = 1;
let selectedRating = 0;
let selectedRestaurant = null;
let uploadedPhotos = [];
let tags = [];
let isRecommended = true;
let visibility = 'public';

// ── Steps ──
function goToStep(n) {
    if (n === 2 && !validateStep1()) return;
    if (n === 3 && !validateStep2()) return;

    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hidden'));
    document.getElementById(`formStep${n}`).classList.remove('hidden');

    document.querySelectorAll('.step').forEach((s, i) => {
        s.classList.toggle('active', i + 1 === n);
        s.classList.toggle('done', i + 1 < n);
    });
    currentStep = n;
    if (n === 3) buildPreview();
}

function validateStep1() {
    if (!selectedRestaurant) { showToast('Please select a restaurant first', '⚠️'); return false; }
    if (!document.getElementById('dishName').value.trim()) { showToast('Please enter the dish name', '⚠️'); return false; }
    if (selectedRating === 0) { showToast('Please rate your experience', '⭐'); return false; }
    return true;
}

function validateStep2() { return true; }

// ── Restaurant Search ──
function initRestaurantSearch() {
    const input = document.getElementById('restoSearch');
    const dropdown = document.getElementById('restoDropdown');

    input.addEventListener('input', () => {
        const q = input.value.toLowerCase().trim();
        if (!q) { dropdown.classList.remove('visible'); return; }
        const filtered = MOCK_RESTAURANTS.filter(r =>
            r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
        );
        dropdown.innerHTML = '';
        if (!filtered.length) {
            dropdown.innerHTML = `<div style="padding:12px;color:var(--text-muted);font-size:13px">No restaurants found</div>`;
        } else {
            filtered.forEach(r => {
                const opt = document.createElement('div');
                opt.className = 'resto-option';
                opt.innerHTML = `
          <img class="resto-option-img" src="${r.image}" alt="${r.name}" />
          <div>
            <div class="resto-option-name">${r.name}</div>
            <div class="resto-option-meta">${r.cuisine} · ${r.address}</div>
          </div>
          <span class="resto-option-rating">★ ${r.rating}</span>
        `;
                opt.addEventListener('click', () => selectRestaurant(r));
                dropdown.appendChild(opt);
            });
        }
        dropdown.classList.add('visible');
    });

    document.addEventListener('click', e => {
        if (!e.target.closest('#restoSearch') && !e.target.closest('#restoDropdown')) {
            dropdown.classList.remove('visible');
        }
    });
}

function selectRestaurant(r) {
    selectedRestaurant = r;
    document.getElementById('restoSearch').value = '';
    document.getElementById('restoDropdown').classList.remove('visible');
    const card = document.getElementById('selectedRestoCard');
    document.getElementById('selectedRestoImg').src = r.image;
    document.getElementById('selectedRestoName').textContent = r.name;
    document.getElementById('selectedRestoCuisine').textContent = `${r.cuisine} · ${r.address}`;
    card.style.display = 'flex';
    updateLivePreview();
}

function clearSelectedResto() {
    selectedRestaurant = null;
    document.getElementById('selectedRestoCard').style.display = 'none';
    document.getElementById('restoSearch').value = '';
    updateLivePreview();
}

// ── Star Picker ──
function initStarPickers() {
    // Main star picker
    const stars = document.querySelectorAll('.star-pick');
    const ratingLabels = ['😢 Terrible', '😕 Below Average', '😐 Okay', '😊 Good', '🤩 Outstanding!'];
    stars.forEach(star => {
        star.addEventListener('mouseover', () => highlightStars(star.dataset.val));
        star.addEventListener('mouseout', () => highlightStars(selectedRating));
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.val);
            document.getElementById('selectedRating').value = selectedRating;
            document.getElementById('ratingLabel').textContent = ratingLabels[selectedRating - 1];
            document.getElementById('ratingLabel').style.color = 'var(--brand-gold)';
            highlightStars(selectedRating);
            updateLivePreview();
        });
    });

    // Mini star pickers
    ['foodQuality', 'serviceRating', 'ambienceRating', 'valueRating'].forEach(id => {
        initMiniStars(id);
    });
}

function highlightStars(val) {
    document.querySelectorAll('.star-pick').forEach(s => {
        s.classList.toggle('filled', parseInt(s.dataset.val) <= parseInt(val));
    });
}

function initMiniStars(containerId) {
    const container = document.getElementById(containerId);
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mini-star';
        btn.textContent = '★';
        btn.dataset.val = i;
        btn.addEventListener('click', () => {
            container.querySelectorAll('.mini-star').forEach(s => {
                s.classList.toggle('filled', parseInt(s.dataset.val) <= i);
            });
        });
        btn.addEventListener('mouseover', () => {
            container.querySelectorAll('.mini-star').forEach(s => {
                s.classList.toggle('filled', parseInt(s.dataset.val) <= i);
            });
        });
        btn.addEventListener('mouseout', () => {
            const current = container.querySelector('.mini-star.filled:last-of-type');
            // Rerender based on last set value
        });
        container.appendChild(btn);
    }
}

// ── Photo Upload ──
function handlePhotoUpload(event) {
    const files = Array.from(event.target.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => addPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
    });
}

function addPhotoPreview(src) {
    uploadedPhotos.push(src);
    const container = document.getElementById('photoPreviews');
    const thumb = document.createElement('div');
    thumb.className = 'preview-thumb';
    const idx = uploadedPhotos.length - 1;
    thumb.innerHTML = `
    <img src="${src}" alt="Preview" />
    <div class="preview-thumb-remove" onclick="removePhoto(${idx}, this.parentElement)">✕</div>
  `;
    container.appendChild(thumb);
    updateLivePreview();
}

function removePhoto(idx, el) {
    uploadedPhotos.splice(idx, 1);
    el.remove();
    updateLivePreview();
}

function initDragDrop() {
    const zone = document.getElementById('photoDropZone');
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = ev => addPhotoPreview(ev.target.result);
            reader.readAsDataURL(file);
        });
    });
}

// ── Tags ──
function addTag() {
    const input = document.getElementById('tagInput');
    let val = input.value.trim();
    if (!val) return;
    if (!val.startsWith('#')) val = '#' + val;
    if (tags.includes(val)) { showToast('Tag already added', '⚠️'); return; }
    tags.push(val);

    const row = document.getElementById('tagsRow');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${val} <span class="chip-remove" onclick="removeTag('${val}', this.parentElement)">✕</span>`;
    row.appendChild(chip);
    input.value = '';
    updateLivePreview();
}

function removeTag(val, el) {
    tags = tags.filter(t => t !== val);
    el.remove();
    updateLivePreview();
}

document.getElementById('tagInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });

// ── Visit Options ──
function initVisitOptions() {
    document.querySelectorAll('.visit-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.visit-opt').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// ── Recommend ──
function setRecommend(val) {
    isRecommended = val;
    document.getElementById('yesBtn').classList.toggle('active', val);
    document.getElementById('noBtn').classList.toggle('active', !val);
}

// ── Visibility ──
function setVis(btn) {
    document.querySelectorAll('.vis-opt').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visibility = btn.dataset.val;
}

// ── Char Counter ──
function updateCharCount() {
    const len = document.getElementById('reviewText').value.length;
    const el = document.getElementById('charCount');
    el.textContent = `${len} / 500`;
    el.style.color = len > 450 ? 'var(--brand-accent)' : 'var(--text-muted)';
    updateLivePreview();
}

// ── Live Preview ──
function updateLivePreview() {
    const preview = document.getElementById('livePreview');
    const caption = document.getElementById('reviewText')?.value || '';
    const dish = document.getElementById('dishName')?.value || '';
    const photoSrc = uploadedPhotos.length ? uploadedPhotos[0] : (selectedRestaurant ? selectedRestaurant.image : null);

    if (!selectedRestaurant) {
        preview.innerHTML = `<div class="preview-empty"><div style="font-size:40px;margin-bottom:10px">🍽️</div><div style="font-size:13px;color:var(--text-muted)">Select a restaurant to see a preview</div></div>`;
        return;
    }

    preview.innerHTML = `
    <div class="preview-post-header">
      <img class="avatar avatar-sm" src="${CURRENT_USER.avatar}" alt="" />
      <div>
        <div class="preview-user-name">${CURRENT_USER.name}</div>
        <div class="preview-meta">${CURRENT_USER.handle} · Just now</div>
      </div>
    </div>
    ${photoSrc ? `<img class="preview-post-img" src="${photoSrc}" alt="photo" />` : ''}
    <div style="display:flex;align-items:center;justify-content:space-between;margin-top:8px">
      <div class="stars" style="font-size:12px">${renderStars(selectedRating)}</div>
      ${dish ? `<span style="font-size:10px;color:var(--brand-primary);font-weight:600">🍽️ ${dish}</span>` : ''}
    </div>
    <div class="preview-caption" style="margin-top:4px">
      <strong style="color:var(--text-primary)">${CURRENT_USER.handle}</strong>
      ${caption ? ' ' + caption.slice(0, 100) + (caption.length > 100 ? '…' : '') : ' ' + selectedRestaurant.name}
    </div>
    ${tags.length ? `<div style="font-size:10px;color:var(--brand-primary);margin-top:4px">${tags.join(' ')}</div>` : ''}
    <div class="preview-actions">
      <span>❤️ 0</span><span>💬 0</span><span>🔗 Share</span>
    </div>
  `;
}

// ── Build Preview (Step 3) ──
function buildPreview() {
    const section = document.getElementById('postPreview');
    const caption = document.getElementById('reviewText').value;
    if (!caption.trim()) { section.classList.remove('visible'); return; }
    section.classList.add('visible');
    section.innerHTML = `
    <h4 style="font-size:13px;font-weight:700;margin-bottom:10px">Post Preview</h4>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <img class="avatar avatar-sm" src="${CURRENT_USER.avatar}" alt="" />
      <div>
        <div style="font-size:13px;font-weight:600">${CURRENT_USER.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${selectedRestaurant?.name || ''}</div>
      </div>
      <div style="margin-left:auto;font-size:13px;color:var(--brand-gold)">${renderStars(selectedRating)}</div>
    </div>
    <p style="font-size:13px;line-height:1.5;color:var(--text-secondary)">${caption}</p>
  `;
}

// ── Live preview on input ──
document.addEventListener('input', updateLivePreview);

// ── Submit ──
function submitReview(e) {
    e.preventDefault();
    const caption = document.getElementById('reviewText').value.trim();
    if (!caption) { showToast('Please write your review first', '⚠️'); return; }

    const btn = e.submitter;
    btn.textContent = '⏳ Posting…';
    btn.disabled = true;

    setTimeout(() => {
        btn.textContent = '🚀 Post Review';
        btn.disabled = false;
        openSuccessModal();
    }, 1500);
}

function openSuccessModal() {
    document.getElementById('successModal').classList.add('open');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
    if (id === 'successModal') resetForm();
}

function resetForm() {
    goToStep(1);
    selectedRestaurant = null;
    selectedRating = 0;
    uploadedPhotos = [];
    tags = [];
    document.getElementById('selectedRestoCard').style.display = 'none';
    document.getElementById('dishName').value = '';
    document.getElementById('reviewText').value = '';
    document.getElementById('photoPreviews').innerHTML = '';
    document.getElementById('tagsRow').innerHTML = '';
    document.getElementById('ratingLabel').textContent = 'Tap to rate';
    highlightStars(0);
    updateLivePreview();
}

document.getElementById('successModal').addEventListener('click', function (e) {
    if (e.target === this) closeModal('successModal');
});
