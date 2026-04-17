// Leave API empty for production so it uses the same domain
const API = '';

// Handle Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showMessage(data.error || 'Login failed', 'error');
            return;
        }
        
        // Save session data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // FIXED: Redirecting without the leading slash for better compatibility
        if (data.user.role === 'teacher') {
            window.location.href = 'teacher-dashboard.html';
        } else {
            window.location.href = 'student-scan.html';
        }
    } catch (err) {
        showMessage('Connection error: Server might be offline', 'error');
    }
});

// Handle Registration
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;
    
    try {
        const res = await fetch(`${API}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            showMessage(data.error || 'Registration failed', 'error');
            return;
        }
        
        showMessage('Registration successful! Please login.', 'success');
        
        // Hide modal and reset form
        if(typeof hideRegister === 'function') {
            hideRegister();
        } else {
            document.getElementById('registerModal').style.display = 'none';
        }
        document.getElementById('registerForm').reset();
    } catch (err) {
        showMessage('Connection error during registration', 'error');
    }
});

// Toggle functions
function showRegister() {
    document.getElementById('registerModal').style.display = 'block';
    // Hide the login form card if it exists
    const loginCard = document.querySelector('.card');
    if (loginCard) loginCard.style.display = 'none';
}

function hideRegister() {
    document.getElementById('registerModal').style.display = 'none';
    const loginCard = document.querySelector('.card');
    if (loginCard) loginCard.style.display = 'block';
}

// Utility to show messages
function showMessage(text, type) {
    const el = document.getElementById('message');
    if (!el) return;
    el.className = `message ${type}`;
    el.textContent = text;
    el.style.display = 'block';
    el.style.padding = '10px';
    el.style.marginBottom = '10px';
    el.style.borderRadius = '5px';
    el.style.textAlign = 'center';
    
    // Set colors based on type
    el.style.backgroundColor = type === 'error' ? '#fee2e2' : '#dcfce7';
    el.style.color = type === 'error' ? '#991b1b' : '#166534';

    setTimeout(() => el.style.display = 'none', 5000);
}

// Redirect if already logged in (Check on page load)
window.addEventListener('load', () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    // Check current path to avoid infinite redirect loops
    const currentPath = window.location.pathname;
    if (token && user && (currentPath.includes('login.html') || currentPath === '/')) {
        window.location.href = user.role === 'teacher' ? 'teacher-dashboard.html' : 'student-scan.html';
    }
});