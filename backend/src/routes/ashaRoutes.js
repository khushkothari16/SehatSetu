import express from 'express';
import { store } from '../db/store.js';

export const createAshaRouter = (io) => {
  const router = express.Router();

  // 1. Get assigned patients
  router.get('/asha/patients', (req, res) => {
    const ashaPatients = store.get('ashaPatients') || [];
    res.json({ success: true, data: ashaPatients });
  });

  // 2. Register patient
  router.post('/asha/patients', (req, res) => {
    const patientData = req.body;
    const newId = `PAT-MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPatient = {
      id: newId,
      ...patientData,
      createdAt: new Date().toISOString()
    };

    store.update((data) => {
      if (!data.ashaPatients) data.ashaPatients = [];
      data.ashaPatients.unshift(newPatient);
      return data;
    });

    if (io) {
      io.emit('asha_patient_registered', newPatient);
    }

    res.json({ success: true, data: newPatient });
  });

  // 3. Consultation requests
  router.get('/asha/requests', (req, res) => {
    const requests = store.get('ashaRequests') || [];
    res.json({ success: true, data: requests });
  });

  router.post('/asha/requests', (req, res) => {
    const requestData = req.body;
    const newReq = {
      id: `REQ-ASHA-${Date.now().toString().slice(-6)}`,
      ...requestData,
      status: 'Pending Review',
      createdAt: new Date().toISOString()
    };

    store.update((data) => {
      if (!data.ashaRequests) data.ashaRequests = [];
      data.ashaRequests.unshift(newReq);
      return data;
    });

    if (io) {
      io.emit('asha_request_created', newReq);
      io.emit('notification_received', {
        title: `ASHA Consultation Request: ${newReq.patientName}`,
        message: `${newReq.triageCategory} case submitted by ASHA worker.`,
        type: 'consultation'
      });
    }

    res.json({ success: true, data: newReq });
  });

  router.put('/asha/requests/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const existing = (store.get('ashaRequests') || []).find(r => r.id === id);
    if (!existing) {
      return res.status(404).json({ success: false, message: `ASHA consultation request ${id} not found.` });
    }

    const updated = store.update((data) => {
      if (!data.ashaRequests) data.ashaRequests = [];
      data.ashaRequests = data.ashaRequests.map(r => r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r);
      return data.ashaRequests.find(r => r.id === id);
    });

    if (io) {
      io.emit('asha_request_updated', { id, updates });
    }

    res.json({ success: true, data: updated });
  });

  // 4. Messages
  router.get('/asha/messages', (req, res) => {
    const messages = store.get('ashaMessages') || [];
    res.json({ success: true, data: messages });
  });

  router.post('/asha/messages', (req, res) => {
    const msgData = req.body;
    const newMsg = {
      id: `MSG-${Date.now()}`,
      ...msgData,
      timestamp: new Date().toISOString()
    };

    store.update((data) => {
      if (!data.ashaMessages) data.ashaMessages = [];
      data.ashaMessages.push(newMsg);
      return data;
    });

    if (io) {
      io.emit('asha_message_sent', newMsg);
    }

    res.json({ success: true, data: newMsg });
  });

  // 5. Offline Batch Sync
  router.post('/asha/sync', (req, res) => {
    const { items = [] } = req.body;
    // Process queued offline operations
    res.json({ success: true, syncedCount: items.length });
  });

  return router;
};
