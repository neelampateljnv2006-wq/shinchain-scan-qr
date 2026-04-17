require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// --- Internal Routes & Database ---
// FIXED: Changed this line to extract 'router' and rename it to 'authRoutes'
const { router: authRoutes } = require('./auth'); 
const db = require('./db');                
const teacherRoutes = require('./teacher'); 
const studentRoutes = require('./student'); 

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// Serves CSS, JS, and Images from the root folder
app.use(express.static(path.join(__dirname, '.')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// --- Frontend Routing ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Server Start ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is successfully running on port ${PORT}`);
});