const express = require('express');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('teacher'));

// Create attendance session & generate QR
router.post('/create-session', async (req, res) => {
  const { subject, validMinutes = 10 } = req.body;

  if (!subject) {
    return res.status(400).json({ error: 'Subject required' });
  }

  const qrToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

  const stmt = db.prepare(
    'INSERT INTO sessions (teacher_id, subject, qr_token, expires_at) VALUES (?, ?, ?, ?)'
  );
  const result = stmt.run(req.user.id, subject, qrToken, expiresAt);

  // Generate QR code as data URL
  const qrData = JSON.stringify({
    token: qrToken,
    sessionId: result.lastInsertRowid,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  res.json({
    sessionId: result.lastInsertRowid,
    qrCode: qrCodeDataUrl,
    expiresAt,
    subject,
  });
});

// Get attendance for a session
router.get('/session/:sessionId/attendance', (req, res) => {
  const { sessionId } = req.params;

  const session = db.prepare(
    'SELECT * FROM sessions WHERE id = ? AND teacher_id = ?'
  ).get(sessionId, req.user.id);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const attendance = db.prepare(`
    SELECT u.name, u.email, a.marked_at
    FROM attendance a
    JOIN users u ON a.student_id = u.id
    WHERE a.session_id = ?
    ORDER BY a.marked_at
  `).all(sessionId);

  res.json({ session, attendance });
});

// Get all sessions for teacher
router.get('/sessions', (req, res) => {
  const sessions = db.prepare(`
    SELECT s.*, COUNT(a.id) as attendance_count
    FROM sessions s
    LEFT JOIN attendance a ON s.id = a.session_id
    WHERE s.teacher_id = ?
    GROUP BY s.id
    ORDER BY s.created_at DESC
  `).all(req.user.id);

  res.json(sessions);
});

module.exports = router;
