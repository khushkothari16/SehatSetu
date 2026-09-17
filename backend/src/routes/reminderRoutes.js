import express from 'express';
import { store } from '../db/store.js';

export const createReminderRouter = (io) => {
  const router = express.Router();

  // Get active medicine reminders
  router.get('/reminders', (req, res) => {
    let reminders = store.get('reminders') || [];
    if (reminders.length === 0) {
      // Auto-populate from prescriptions if empty
      const prescriptions = store.get('prescriptions') || [];
      reminders = [];
      prescriptions.forEach(rx => {
        (rx.medicines || []).forEach((med, idx) => {
          reminders.push({
            id: `REM-${rx.id}-${idx}`,
            prescriptionId: rx.id,
            medicineName: med.name,
            type: med.type || 'Tablet',
            dosage: med.dosage || '1 Dose',
            instructions: med.instructions || 'Take after food',
            doctorName: rx.doctorName || 'Dr. Anjali Mehta',
            frequency: med.frequency || '1-0-1',
            slotKey: 'morning',
            slotLabel: 'Morning Dose',
            scheduledTime: '08:00 AM',
            status: 'pending',
            takenAt: null
          });
        });
      });
      store.set('reminders', reminders);
    }
    res.json({ success: true, data: reminders });
  });

  // Mark dose as taken
  router.post('/reminders/:id/take', (req, res) => {
    const { id } = req.params;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedReminder = null;
    store.update((data) => {
      data.reminders = (data.reminders || []).map(r => {
        if (r.id === id) {
          updatedReminder = { ...r, status: 'taken', takenAt: nowStr };
          return updatedReminder;
        }
        return r;
      });
      return data;
    });

    if (io) {
      io.emit('dose_taken_success', updatedReminder);
    }

    res.json({ success: true, data: updatedReminder });
  });

  // Trigger test reminder alarm
  router.post('/reminders/trigger', (req, res) => {
    const reminders = store.get('reminders') || [];
    const target = reminders.find(r => r.status === 'pending') || reminders[0];

    if (io && target) {
      io.emit('medicine_dose_alert', target);
    }

    res.json({ success: true, data: target });
  });

  return router;
};
