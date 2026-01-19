// API base URL - use relative paths for dev (Vite proxy), absolute for production
const API_BASE = import.meta.env.VITE_API_URL || '';

// DOM Elements
const views = {
    login: document.getElementById('login-view'),
    welcome: document.getElementById('welcome-view'),
    denied: document.getElementById('denied-view'),
    loading: document.getElementById('loading-view')
};

const elements = {
    googleSignInBtn: document.getElementById('google-signin-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    backBtn: document.getElementById('back-btn'),
    registerForm: document.getElementById('register-form'),
    registerEmail: document.getElementById('register-email'),
    registerMessage: document.getElementById('register-message'),
    userAvatar: document.getElementById('user-avatar'),
    userName: document.getElementById('user-name'),
    userEmail: document.getElementById('user-email'),
    deniedEmail: document.getElementById('denied-email')
};

// View Management
function showView(viewName) {
    Object.values(views).forEach(view => view.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

// Check authentication status on page load
async function checkAuth() {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const error = urlParams.get('error');

    // Clear URL params
    if (authStatus || error) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle OAuth callback results
    if (authStatus === 'success') {
        showView('loading');
        await fetchUserAndShow();
        return;
    }

    if (authStatus === 'denied') {
        showView('loading');
        await fetchUserAndShowDenied();
        return;
    }

    if (error) {
        showMessage('Authentication failed. Please try again.', 'error');
        showView('login');
        return;
    }

    // Check existing session
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            if (data.isWhitelisted) {
                showWelcome(data.user);
            } else {
                showDenied(data.user.email);
            }
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showView('login');
    }
}

async function fetchUserAndShow() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated && data.isWhitelisted) {
            showWelcome(data.user);
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Fetch user failed:', error);
        showView('login');
    }
}

async function fetchUserAndShowDenied() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (data.authenticated) {
            showDenied(data.user.email);
        } else {
            showView('login');
        }
    } catch (error) {
        console.error('Fetch user failed:', error);
        showView('login');
    }
}

function showWelcome(user) {
    elements.userAvatar.src = user.picture || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name);
    elements.userName.textContent = user.name;
    elements.userEmail.textContent = user.email;
    showView('welcome');
}

function showDenied(email) {
    elements.deniedEmail.textContent = email;
    showView('denied');
}

function showMessage(text, type) {
    elements.registerMessage.textContent = text;
    elements.registerMessage.className = 'message ' + type;
}

// Event Handlers
elements.googleSignInBtn.addEventListener('click', () => {
    window.location.href = `${API_BASE}/auth/google`;
});

elements.logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        showView('login');
        showMessage('', '');
    } catch (error) {
        console.error('Logout failed:', error);
    }
});

elements.backBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        showView('login');
    } catch (error) {
        console.error('Logout failed:', error);
        showView('login');
    }
});

// Bonus: Email Registration
elements.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = elements.registerEmail.value.trim();

    if (!email) {
        showMessage('Please enter an email address', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/whitelist`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email }),
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            showMessage('Email registered! You can now sign in.', 'success');
            elements.registerEmail.value = '';
        } else {
            showMessage(data.error || 'Failed to register email', 'error');
        }
    } catch (error) {
        console.error('Registration failed:', error);
        showMessage('Failed to register. Please try again.', 'error');
    }
});

// Initialize
checkAuth();
