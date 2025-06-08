import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDBAndStartServer from './config/db.js';
// import complaintRoutes from './routes/complaintRoutes.js';
// import analyticsRoutes from './routes/analyticsRoutes.js';  
import roomRoutes from './routes/roomRoutes.js';
// import userRoutes from './routes/userRoutes.js';
// import categoryRoutes from './routes/categoryRoutes.js';


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

// app.use('/api/complaints', complaintRoutes);
// app.use('/api/analytics', analyticsRoutes);
app.use('/api/rooms', roomRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/categories', categoryRoutes);