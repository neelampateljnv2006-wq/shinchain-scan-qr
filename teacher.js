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
  const { subject, validMinutes = 10 } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject required' });

  const qrToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + validMinutes * 60 * 1000).toISOString();

  const sql = 'INSERT INTO sessions (teacher_id, subject, qr_token, expires_at) VALUES (?, ?, ?, ?)';
  db.run(sql, [req.user.id, subject, qrToken, expiresAt], async function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create session' });
      const sessionId = this.lastID;
      const qrData = JSON.stringify({ token: qrToken, sessionId });
      const qrCodeDataUrl = await QRCode.toDataURL(qrData);
      res.json({ sessionId, qrCode: qrCodeDataUrl, expiresAt, subject });
  });
});

router.get('/sessions', (req, res) => {
  const sql = `SELECT s.*, COUNT(a.id) as attendance_count FROM sessions s LEFT JOIN attendance a ON s.id = a.session_id WHERE s.teacher_id = ? GROUP BY s.id ORDER BY s.created_at DESC`;
  db.all(sql, [req.user.id], (err, sessions) => {
      if (err) return res.status(500).json({ error: 'Failed to fetch sessions' });
      res.json(sessions);
  });
});

module.exports = router;