import express from 'express';
import { store } from '../db/store.js';

const router = express.Router();

// Current Patient Profile
router.get('/patient', (req, res) => {
  const patient = store.get('patient');
  res.json({ success: true, data: patient });
});

router.put('/patient', (req, res) => {
  const updated = store.update((data) => {
    data.patient = { ...data.patient, ...req.body };
    return data.patient;
  });
  res.json({ success: true, data: updated });
});

// Doctor List
router.get('/doctors', (req, res) => {
  const doctors = store.get('doctors') || [];
  res.json({ success: true, data: doctors });
});

export default router;
