const API = '';
let html5QrCode;

// Navigation Logic
window.showSection = function(sectionId) {
    document.querySelectorAll('.dashboard-section').forEach(sec => sec.style.display = 'none');
    const target = document.getElementById(sectionId);
    if (target) target.style.display = 'block';
};

// Scanner Logic
window.startScanner = function() {
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('stopBtn').style.display = 'block';

    html5QrCode = new Html5Qrcode("qr-reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess)
    .catch(err => {
        console.error(err);
        alert("Camera access denied or error occurred.");
        stopScanner();
    });
};

window.stopScanner = function() {
    if (html5QrCode) {
        html5QrCode.stop().then(() => {
            document.getElementById('startBtn').style.display = 'block';
            document.getElementById('stopBtn').style.display = 'none';
        });
    }
};

async function onScanSuccess(decodedText) {
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
        alert(res.ok ? "✅ Attendance Marked Successfully!" : "❌ " + data.error);
    } catch (e) {
        alert("⚠️ Invalid QR Code Format");
    }
}

window.logout = function() {
    localStorage.clear();
    window.location.href = 'login.html';
};

window.onload = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (user.name) document.getElementById('studentName').innerText = user.name;
    showSection('scanSection');
};