import express from 'express';
import { store } from '../db/store.js';

export const createTeleconsultRouter = (io) => {
  const router = express.Router();

  // Get waiting pool for teleconsultation
  router.get('/teleconsult/pool', (req, res) => {
    const pool = store.get('teleconsultWaitingPool') || [];
    res.json({ success: true, data: pool });
  });

  // Broadcast an incoming teleconsultation call
  router.post('/teleconsult/broadcast', (req, res) => {
    const callData = req.body;
    store.update((data) => {
      data.teleconsultWaitingPool = [callData, ...(data.teleconsultWaitingPool || []).filter(c => c.callId !== callData.callId)];
      return data;
    });

    if (io) {
      io.emit('teleconsult_call_broadcast', callData);
    }

    res.json({ success: true, data: callData });
  });

  // Accept a call
  router.post('/teleconsult/accept', (req, res) => {
    const { callId, doctorId, doctorName } = req.body;

    store.update((data) => {
      data.teleconsultWaitingPool = (data.teleconsultWaitingPool || []).filter(c => c.callId !== callId);
      return data;
    });

    if (io) {
      io.emit('teleconsult_call_accepted', { callId, doctorId, doctorName });
    }

    res.json({ success: true, message: 'Call accepted' });
  });

  return router;
};
