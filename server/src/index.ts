import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { initSocket } from './socket';
import authRoutes from './routes/auth';
import meetingRoutes from './routes/meeting';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetings', meetingRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Initialize Socket.io
initSocket(server);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student-meeting')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('MongoDB connection error. (Socket features will still work!):', err.message);
  });

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
