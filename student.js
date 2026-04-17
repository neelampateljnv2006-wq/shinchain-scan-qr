const express = require('express');
const db = require('./db');
// FIXED: Path changed to './auth' and using the correct function name 'authenticate'
const { authenticate } = require('./auth'); 

const router = express.Router();

// FIXED: Using 'authenticate' middleware
router.use(authenticate);

// Middleware to check role (Optional but safer)
const requireRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Students only' });
    }
};

router.use(requireRole('student'));

// Mark attendance by scanning QR
router.post('/mark-attendance', (req, res) => {
    const { token, sessionId } = req.body;

    if (!token || !sessionId) {
        return res.status(400).json({ error: 'Token and sessionId required' });
    }

    // Validate session using db.get callback
    db.get('SELECT * FROM sessions WHERE id = ? AND qr_token = ?', [sessionId, token], (err, session) => {
        if (err) {
            return res.status(500).json({ error: 'Database error while checking session' });
        }
        
        if (!session) {
            return res.status(404).json({ error: 'Invalid QR code' });
        }

        // Check expiration
        if (new Date(session.expires_at) < new Date()) {
            return res.status(410).json({ error: 'QR code has expired' });
        }

        // Mark attendance using db.run callback
        const insertSql = 'INSERT INTO attendance (session_id, student_id) VALUES (?, ?)';
        db.run(insertSql, [sessionId, req.user.id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({ error: 'Attendance already marked' });
                }
                return res.status(500).json({ error: 'Failed to mark attendance' });
            }

            res.json({ 
                message: 'Attendance marked successfully',
                subject: session.subject,
                time: new Date().toISOString()
            });
        });
    });
});

// Get student's attendance history
router.get('/my-attendance', (req, res) => {
    const sql = `
        SELECT s.subject, s.created_at as session_date, a.marked_at, u.name as teacher_name
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        JOIN users u ON s.teacher_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.marked_at DESC
    `;

    db.all(sql, [req.user.id], (err, records) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch attendance history' });
        }
        res.json(records);
    });
});

module.exports = router;