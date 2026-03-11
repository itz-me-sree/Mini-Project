/* ========================================
   GUEST MODE INTERACTION LOGIC
   ======================================== */

/**
 * Injects the Guest Login Modal into the DOM if it doesn't exist
 * and shows it with an optional customized message.
 */
function showGuestLoginModal(message = "Please login to continue enjoying Foodie 🍔") {
    let modal = document.getElementById('guestLoginModal');

    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'guestLoginModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal guest-modal">
                <div class="modal-content">
                    <div class="guest-modal-icon">🔒</div>
                    <h2>Login Required</h2>
                    <p id="guestModalMessage">${message}</p>
                    <div class="guest-modal-actions">
                        <a href="login.html" class="btn btn-primary">Login Now</a>
                        <a href="signup.html" class="btn btn-secondary">Sign Up</a>
                        <button class="btn-text" onclick="closeGuestModal()">Maybe Later</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } else {
        document.getElementById('guestModalMessage').textContent = message;
    }

    // Trigger reflow for animation
    modal.offsetHeight;
    modal.classList.add('open');
}

function closeGuestModal() {
    const modal = document.getElementById('guestLoginModal');
    if (modal) modal.classList.remove('open');
}

/**
 * Initializes the "Browsing as Guest" banner if user is not authenticated.
 */
function initGuestBanner() {
    if (isAuthenticated()) return;

    const banner = document.createElement('div');
    banner.className = 'guest-banner';
    banner.innerHTML = `
        <div class="guest-banner-content">
            <span>👋 You are browsing as a <strong>Guest</strong>. Sign in to like, comment and follow!</span>
            <div class="guest-banner-actions">
                <a href="login.html">Login</a>
                <a href="signup.html" class="highlight">Join Foodie</a>
            </div>
        </div>
    `;
    document.body.prepend(banner);
    document.body.classList.add('with-guest-banner');
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    initGuestBanner();
});
