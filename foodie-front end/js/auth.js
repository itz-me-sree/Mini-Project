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
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            handleAuth(email, 'user', name, username);
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



async function handleAuth(email, role, name = 'Foodie Explorer', username = '') {
    const password = document.getElementById('password').value;

    // For Registration
    if (document.getElementById('signupForm')) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: name, username, email, password })
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem('foodie_session', JSON.stringify(result.data));
                localStorage.setItem('foodie_token', result.data.token);
                window.location.href = 'index.html';
            } else {
                showToast(result.message || 'Registration failed', '❌');
            }
        } catch (err) {
            console.error('Registration Error:', err);
            showToast('Server connection failed. Is the backend running?', '📡');
        }
    }
    // For Login
    else if (document.getElementById('loginForm')) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (result.success) {
                localStorage.setItem('foodie_session', JSON.stringify(result.data));
                localStorage.setItem('foodie_token', result.data.token);
                window.location.href = 'index.html';
            } else {
                showToast(result.message || 'Login failed', '❌');
            }
        } catch (err) {
            console.error('Login Error:', err);
            showToast('Server connection failed. Is the backend running?', '📡');
        }
    }
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
