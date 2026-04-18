// This runs in your BROWSER
const API = '';

// Function to switch between "Generate QR" and "History" tabs
window.showSection = function(sectionId) {
    document.querySelectorAll('.card').forEach(card => {
        card.style.display = 'none';
    });
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
}

// Generate QR Code Logic
document.getElementById('qrForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('subject').value;
    
    try {
        const res = await fetch(`${API}/api/teacher/create-session`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ subject })
        });
        const data = await res.json();
        if (res.ok) {
            document.getElementById('qrResult').innerHTML = `<img src="${data.qrCode}">`;
        }
    } catch (err) {
        alert('Error generating QR');
    }
});

// Load name on start
window.onload = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) document.getElementById('teacherName').innerText = user.name;
    showSection('generate-qr'); // Default view
};