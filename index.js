require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path'); // Path is declared once here

// --- Internal Routes & Database ---
const authRoutes = require('./auth');      
const db = require('./db');                
const teacherRoutes = require('./teacher'); 
const studentRoutes = require('./student'); 

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json());

// This tells Express to serve your CSS, JS, and Images from the main folder
app.use(express.static(path.join(__dirname, '.')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// --- Frontend Routing ---
// This serves your index.html for any page refresh or main visit
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// --- Server Start ---
// '0.0.0.0' is critical for Railway to connect to the outside world
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server is successfully running on port ${PORT}`);
});