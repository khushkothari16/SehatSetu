import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_APPOINTMENTS } from '../data/mockData';

export const appointmentService = {
  async getAppointments() {
    await delay(150);
    return getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
  },

  async getAppointmentById(id) {
    await delay(100);
    const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const apt = appointments.find(a => a.id === id);
    if (!apt) throw new Error('Appointment not found');
    return apt;
  },

  async bookAppointment({ doctor, mode, date, time, reason, patient }) {
    await delay(250);
    const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    
    // Generate new unique ID
    const newId = `APT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    
    // Determine sequential token number (ensuring we don't collide with base mock tokens 35-38)
    const existingTokens = [
      ...appointments.map(a => Number(a.tokenNumber)),
      35, 36, 37, 38
    ].filter(n => !isNaN(n));
    const maxToken = existingTokens.length > 0 ? Math.max(...existingTokens) : 38;
    const tokenNumber = maxToken + 1;

    // Patient profile extraction from parameters or localStorage
    const savedPatient = getStored(STORAGE_KEYS.PATIENT, null);
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
      id: newId,
      doctorId: doctor.id || 'DOC-01',
      doctorName: doctor.name || 'Dr. Anjali Mehta',
      doctorSpecialty: doctor.specialty || 'General Physician',
      doctorAvatar: doctor.avatar,
      facility: doctor.hospital || 'Primary Health Centre (PHC)',
      room: doctor.room || 'OPD Room 4',
      date: date || new Date().toISOString().split('T')[0],
      time: time || '11:00 AM',
      type: mode === 'online' ? 'Teleconsultation / Video' : 'In-Person OPD',
      mode: mode || 'offline',
      status: 'Confirmed',
      tokenNumber,
      token: `#${tokenNumber}`,
      reason: reason || 'Routine medical consultation',
      fee: doctor.fee || 0,
      createdAt: new Date().toISOString(),

      // Patient demographics for doctor portal EMR
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

    const updated = [newAppointment, ...appointments];
    setStored(STORAGE_KEYS.APPOINTMENTS, updated);

    // Update active queue state for this patient if in-person OPD appointment
    let queueData = null;
    if (mode !== 'online') {
      // Calculate real queue position based on actual waiting patients in doctor's OPD
      const doctorPatients = appointmentService.getDoctorPatientsSync(doctor.id || 'DOC-01')
        .filter(p => p.mode === 'offline');

      // Count patients waiting ahead of this newly booked patient
      const patientsAheadList = doctorPatients.filter(p => {
        const pToken = Number(p.tokenNumber || String(p.token || '').replace(/\D/g, '')) || 0;
        return pToken < tokenNumber && p.id !== patientId && p.abhaId !== patientAbhaId;
      });
      const patientsAhead = patientsAheadList.length;

      // Current token is the token of the first patient ahead, or the patient's own token if none ahead
      const currentServingToken = patientsAhead > 0
        ? (Number(patientsAheadList[0]?.tokenNumber) || tokenNumber)
        : tokenNumber;

      const isTurn = patientsAhead === 0;
      const status = isTurn ? 'Your Turn' : patientsAhead <= 2 ? 'Almost Your Turn' : 'Waiting';

      queueData = {
        appointmentId: newId,
        patientId: patientId,
        patientName: patientName,
        patientPhone: patientPhone,
        patientAbhaId: patientAbhaId,
        doctorName: doctor.name || 'Dr. Anjali Mehta',
        facility: doctor.hospital || 'Primary Health Centre (PHC)',
        room: newAppointment.room || 'OPD Room 4',
        userToken: tokenNumber,
        currentToken: currentServingToken,
        patientsAhead: patientsAhead,
        estimatedWaitMinutes: patientsAhead * 4,
        status: status,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStored(STORAGE_KEYS.QUEUE, queueData);
    }

    // Dispatch global events for instant multi-dashboard synchronization
    window.dispatchEvent(new CustomEvent('appointment_booked', { detail: newAppointment }));
    if (queueData) {
      window.dispatchEvent(new CustomEvent('queue_state_change', { detail: queueData }));
    }

    return newAppointment;
  },

  // Synchronous and asynchronous retrieval of all patients for the doctor portal
  getDoctorPatientsSync(doctorId) {
    const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const queueState = getStored(STORAGE_KEYS.QUEUE, null);

    // Base seed patients for doctor portal demonstration (Tokens in sequential ascending order: #35 -> #36 -> #37 -> #38)
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
        symptoms: 'High fever, cough, chest congestion, fatigue for 3 days',
        referral: {
          referredBy: 'Rekha Gaikwad (ANM / ASHA Lead)',
          facility: 'Health Sub-Centre',
          date: '08 Sep 2026, 09:15 AM',
          referralSlipId: 'REF-2026-8941',
          reason: 'Fever not subsiding with Paracetamol; crackles heard in lower chest; SpO2 at 95%. Referred for Medical Officer review and antibiotic prescription.',
          vitalsAtReferral: {
            bp: '126/82 mmHg',
            pulse: '88 bpm',
            spo2: '95%',
            temp: '102.2°F',
            weight: '68 kg'
          }
        },
        history: {
          chronicConditions: 'None diagnosed; seasonal allergic rhinitis',
          allergies: ['Penicillin (Mild skin rash & itching)'],
          pastTreatments: [
            {
              date: '14 May 2026',
              doctor: 'Dr. Anjali Mehta',
              diagnosis: 'Acute Gastroenteritis (Food contamination)',
              treatment: 'ORS, Zinc, Ciprofloxacin 500mg (3 days) - Resolved'
            }
          ],
          labReports: [
            { name: 'Complete Blood Count (CBC)', date: '14 May 2026', result: 'Hb: 13.8 g/dL, WBC: 9,200/mcL (Normal)' },
            { name: 'Fasting Blood Sugar', date: '14 May 2026', result: '98 mg/dL (Normal)' }
          ]
        }
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
        symptoms: 'Uncontrolled blood pressure, persistent morning headache, bilateral ankle swelling',
        referral: {
          referredBy: 'Pooja Jadhav (ASHA Worker)',
          facility: 'Alandi Gramin Health Post',
          date: '08 Sep 2026, 08:30 AM',
          referralSlipId: 'REF-2026-4410',
          reason: 'BP measured 170/105 mmHg during routine hypertension camp. Needs medication adjustment & renal profile.',
          vitalsAtReferral: {
            bp: '170/105 mmHg',
            pulse: '92 bpm',
            spo2: '97%',
            temp: '98.4°F',
            weight: '74 kg'
          }
        },
        history: {
          chronicConditions: 'Essential Hypertension (7 years), Type 2 Diabetes Mellitus (4 years)',
          allergies: ['Amlodipine (Causes peripheral pedal edema)'],
          pastTreatments: [
            {
              date: '20 Jun 2026',
              doctor: 'Dr. Anjali Mehta',
              diagnosis: 'Hypertensive Urgency',
              treatment: 'Telmisartan 40mg + Hydrochlorothiazide 12.5mg OD'
            }
          ],
          labReports: [
            { name: 'HbA1c Glycated Hemoglobin', date: '20 Jun 2026', result: '7.8% (Borderline high)' },
            { name: 'Serum Creatinine', date: '20 Jun 2026', result: '1.1 mg/dL (Normal)' }
          ]
        }
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
        symptoms: 'Chronic bilateral knee joint pain, morning stiffness, difficulty walking without cane',
        referral: {
          referredBy: 'Self Registered (Kiosk Token)',
          facility: 'OPD Registration Desk',
          date: '08 Sep 2026, 09:45 AM',
          referralSlipId: 'REG-2026-0929',
          reason: 'Follow-up for degenerative osteoarthritis; requesting knee brace prescription and topical gel.',
          vitalsAtReferral: {
            bp: '134/84 mmHg',
            pulse: '74 bpm',
            spo2: '98%',
            temp: '98.2°F',
            weight: '80 kg'
          }
        },
        history: {
          chronicConditions: 'Bilateral Osteoarthritis of Knee (Grade 3), Dyslipidemia',
          allergies: ['None reported'],
          pastTreatments: [
            {
              date: '10 Jan 2026',
              doctor: 'Dr. Anjali Mehta',
              diagnosis: 'Osteoarthritis Flare',
              treatment: 'Paracetamol 650mg TDS, Aceclofenac SOS, Physiotherapy referral'
            }
          ],
          labReports: [
            { name: 'Lipid Profile', date: '10 Jan 2026', result: 'Cholesterol: 215 mg/dL, Triglycerides: 190 mg/dL' }
          ]
        }
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
        symptoms: 'Antenatal Trimester 2 checkup, gestational fatigue, Hb report review',
        referral: {
          referredBy: 'Sunita Bai (ASHA Worker, Manchar)',
          facility: 'Manchar Health Post',
          date: '08 Sep 2026, 10:45 AM',
          referralSlipId: 'REF-ANC-2026-102',
          reason: 'Hemoglobin low at 9.4 g/dL. Dietary counsel & Iron-Folic Acid supplementation advice requested via Tele-OPD.',
          vitalsAtReferral: {
            bp: '110/70 mmHg',
            pulse: '76 bpm',
            spo2: '99%',
            temp: '98.6°F',
            weight: '54 kg'
          }
        },
        history: {
          chronicConditions: 'Primigravida (22 weeks gestation)',
          allergies: ['No known drug allergies'],
          pastTreatments: [],
          labReports: [
            { name: 'Hemoglobin (Hb)', date: '06 Sep 2026', result: '9.4 g/dL (Mild gestational anemia)' }
          ]
        }
      }
    ];

    // Filter completed checkups by appointment ID and base tokens
    const completedCheckups = getStored('sehatsetu_completed_checkups', []);
    const completedAptIds = new Set(completedCheckups.map(c => c.appointmentId).filter(Boolean));
    const completedTokens = new Set(completedCheckups.map(c => Number(c.tokenNumber || String(c.token).replace(/\D/g, ''))));

    // Auto-heal any live booked appointments that were inadvertently marked completed without a matching checkup record
    let appointmentsHealed = false;
    const sanitizedAppointments = appointments.map(a => {
      if (a.isLiveBooking && a.status === 'Completed' && !completedAptIds.has(a.id)) {
        appointmentsHealed = true;
        return { ...a, status: 'Confirmed' };
      }
      return a;
    });
    if (appointmentsHealed) {
      setStored(STORAGE_KEYS.APPOINTMENTS, sanitizedAppointments);
    }

    // Filter appointments from storage that are active and not completed
    const bookedAppointments = sanitizedAppointments.filter(a => {
      if (a.status === 'Cancelled' || a.status === 'Completed') return false;
      if (completedAptIds.has(a.id)) return false;
      return true;
    });

    // Convert booked appointments into full patient records
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
        isLiveBooking: true,
        referral: {
          referredBy: 'Direct Self Booking (Patient Portal)',
          facility: apt.facility || 'Primary Health Centre',
          date: `${apt.date || 'Today'}, ${apt.time || '11:00 AM'}`,
          referralSlipId: `SLIP-${apt.id}`,
          reason: apt.reason || 'Booked online through SehatSetu Patient Portal',
          vitalsAtReferral: {
            bp: '120/80 mmHg',
            pulse: '76 bpm',
            spo2: '98%',
            temp: '98.6°F',
            weight: '65 kg'
          }
        },
        history: {
          chronicConditions: 'None reported during online app booking',
          allergies: ['No known drug allergies reported'],
          pastTreatments: [
            {
              date: '14 May 2026',
              doctor: apt.doctorName || 'Dr. Anjali Mehta',
              diagnosis: 'General Clinical Review',
              treatment: 'Standard Hydration Therapy & Consultation'
            }
          ],
          labReports: []
        }
      };
    });

    // Filter base demo patients not completed
    const activeBasePatients = basePatients.filter(b => !completedTokens.has(b.tokenNumber));

    // Merge: live booked patients take priority over matching base tokens
    const merged = [...bookedPatients];
    for (const base of activeBasePatients) {
      if (!merged.some(p => p.token === base.token || p.tokenNumber === base.tokenNumber)) {
        merged.push(base);
      }
    }

    // CRITICAL: OPD Queue must always be in ascending token order: #35 -> #36 -> #37 -> #38
    merged.sort((a, b) => {
      const tokenA = Number(a.tokenNumber || String(a.token || '').replace(/\D/g, '')) || 0;
      const tokenB = Number(b.tokenNumber || String(b.token || '').replace(/\D/g, '')) || 0;
      return tokenA - tokenB;
    });

    return merged;
  },

  async getDoctorPatients(doctorId) {
    await delay(100);
    return this.getDoctorPatientsSync(doctorId);
  },

  async cancelAppointment(id) {
    await delay(200);
    const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = appointments.map(a => a.id === id ? { ...a, status: 'Cancelled' } : a);
    setStored(STORAGE_KEYS.APPOINTMENTS, updated);
    window.dispatchEvent(new CustomEvent('appointment_updated', { detail: { id, status: 'Cancelled' } }));
    return true;
  },

  async rescheduleAppointment(id, date, time) {
    await delay(200);
    const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, INITIAL_APPOINTMENTS);
    const updated = appointments.map(a => a.id === id ? { ...a, date, time, status: 'Rescheduled' } : a);
    setStored(STORAGE_KEYS.APPOINTMENTS, updated);
    window.dispatchEvent(new CustomEvent('appointment_updated', { detail: { id, date, time, status: 'Rescheduled' } }));
    return updated.find(a => a.id === id);
  }
};
