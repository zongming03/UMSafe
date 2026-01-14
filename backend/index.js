import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import connectDB from './config/db.js';
import complaintRoutes from './routes/complaintRoutes.js';
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import facultyCategoryRoutes from './routes/facultyCategoryRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import { authMiddleware } from './middleware/authMiddleware.js';
import { initSocket } from './realtime/socket.js';
import { registerPartnerProxy } from './routes/partnerProxy.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// CORS Configuration - Allow frontend to access backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
app.use('/admin/auth', authRoutes);
app.use('/admin/complaints', complaintRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/admin/rooms', roomRoutes);
app.use('/admin/users', userRoutes);
app.use('/admin/profile', profileRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/faculty-categories', facultyCategoryRoutes);
app.use('/admin/mobile', mobileRoutes);
app.use('/admin/upload', uploadRoutes);

// Partner API Proxy - handles /admin/reports and /admin/mobileAdmin
// Apply auth middleware to proxy routes
app.use('/admin/reports', authMiddleware);
app.use('/admin/mobileAdmin', authMiddleware);
const PARTNER_API_BASE_URL = (process.env.PARTNER_API_BASE_URL || '').trim();
registerPartnerProxy(app, PARTNER_API_BASE_URL);

// Initialize HTTP server and Socket.IO
const server = http.createServer(app);
initSocket(server);

// Start server
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
