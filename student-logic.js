const API = '';
let html5QrCode;

// NAVIGATION: Switch between Scan and History
window.showSection = function(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(sectionId);
    if (target) {
        target.style.display = 'block';
        if (sectionId === 'historySection') loadHistory();
    }
};

// SCANNER: Start Camera
window.startScanner = function() {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';

    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
    .catch(err => {
        alert("Camera access denied. Please allow camera permissions.");
        window.stopScanner();
    });
};

window.stopScanner = function() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('startBtn').style.display = 'block';
            document.getElementById('stopBtn').style.display = 'none';
        }).catch(() => {
            // Handle cases where scanner is already stopped
            document.getElementById('startBtn').style.display = 'block';
            document.getElementById('stopBtn').style.display = 'none';
        });
    }
};

async function onScanSuccess(decodedText) {
    // Stop camera immediately after successful scan
    await html5QrCode.stop();
    document.getElementById('startBtn').style.display = 'block';
    document.getElementById('stopBtn').style.display = 'none';

    try {
        const qrData = JSON.parse(decodedText);
        const res = await fetch(`${API}/api/student/mark-attendance`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ sessionId: qrData.sessionId, token: qrData.token })
        });
        
        const data = await res.json();
        if (res.ok) {
            alert("✅ Attendance Marked: " + data.subject);
        } else {
            alert("❌ " + data.error);
        }
    } catch (e) {
        alert("⚠️ This is not a valid Attendance QR Code");
    }
}

// HISTORY: Load previous attendance
async function loadHistory() {
    const list = document.getElementById('attendanceList');
    list.innerHTML = 'Loading...';
    
    try {
        const res = await fetch(`${API}/api/student/my-attendance`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const records = await res.json();
        
        list.innerHTML = records.map(r => `
            <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 5px solid #4834d4;">
                <strong>${r.subject}</strong><br>
                <small>${new Date(r.marked_at).toLocaleString()}</small>
            </div>
        `).join('') || 'No records found.';
    } catch (err) {
        list.innerHTML = 'Error loading history.';
    }
}

window.logout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

window.onload = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!token) { window.location.href = 'login.html'; return; }
    if (user.name) document.getElementById('studentName').innerText = user.name;
    showSection('scanSection');
};