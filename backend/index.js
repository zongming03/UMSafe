const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true, }));

//Connect to MongoDB
connectDB();


//Test route
// Test route to check if the server is running
app.get('/api/test', (req, res) => {
res.json({ message: 'Hello from backend!' });
});


// Basic route`
app.get("/", (req, res) => {
  res.send("UMSafe backend is running!");
});

//Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

// app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/complaints', require('./routes/complaintRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/rooms', require('./routes/roomRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));