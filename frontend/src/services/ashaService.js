import { delay, getStored, setStored, STORAGE_KEYS, apiFetch } from './api';
import {
  INITIAL_ASHA_WORKER,
  INITIAL_ASHA_PATIENTS,
  INITIAL_ASHA_CONSULT_REQUESTS,
  INITIAL_ASHA_MESSAGES,
  INITIAL_ASHA_AUDIT_LOGS
} from '../data/mockData';
import { appointmentService } from './appointmentService';
import { referralTrackingService } from './referralTrackingService';
import { followUpService } from './followUpService';
import { prescriptionService } from './prescriptionService';
import { diagnosticService, reportService } from './diagnosticService';
import { emergencyService } from './emergencyService';

const USERS_STORAGE_KEY = 'sehatsetu_all_users';

export const ashaService = {
  // 1. Get Current ASHA Profile
  async getProfile() {
    await delay(100);
    const session = getStored('sehatsetu_active_session', null);
    if (session && session.role === 'asha' && session.user) {
      return session.user;
    }
    return INITIAL_ASHA_WORKER;
  },

  // 2. Patient Management: Get all assigned patients
  async getAssignedPatients(ashaId = 'ASHA-MH-2026-4018') {
    await delay(150);
    const localAshaPatients = getStored(STORAGE_KEYS.ASHA_PATIENTS, INITIAL_ASHA_PATIENTS);
    const allUsers = getStored(USERS_STORAGE_KEY, []);
    
    // Also include any users registered with role 'patient' that have ashaAssignedId or are in the ASHA's village
    const registeredPatients = allUsers.filter(u => u.role === 'patient');

    // Merge and deduplicate by patient ID or ABHA
    const patientMap = new Map();
    localAshaPatients.forEach(p => patientMap.set(p.id, p));

    registeredPatients.forEach(rp => {
      if (!patientMap.has(rp.id)) {
        patientMap.set(rp.id, {
          id: rp.id,
          name: rp.name,
          nameHindi: rp.nameHindi || rp.name,
          age: rp.age || 30,
          gender: rp.gender || 'Not specified',
          village: rp.village || 'Khed Rural',
          phone: rp.phone || '',
          emergencyContact: rp.emergencyContacts?.[0]?.phone || rp.phone || '',
          bloodGroup: rp.bloodGroup || 'O+',
          abhaId: rp.abhaId || '91-0000-0000-0000',
          riskStatus: rp.riskStatus || 'Normal',
          riskCategory: rp.riskCategory || 'General Care',
          currentDoctor: 'Dr. Anjali Mehta',
          lastVisit: rp.lastVisit || 'Recent Registration',
          nextFollowUp: rp.nextFollowUp || 'Routine',
          referralStatus: 'No Active Referral',
          vitals: rp.vitals || { bp: '120/80', pulse: '72', spo2: '98%', temp: '98.4°F' },
          conditions: rp.conditions || [],
          allergies: rp.allergies || [],
          currentMeds: rp.currentMeds || [],
          ashaNotes: rp.ashaNotes || 'Registered in SehatSetu platform',
          ashaAssignedId: ashaId
        });
      }
    });

    const merged = Array.from(patientMap.values());
    return merged;
  },

  // 3. Register New Rural Patient
  async registerPatient(patientData, ashaWorker) {
    await delay(250);
    const patients = await this.getAssignedPatients();
    
    const newId = `PAT-MH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomDigits = () => Math.floor(1000 + Math.random() * 9000);
    const generatedAbha = patientData.abhaId && patientData.abhaId.trim() !== ''
      ? patientData.abhaId
      : `91-${randomDigits()}-${randomDigits()}-${randomDigits()}`;

    const newPatient = {
      id: newId,
      role: 'patient',
      name: patientData.name,
      nameHindi: patientData.nameHindi || patientData.name,
      age: Number(patientData.age) || 28,
      gender: patientData.gender || 'Female',
      village: patientData.village || ashaWorker?.village || 'Khed Rural',
      address: patientData.address || `${patientData.village || 'Khed'}, Maharashtra`,
      phone: patientData.phone ? (patientData.phone.startsWith('+91') ? patientData.phone : `+91 ${patientData.phone}`) : '+91 98000 00000',
      emergencyContact: patientData.emergencyContact || '+91 98220 00000 (Family)',
      bloodGroup: patientData.bloodGroup || 'B+',
      abhaId: generatedAbha,
      riskStatus: patientData.riskStatus || 'Normal',
      riskCategory: patientData.riskCategory || 'General Rural Care',
      currentDoctor: patientData.currentDoctor || 'Dr. Anjali Mehta (General Physician)',
      lastVisit: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      nextFollowUp: patientData.nextFollowUp || 'As Advised',
      referralStatus: 'No Active Referral',
      vitals: patientData.vitals || { bp: '120/80 mmHg', pulse: '76 bpm', spo2: '98%', temp: '98.4°F' },
      conditions: patientData.conditions ? (Array.isArray(patientData.conditions) ? patientData.conditions : [patientData.conditions]) : [],
      allergies: patientData.allergies ? (Array.isArray(patientData.allergies) ? patientData.allergies : [patientData.allergies]) : ['No known allergies'],
      currentMeds: patientData.currentMeds ? (Array.isArray(patientData.currentMeds) ? patientData.currentMeds : [patientData.currentMeds]) : [],
      previousHistory: patientData.previousHistory || 'No major surgical history recorded',
      ashaNotes: patientData.ashaNotes || `Enrolled by ASHA ${ashaWorker?.name || 'Sunita Kamble'}`,
      ashaAssignedId: ashaWorker?.id || 'ASHA-MH-2026-4018',
      consentRecorded: true,
      registeredAt: new Date().toISOString()
    };

    // 1. Save in ASHA Patients collection
    const updatedAshaList = [newPatient, ...patients];
    setStored(STORAGE_KEYS.ASHA_PATIENTS, updatedAshaList);

    // 2. Save in Global Users collection so patient can log in with phone or ABHA
    const allUsers = getStored(USERS_STORAGE_KEY, []);
    setStored(USERS_STORAGE_KEY, [newPatient, ...allUsers]);

    // 3. Log Audit Trail
    this.logAuditAction(
      'Patient Registered',
      `ASHA registered new patient ${newPatient.name} (ABHA: ${newPatient.abhaId}, Village: ${newPatient.village}).`,
      ashaWorker?.name || 'Sunita Kamble (ASHA)'
    );

    // 4. Dispatch global event for instant multi-dashboard synchronization
    window.dispatchEvent(new CustomEvent('asha_patient_registered', { detail: newPatient }));

    return newPatient;
  },

  // 4. Update Basic Patient Information
  async updatePatient(patientId, updates, ashaWorker) {
    await delay(150);
    const patients = await this.getAssignedPatients();
    const updated = patients.map(p => p.id === patientId ? { ...p, ...updates } : p);
    setStored(STORAGE_KEYS.ASHA_PATIENTS, updated);

    // Also update users collection if found
    const allUsers = getStored(USERS_STORAGE_KEY, []);
    const updatedUsers = allUsers.map(u => u.id === patientId ? { ...u, ...updates } : u);
    setStored(USERS_STORAGE_KEY, updatedUsers);

    this.logAuditAction(
      'Patient Info Updated',
      `Updated profile/vitals for patient ID ${patientId}.`,
      ashaWorker?.name || 'Sunita Kamble (ASHA)'
    );

    window.dispatchEvent(new CustomEvent('asha_patient_updated', { detail: { patientId, updates } }));
    return updated.find(p => p.id === patientId);
  },

  // 5. Digital Triage Assistance (Decision Support Algorithm)
  evaluateDigitalTriage({ bpSystolic, bpDiastolic, pulse, spo2, temp, bloodSugar, symptoms = '', redFlags = [] }) {
    const sys = Number(bpSystolic) || 0;
    const dia = Number(bpDiastolic) || 0;
    const hr = Number(pulse) || 0;
    const ox = Number(spo2) || 100;
    const fev = Number(temp) || 98.6;
    const bsg = Number(bloodSugar) || 0;
    const symLower = symptoms.toLowerCase();

    // Red Flag / Emergency Triggers (RED)
    const isEmergencyVitals = (sys >= 180 || dia >= 120) || (ox > 0 && ox < 92) || (hr > 130 || (hr > 0 && hr < 45));
    const isEmergencySymptoms = 
      redFlags.length > 0 ||
      symLower.includes('chest pain') ||
      symLower.includes('heart attack') ||
      symLower.includes('unconscious') ||
      symLower.includes('snake bite') ||
      symLower.includes('severe bleeding') ||
      symLower.includes('choking') ||
      symLower.includes('cannot breathe') ||
      symLower.includes('stroke') ||
      symLower.includes('paralysis') ||
      symLower.includes('convulsion');

    if (isEmergencyVitals || isEmergencySymptoms) {
      return {
        level: 'RED',
        category: 'Emergency',
        badgeColor: '#DC2626',
        bgLight: '#FEF2F2',
        borderColor: '#EF4444',
        title: 'CRITICAL EMERGENCY (गंभीर आपातकाल)',
        summary: 'Life-threatening symptoms or dangerous vital signs detected. Immediate stabilization and 108 Emergency Ambulance dispatch required.',
        action: 'TRIGGER_EMERGENCY',
        nextSteps: [
          'Initiate 108 Ambulance Dispatch immediately via Emergency SOS.',
          'Keep patient calm, airway clear, semi-reclined, and loose restrictive garments.',
          'Do NOT give oral solids or liquids if drowsy or breathless.',
          'Alert connected PHC Medical Officer and emergency bay staff.'
        ],
        disclaimer: 'Preliminary triage support only. Final medical assessment must be performed by a qualified healthcare professional.'
      };
    }

    // Urgent Triggers (YELLOW)
    const isUrgentVitals = (sys >= 140 || dia >= 90) || (ox >= 92 && ox <= 94) || (fev >= 101.5) || (bsg >= 220 || (bsg > 0 && bsg < 70));
    const isUrgentSymptoms =
      symLower.includes('high fever') ||
      symLower.includes('dizziness') ||
      symLower.includes('vomiting') ||
      symLower.includes('dehydration') ||
      symLower.includes('swelling') ||
      symLower.includes('pregnant') ||
      symLower.includes('anemia') ||
      symLower.includes('severe pain') ||
      symLower.includes('infection');

    if (isUrgentVitals || isUrgentSymptoms) {
      return {
        level: 'YELLOW',
        category: 'Urgent',
        badgeColor: '#D97706',
        bgLight: '#FFFBEB',
        borderColor: '#F59E0B',
        title: 'PROMPT MEDICAL ATTENTION NEEDED (शीघ्र डॉक्टर परामर्श आवश्यक)',
        summary: 'Abnormal vitals or concerning symptoms detected. Requires priority evaluation by PHC Medical Officer within 12-24 hours.',
        action: 'SUBMIT_CONSULT_REQUEST',
        nextSteps: [
          'Submit instant Consultation Request to Dr. Anjali Mehta (PHC Medical Officer).',
          'Fast-track OPD queue token or prepare for assisted teleconsultation.',
          'Verify patient has taken prescribed baseline medications.',
          'Monitor SpO2 and BP every 2 hours until doctor examination.'
        ],
        disclaimer: 'Preliminary triage support only. Final medical assessment must be performed by a qualified healthcare professional.'
      };
    }

    // Normal / Routine Triggers (GREEN)
    return {
      level: 'GREEN',
      category: 'Normal',
      badgeColor: '#16A34A',
      bgLight: '#F0FDF4',
      borderColor: '#22C55E',
      title: 'NORMAL / ROUTINE CARE (सामान्य / नियमित देखभाल)',
      summary: 'Vitals are within acceptable physiological limits. Standard outpatient care, routine teleconsultation, or scheduled follow-up is appropriate.',
      action: 'SCHEDULE_NORMAL_CARE',
      nextSteps: [
        'Book regular OPD appointment or routine video teleconsultation at convenience.',
        'Ensure continuity of current medications and healthy lifestyle counsel.',
        'Record vitals in patient longitudinal history for future doctor review.'
      ],
      disclaimer: 'Preliminary triage support only. Final medical assessment must be performed by a qualified healthcare professional.'
    };
  },

  // 6. Doctor Synchronization: Consultation Requests
  getConsultationRequestsSync() {
    const data = getStored(STORAGE_KEYS.ASHA_CONSULT_REQUESTS, INITIAL_ASHA_CONSULT_REQUESTS);
    return Array.isArray(data) ? data : (INITIAL_ASHA_CONSULT_REQUESTS || []);
  },

  async getConsultationRequests() {
    await delay(120);
    return this.getConsultationRequestsSync();
  },

  async createConsultationRequest(requestData, ashaWorker) {
    await delay(250);
    const existing = await this.getConsultationRequests();
    const reqId = `REQ-ASHA-${Date.now().toString().slice(-6)}`;

    const newRequest = {
      id: reqId,
      patientId: requestData.patientId,
      patientName: requestData.patientName,
      patientAge: requestData.patientAge || 34,
      patientGender: requestData.patientGender || 'Male',
      patientAbhaId: requestData.patientAbhaId || '91-4829-1029-4819',
      village: requestData.village || 'Khed Rural',
      doctorId: requestData.doctorId || 'DOC-01',
      doctorName: requestData.doctorName || 'Dr. Anjali Mehta',
      triageCategory: requestData.triageCategory || 'Urgent',
      symptoms: requestData.symptoms,
      vitals: requestData.vitals || {},
      ashaNotes: requestData.ashaNotes || 'Triage consultation requested by ASHA worker.',
      status: 'Pending Review', // Pending Review | Accepted | Scheduled | Completed | Rejected
      createdAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ashaWorkerId: ashaWorker?.id || 'ASHA-MH-2026-4018',
      ashaWorkerName: ashaWorker?.name || 'Sunita Kamble'
    };

    const updated = [newRequest, ...existing];
    setStored(STORAGE_KEYS.ASHA_CONSULT_REQUESTS, updated);

    // Also create initial message / notification for the doctor
    this.sendDoctorMessage({
      patientId: newRequest.patientId,
      patientName: newRequest.patientName,
      senderRole: 'asha',
      senderName: `${newRequest.ashaWorkerName} (ASHA)`,
      recipientName: newRequest.doctorName,
      doctorId: newRequest.doctorId,
      message: `[Triage Alert - ${newRequest.triageCategory}] New consultation request submitted for ${newRequest.patientName}: ${newRequest.symptoms}. Vitals: BP ${newRequest.vitals.bp || 'N/A'}, Pulse ${newRequest.vitals.pulse || 'N/A'}.`
    });

    this.logAuditAction(
      'Consultation Request Submitted',
      `Submitted ${newRequest.triageCategory} consult request for ${newRequest.patientName} to ${newRequest.doctorName}.`,
      newRequest.ashaWorkerName
    );

    // Global event dispatched for instant doctor desk synchronization
    window.dispatchEvent(new CustomEvent('asha_consultation_request_created', { detail: newRequest }));
    window.dispatchEvent(new CustomEvent('notification_received', {
      detail: {
        title: `ASHA Triage Request: ${newRequest.patientName}`,
        message: `${newRequest.triageCategory} case flagged by ASHA ${newRequest.ashaWorkerName}.`,
        type: 'consultation'
      }
    }));

    return newRequest;
  },

  async updateConsultationRequestStatus(requestId, updates, actor = 'Dr. Anjali Mehta') {
    await delay(200);
    const existing = await this.getConsultationRequests();
    const updated = existing.map(r => r.id === requestId ? { ...r, ...updates, lastUpdated: new Date().toISOString() } : r);
    setStored(STORAGE_KEYS.ASHA_CONSULT_REQUESTS, updated);

    this.logAuditAction(
      'Consultation Request Updated',
      `Request ${requestId} status updated to: ${updates.status || 'Updated'} by ${actor}.`,
      actor
    );

    window.dispatchEvent(new CustomEvent('asha_consultation_request_updated', {
      detail: { requestId, updates }
    }));

    return updated.find(r => r.id === requestId);
  },

  // 7. ASHA ↔ Doctor Real-Time Communication
  async getDoctorMessages(patientId) {
    await delay(100);
    const allMessages = getStored(STORAGE_KEYS.ASHA_MESSAGES, INITIAL_ASHA_MESSAGES);
    if (!patientId) return allMessages;
    return allMessages.filter(m => m.patientId === patientId);
  },

  async sendDoctorMessage(msgData) {
    await delay(150);
    const allMessages = getStored(STORAGE_KEYS.ASHA_MESSAGES, INITIAL_ASHA_MESSAGES);
    const now = new Date();
    const newMsg = {
      id: `MSG-${Date.now()}`,
      patientId: msgData.patientId || 'GENERAL',
      patientName: msgData.patientName || 'Patient Consultation',
      senderRole: msgData.senderRole || 'asha',
      senderName: msgData.senderName || 'Sunita Kamble (ASHA)',
      recipientName: msgData.recipientName || 'Dr. Anjali Mehta',
      doctorId: msgData.doctorId || 'DOC-01',
      message: msgData.message,
      timestamp: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    const updated = [...allMessages, newMsg];
    setStored(STORAGE_KEYS.ASHA_MESSAGES, updated);

    window.dispatchEvent(new CustomEvent('asha_message_received', { detail: newMsg }));
    return newMsg;
  },

  // 8. Assisted Appointment & Shared Queue Booking
  async bookAssistedAppointment({ doctor, mode, date, time, reason, patient }) {
    return await appointmentService.bookAppointment({
      doctor,
      mode,
      date,
      time,
      reason,
      patient
    });
  },

  // 9. Referral Tracking & Cross-Facility Updates
  async getReferralChains() {
    return await referralTrackingService.getTrackingChains();
  },

  async initiateReferral({ patient, targetFacility, specialty, reason, priority = 'High Priority', referringDoctor = 'Dr. Anjali Mehta', ashaWorker }) {
    await delay(200);
    const hopData = {
      patientId: patient.id,
      patientName: patient.name,
      patientNameHindi: patient.nameHindi,
      abhaId: patient.abhaId,
      age: patient.age,
      gender: patient.gender,
      village: patient.village,
      facility: targetFacility,
      specialty: specialty,
      doctorName: 'Specialist Incharge',
      status: 'in_progress',
      chainStatus: 'In Transit to Specialist',
      priority: priority,
      clinicalFindings: reason,
      doctorRemarks: `ASHA-assisted referral transfer initiated for ${patient.name}. Reason: ${reason}`,
      actionTaken: `Transferred to ${targetFacility}`
    };

    const result = await referralTrackingService.addReferralHop(null, hopData);

    this.logAuditAction(
      'Referral Initiated',
      `ASHA initiated referral for ${patient.name} to ${targetFacility} (${specialty}).`,
      ashaWorker?.name || 'Sunita Kamble (ASHA)'
    );

    return result;
  },

  async markPatientArrivedAtFacility(trackingId, hospitalName = 'District Civil Hospital, Chakan', remarks = 'Patient reported at triage desk.') {
    await delay(200);
    const hopData = {
      facility: hospitalName,
      status: 'in_progress',
      chainStatus: 'Under Specialist Review',
      clinicalFindings: 'Patient physically arrived at referred facility.',
      doctorRemarks: remarks,
      actionTaken: 'Patient Arrived & Registered at Specialist Counter'
    };

    const result = await referralTrackingService.addReferralHop(trackingId, hopData);

    this.logAuditAction(
      'Patient Arrived at Hospital',
      `Referral #${trackingId} marked: Patient arrived at ${hospitalName}.`,
      'Hospital Desk & ASHA Tracker'
    );

    return result;
  },

  // 10. High-Risk Patient Management
  async getHighRiskPatients() {
    const patients = await this.getAssignedPatients();
    return patients.filter(p => 
      p.riskStatus === 'High-Risk' ||
      p.riskCategory?.toLowerCase().includes('anc') ||
      p.riskCategory?.toLowerCase().includes('maternal') ||
      p.riskCategory?.toLowerCase().includes('malnutrition') ||
      p.riskCategory?.toLowerCase().includes('hypertension') ||
      p.riskCategory?.toLowerCase().includes('diabetes') ||
      p.riskCategory?.toLowerCase().includes('cardiac') ||
      p.riskCategory?.toLowerCase().includes('geriatric')
    ).map(p => {
      // Determine urgency badge based on follow-up and risk category
      let badge = 'NORMAL';
      if (p.riskStatus === 'High-Risk' && p.riskCategory?.toLowerCase().includes('anemia')) badge = 'URGENT';
      else if (p.riskCategory?.toLowerCase().includes('hypertension') && p.vitals?.bp?.includes('165')) badge = 'URGENT';
      else if (p.nextFollowUp?.includes('16 Sep') || p.nextFollowUp?.includes('17 Sep')) badge = 'DUE SOON';
      else if (p.nextFollowUp?.includes('Overdue') || p.nextFollowUp?.includes('10 Sep')) badge = 'OVERDUE';

      return {
        ...p,
        urgencyBadge: badge
      };
    });
  },

  // 11. Follow-up Tasks & Accountability
  async getFollowUpTasks() {
    const followUps = await followUpService.getFollowUps();
    const patients = await this.getAssignedPatients();

    // Cross-link follow-ups with assigned patient demographics
    return followUps.map(f => {
      const patientMatch = patients.find(p => p.name.toLowerCase() === (f.patientName || '').toLowerCase() || p.id === f.patientId) || patients[0];
      return {
        ...f,
        patientName: f.patientName || patientMatch?.name || 'Rahul Sharma',
        patientPhone: f.patientPhone || patientMatch?.phone || '+91 98765 43210',
        village: f.village || patientMatch?.village || 'Khed (Rajgurunagar)',
        abhaId: f.abhaId || patientMatch?.abhaId || '91-4829-1029-4819'
      };
    });
  },

  async completeFollowUpTask(taskId, notes, ashaWorker) {
    const updated = await followUpService.updateFollowUp(taskId, {
      status: 'Completed',
      completionNotes: notes,
      completedAt: new Date().toISOString(),
      completedBy: ashaWorker?.name || 'Sunita Kamble (ASHA)'
    });

    this.logAuditAction(
      'Follow-Up Completed',
      `Follow-up task #${taskId} marked completed: ${notes}`,
      ashaWorker?.name || 'Sunita Kamble (ASHA)'
    );

    return updated;
  },

  // 12. Prescriptions & Medicines Synchronization
  async getPrescriptions() {
    return await prescriptionService.getPrescriptions();
  },

  // 13. Diagnostic Test Coordination
  async getDiagnosticTests() {
    const tests = await diagnosticService.getAvailableTests();
    const reports = await reportService.getReports();
    return { tests, reports };
  },

  // 14. Emergency 108 Dispatch Trigger
  async triggerEmergencyAssistance({ patient, emergencyType, emergencyNotes, location, ashaWorker }) {
    const desc = `[ASHA FRONT-LINE SOS] ${emergencyType || 'Critical Emergency'}: ${emergencyNotes || 'Immediate assistance required for assigned patient.'} | Patient: ${patient?.name} (ABHA: ${patient?.abhaId || 'N/A'}) | ASHA: ${ashaWorker?.name || 'Sunita Kamble'}`;

    const dispatch = await emergencyService.dispatchEmergency({
      targetType: 'someone_else',
      description: desc,
      callerName: `${ashaWorker?.name || 'Sunita Kamble'} (ASHA Worker)`,
      callerPhone: ashaWorker?.phone || '+91 97654 33211',
      userCoords: location || { lat: 18.8472, lng: 73.9142 },
      address: `${patient?.village || 'Khed Rural'}, Pune District, Maharashtra`
    });

    this.logAuditAction(
      'Emergency SOS Dispatched',
      `108 Emergency ambulance dispatched for ${patient?.name}: ${emergencyType}.`,
      ashaWorker?.name || 'Sunita Kamble (ASHA)'
    );

    return dispatch;
  },

  // 15. Longitudinal Patient Health Record (EHR Timeline)
  async getLongitudinalRecord(patientId) {
    await delay(150);
    const patients = await this.getAssignedPatients();
    const patient = patients.find(p => p.id === patientId) || patients[0];
    const prescriptions = await prescriptionService.getPrescriptions();
    const followUps = await followUpService.getFollowUps();
    const referralChains = await referralTrackingService.getTrackingChains();
    const reports = await reportService.getReports();

    const patientPrescriptions = prescriptions.filter(p => p.patientName?.toLowerCase().includes(patient.name.toLowerCase()) || p.appointmentId);
    const patientReferrals = referralChains.filter(r => r.patientName?.toLowerCase().includes(patient.name.toLowerCase()));

    const timeline = [
      {
        type: 'REGISTRATION',
        title: 'Initial Rural Health Registration & ABHA Generation',
        date: patient.registeredAt ? new Date(patient.registeredAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '01 Aug 2026',
        subtitle: `Registered at Khed Sub-Centre by ASHA Sunita Kamble`,
        details: `ABHA ID: ${patient.abhaId} verified. Consent obtained for digital health records.`
      },
      {
        type: 'CONSULTATION',
        title: 'Primary Health Center OPD Consultation',
        date: '08 Sep 2026',
        subtitle: 'Examined by Dr. Anjali Mehta (General Medicine)',
        details: 'Complaints of persistent fever, cough and chest tightness. Temperature 102.2°F, SpO2 95%.'
      },
      ...patientPrescriptions.map(rx => ({
        type: 'PRESCRIPTION',
        title: `Digital E-Prescription Issued (#${rx.id})`,
        date: rx.date || '10 Sep 2026',
        subtitle: `Prescribed by ${rx.doctorName || 'Dr. Anjali Mehta'}`,
        details: `Diagnosis: ${rx.diagnosis || 'Acute Respiratory Infection'}. Medicines: ${(rx.medicines || []).map(m => m.name).join(', ')}`
      })),
      ...reports.map(rep => ({
        type: 'DIAGNOSTIC',
        title: `Diagnostic Lab Report: ${rep.testName}`,
        date: rep.date || '12 Sep 2026',
        subtitle: `Conducted at ${rep.diagnosticCenter}`,
        details: `Summary: ${rep.summary}`
      })),
      ...patientReferrals.map(ref => ({
        type: 'REFERRAL',
        title: `Inter-Facility Referral: ${ref.primaryCondition}`,
        date: ref.createdAt || '11 Sep 2026',
        subtitle: `Status: ${ref.status}`,
        details: `Current Hop: ${ref.hops?.[ref.hops.length - 1]?.facility || 'District Hospital'}`
      })),
      ...followUps.map(fup => ({
        type: 'FOLLOWUP',
        title: `Doctor Follow-up: ${fup.instructions || 'Review Symptoms'}`,
        date: fup.dueDate || '18 Sep 2026',
        subtitle: `Status: ${fup.status}`,
        details: `Managed by ASHA Sunita Kamble`
      }))
    ];

    return {
      patient,
      timeline
    };
  },

  // 16. Audit Log Recording
  logAuditAction(action, details, actor = 'Sunita Kamble (ASHA)') {
    try {
      const logs = getStored(STORAGE_KEYS.ASHA_AUDIT_LOGS, INITIAL_ASHA_AUDIT_LOGS);
      const newLog = {
        id: `AUDIT-${Date.now()}`,
        action,
        details,
        actor,
        timestamp: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStored(STORAGE_KEYS.ASHA_AUDIT_LOGS, [newLog, ...logs]);
      window.dispatchEvent(new CustomEvent('asha_audit_logged', { detail: newLog }));
    } catch (e) {
      console.warn('Audit log write note:', e);
    }
  },

  async getAuditLogs() {
    await delay(100);
    return getStored(STORAGE_KEYS.ASHA_AUDIT_LOGS, INITIAL_ASHA_AUDIT_LOGS);
  },

  // 17. Offline Sync Queue (Low-Connectivity Handling)
  getOfflineQueue() {
    return getStored(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, []);
  },

  queueOfflineAction(actionType, payload) {
    const queue = this.getOfflineQueue();
    const item = {
      queueId: `OFFLINE-SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actionType,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending'
    };
    setStored(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, [...queue, item]);
    return item;
  },

  async syncOfflineQueue() {
    const queue = this.getOfflineQueue();
    if (queue.length === 0) return { syncedCount: 0 };

    await delay(500); // Simulate network synchronization
    let syncedCount = 0;

    for (const item of queue) {
      if (item.actionType === 'REGISTER_PATIENT') {
        // Already persisted locally; clear from pending sync
        syncedCount++;
      } else if (item.actionType === 'TRIAGE_NOTE') {
        syncedCount++;
      }
    }

    setStored(STORAGE_KEYS.OFFLINE_SYNC_QUEUE, []);
    this.logAuditAction('Offline Sync Completed', `Synchronized ${syncedCount} queued actions when connectivity returned.`, 'Sync Engine');
    window.dispatchEvent(new CustomEvent('asha_sync_completed', { detail: { syncedCount } }));
    return { syncedCount };
  }
};
