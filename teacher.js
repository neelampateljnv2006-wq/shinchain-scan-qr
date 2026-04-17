const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('./db');
// FIXED: Path changed to './auth' and using the correct function name 'authenticate'
const { authenticate } = require('./auth'); 

const router = express.Router();

// FIXED: Using 'authenticate' middleware
router.use(authenticate);

// Middleware to check role
const requireRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Teachers only' });
    }
};

router.use(requireRole('teacher'));

// Create attendance session & generate QR
router.post('/create-session', async (req, res) => {
  const { subject, validMinutes = 10 } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject required' });
  }

  const qrToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

  try {
      // FIXED: Added try-catch and ensured db.run matches your sqlite3 setup
      const sql = 'INSERT INTO sessions (teacher_id, subject, qr_token, expires_at) VALUES (?, ?, ?, ?)';
      db.run(sql, [req.user.id, subject, qrToken, expiresAt], async function(err) {
          if (err) return res.status(500).json({ error: 'Failed to create session' });

          const sessionId = this.lastID;

          // Generate QR code
          const qrData = JSON.stringify({ token: qrToken, sessionId });
          const qrCodeDataUrl = await QRCode.toDataURL(qrData);

          res.json({
            sessionId,
            qrCode: qrCodeDataUrl,
            expiresAt,
            subject,
          });
      });
  } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Get attendance for a session
router.get('/session/:sessionId/attendance', (req, res) => {
  const { sessionId } = req.params;

  db.get('SELECT * FROM sessions WHERE id = ? AND teacher_id = ?', [sessionId, req.user.id], (err, session) => {
      if (err || !session) return res.status(404).json({ error: 'Session not found' });

      const sql = `
        SELECT u.name, u.email, a.marked_at
        FROM attendance a
        JOIN users u ON a.student_id = u.id
        WHERE a.session_id = ?
        ORDER BY a.marked_at`;

      db.all(sql, [sessionId], (err, attendance) => {
          if (err) return res.status(500).json({ error: 'Failed to fetch attendance' });
          res.json({ session, attendance });
      });
  });
});

// Get all sessions for teacher
router.get('/sessions', (req, res) => {
  const sql = `
    SELECT s.*, COUNT(a.id) as attendance_count
    FROM sessions s
    LEFT JOIN attendance a ON s.id = a.session_id
    WHERE s.teacher_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC`;

  db.all(sql, [req.user.id], (err, sessions) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
      res.json(sessions);
  });
});

module.exports = router;