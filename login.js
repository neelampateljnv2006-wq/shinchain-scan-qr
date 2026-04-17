const API = '';

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
      showMessage(data.error, 'error');
      return;
    }
    
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect based on role
    if (data.user.role === 'teacher') {
      window.location.href = '/teacher-dashboard.html';
    } else {
      window.location.href = '/student-scan.html';
    }
  } catch (err) {
    showMessage('Connection error', 'error');
  }
});

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
      showMessage(data.error, 'error');
      return;
    }
    
    showMessage('Registration successful! Please login.', 'success');
    document.getElementById('registerModal').style.display = 'none';
    document.getElementById('registerForm').reset();
  } catch (err) {
    showMessage('Connection error', 'error');
  }
});

function showRegister() {
  const modal = document.getElementById('registerModal');
  modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
}

function showMessage(text, type) {
  const el = document.getElementById('message');
  el.className = `message ${type}`;
  el.textContent = text;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

// Redirect if already logged in
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || 'null');
if (token && user) {
  window.location.href = user.role === 'teacher' ? '/teacher-dashboard.html' : '/student-scan.html';
}
