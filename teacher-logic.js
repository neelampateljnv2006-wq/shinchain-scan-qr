const API = '';

// Function to switch between tabs and load data
window.showSection = function(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(section => {
        section.style.display = 'none';
    });
    
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        if (sectionId === 'historySection') {
            loadHistory();
        }
    }
}

// Fetch history and student counts
window.loadHistory = async function() {
    const list = document.getElementById('sessionList');
    const downloadBtn = document.getElementById('downloadBtn');
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
            list.innerHTML = '<p style="text-align:center; padding: 20px;">No sessions found yet.</p>';
            if (downloadBtn) downloadBtn.style.display = 'none';
            return;
        }

        // Show download button if data exists
        if (downloadBtn) downloadBtn.style.display = 'block';

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
        list.innerHTML = '<p style="color:red; text-align:center;">⚠️ Failed to load history.</p>';
    }
}

// NEW: Safe function to download history as CSV
window.downloadHistory = async function() {
    try {
        const res = await fetch(`${API}/api/teacher/sessions`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const sessions = await res.json();

        if (!sessions || sessions.length === 0) {
            alert("No data available to download.");
            return;
        }

        // Create CSV Header and Rows
        let csvContent = "Subject,Date,Time,Students Present\n";
        sessions.forEach(s => {
            const d = new Date(s.created_at);
            const date = d.toLocaleDateString().replace(/,/g, '');
            const time = d.toLocaleTimeString().replace(/,/g, '');
            csvContent += `"${s.subject}","${date}","${time}","${s.attendance_count}"\n`;
        });

        // Trigger safe browser download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Attendance_Report_${new Date().toLocaleDateString()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        alert("Download failed. Please check your connection.");
    }
};

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
        alert('Connection error');
    }
});

window.logout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
}

window.onload = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token || token === 'undefined') {
        window.location.href = 'login.html';
        return; 
    }
    if (user.name) document.getElementById('teacherName').innerText = user.name;
    showSection('generateSection');
};