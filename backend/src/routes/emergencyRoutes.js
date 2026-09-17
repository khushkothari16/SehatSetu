import express from 'express';
import { store } from '../db/store.js';

export const createEmergencyRouter = (io) => {
  const router = express.Router();

  // Get active 108 SOS emergency status
  router.get('/emergency/status', (req, res) => {
    const emergency = store.get('emergencyState') || null;
    res.json({ success: true, data: emergency });
  });

  // Trigger 108 SOS dispatch
  router.post('/emergency/dispatch', (req, res) => {
    const { lat, lng, reason, patientName, patientPhone } = req.body;

    const newDispatch = {
      id: `SOS-108-${Date.now()}`,
      status: 'En Route',
      ambulanceNumber: 'MH-14-EM-1084',
      driverName: 'Suresh More',
      driverPhone: '+91 98220 99887',
      estimatedArrivalMinutes: 8,
      hospitalDestination: 'Khed Primary Health Centre (PHC)',
      patientName: patientName || 'Rahul Sharma',
      patientPhone: patientPhone || '+91 98765 43210',
      reason: reason || 'Acute Medical Emergency Alert',
      location: { lat: lat || 18.8472, lng: lng || 73.9142 },
      timestamp: new Date().toISOString()
    };

    store.set('emergencyState', newDispatch);

    if (io) {
      io.emit('emergency_dispatched', newDispatch);
    }

    res.status(201).json({ success: true, data: newDispatch });
  });

  // Cancel emergency
  router.post('/emergency/cancel', (req, res) => {
    store.set('emergencyState', null);
    if (io) {
      io.emit('emergency_cancelled');
    }
    res.json({ success: true, message: 'Emergency cleared' });
  });

  // Get all Urgent Home Nursing / Staff injection requests
  router.get('/staff/requests', (req, res) => {
    const requests = store.get('staffRequests') || [];
    res.json({ success: true, data: requests });
  });

  return router;
};
