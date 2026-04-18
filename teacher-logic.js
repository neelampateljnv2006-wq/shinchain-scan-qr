const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('./db');
const { authenticate } = require('./auth'); 

const router = express.Router();

// Apply Authentication Middleware
router.use(authenticate);

// Middleware to strictly enforce Teacher role
const requireRole = (role) => (req, res, next) => {
    if (req.user && req.user.role === role) {
        next();
    } else {
        res.status(403).json({ error: 'Access denied: Teachers only' });
    }
};

router.use(requireRole('teacher'));

/**
 * POST /api/teacher/create-session
 * Generates a unique QR code for a class session
 */
router.post('/create-session', async (req, res) => {
  const { subject, validMinutes = 10 } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  // Create unique security token for this QR
  const qrToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

  const sql = 'INSERT INTO sessions (teacher_id, subject, qr_token, expires_at) VALUES (?, ?, ?, ?)';
  
  try {
      db.run(sql, [req.user.id, subject, qrToken, expiresAt], async function(err) {
          if (err) {
              console.error("DB Error:", err.message);
              return res.status(500).json({ error: 'Failed to create session in database' });
          }

          const sessionId = this.lastID;

          // Encode token and ID into the QR
          const qrData = JSON.stringify({ token: qrToken, sessionId });
          
          try {
              const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
                  width: 300,
                  margin: 2
              });

              res.json({
                  sessionId,
                  qrCode: qrCodeDataUrl,
                  expiresAt,
                  subject,
              });
          } catch (qrErr) {
              res.status(500).json({ error: 'Failed to generate QR image' });
          }
      });
  } catch (err) {
      res.status(500).json({ error: 'Server error' });
  }
});

/**
 * GET /api/teacher/sessions
 * Returns history of all QR sessions created by this teacher
 */
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
      res.json(sessions || []);
  });
});

/**
 * GET /api/teacher/session/:sessionId/attendance
 * Returns list of students who scanned a specific QR
 */
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

module.exports = router;