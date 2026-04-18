const express = require('express');
const db = require('./db');
const { authenticate } = require('./auth'); 

const router = express.Router();

// Apply Authentication
router.use(authenticate);

// Middleware to strictly enforce Student role
const requireRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Students only' });
    }
};

router.use(requireRole('student'));

/**
 * POST /api/student/mark-attendance
 * Validates the QR token and records attendance in the DB
 */
router.post('/mark-attendance', (req, res) => {
    const { token, sessionId } = req.body;

    if (!token || !sessionId) {
        return res.status(400).json({ error: 'Invalid QR data' });
    }

    // 1. Verify the session exists and the token matches
    db.get('SELECT * FROM sessions WHERE id = ? AND qr_token = ?', [sessionId, token], (err, session) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!session) return res.status(404).json({ error: 'This QR code is invalid' });

        // 2. Check if the QR has expired
        if (new Date(session.expires_at) < new Date()) {
            return res.status(410).json({ error: 'This QR code has expired' });
        }

        // 3. Insert attendance record
        const insertSql = 'INSERT INTO attendance (session_id, student_id) VALUES (?, ?)';
        db.run(insertSql, [sessionId, req.user.id], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint')) {
                    return res.status(409).json({ error: 'You have already marked attendance for this class' });
                }
                return res.status(500).json({ error: 'Failed to record attendance' });
            }

            res.json({ 
                message: 'Success!',
                subject: session.subject
            });
        });
    });
});

/**
 * GET /api/student/my-attendance
 * Returns all past attendance for the logged-in student
 */
router.get('/my-attendance', (req, res) => {
    const sql = `
        SELECT s.subject, a.marked_at, u.name as teacher_name
        FROM attendance a
        JOIN sessions s ON a.session_id = s.id
        JOIN users u ON s.teacher_id = u.id
        WHERE a.student_id = ?
        ORDER BY a.marked_at DESC`;

    db.all(sql, [req.user.id], (err, records) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch history' });
        res.json(records || []);
    });
});

module.exports = router;