import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import { createAppointmentRouter } from './routes/appointmentRoutes.js';
import { createPrescriptionRouter } from './routes/prescriptionRoutes.js';
import { createReminderRouter } from './routes/reminderRoutes.js';
import { createEmergencyRouter } from './routes/emergencyRoutes.js';
import { createTeleconsultRouter } from './routes/teleconsultRoutes.js';
import pharmacyRoutes from './routes/pharmacyRoutes.js';
import { createAshaRouter } from './routes/ashaRoutes.js';
import { createReferralRouter } from './routes/referralRoutes.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io for real-time OPD queue sync, buzzer, and emergency broadcasts
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'SehatSetu Rural Healthcare Access Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api', authRoutes);
app.use('/api', createAppointmentRouter(io));
app.use('/api', createPrescriptionRouter(io));
app.use('/api', createReminderRouter(io));
app.use('/api', createEmergencyRouter(io));
app.use('/api', createTeleconsultRouter(io));
app.use('/api', pharmacyRoutes);
app.use('/api', createAshaRouter(io));
app.use('/api', createReferralRouter(io));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal Server Error' });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏥 SehatSetu Backend API Running on http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Server Active on port ${PORT}`);
  console.log(`=======================================================`);
});
