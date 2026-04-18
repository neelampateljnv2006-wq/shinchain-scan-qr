const API = '';

// Function to switch between "Generate QR" and "History" tabs
window.showSection = function(sectionId) {
    // Hide all internal sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    // Show the targeted section
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

// Generate QR Code Logic
document.getElementById('qrForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    const duration = document.getElementById('duration').value;
    
    try {
        const res = await fetch(`${API}/api/teacher/create-session`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subject, validMinutes: duration })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            document.getElementById('qrResult').innerHTML = `
                <h3>${data.subject}</h3>
                <img src="${data.qrCode}" style="max-width: 100%; border: 10px solid white; border-radius: 10px;">
                <p>Scan this to mark attendance</p>
            `;
        } else {
            alert(data.error || 'Failed to generate QR');
        }
    } catch (err) {
        console.error(err);
        alert('Connection error');
    }
});

// Logout Function
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Load name and setup UI on start
window.onload = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) document.getElementById('teacherName').innerText = user.name;
    
    // Check if token exists, otherwise redirect to login
    if (!localStorage.getItem('token')) {
        window.location.href = 'login.html';
    }

    showSection('generateSection'); // Default view
};