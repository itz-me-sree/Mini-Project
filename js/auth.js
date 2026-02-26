/* ── Authentication Logic ── */

document.addEventListener('DOMContentLoaded', () => {
    initAuthFlows();
});

function initAuthFlows() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const forgotForm = document.getElementById('forgotForm');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            handleAuth(email, 'user');
        });
    }

    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            handleAuth(email, 'user', name);
        });
    }

    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const adminId = document.getElementById('adminId').value;
            handleAuth(adminId + '@foodie.com', 'admin', 'System Admin');
        });
    }

    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            forgotForm.style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
        });
    }
}

function handleAuth(email, role, name = 'Foodie Explorer') {
    const userData = {
        name: name,
        handle: '@' + (name === 'System Admin' ? 'admin' : name.toLowerCase().split(' ')[0] + '_' + Math.floor(Math.random() * 100)),
        role: role,
        email: email,
        avatar: role === 'admin' ? 'https://i.pravatar.cc/150?img=12' : 'https://i.pravatar.cc/150?img=68',
        level: role === 'admin' ? 99 : 1,
        xp: 0
    };

    localStorage.setItem('foodie_session', JSON.stringify(userData));
    window.location.href = 'index.html';
}

function continueAsGuest() {
    const guestData = {
        name: 'Guest User',
        handle: '@guest',
        role: 'guest',
        avatar: 'https://i.pravatar.cc/150?img=65',
        level: 1,
        xp: 0
    };

    localStorage.setItem('foodie_session', JSON.stringify(guestData));
    window.location.href = 'index.html';
}
