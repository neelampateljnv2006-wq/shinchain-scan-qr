const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the database file path is absolute and correct for Linux/Railway
// Using path.resolve helps prevent path-related startup crashes
const dbPath = path.resolve(__dirname, 'attendance.db');

// Optional: Check if the file exists or is writable (helpful for debugging logs)
console.log(`Database path: ${dbPath}`);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
    } else {
        console.log('✅ Connected to the SQLite database.');
        // Enable Foreign Keys for SQLite (Important for your table relationships)
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Initialize tables
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT CHECK(role IN ('teacher', 'student')) NOT NULL,
            name TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            teacher_id INTEGER NOT NULL,
            subject TEXT NOT NULL,
            qr_token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (teacher_id) REFERENCES users(id)
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            marked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES sessions(id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            UNIQUE(session_id, student_id)
        )
    `);
});

module.exports = db;