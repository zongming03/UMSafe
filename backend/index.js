import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDBAndStartServer from './config/db.js';
import complaintRoutes from './routes/complaintRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';  
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import userRoutes from './routes/userRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

//Middleware
app.use(express.json());
app.use(cors({ origin: true, credentials: true, }));

//Connect to MongoDB
connectDBAndStartServer(app);

//Test route
// Test route to check if the server is running
app.get('/api/test', (req, res) => {
res.json({ message: 'Hello from backend!' });
});


// Basic route`
app.get("/", (req, res) => {
   console.log("UMSafe backend is running!");
});

//Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

app.use("/uploads", express.static("uploads"));


app.use('/admin/auth', authRoutes);
app.use('/admin/complaints', complaintRoutes);
// app.use('/api/analytics', analyticsRoutes);
app.use('/admin/rooms', roomRoutes);
app.use('/admin/users', userRoutes);
app.use('/admin/profile', profileRoutes);
app.use('/admin/categories', categoryRoutes);
app.use('/admin/usersMobile', mobileRoutes);
