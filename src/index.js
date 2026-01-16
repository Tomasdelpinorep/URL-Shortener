const express = require('express');
const dotenv = require('dotenv');
const urlRoutes = require('./routes/urlRoutes');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Routes
app.use('/api', urlRoutes);
app.use('/api/auth', authRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});