const API = '';

// Function to switch between tabs and load data
window.showSection = function(sectionId) {
    // Hide all internal sections
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the targeted section
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        
        // NEW: If teacher clicks history, go fetch the data from server
        if (sectionId === 'historySection') {
            loadHistory();
        }
    }
}

// NEW FUNCTION: Fetch history and student counts from the database
async function loadHistory() {
    const list = document.getElementById('sessionList');
    if (!list) return;

    list.innerHTML = '<p style="text-align:center;">Loading history...</p>';

    try {
        const res = await fetch(`${API}/api/teacher/sessions`, {
            headers: { 
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            }
        });
        const sessions = await res.json();

        if (!res.ok) throw new Error(sessions.error || 'Failed to fetch');

        if (sessions.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding: 20px;">No sessions found yet. Generate a QR to start!</p>';
            return;
        }

        // Generate the HTML for each session card
        list.innerHTML = sessions.map(s => `
            <div style="background: #ffffff; padding: 15px; margin-bottom: 12px; border-radius: 10px; border-left: 6px solid #6c5ce7; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="flex: 1;">
                        <strong style="font-size: 1.1em; color: #2d3436;">${s.subject}</strong><br>
                        <small style="color: #636e72;">${new Date(s.created_at).toLocaleString()}</small>
                    </div>
                    <div style="text-align: right;">
                        <div style="background: #efecff; color: #6c5ce7; padding: 4px 12px; border-radius: 15px; font-weight: bold; font-size: 0.9em;">
                            ${s.attendance_count} Present
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color:red; text-align:center;">⚠️ Failed to load history. Please try again.</p>';
    }
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
                <div style="margin-top:20px; padding:15px; background:#f9f9f9; border-radius:10px;">
                    <h3 style="margin-bottom:10px;">${data.subject}</h3>
                    <img src="${data.qrCode}" style="width: 200px; border: 5px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <p style="margin-top:10px; font-size:0.9em; color:#666;">Students can now scan this code.</p>
                </div>
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
    localStorage.clear();
    window.location.href = 'login.html';
}

// Load name and setup UI on start
window.onload = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || token === 'undefined') {
        window.location.href = 'login.html';
        return; 
    }

    if (user.name) {
        document.getElementById('teacherName').innerText = user.name;
    }

    showSection('generateSection');
};