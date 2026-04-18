const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('./db');
const { authenticate } = require('./auth'); 

const router = express.Router();

router.use(authenticate);

const requireRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Teachers only' });
    }
};

router.use(requireRole('teacher'));

router.post('/create-session', async (req, res) => {
    try {
        // FIX 1: Extract validMinutes and convert to a Number
        let { subject, validMinutes } = req.body;
        
        if (!subject) return res.status(400).json({ error: 'Subject required' });

        // FIX 2: Parse "5 minutes" into just the number 5
        const minutes = parseInt(validMinutes) || 10;

        const qrToken = crypto.randomBytes(32).toString('hex');
        
        // FIX 3: Ensure expiration calculation is stable
        const expiryDate = new Date(Date.now() + minutes * 60 * 1000);
        const expiresAt = expiryDate.toISOString();

        const sql = 'INSERT INTO sessions (teacher_id, subject, qr_token, expires_at) VALUES (?, ?, ?, ?)';
        
        db.run(sql, [req.user.id, subject, qrToken, expiresAt], async function(err) {
            if (err) {
                console.error("Database Insert Error:", err.message);
                return res.status(500).json({ error: 'Database failed to save session' });
            }
            
            const sessionId = this.lastID;
            const qrData = JSON.stringify({ token: qrToken, sessionId });
            
            try {
                // Generate the QR Image
                const qrCodeDataUrl = await QRCode.toDataURL(qrData);
                res.json({ sessionId, qrCode: qrCodeDataUrl, expiresAt, subject });
            } catch (qrErr) {
                console.error("QR Generation Error:", qrErr);
                res.status(500).json({ error: 'Failed to generate QR Image' });
            }
        });
    } catch (globalErr) {
        console.error("Server Crash Prevented:", globalErr);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.get('/sessions', (req, res) => {
    // FIX 4: Ensure column names match your db.js (using created_at)
    const sql = `
        SELECT s.*, COUNT(a.id) as attendance_count 
        FROM sessions s 
        LEFT JOIN attendance a ON s.id = a.session_id 
        WHERE s.teacher_id = ? 
        GROUP BY s.id 
        ORDER BY s.created_at DESC`;
        
    db.all(sql, [req.user.id], (err, sessions) => {
        if (err) {
            console.error("History Fetch Error:", err.message);
            return res.status(500).json({ error: 'Failed to fetch sessions' });
        }
        res.json(sessions || []);
    });
});

module.exports = router;