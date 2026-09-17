import express from 'express';
import { store } from '../db/store.js';

export const createPrescriptionRouter = (io) => {
  const router = express.Router();

  // Get prescriptions
  router.get('/prescriptions', (req, res) => {
    const rxList = store.get('prescriptions') || [];
    res.json({ success: true, data: rxList });
  });

  // Create new prescription
  router.post('/prescriptions', (req, res) => {
    const { doctorName, facility, diagnosis, medicines, notes, patientName, abhaId } = req.body;

    const newId = `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRx = {
      id: newId,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      doctorName: doctorName || 'Dr. Anjali Mehta',
      facility: facility || 'Khed Primary Health Centre (PHC)',
      diagnosis: diagnosis || 'General Medical Review',
      notes: notes || 'Prescribed during OPD checkup.',
      patientName: patientName || 'Rahul Sharma',
      abhaId: abhaId || '91-4829-1029-4819',
      medicines: medicines || [],
      qrData: `ABHA:${abhaId || '91-4829-1029-4819'}|RX:${newId}|NMC:2014082941`,
      createdAt: new Date().toISOString()
    };

    store.update((data) => {
      data.prescriptions = [newRx, ...(data.prescriptions || [])];
      return data;
    });

    if (io) {
      io.emit('prescription_created', newRx);
    }

    res.status(201).json({ success: true, data: newRx });
  });

  return router;
};
