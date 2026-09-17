import express from 'express';
import { store } from '../db/store.js';

export const createAppointmentRouter = (io) => {
  const router = express.Router();

  // 1. Get all appointments
  router.get('/appointments', (req, res) => {
    const appointments = store.get('appointments') || [];
    res.json({ success: true, data: appointments });
  });

  // 2. Book appointment
  router.post('/appointments/book', (req, res) => {
    const { doctor, mode, date, time, reason, patient } = req.body;

    const appointments = store.get('appointments') || [];

    // Safe sequential token generation (avoiding collision with demo base tokens 35-38)
    const existingTokens = [
      ...appointments.map(a => Number(a.tokenNumber)),
      35, 36, 37, 38
    ].filter(n => !isNaN(n));
    const maxToken = existingTokens.length > 0 ? Math.max(...existingTokens) : 38;
    const tokenNumber = maxToken + 1;

    const savedPatient = store.get('patient');
    const patientName = patient?.name || savedPatient?.name || 'Rahul Sharma';
    const patientNameHindi = patient?.nameHindi || savedPatient?.nameHindi || 'राहुल शर्मा';
    const patientPhone = patient?.phone || savedPatient?.phone || '+91 98765 43210';
    const patientVillage = patient?.village || savedPatient?.village || 'Current Village';
    const patientDistrict = patient?.district || savedPatient?.district || 'District PHC';
    const patientAbhaId = patient?.abhaId || savedPatient?.abhaId || '91-4829-1029-4819';
    const patientAge = patient?.age || savedPatient?.age || 34;
    const patientGender = patient?.gender || savedPatient?.gender || 'Male';
    const patientBloodGroup = patient?.bloodGroup || savedPatient?.bloodGroup || 'B+';
    const patientId = patient?.id || `PAT-${tokenNumber}`;

    const newAppointment = {
      id: `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorId: doctor?.id || 'DOC-01',
      doctorName: doctor?.name || 'Dr. Anjali Mehta',
      doctorSpecialty: doctor?.specialty || 'General Physician',
      doctorAvatar: doctor?.avatar || null,
      facility: doctor?.hospital || 'Primary Health Centre (PHC)',
      room: doctor?.room || 'OPD Room 4',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '11:00 AM',
      type: mode === 'online' ? 'Teleconsultation / Video' : 'In-Person OPD',
      mode: mode || 'offline',
      status: 'Confirmed',
      tokenNumber,
      token: `#${tokenNumber}`,
      reason: reason || 'Routine medical consultation',
      fee: doctor?.fee || 0,
      createdAt: new Date().toISOString(),
      patientId,
      patientName,
      patientNameHindi,
      patientPhone,
      patientVillage,
      patientDistrict,
      patientAbhaId,
      patientAge,
      patientGender,
      patientBloodGroup,
      symptoms: reason || 'Routine medical consultation requested via patient portal',
      isLiveBooking: true
    };

    let queueState = null;
    store.update((data) => {
      data.appointments = [newAppointment, ...(data.appointments || [])];

      if (mode !== 'online') {
        const activeOffline = data.appointments.filter(a => a.mode === 'offline' && a.status === 'Confirmed');
        const ahead = activeOffline.filter(a => Number(a.tokenNumber) < tokenNumber).length;
        const currentToken = ahead > 0 ? (activeOffline[0]?.tokenNumber || tokenNumber) : tokenNumber;

        queueState = {
          appointmentId: newAppointment.id,
          patientId,
          patientName,
          patientPhone,
          patientAbhaId,
          doctorName: doctor?.name || 'Dr. Anjali Mehta',
          facility: doctor?.hospital || 'Primary Health Centre (PHC)',
          room: newAppointment.room,
          userToken: tokenNumber,
          currentToken,
          patientsAhead: ahead,
          estimatedWaitMinutes: ahead * 4,
          status: ahead === 0 ? 'Your Turn' : ahead <= 2 ? 'Almost Your Turn' : 'Waiting',
          updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        data.queue = queueState;
      }
      return data;
    });

    // Broadcast live event to all connected clients
    if (io) {
      io.emit('appointment_booked', newAppointment);
      if (queueState) {
        io.emit('queue_state_change', queueState);
      }
    }

    res.status(201).json({ success: true, data: newAppointment, queue: queueState });
  });

  // 3. Get live queue status for patient
  router.get('/queue/status', (req, res) => {
    const queue = store.get('queue');
    res.json({ success: true, data: queue });
  });

  // 4. Get doctor patients list for OPD & Teleconsult desk
  router.get('/queue/doctor/:doctorId', (req, res) => {
    const appointments = store.get('appointments') || [];
    const queueState = store.get('queue');
    const completedCheckups = store.get('completedCheckups') || [];
    const completedAptIds = new Set(completedCheckups.map(c => c.appointmentId).filter(Boolean));
    const completedTokens = new Set(completedCheckups.map(c => Number(c.tokenNumber || String(c.token || '').replace(/\D/g, ''))));

    // Base seed patients for doctor portal demonstration
    const basePatients = [
      {
        id: 'PAT-35',
        token: '#35',
        tokenNumber: 35,
        mode: 'offline',
        name: 'Rahul Sharma',
        nameHindi: 'राहुल शर्मा',
        age: 34,
        gender: 'Male',
        village: 'Khed (Rajgurunagar)',
        bloodGroup: 'B+',
        abhaId: '91-4829-1029-4819',
        phone: '+91 98765 43210',
        time: '10:30 AM (In-Person OPD)',
        priority: 'Routine',
        status: (queueState && queueState.currentToken === 35 && queueState.status === 'Your Turn')
          ? 'Called into Room 4'
          : 'Waiting in Room 4',
        symptoms: 'High fever, cough, chest congestion, fatigue for 3 days'
      },
      {
        id: 'PAT-36',
        token: '#36',
        tokenNumber: 36,
        mode: 'offline',
        name: 'Savita Kamble',
        nameHindi: 'सविता कांबळे',
        age: 52,
        gender: 'Female',
        village: 'Alandi Rural Sector',
        bloodGroup: 'O+',
        abhaId: '91-3829-4410-9281',
        phone: '+91 98230 45678',
        time: '11:00 AM (In-Person OPD)',
        priority: 'Urgent',
        status: 'Vitals Checked by Staff Nurse',
        symptoms: 'Uncontrolled blood pressure, persistent morning headache, bilateral ankle swelling'
      },
      {
        id: 'PAT-37',
        token: '#37',
        tokenNumber: 37,
        mode: 'offline',
        name: 'Maruti Shinde',
        nameHindi: 'मारुती शिंदे',
        age: 61,
        gender: 'Male',
        village: 'Bhamerwadi Village',
        bloodGroup: 'AB+',
        abhaId: '91-8821-3940-5812',
        phone: '+91 94220 89123',
        time: '11:15 AM (In-Person OPD)',
        priority: 'Routine',
        status: 'Waiting in OPD Hall',
        symptoms: 'Chronic bilateral knee joint pain, morning stiffness, difficulty walking without cane'
      },
      {
        id: 'PAT-38',
        token: '#38',
        tokenNumber: 38,
        mode: 'offline',
        name: 'Priya Deshmukh',
        nameHindi: 'प्रिया देशमुख',
        age: 26,
        gender: 'Female',
        village: 'Manchar Sub-Centre',
        bloodGroup: 'B+',
        abhaId: '91-4921-9982-1284',
        phone: '+91 97654 32190',
        time: '11:30 AM (In-Person OPD)',
        priority: 'Routine',
        status: 'Waiting in OPD Hall',
        symptoms: 'Antenatal Trimester 2 checkup, gestational fatigue, Hb report review'
      }
    ];

    // Filter confirmed active appointments
    const bookedAppointments = appointments.filter(a => {
      if (a.status === 'Cancelled' || a.status === 'Completed') return false;
      if (completedAptIds.has(a.id)) return false;
      return true;
    });

    const bookedPatients = bookedAppointments.map(apt => {
      const isServing = queueState && Number(queueState.currentToken) === Number(apt.tokenNumber);
      const isCalled = isServing && queueState.status === 'Your Turn';

      return {
        id: apt.patientId || `PAT-${apt.tokenNumber}`,
        token: apt.token || `#${apt.tokenNumber}`,
        tokenNumber: Number(apt.tokenNumber) || 35,
        appointmentId: apt.id,
        mode: apt.mode || 'offline',
        name: apt.patientName || 'Rahul Sharma',
        nameHindi: apt.patientNameHindi || 'राहुल शर्मा',
        age: apt.patientAge || 34,
        gender: apt.patientGender || 'Male',
        village: apt.patientVillage || 'Current Village',
        district: apt.patientDistrict || 'District PHC',
        bloodGroup: apt.patientBloodGroup || 'B+',
        abhaId: apt.patientAbhaId || '91-4829-1029-4819',
        phone: apt.patientPhone || '+91 98765 43210',
        time: `${apt.time} (${apt.mode === 'online' ? 'Teleconsult Audio/Video' : 'In-Person OPD'})`,
        priority: apt.priority || 'Routine',
        status: isCalled
          ? 'Called into Room 4 (Patient Entering)'
          : isServing
          ? 'Serving Now'
          : (apt.mode === 'online' ? 'Awaiting Video Call' : 'Present in Queue (Ready for Exam)'),
        symptoms: apt.symptoms || apt.reason || 'General health consultation',
        isLiveBooking: true
      };
    });

    const activeBasePatients = basePatients.filter(b => !completedTokens.has(b.tokenNumber));

    const merged = [...bookedPatients];
    for (const base of activeBasePatients) {
      if (!merged.some(p => p.token === base.token || p.tokenNumber === base.tokenNumber)) {
        merged.push(base);
      }
    }

    merged.sort((a, b) => {
      const tokenA = Number(a.tokenNumber || String(a.token || '').replace(/\D/g, '')) || 0;
      const tokenB = Number(b.tokenNumber || String(b.token || '').replace(/\D/g, '')) || 0;
      return tokenA - tokenB;
    });

    res.json({ success: true, data: merged });
  });

  // 5. Call next patient (doctor desk buzzer trigger)
  router.post('/queue/call-next', (req, res) => {
    const { tokenNumber, patientName, doctorName = 'Dr. Anjali Mehta', room = 'OPD Room 4' } = req.body;

    const updatedQueue = store.update((data) => {
      const current = data.queue || {};
      const targetToken = Number(tokenNumber) || current.currentToken || 35;
      const isUserTurn = current.userToken === targetToken;
      const patientsAhead = Math.max(0, (current.userToken || targetToken) - targetToken);

      data.queue = {
        ...current,
        currentToken: targetToken,
        doctorName,
        room,
        patientsAhead,
        estimatedWaitMinutes: patientsAhead * 4,
        status: isUserTurn ? 'Your Turn' : patientsAhead <= 2 && patientsAhead > 0 ? 'Almost Your Turn' : 'Serving Other Patients',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      return data.queue;
    });

    if (io) {
      io.emit('queue_state_change', updatedQueue);
      io.emit('patient_called', { tokenNumber, patientName, doctorName, room });
    }

    res.json({ success: true, data: updatedQueue });
  });

  // 6. Complete patient checkup
  router.post('/queue/complete-checkup', (req, res) => {
    const { patient, diagnosis, notes, followUpRequired, followUpDate, medicines } = req.body;

    if (!patient || (!patient.id && !patient.tokenNumber && !patient.token)) {
      return res.status(400).json({ success: false, message: 'Valid patient object with ID or token is required.' });
    }

    const tokenClean = Number(patient.tokenNumber || String(patient.token || '').replace(/\D/g, '')) || 35;
    const completedRecord = {
      id: patient.id || `PAT-${tokenClean}`,
      patientId: patient.id || `PAT-${tokenClean}`,
      appointmentId: patient.appointmentId || null,
      token: `#${tokenClean}`,
      tokenNumber: tokenClean,
      name: patient.name || 'Rahul Sharma',
      nameHindi: patient.nameHindi || '',
      age: patient.age,
      gender: patient.gender,
      village: patient.village,
      abhaId: patient.abhaId,
      diagnosis: diagnosis || 'Clinical Examination Concluded',
      doctorNotes: notes || 'Checkup concluded. Patient examined and treatment issued.',
      followUpRequired: Boolean(followUpRequired),
      followUpDate: followUpRequired ? followUpDate : null,
      medicines: medicines || [],
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      completedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    };

    store.update((data) => {
      data.completedCheckups = [completedRecord, ...(data.completedCheckups || []).filter(c => c.tokenNumber !== tokenClean)];

      // Mark specific appointment as completed
      if (data.appointments) {
        data.appointments = data.appointments.map(a => {
          if ((patient.appointmentId && a.id === patient.appointmentId) || (!patient.appointmentId && a.tokenNumber === tokenClean)) {
            return { ...a, status: 'Completed', completedAt: new Date().toISOString() };
          }
          return a;
        });
      }

      // Advance queue token
      if (data.queue) {
        data.queue.currentToken = tokenClean + 1;
        data.queue.patientsAhead = Math.max(0, (data.queue.patientsAhead || 1) - 1);
        data.queue.estimatedWaitMinutes = data.queue.patientsAhead * 4;
        data.queue.status = data.queue.userToken === data.queue.currentToken ? 'Your Turn' : 'Waiting';
      }
      return data;
    });

    if (io) {
      io.emit('checkup_completed', completedRecord);
      io.emit('queue_state_change', store.get('queue'));
    }

    res.json({ success: true, data: completedRecord });
  });

  return router;
};
