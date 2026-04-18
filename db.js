const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ensure the database file path is absolute for Railway
const dbPath = path.resolve(__dirname, 'attendance.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Database connection error:', err.message);
    } else {
        console.log('✅ Connected to SQLite database.');
        db.run('PRAGMA foreign_keys = ON'); // Enable relational links
    }
});

db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('teacher', 'student')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Sessions Table (Teacher creates these)
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        teacher_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        qr_token TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )`);

    // 3. Attendance Table (Students mark these)
    // ADDED: Better handling for the UNIQUE constraint
    db.run(`CREATE TABLE IF NOT EXISTS attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER NOT NULL,
        student_id INTEGER NOT NULL,
        marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        FOREIGN KEY (student_id) REFERENCES users(id),
        CONSTRAINT unique_attendance UNIQUE(session_id, student_id)
    )`);
});

module.exports = db;