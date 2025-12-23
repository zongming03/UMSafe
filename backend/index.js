import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './config/db.js';
import complaintRoutes from './routes/complaintRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';  
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import testEmailRoutes from './routes/testEmailRoutes.js';
import { initSocket } from './realtime/socket.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(express.json());

// CORS configuration - allows both localhost and ngrok
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Allow localhost and your specific ngrok URLs
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'https://01f0ccd1151d.ngrok-free.app',
    ];
    
    // Allow any origin that starts with http://localhost or ends with ngrok domains
    if (allowedOrigins.includes(origin) || 
        origin.startsWith('http://localhost') || 
        origin.endsWith('.ngrok-free.app') ||
        origin.endsWith('.ngrok.app') ||
        origin.endsWith('.ngrok.io')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
};

app.use(cors(corsOptions));

// Explicit preflight handler for all routes
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, ngrok-skip-browser-warning');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

//Test route
// Test route to check if the server is running
app.get('/api/test', (req, res) => {
res.json({ message: 'Hello from backend!' });
});


// Basic route`
app.get("/", (req, res) => {
   console.log("UMSafe backend is running!");
});

app.use("/uploads", express.static("uploads"));


app.use('/admin/auth', authRoutes);
app.use('/admin/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/admin/rooms', roomRoutes);
app.use('/admin/users', userRoutes);
app.use('/admin/profile', profileRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/usersMobile', mobileRoutes);

// Test email routes (only for development/testing)
if (process.env.NODE_ENV !== 'production') {
  app.use('/admin/test-emails', testEmailRoutes);
  console.log('🧪 Email testing endpoints enabled at /admin/test-emails');
}

const server = http.createServer(app);
initSocket(server);

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
