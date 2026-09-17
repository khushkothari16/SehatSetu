import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  UserCheck,
  UserPlus,
  Activity,
  AlertTriangle,
  Clock,
  Share2,
  Calendar,
  FileCheck,
  Pill,
  Phone,
  PhoneCall,
  Search,
  CheckCircle2,
  AlertCircle,
  Stethoscope,
  Building,
  RefreshCw,
  Send,
  Plus,
  Eye,
  FileText,
  MapPin,
  Mic,
  MicOff,
  Volume2,
  ShieldCheck,
  Check,
  X,
  ChevronRight,
  Download,
  Flame,
  Radio,
  Wifi,
  WifiOff,
  User,
  Users,
  LogOut,
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useConnectivity } from '../context/ConnectivityContext';
import { useLocation } from '../context/LocationContext';
import { ashaService } from '../services/ashaService';
import { appointmentService } from '../services/appointmentService';
import { queueService } from '../services/queueService';
import { voiceService } from '../services/voiceService';

export const AshaDashboard = ({ onLogout, currentSubView, onNavigate }) => {
  const { user } = useAuth();
  const { t, tr, language } = useLanguage();
  const { addToast } = useNotifications();
  const { isOnline } = useConnectivity();
  const { location: userLoc } = useLocation();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'patients' | 'add-patient' | 'triage' | 'requests' | 'referrals' | 'high-risk' | 'followups' | 'diagnostics' | 'prescriptions' | 'emergency' | 'messages' | 'audit'

  // Data States
  const [patients, setPatients] = useState([]);
  const [highRiskPatients, setHighRiskPatients] = useState([]);
  const [consultRequests, setConsultRequests] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [referralChains, setReferralChains] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [diagnosticData, setDiagnosticData] = useState({ tests: [], reports: [] });
  const [messages, setMessages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [liveQueue, setLiveQueue] = useState(() => queueService.getQueueStatusSync());

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  // Modals
  const [selectedPatientForModal, setSelectedPatientForModal] = useState(null);
  const [showTimelineModal, setShowTimelineModal] = useState(false);
  const [patientTimeline, setPatientTimeline] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] = useState(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [selectedPatientForReferral, setSelectedPatientForReferral] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [selectedPatientForEmergency, setSelectedPatientForEmergency] = useState(null);

  // New Patient Form State
  const [newPatient, setNewPatient] = useState({
    name: '',
    age: '',
    gender: 'Female',
    village: user?.village || 'Khed Rural',
    phone: '',
    emergencyContact: '',
    bloodGroup: 'B+',
    conditions: '',
    allergies: '',
    currentMeds: '',
    previousHistory: '',
    abhaId: '',
    riskStatus: 'Normal',
    riskCategory: 'General Care'
  });

  // Digital Triage Form State
  const [triagePatientId, setTriagePatientId] = useState('');
  const [triageVitals, setTriageVitals] = useState({
    bpSystolic: '120',
    bpDiastolic: '80',
    pulse: '76',
    spo2: '98',
    temp: '98.4',
    bloodSugar: '110',
    symptoms: '',
    redFlags: []
  });
  const [triageResult, setTriageResult] = useState(null);
  const [triageDoctorNotes, setTriageDoctorNotes] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  // Doctor Communication Chat State
  const [selectedChatPatientId, setSelectedChatPatientId] = useState('PAT-36');
  const [chatInputText, setChatInputText] = useState('');

  // Referral Initiation Form State
  const [referralForm, setReferralForm] = useState({
    targetFacility: 'District Civil Hospital, Chakan',
    specialty: 'Cardiology',
    reason: '',
    priority: 'High Priority'
  });

  // Appointment Booking Form State
  const [bookingForm, setBookingForm] = useState({
    doctorId: 'DOC-01',
    doctorName: 'Dr. Anjali Mehta',
    mode: 'offline',
    date: new Date().toISOString().split('T')[0],
    time: '11:00 AM',
    reason: 'Routine consultation and follow-up review'
  });

  // Sync subview navigation from parent or sidebar
  useEffect(() => {
    if (!currentSubView) return;
    if (currentSubView === 'asha-patients' || currentSubView === 'patients') setActiveTab('patients');
    else if (currentSubView === 'asha-add-patient') setActiveTab('add-patient');
    else if (currentSubView === 'asha-triage') setActiveTab('triage');
    else if (currentSubView === 'asha-consult-requests') setActiveTab('requests');
    else if (currentSubView === 'asha-referrals' || currentSubView === 'referrals') setActiveTab('referrals');
    else if (currentSubView === 'asha-high-risk') setActiveTab('high-risk');
    else if (currentSubView === 'asha-followups' || currentSubView === 'follow-ups') setActiveTab('followups');
    else if (currentSubView === 'asha-diagnostics' || currentSubView === 'reports') setActiveTab('diagnostics');
    else if (currentSubView === 'asha-prescriptions' || currentSubView === 'prescriptions') setActiveTab('prescriptions');
    else if (currentSubView === 'asha-messages') setActiveTab('messages');
    else if (currentSubView === 'emergency') setActiveTab('emergency');
    else if (currentSubView === 'home') setActiveTab('home');
  }, [currentSubView]);

  // Load All Shared Data
  const loadDashboardData = async () => {
    try {
      const pts = await ashaService.getAssignedPatients(user?.id);
      setPatients(pts);

      const hrs = await ashaService.getHighRiskPatients();
      setHighRiskPatients(hrs);

      const reqs = await ashaService.getConsultationRequests();
      setConsultRequests(reqs);

      const fups = await ashaService.getFollowUpTasks();
      setFollowUps(fups);

      const refs = await ashaService.getReferralChains();
      setReferralChains(refs);

      const rxs = await ashaService.getPrescriptions();
      setPrescriptions(rxs);

      const diag = await ashaService.getDiagnosticTests();
      setDiagnosticData(diag);

      const msgs = await ashaService.getDoctorMessages();
      setMessages(msgs);

      const logs = await ashaService.getAuditLogs();
      setAuditLogs(logs);

      setOfflineQueue(ashaService.getOfflineQueue());
      setLiveQueue(queueService.getQueueStatusSync());
    } catch (err) {
      console.warn('Error loading ASHA dashboard data:', err);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Listen to real-time events from Doctor Desk, Patient Portal, and Queue
    const handleSync = () => loadDashboardData();
    window.addEventListener('asha_patient_registered', handleSync);
    window.addEventListener('asha_patient_updated', handleSync);
    window.addEventListener('asha_consultation_request_created', handleSync);
    window.addEventListener('asha_consultation_request_updated', handleSync);
    window.addEventListener('asha_message_received', handleSync);
    window.addEventListener('referral_chain_updated', handleSync);
    window.addEventListener('prescription_created', handleSync);
    window.addEventListener('appointment_booked', handleSync);
    window.addEventListener('queue_state_change', handleSync);
    window.addEventListener('followup_created', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('asha_patient_registered', handleSync);
      window.removeEventListener('asha_patient_updated', handleSync);
      window.removeEventListener('asha_consultation_request_created', handleSync);
      window.removeEventListener('asha_consultation_request_updated', handleSync);
      window.removeEventListener('asha_message_received', handleSync);
      window.removeEventListener('referral_chain_updated', handleSync);
      window.removeEventListener('prescription_created', handleSync);
      window.removeEventListener('appointment_booked', handleSync);
      window.removeEventListener('queue_state_change', handleSync);
      window.removeEventListener('followup_created', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  // Recalculate triage whenever vitals or symptoms change
  useEffect(() => {
    if (!triageVitals.symptoms && !triageVitals.bpSystolic) {
      setTriageResult(null);
      return;
    }
    const evaluated = ashaService.evaluateDigitalTriage(triageVitals);
    setTriageResult(evaluated);
  }, [triageVitals]);

  // Voice Input Toggle for Triage / Notes
  const handleToggleVoiceInput = () => {
    if (isVoiceListening) {
      setIsVoiceListening(false);
      return;
    }

    setIsVoiceListening(true);
    const recognition = voiceService.startListening({
      language: language === 'hi' ? 'hi' : language === 'mr' ? 'mr' : 'en',
      onResult: (res) => {
        setTriageVitals(prev => ({
          ...prev,
          symptoms: prev.symptoms ? `${prev.symptoms} ${res.text}` : res.text
        }));
      },
      onError: (err) => {
        addToast(err || 'Microphone error', 'warning');
        setIsVoiceListening(false);
      },
      onEnd: () => {
        setIsVoiceListening(false);
      }
    });

    if (!recognition) setIsVoiceListening(false);
  };

  // Register Patient Action
  const handleRegisterPatientSubmit = async (e) => {
    e.preventDefault();
    if (!newPatient.name.trim()) {
      addToast(tr('Please enter patient name', 'कृपया मरीज का नाम दर्ज करें', 'कृपया रुग्णाचे नाव प्रविष्ट करा'), 'warning');
      return;
    }

    try {
      if (!isOnline) {
        ashaService.queueOfflineAction('REGISTER_PATIENT', newPatient);
      }
      const registered = await ashaService.registerPatient(newPatient, user);
      addToast(
        tr(
          `Patient ${registered.name} successfully registered with ABHA: ${registered.abhaId}`,
          `मरीज ${registered.name} सफलतापूर्वक पंजीकृत (ABHA: ${registered.abhaId})`,
          `रुग्ण ${registered.name} यशस्वीरित्या नोंदणीकृत (ABHA: ${registered.abhaId})`
        ),
        'success'
      );
      setNewPatient({
        name: '',
        age: '',
        gender: 'Female',
        village: user?.village || 'Khed Rural',
        phone: '',
        emergencyContact: '',
        bloodGroup: 'B+',
        conditions: '',
        allergies: '',
        currentMeds: '',
        previousHistory: '',
        abhaId: '',
        riskStatus: 'Normal',
        riskCategory: 'General Care'
      });
      await loadDashboardData();
      setActiveTab('patients');
    } catch (err) {
      addToast(err.message || 'Registration failed', 'error');
    }
  };

  // Submit Triage Consultation Request
  const handleSubmitTriageRequest = async () => {
    const pt = patients.find(p => p.id === triagePatientId) || patients[0];
    if (!pt) {
      addToast('Please select a patient for triage', 'warning');
      return;
    }

    try {
      const req = await ashaService.createConsultationRequest({
        patientId: pt.id,
        patientName: pt.name,
        patientAge: pt.age,
        patientGender: pt.gender,
        patientAbhaId: pt.abhaId,
        village: pt.village,
        doctorId: 'DOC-01',
        doctorName: 'Dr. Anjali Mehta',
        triageCategory: triageResult?.category || 'Urgent',
        symptoms: triageVitals.symptoms || 'Patient flagged for clinical consultation',
        vitals: {
          bp: `${triageVitals.bpSystolic}/${triageVitals.bpDiastolic}`,
          pulse: triageVitals.pulse,
          spo2: `${triageVitals.spo2}%`,
          temp: `${triageVitals.temp}°F`,
          sugar: triageVitals.bloodSugar ? `${triageVitals.bloodSugar} mg/dL` : undefined
        },
        ashaNotes: triageDoctorNotes || 'Triage consultation submitted by ASHA worker.'
      }, user);

      addToast(
        tr(
          `Consultation request submitted for ${pt.name} to Dr. Anjali Mehta!`,
          `${pt.name} के लिए डॉ. अंजलि मेहता को परामर्श अनुरोध भेजा गया!`,
          `${pt.name} साठी डॉ. अंजली मेहता यांच्याकडे सल्ला विनंती पाठवली!`
        ),
        'success'
      );

      setTriageVitals({
        bpSystolic: '120',
        bpDiastolic: '80',
        pulse: '76',
        spo2: '98',
        temp: '98.4',
        bloodSugar: '110',
        symptoms: '',
        redFlags: []
      });
      setTriageDoctorNotes('');
      await loadDashboardData();
      setActiveTab('requests');
    } catch (err) {
      addToast(err.message || 'Request failed', 'error');
    }
  };

  // View Longitudinal Health Record Timeline
  const handleOpenTimeline = async (patient) => {
    setSelectedPatientForModal(patient);
    const data = await ashaService.getLongitudinalRecord(patient.id);
    setPatientTimeline(data);
    setShowTimelineModal(true);
  };

  // Open Appointment Booking Modal
  const handleOpenBookingModal = (patient) => {
    setSelectedPatientForAppointment(patient);
    setShowAppointmentModal(true);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedPatientForAppointment) return;

    try {
      const apt = await ashaService.bookAssistedAppointment({
        doctor: {
          id: bookingForm.doctorId,
          name: bookingForm.doctorName,
          specialty: 'General Physician',
          hospital: user?.connectedPhc || 'Khed Primary Health Centre (PHC)',
          room: 'OPD Room 4',
          fee: 0
        },
        mode: bookingForm.mode,
        date: bookingForm.date,
        time: bookingForm.time,
        reason: bookingForm.reason,
        patient: selectedPatientForAppointment
      });

      addToast(
        tr(
          `Appointment confirmed for ${selectedPatientForAppointment.name}! Token: ${apt.token}`,
          `${selectedPatientForAppointment.name} के लिए अपॉइंटमेंट पुष्ट! टोकन: ${apt.token}`,
          `${selectedPatientForAppointment.name} साठी भेट निश्चित! टोकन: ${apt.token}`
        ),
        'success'
      );
      setShowAppointmentModal(false);
      await loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Booking failed', 'error');
    }
  };

  // Open Referral Initiation Modal
  const handleOpenReferralModal = (patient) => {
    setSelectedPatientForReferral(patient);
    setReferralForm({
      targetFacility: 'District Civil Hospital, Chakan',
      specialty: 'Department of Cardiology & Cath Lab',
      reason: `Patient ${patient.name} requires specialist review for ${patient.riskCategory || 'complex clinical condition'}.`,
      priority: 'High Priority'
    });
    setShowReferralModal(true);
  };

  const handleConfirmReferral = async (e) => {
    e.preventDefault();
    if (!selectedPatientForReferral) return;

    try {
      await ashaService.initiateReferral({
        patient: selectedPatientForReferral,
        targetFacility: referralForm.targetFacility,
        specialty: referralForm.specialty,
        reason: referralForm.reason,
        priority: referralForm.priority,
        referringDoctor: 'Dr. Anjali Mehta',
        ashaWorker: user
      });

      addToast(
        tr(
          `Referral successfully initiated for ${selectedPatientForReferral.name} to ${referralForm.targetFacility}!`,
          `${selectedPatientForReferral.name} के लिए ${referralForm.targetFacility} में रेफरल शुरू!`,
          `${selectedPatientForReferral.name} साठी ${referralForm.targetFacility} मध्ये रेफरल सुरू!`
        ),
        'success'
      );
      setShowReferralModal(false);
      await loadDashboardData();
      setActiveTab('referrals');
    } catch (err) {
      addToast(err.message || 'Referral failed', 'error');
    }
  };

  // Open Emergency SOS Modal
  const handleOpenEmergencyModal = (patient) => {
    setSelectedPatientForEmergency(patient);
    setShowEmergencyModal(true);
  };

  const handleConfirmEmergency = async () => {
    if (!selectedPatientForEmergency) return;

    try {
      await ashaService.triggerEmergencyAssistance({
        patient: selectedPatientForEmergency,
        emergencyType: 'Critical Triage Escalation / Acute Distress',
        emergencyNotes: `Urgent ambulance dispatch initiated by ASHA ${user?.name || 'Sunita Kamble'} for ${selectedPatientForEmergency.name} in ${selectedPatientForEmergency.village}.`,
        location: userLoc ? { lat: userLoc.lat, lng: userLoc.lng } : { lat: 18.8472, lng: 73.9142 },
        ashaWorker: user
      });

      addToast(
        tr(
          `🚨 108 Emergency Ambulance dispatched immediately for ${selectedPatientForEmergency.name}!`,
          `🚨 108 एम्बुलेंस ${selectedPatientForEmergency.name} के लिए तुरंत रवाना!`,
          `🚨 १०८ रुग्णवाहिका ${selectedPatientForEmergency.name} साठी तातडीने रवाना!`
        ),
        'error'
      );
      setShowEmergencyModal(false);
      await loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Dispatch failed', 'error');
    }
  };

  // Complete Follow-up Task Action
  const handleCompleteFollowUp = async (taskId) => {
    const notes = prompt(
      language === 'hi'
        ? 'फॉलो-अप नोट्स दर्ज करें (मरीज की स्थिति):'
        : language === 'mr'
          ? 'पाठपुरावा नोंदी प्रविष्ट करा (रुग्णाची स्थिती):'
          : 'Enter follow-up visit notes (Patient condition & advice given):',
      'Patient contacted at home. Symptoms evaluated stable. Advised continuation of medications.'
    );
    if (!notes) return;

    try {
      await ashaService.completeFollowUpTask(taskId, notes, user);
      addToast(tr('Follow-up marked completed!', 'फॉलो-अप पूर्ण चिन्हित!', 'पाठपुरावा पूर्ण झाला!'), 'success');
      await loadDashboardData();
    } catch (err) {
      addToast(err.message || 'Failed to complete follow-up', 'error');
    }
  };

  // Send Chat Message to Doctor
  const handleSendMessageToDoctor = async (e) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;

    const pt = patients.find(p => p.id === selectedChatPatientId) || patients[0];
    try {
      await ashaService.sendDoctorMessage({
        patientId: pt?.id || 'PAT-36',
        patientName: pt?.name || 'Savita Kamble',
        senderRole: 'asha',
        senderName: `${user?.name || 'Sunita Kamble'} (ASHA)`,
        recipientName: 'Dr. Anjali Mehta',
        doctorId: 'DOC-01',
        message: chatInputText.trim()
      });
      setChatInputText('');
      await loadDashboardData();
    } catch (err) {
      addToast('Message sending failed', 'error');
    }
  };

  // Sync Offline Queue Manually
  const handleSyncOfflineNow = async () => {
    try {
      const res = await ashaService.syncOfflineQueue();
      addToast(
        tr(
          `Sync complete: ${res.syncedCount} queued action(s) uploaded!`,
          `सिंक पूर्ण: ${res.syncedCount} कार्य अपलोड हुए!`,
          `सिंक पूर्ण: ${res.syncedCount} कृती अपलोड झाल्या!`
        ),
        'success'
      );
      await loadDashboardData();
    } catch (err) {
      addToast('Sync failed', 'error');
    }
  };

  // Filtered Patients List
  const filteredPatients = patients.filter(p => {
    const matchesSearch =
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.abhaId?.includes(searchQuery) ||
      p.village?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (riskFilter === 'ALL') return true;
    if (riskFilter === 'HIGH_RISK') return p.riskStatus === 'High-Risk';
    if (riskFilter === 'MODERATE') return p.riskStatus === 'Moderate';
    if (riskFilter === 'NORMAL') return p.riskStatus === 'Normal';
    return true;
  });

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', paddingBottom: '5rem', fontFamily: 'Inter, sans-serif' }}>
      
      {/* 1. TOP ASHA HEADER BAR */}
      <header
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
          color: 'white',
          padding: '1.25rem 1.5rem',
          boxShadow: '0 4px 12px rgba(13, 148, 136, 0.15)',
          position: 'sticky',
          top: 0,
          zIndex: 40
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          
          {/* Worker Identity & Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem',
                border: '2px solid rgba(255, 255, 255, 0.4)'
              }}
            >
              👩‍⚕️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                  {user?.name || 'Sunita Kamble'}
                </h1>
                <span
                  style={{
                    backgroundColor: '#134E4A',
                    color: '#99F6E4',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '12px',
                    letterSpacing: '0.04em'
                  }}
                >
                  ID: {user?.medicalRegNo || 'ASHA-MH-2026-4018'}
                </span>
                <span
                  style={{
                    backgroundColor: isOnline ? '#065F46' : '#7F1D1D',
                    color: isOnline ? '#A7F3D0' : '#FECACA',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                  {isOnline ? tr('ONLINE', 'ऑनलाइन', 'ऑनलाइन') : tr('OFFLINE (Local Queue)', 'ऑफ़लाइन (लोकल)', 'ऑफलाईन')}
                </span>
              </div>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <span>📍 {user?.village || 'Khed Rural & Alandi Sector'}</span>
                <span>🏥 {user?.connectedPhc || 'Khed Primary Health Centre (PHC)'}</span>
                <span>📅 {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </p>
            </div>
          </div>

          {/* Quick Action Controls in Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            {offlineQueue.length > 0 && (
              <button
                onClick={handleSyncOfflineNow}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#78350F',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '0.4rem 0.85rem'
                }}
              >
                <RefreshCw size={13} />
                <span>{offlineQueue.length} {tr('Pending Sync', 'पेंडिंग सिंक', 'प्रलंबित सिंक')}</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('emergency')}
              className="btn btn-sm"
              style={{
                backgroundColor: '#EF4444',
                color: 'white',
                fontWeight: 800,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                borderRadius: '20px',
                padding: '0.45rem 0.9rem',
                boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
              }}
            >
              <AlertTriangle size={14} />
              <span>108 SOS</span>
            </button>

            <button
              onClick={onLogout}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                fontWeight: 700,
                fontSize: '0.8rem',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                borderRadius: '20px',
                padding: '0.4rem 0.8rem'
              }}
              title="Logout"
            >
              <LogOut size={13} />
              <span>{tr('Logout', 'लॉगआउट', 'लॉगआउट')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TABS BAR */}
      <nav
        style={{
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: '72px',
          zIndex: 30,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '0.5rem 1rem'
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'home', label: tr('Desk Home', 'मुख्य डैशबोर्ड', 'मुख्य डॅशबोर्ड'), icon: Stethoscope },
            { id: 'patients', label: `${tr('My Patients', 'मेरे मरीज', 'माझे रुग्ण')} (${patients.length})`, icon: UserCheck },
            { id: 'add-patient', label: tr('+ Add Patient', '+ नया मरीज', '+ नवीन रुग्ण'), icon: UserPlus },
            { id: 'triage', label: tr('Digital Triage', 'डिजिटल ट्राइएज', 'डिजिटल ट्रायेज'), icon: Activity },
            { id: 'requests', label: `${tr('Doctor Requests', 'डॉक्टर अनुरोध', 'डॉक्टर विनंत्या')} (${consultRequests.length})`, icon: Clock },
            { id: 'referrals', label: `${tr('Referrals', 'रेफरल नेटवर्क', 'रेफरल नेटवर्क')} (${referralChains.length})`, icon: Share2 },
            { id: 'high-risk', label: `${tr('High-Risk Watchlist', 'उच्च जोखिम मरीज', 'अति-जोखमीचे रुग्ण')} (${highRiskPatients.length})`, icon: AlertTriangle },
            { id: 'followups', label: `${tr('Follow-Up Tasks', 'फॉलो-अप कार्य', 'पाठपुरावा कार्ये')} (${followUps.filter(f => f.status !== 'Completed').length})`, icon: Calendar },
            { id: 'diagnostics', label: tr('Diagnostic Tests', 'जांच व रिपोर्ट्स', 'तपासणी व अहवाल'), icon: FileCheck },
            { id: 'prescriptions', label: tr('Prescriptions', 'दवा पर्चियां', 'औषध चिठ्ठ्या'), icon: Pill },
            { id: 'messages', label: tr('Doctor Chat', 'डॉक्टर संवाद', 'डॉक्टर संवाद'), icon: Send },
            { id: 'emergency', label: tr('108 Emergency', '108 आपातकाल', '१०८ आपत्काल'), icon: Flame }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.95rem',
                  borderRadius: '24px',
                  border: isActive ? '2px solid #0D9488' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#CCFBF1' : 'white',
                  color: isActive ? '#0F766E' : '#475569',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} color={isActive ? '#0D9488' : '#64748b'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. MAIN DASHBOARD CONTENT ROUTING */}
      <main style={{ maxWidth: 1280, margin: '1.5rem auto', padding: '0 1rem' }}>
        
        {/* ========================================================= */}
        {/* VIEW 1: HOME OVERVIEW (8 REAL-DATA METRIC CARDS + GATEWAYS) */}
        {/* ========================================================= */}
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* 8 REAL-TIME DATA CARDS */}
            <section>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                  📊 {tr('Live Rural Field Overview', 'लाइव ग्रामीण फील्ड स्थिति', 'थेट ग्रामीण फील्ड स्थिती')}
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {tr('Synchronized with PHC & Doctor Database', 'पीएचसी व डॉक्टर डेटाबेस से सिंक', 'पीएचसी व डॉक्टर डेटाबेसशी सिंक')}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                
                {/* 1. Total Assigned Patients */}
                <div
                  onClick={() => setActiveTab('patients')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #0D9488', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('Total Assigned Patients', 'कुल पंजीकृत मरीज', 'एकूण नोंदणीकृत रुग्ण')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0F766E', marginTop: '0.2rem' }}>
                        {patients.length}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#CCFBF1', color: '#0D9488' }}>
                      <UserCheck size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#0D9488', fontWeight: 700 }}>
                    {tr('Tap to manage patients →', 'मरीज सूची देखने के लिए टैप करें →', 'रुग्ण यादी पाहण्यासाठी टॅप करा →')}
                  </div>
                </div>

                {/* 2. Today's Appointments */}
                <div
                  onClick={() => setActiveTab('requests')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #0284C7', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr("Today's Appointments", 'आज के अपॉइंटमेंट', 'आजच्या भेटी')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0284C7', marginTop: '0.2rem' }}>
                        {liveQueue ? 1 : 0}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                      <Clock size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#0284C7', fontWeight: 700 }}>
                    {liveQueue ? `Token #${liveQueue.userToken} active in OPD Room 4` : 'No active queue token'}
                  </div>
                </div>

                {/* 3. Pending Follow-ups */}
                <div
                  onClick={() => setActiveTab('followups')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #EAB308', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('Pending Follow-ups', 'लंबित फॉलो-अप', 'प्रलंबित पाठपुरावा')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#CA8A04', marginTop: '0.2rem' }}>
                        {followUps.filter(f => f.status !== 'Completed').length}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#FEF9C3', color: '#CA8A04' }}>
                      <Calendar size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#CA8A04', fontWeight: 700 }}>
                    {tr('Home visits scheduled this week →', 'इस सप्ताह गृह भेंट नियत →', 'या आठवड्यात गृहभेटी नियोजित →')}
                  </div>
                </div>

                {/* 4. High-Risk Patients */}
                <div
                  onClick={() => setActiveTab('high-risk')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #EF4444', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('High-Risk Patients', 'उच्च जोखिम मरीज', 'अति-जोखमीचे रुग्ण')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#DC2626', marginTop: '0.2rem' }}>
                        {highRiskPatients.length}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                      <AlertTriangle size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>
                    {tr('ANC, Anemia, Hypertension & Malnutrition →', 'गर्भवती, रक्तअल्पता, बीपी व कुपोषण →', 'गरोदर, ॲनिमिया, बीपी व कुपोषण →')}
                  </div>
                </div>

                {/* 5. Pending Referrals */}
                <div
                  onClick={() => setActiveTab('referrals')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #8B5CF6', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('Active Referrals', 'सक्रिय रेफरल', 'सक्रिय संदर्भ')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#7C3AED', marginTop: '0.2rem' }}>
                        {referralChains.length}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
                      <Share2 size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#7C3AED', fontWeight: 700 }}>
                    {tr('Chakan District Hospital tracking →', 'चाकण जिल्हा रुग्णालय ट्रॅकिंग →', 'चाकण जिल्हा रुग्णालय ट्रॅकिंग →')}
                  </div>
                </div>

                {/* 6. Emergency Cases */}
                <div
                  onClick={() => setActiveTab('emergency')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #F43F5E', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('108 Emergency Cases', '108 आपातकालीन स्थिति', '१०८ आपत्कालीन स्थिती')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#E11D48', marginTop: '0.2rem' }}>
                        0
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#FFE4E6', color: '#E11D48' }}>
                      <Flame size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#E11D48', fontWeight: 700 }}>
                    {tr('1-Tap SOS Ready →', '1-क्लिक SOS सक्रिय →', '१-क्लिक SOS सक्रिय →')}
                  </div>
                </div>

                {/* 7. Pending Diagnostic Tests */}
                <div
                  onClick={() => setActiveTab('diagnostics')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #06B6D4', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('Diagnostic Tests', 'लैब जांच समन्वय', 'लॅब तपासणी समन्वय')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0891B2', marginTop: '0.2rem' }}>
                        {diagnosticData.reports?.length || 2}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#CFFAFE', color: '#0891B2' }}>
                      <FileCheck size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#0891B2', fontWeight: 700 }}>
                    {tr('CBC & Blood Sugar Reports Available →', 'सीबीसी व शुगर रिपोर्ट तैयार →', 'सीबीसी व शुगर रिपोर्ट तयार →')}
                  </div>
                </div>

                {/* 8. Medicine/Prescription Alerts */}
                <div
                  onClick={() => setActiveTab('prescriptions')}
                  className="card card-clickable"
                  style={{ padding: '1.25rem', borderRadius: '16px', borderLeft: '5px solid #10B981', backgroundColor: 'white' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        {tr('Active Prescriptions', 'सक्रिय दवा पर्चियां', 'सक्रिय औषध चिठ्ठ्या')}
                      </div>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#059669', marginTop: '0.2rem' }}>
                        {prescriptions.length}
                      </div>
                    </div>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', backgroundColor: '#D1FAE5', color: '#059669' }}>
                      <Pill size={22} />
                    </div>
                  </div>
                  <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: '#059669', fontWeight: 700 }}>
                    {tr('Jan Aushadhi Kendra stock linked →', 'जन औषधि केंद्र स्टॉक लिंक →', 'जन औषध केंद्र स्टॉक लिंक →')}
                  </div>
                </div>

              </div>
            </section>

            {/* QUICK HEALTHCARE BRIDGES */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              
              {/* Card 1: Fast Action Shortcuts */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                  ⚡ {tr('Frontline Action Shortcuts', 'त्वरित स्वास्थ्य सेवाएं', 'त्वरित आरोग्य सेवा')}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button
                    onClick={() => setActiveTab('add-patient')}
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', borderColor: '#0D9488', color: '#0D9488', fontWeight: 700, borderRadius: '12px' }}
                  >
                    <UserPlus size={18} />
                    <span>{tr('Register New Village Patient (ABHA Linked)', 'नया ग्रामीण मरीज जोड़ें (ABHA लिंक)', 'नवीन ग्रामीण रुग्ण जोडा (ABHA लिंक)')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('triage')}
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', borderColor: '#D97706', color: '#D97706', fontWeight: 700, borderRadius: '12px' }}
                  >
                    <Activity size={18} />
                    <span>{tr('Conduct Symptom & Vitals Triage (Green/Yellow/Red)', 'लक्षण व वाइटल्स ट्राइएज जांच', 'लक्षणे व वाइटल्स ट्रायेज तपासणी')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('requests')}
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', borderColor: '#0284C7', color: '#0284C7', fontWeight: 700, borderRadius: '12px' }}
                  >
                    <Clock size={18} />
                    <span>{tr('Check Live OPD Queue & Doctor Review Status', 'लाइव ओपीडी कतार व डॉक्टर स्थिति', 'थेट ओपीडी रांग व डॉक्टर स्थिती')}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('referrals')}
                    className="btn btn-outline"
                    style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', borderColor: '#7C3AED', color: '#7C3AED', fontWeight: 700, borderRadius: '12px' }}
                  >
                    <Share2 size={18} />
                    <span>{tr('Track Specialist Referrals & Hospital Arrival', 'अस्पताल रेफरल व आगमन ट्रैकिंग', 'रुग्णालय संदर्भ व आगमन ट्रॅकिंग')}</span>
                  </button>
                </div>
              </div>

              {/* Card 2: Connected Primary Health Centre (PHC) Liaison */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>
                    🏥 {tr('Connected PHC & Doctor Duty', 'संबद्ध पीएचसी व डॉक्टर ड्यूटी', 'संलग्न पीएचसी व डॉक्टर ड्युटी')}
                  </h3>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
                    Active Sync
                  </span>
                </div>

                <div style={{ backgroundColor: '#F0FDFA', padding: '1rem', borderRadius: '12px', border: '1px solid #CCFBF1', marginBottom: '1rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F766E' }}>
                    Khed Primary Health Centre (PHC Room 4)
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
                    Duty Medical Officer: <strong>Dr. Anjali Mehta, MBBS, MD</strong>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#0D9488', marginTop: '0.35rem', fontWeight: 700 }}>
                    ⚡ OPD Hours: 9:00 AM - 2:00 PM • Telemedicine Bay Online
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => setActiveTab('messages')}
                    className="btn btn-primary"
                    style={{ flex: 1, borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <Send size={14} />
                    <span>{tr('Message Dr. Mehta', 'डॉक्टर को संदेश भेजें', 'डॉक्टरांना संदेश पाठवा')}</span>
                  </button>
                  <a
                    href="tel:+919822144556"
                    className="btn btn-outline"
                    style={{ borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    <Phone size={14} />
                  </a>
                </div>
              </div>

            </section>

            {/* HIGH RISK WATCHLIST SUMMARY */}
            <section style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#DC2626' }}>
                    🚨 {tr('Urgent Attention: High-Risk Patients', 'अति-आवश्यक: उच्च जोखिम मरीज', 'तातडीचे: अति-जोखमीचे रुग्ण')}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {tr('Patients requiring priority monitoring, nutrition assistance, or medication refill', 'प्राथमिकता निगरानी व दवा रिफिल हेतु चिन्हित मरीज', 'प्राधान्य देखरेख व औषध रिफिल आवश्यक असलेले रुग्ण')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('high-risk')}
                  className="btn btn-outline btn-sm"
                  style={{ borderRadius: '16px', fontSize: '0.8rem', fontWeight: 700 }}
                >
                  {tr('View All', 'सभी देखें', 'सर्व पहा')} →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {highRiskPatients.slice(0, 3).map(p => (
                  <div
                    key={p.id}
                    style={{
                      padding: '1rem',
                      borderRadius: '12px',
                      border: '1px solid #FEE2E2',
                      backgroundColor: '#FFF5F5',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991B1B' }}>
                            {p.name} ({p.age}y / {p.gender})
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            📍 {p.village} • ABHA: {p.abhaId}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#EF4444', color: 'white', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                          {p.urgencyBadge}
                        </span>
                      </div>
                      
                      <div style={{ margin: '0.65rem 0', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: 600 }}>
                        ⚠️ {p.riskCategory}
                      </div>

                      <div style={{ fontSize: '0.75rem', color: '#475569', backgroundColor: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                        <strong>Vitals:</strong> BP: {p.vitals?.bp || 'N/A'} • Pulse: {p.vitals?.pulse || 'N/A'} • Next Follow-up: <strong>{p.nextFollowUp}</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: '0.85rem', display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => {
                          setTriagePatientId(p.id);
                          setActiveTab('triage');
                        }}
                        className="btn btn-sm btn-outline"
                        style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, borderColor: '#DC2626', color: '#DC2626', borderRadius: '8px' }}
                      >
                        {tr('Triage', 'ट्राइएज', 'ट्रायेज')}
                      </button>
                      <button
                        onClick={() => handleOpenTimeline(p)}
                        className="btn btn-sm btn-outline"
                        style={{ flex: 1, fontSize: '0.75rem', fontWeight: 700, borderRadius: '8px' }}
                      >
                        {tr('History', 'इतिहास', 'इतिहास')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: MY PATIENTS (TABLE & CARD GRID WITH RICH ACTIONS) */}
        {/* ========================================================= */}
        {activeTab === 'patients' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Header & Filter Controls */}
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                  👥 {tr('My Assigned Village Patients', 'मेरे पंजीकृत ग्रामीण मरीज', 'माझे नोंदणीकृत ग्रामीण रुग्ण')}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {tr('Real-time synchronization with SehatSetu EHR & Doctor OPD', 'सेहतसेतु ईएचआर व डॉक्टर ओपीडी से सिंक', 'सेतूआरोग्य ईएचआर व डॉक्टर ओपीडीशी सिंक')}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', minWidth: 240 }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    placeholder={tr('Search name, phone, ABHA...', 'नाम, फोन, ABHA खोजें...', 'नाव, फोन, ABHA शोधा...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: '0.55rem 0.75rem 0.55rem 2.3rem',
                      borderRadius: '20px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      width: '100%',
                      outline: 'none'
                    }}
                  />
                </div>

                <select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  style={{
                    padding: '0.55rem 0.85rem',
                    borderRadius: '20px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH_RISK">High-Risk Only</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="NORMAL">Normal</option>
                </select>

                <button
                  onClick={() => setActiveTab('add-patient')}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '20px', fontWeight: 700 }}
                >
                  <UserPlus size={15} />
                  <span>{tr('Add Patient', 'नया मरीज जोड़ें', 'नवीन रुग्ण जोडा')}</span>
                </button>
              </div>
            </div>

            {/* Patients List Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {filteredPatients.map(pt => (
                <div
                  key={pt.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: `1.5px solid ${pt.riskStatus === 'High-Risk' ? '#FCA5A5' : '#e2e8f0'}`,
                    padding: '1.25rem',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Top Row: Name, Age, Risk Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                          {pt.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                          {pt.age} yrs • {pt.gender} • Blood Group: <strong>{pt.bloodGroup || 'B+'}</strong>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          borderRadius: '12px',
                          padding: '0.25rem 0.65rem',
                          backgroundColor: pt.riskStatus === 'High-Risk' ? '#FEE2E2' : pt.riskStatus === 'Moderate' ? '#FEF3C7' : '#DCFCE7',
                          color: pt.riskStatus === 'High-Risk' ? '#DC2626' : pt.riskStatus === 'Moderate' ? '#D97706' : '#16A34A'
                        }}
                      >
                        {pt.riskStatus}
                      </span>
                    </div>

                    {/* ABHA & Location */}
                    <div style={{ margin: '0.75rem 0', padding: '0.65rem', backgroundColor: '#F8FAFC', borderRadius: '10px', fontSize: '0.8rem' }}>
                      <div>🆔 <strong>ABHA ID:</strong> {pt.abhaId}</div>
                      <div>📍 <strong>Village:</strong> {pt.village}</div>
                      <div>📞 <strong>Contact:</strong> {pt.phone}</div>
                      {pt.emergencyContact && (
                        <div>🚨 <strong>Emergency Contact:</strong> {pt.emergencyContact}</div>
                      )}
                    </div>

                    {/* Clinical Summary & Vitals */}
                    <div style={{ fontSize: '0.8rem', color: '#334155', marginBottom: '0.75rem' }}>
                      <div><strong>Health Condition:</strong> {pt.riskCategory || 'General Checkup'}</div>
                      <div><strong>Doctor:</strong> {pt.currentDoctor || 'Dr. Anjali Mehta'}</div>
                      <div><strong>Last Visit:</strong> {pt.lastVisit} • <strong>Next Follow-up:</strong> {pt.nextFollowUp}</div>
                      <div><strong>Referral Status:</strong> {pt.referralStatus}</div>
                    </div>

                    {/* ASHA Notes */}
                    {pt.ashaNotes && (
                      <div style={{ fontSize: '0.78rem', color: '#0F766E', backgroundColor: '#F0FDFA', padding: '0.5rem 0.75rem', borderRadius: '8px', borderLeft: '3px solid #0D9488', marginBottom: '0.75rem' }}>
                        💬 <em>"{pt.ashaNotes}"</em>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <button
                      onClick={() => {
                        setTriagePatientId(pt.id);
                        setActiveTab('triage');
                      }}
                      className="btn btn-sm"
                      style={{ flex: 1, backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 800, borderRadius: '8px', fontSize: '0.78rem', border: '1px solid #FCD34D' }}
                    >
                      <Activity size={13} />
                      <span>{tr('Triage', 'ट्राइएज', 'ट्रायेज')}</span>
                    </button>

                    <button
                      onClick={() => handleOpenBookingModal(pt)}
                      className="btn btn-sm"
                      style={{ flex: 1, backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 800, borderRadius: '8px', fontSize: '0.78rem', border: '1px solid #BAE6FD' }}
                    >
                      <Clock size={13} />
                      <span>{tr('Book OPD', 'अपॉइंटमेंट', 'भेट बुक')}</span>
                    </button>

                    <button
                      onClick={() => handleOpenReferralModal(pt)}
                      className="btn btn-sm"
                      style={{ flex: 1, backgroundColor: '#EDE9FE', color: '#6D28D9', fontWeight: 800, borderRadius: '8px', fontSize: '0.78rem', border: '1px solid #DDD6FE' }}
                    >
                      <Share2 size={13} />
                      <span>{tr('Refer', 'रेफर करें', 'रेफर करा')}</span>
                    </button>

                    <button
                      onClick={() => handleOpenTimeline(pt)}
                      className="btn btn-sm btn-outline"
                      style={{ flex: 1, borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      <ClipboardList size={13} />
                      <span>{tr('History', 'इतिहास', 'इतिहास')}</span>
                    </button>

                    <button
                      onClick={() => handleOpenEmergencyModal(pt)}
                      className="btn btn-sm"
                      style={{ backgroundColor: '#FEE2E2', color: '#DC2626', fontWeight: 800, borderRadius: '8px', fontSize: '0.78rem', border: '1px solid #FCA5A5' }}
                      title="108 SOS"
                    >
                      <Flame size={13} />
                    </button>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: PATIENT REGISTRATION (ADD PATIENT WORKFLOW) */}
        {/* ========================================================= */}
        {activeTab === 'add-patient' && (
          <div style={{ maxWidth: 780, margin: '0 auto', backgroundColor: 'white', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
            
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0F766E' }}>
                ➕ {tr('Register New Rural Patient', 'नया ग्रामीण मरीज पंजीकृत करें', 'नवीन ग्रामीण रुग्णाची नोंदणी करा')}
              </h2>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {tr('Directly synced to Doctor Desk, PHC EMR, and generates 14-digit ABHA ID', 'डॉक्टर डेस्क व पीएचसी ईएमआर से सीधा सिंक, 14-अंकीय ABHA आईडी जनरेट करता है', 'डॉक्टर डेस्क व पीएचसी ईएमआरशी थेट सिंक, १४-अंकी ABHA आयडी जनरेट करतो')}
              </p>
            </div>

            <form onSubmit={handleRegisterPatientSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Name & Age */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Full Name / पूरा नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavita Shinde"
                    value={newPatient.name}
                    onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Age / उम्र *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 29"
                    value={newPatient.age}
                    onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Gender / लिंग *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                    className="form-select"
                  >
                    <option value="Female">Female / महिला</option>
                    <option value="Male">Male / पुरुष</option>
                    <option value="Other">Other / अन्य</option>
                  </select>
                </div>
              </div>

              {/* Mobile Phone & Emergency Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Mobile Number / मोबाइल नंबर</label>
                  <input
                    type="tel"
                    placeholder="e.g. 98221 00000"
                    value={newPatient.phone}
                    onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Emergency Contact / आपातकालीन संपर्क</label>
                  <input
                    type="text"
                    placeholder="e.g. +91 98223 99881 (Spouse)"
                    value={newPatient.emergencyContact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergencyContact: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Village & Blood Group */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Village / Block / ग्राम *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Khed (Rajgurunagar)"
                    value={newPatient.village}
                    onChange={(e) => setNewPatient({ ...newPatient, village: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Blood Group / रक्त समूह</label>
                  <select
                    value={newPatient.bloodGroup}
                    onChange={(e) => setNewPatient({ ...newPatient, bloodGroup: e.target.value })}
                    className="form-select"
                  >
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="O+">O+</option>
                    <option value="AB+">AB+</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="O-">O-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* ABHA ID (Optional or Auto-Generate) */}
              <div>
                <label className="form-label">ABHA Health ID (Leave empty to auto-generate)</label>
                <input
                  type="text"
                  placeholder="e.g. 91-4829-1029-4819"
                  value={newPatient.abhaId}
                  onChange={(e) => setNewPatient({ ...newPatient, abhaId: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* Risk Status & Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Risk Category / जोखिम स्तर</label>
                  <select
                    value={newPatient.riskStatus}
                    onChange={(e) => setNewPatient({ ...newPatient, riskStatus: e.target.value })}
                    className="form-select"
                  >
                    <option value="Normal">Normal / सामान्य</option>
                    <option value="Moderate">Moderate / मध्यम</option>
                    <option value="High-Risk">High-Risk / उच्च जोखिम</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Health Category / स्वास्थ्य श्रेणी</label>
                  <input
                    type="text"
                    placeholder="e.g. Antenatal Care (ANC), Hypertension, Diabetes, Geriatric"
                    value={newPatient.riskCategory}
                    onChange={(e) => setNewPatient({ ...newPatient, riskCategory: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Medical Conditions & Allergies */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Existing Chronic Conditions / पुरानी बीमारियां</label>
                  <input
                    type="text"
                    placeholder="e.g. Diabetes, Asthma, High BP"
                    value={newPatient.conditions}
                    onChange={(e) => setNewPatient({ ...newPatient, conditions: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Known Drug Allergies / दवा एलर्जी</label>
                  <input
                    type="text"
                    placeholder="e.g. Penicillin, Sulfa drugs"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* ASHA Field Notes */}
              <div>
                <label className="form-label">ASHA Worker Field Notes / प्रारंभिक अवलोकन</label>
                <textarea
                  rows={2}
                  placeholder="Notes regarding home visit, symptoms, or special rural assistance required..."
                  value={newPatient.ashaNotes}
                  onChange={(e) => setNewPatient({ ...newPatient, ashaNotes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              {/* Consent check */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.75rem', backgroundColor: '#F0FDFA', borderRadius: '10px', fontSize: '0.85rem', color: '#0F766E' }}>
                <input type="checkbox" required id="consentCheck" defaultChecked />
                <label htmlFor="consentCheck" style={{ cursor: 'pointer' }}>
                  Patient consent obtained for electronic health record registration and ASHA care coordination under National Health Mission guidelines.
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, fontWeight: 800, borderRadius: '12px' }}
                >
                  <UserPlus size={18} />
                  <span>{tr('Save & Register in SehatSetu', 'सेहतसेतु में सुरक्षित व पंजीकृत करें', 'सेतूआरोग्य मध्ये जतन व नोंदणी करा')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('patients')}
                  className="btn btn-outline"
                  style={{ borderRadius: '12px' }}
                >
                  {tr('Cancel', 'रद्द करें', 'रद्द करा')}
                </button>
              </div>

            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: DIGITAL TRIAGE ASSISTANCE (DECISION SUPPORT) */}
        {/* ========================================================= */}
        {activeTab === 'triage' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 960, margin: '0 auto' }}>
            
            {/* Disclaimer Alert */}
            <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #93C5FD', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertCircle size={24} color="#1D4ED8" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: '#1E40AF', lineHeight: 1.4 }}>
                <strong>Statutory Clinical Disclaimer (वैधानिक अस्वीकरण):</strong><br />
                "Preliminary triage support only. Final medical assessment must be performed by a qualified healthcare professional." (प्रारंभिक ट्राइएज सहायता केवल मार्गदर्शक है। अंतिम चिकित्सा निदान योग्य डॉक्टर द्वारा ही किया जाना चाहिए।)
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Left Column: Triage Inputs */}
              <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F766E' }}>
                  🚦 {tr('Vitals & Symptoms Assessment', 'मरीज वाइटल्स व लक्षण जांच', 'रुग्ण वाइटल्स व लक्षण तपासणी')}
                </h3>

                {/* Select Patient */}
                <div style={{ marginBottom: '1rem' }}>
                  <label className="form-label">Select Patient / मरीज चुनें *</label>
                  <select
                    value={triagePatientId}
                    onChange={(e) => setTriagePatientId(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Choose Assigned Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.age}y, {p.village}) - ABHA: {p.abhaId}</option>
                    ))}
                  </select>
                </div>

                {/* Vitals Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label className="form-label">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="120"
                      value={triageVitals.bpSystolic}
                      onChange={(e) => setTriageVitals({ ...triageVitals, bpSystolic: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="80"
                      value={triageVitals.bpDiastolic}
                      onChange={(e) => setTriageVitals({ ...triageVitals, bpDiastolic: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Pulse / Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="76"
                      value={triageVitals.pulse}
                      onChange={(e) => setTriageVitals({ ...triageVitals, pulse: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">SpO2 Oxygen (%)</label>
                    <input
                      type="number"
                      placeholder="98"
                      value={triageVitals.spo2}
                      onChange={(e) => setTriageVitals({ ...triageVitals, spo2: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Temperature (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.4"
                      value={triageVitals.temp}
                      onChange={(e) => setTriageVitals({ ...triageVitals, temp: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="110"
                      value={triageVitals.bloodSugar}
                      onChange={(e) => setTriageVitals({ ...triageVitals, bloodSugar: e.target.value })}
                      className="form-input"
                    />
                  </div>
                </div>

                {/* Symptoms with Voice Dictation */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Reported Symptoms / लक्षण विवरण</label>
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      className={`btn btn-sm ${isVoiceListening ? 'btn-danger' : 'btn-outline'}`}
                      style={{ borderRadius: '16px', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
                    >
                      {isVoiceListening ? <MicOff size={13} /> : <Mic size={13} />}
                      <span>{isVoiceListening ? 'Listening...' : 'Voice Input (बोलें)'}</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Type or speak symptoms (e.g. fever for 3 days, breathlessness, dizziness, chest tightness)..."
                    value={triageVitals.symptoms}
                    onChange={(e) => setTriageVitals({ ...triageVitals, symptoms: e.target.value })}
                    className="form-textarea"
                  />
                </div>

                {/* ASHA Notes to Doctor */}
                <div>
                  <label className="form-label">ASHA Observation Notes to Doctor</label>
                  <input
                    type="text"
                    placeholder="e.g. Village medicine dispensary out of stock, patient missed morning dose"
                    value={triageDoctorNotes}
                    onChange={(e) => setTriageDoctorNotes(e.target.value)}
                    className="form-input"
                  />
                </div>

              </div>

              {/* Right Column: Triage Classification Result */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                
                {triageResult ? (
                  <div
                    style={{
                      backgroundColor: triageResult.bgLight,
                      border: `2px solid ${triageResult.borderColor}`,
                      padding: '1.5rem',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '100%'
                    }}
                  >
                    <div>
                      {/* Classification Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span
                          style={{
                            backgroundColor: triageResult.badgeColor,
                            color: 'white',
                            fontSize: '0.9rem',
                            fontWeight: 900,
                            padding: '0.35rem 0.85rem',
                            borderRadius: '20px',
                            letterSpacing: '0.05em'
                          }}
                        >
                          {triageResult.level} • {triageResult.category.toUpperCase()}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          Algorithmic Decision Support
                        </span>
                      </div>

                      <h3 style={{ margin: '1rem 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: triageResult.badgeColor }}>
                        {triageResult.title}
                      </h3>

                      <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.4 }}>
                        {triageResult.summary}
                      </p>

                      {/* Recommended Next Steps */}
                      <div style={{ marginTop: '1.25rem' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', marginBottom: '0.5rem' }}>
                          📋 Protocol Next Steps / उचित कदम:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.82rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                          {triageResult.nextSteps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Direct Action Trigger Buttons */}
                    <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '1rem' }}>
                      {triageResult.level === 'RED' ? (
                        <button
                          onClick={() => {
                            const pt = patients.find(p => p.id === triagePatientId) || patients[0];
                            handleOpenEmergencyModal(pt);
                          }}
                          className="btn btn-lg"
                          style={{
                            width: '100%',
                            backgroundColor: '#DC2626',
                            color: 'white',
                            fontWeight: 900,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                          }}
                        >
                          <Flame size={20} />
                          <span>🚨 DISPATCH 108 EMERGENCY SOS NOW</span>
                        </button>
                      ) : triageResult.level === 'YELLOW' ? (
                        <button
                          onClick={handleSubmitTriageRequest}
                          className="btn btn-lg"
                          style={{
                            width: '100%',
                            backgroundColor: '#D97706',
                            color: 'white',
                            fontWeight: 800,
                            borderRadius: '12px',
                            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                          }}
                        >
                          <Clock size={18} />
                          <span>SEND CONSULTATION REQUEST TO DOCTOR</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const pt = patients.find(p => p.id === triagePatientId) || patients[0];
                            handleOpenBookingModal(pt);
                          }}
                          className="btn btn-lg"
                          style={{
                            width: '100%',
                            backgroundColor: '#16A34A',
                            color: 'white',
                            fontWeight: 800,
                            borderRadius: '12px'
                          }}
                        >
                          <Calendar size={18} />
                          <span>SCHEDULE NORMAL CARE / OPD VISIT</span>
                        </button>
                      )}
                    </div>

                  </div>
                ) : (
                  <div style={{ backgroundColor: '#F8FAFC', padding: '2.5rem', borderRadius: '16px', border: '2px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                    <Activity size={48} color="#94a3b8" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Awaiting Vital Signs & Symptoms</h4>
                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem' }}>
                      Enter patient BP, Pulse, SpO2, and reported symptoms on the left to activate rule-based digital triage support.
                    </p>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: DOCTOR CONSULTATION REQUESTS & LIVE OPD QUEUE */}
        {/* ========================================================= */}
        {activeTab === 'requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Live Synchronized OPD Queue Status Card */}
            <div style={{ backgroundColor: '#F0FDFA', border: '2px solid #0D9488', borderRadius: '16px', padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#0D9488', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                    LIVE OPD SYNCHRONIZATION
                  </span>
                  <h3 style={{ margin: '0.4rem 0 0.2rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F766E' }}>
                    {liveQueue ? liveQueue.facility : 'Khed Primary Health Centre (PHC)'} • Room 4
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155' }}>
                    Attending Physician: <strong>Dr. Anjali Mehta (General Medicine)</strong>
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CURRENT TOKEN</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0F766E' }}>#{liveQueue?.currentToken || 35}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>ACTIVE TOKEN</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0284C7' }}>#{liveQueue?.userToken || 35}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>QUEUE STATUS</div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, backgroundColor: '#DCFCE7', color: '#166534', padding: '0.25rem 0.75rem', borderRadius: '12px' }}>
                      {liveQueue?.status || 'Your Turn'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ASHA Consultation Requests List */}
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1e293b' }}>
                    🩺 {tr('Submitted Patient Consultation Requests to Doctor', 'डॉक्टर को भेजे गए परामर्श अनुरोध', 'डॉक्टरांकडे पाठवलेल्या सल्ला विनंत्या')}
                  </h3>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {tr('ASHA-submitted triage requests reviewed directly in Doctor Clinical Desk', 'आशा द्वारा भेजे गए ट्राइएज अनुरोध डॉक्टर डेस्क पर सीधे समीक्षित होते हैं', 'आशा कडून पाठवलेल्या ट्रायेज विनंत्या डॉक्टर डेस्कवर थेट तपासल्या जातात')}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('triage')}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: '16px', fontWeight: 700 }}
                >
                  <Plus size={14} />
                  <span>{tr('New Triage Request', 'नया ट्राइएज अनुरोध', 'नवीन ट्रायेज विनंती')}</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {consultRequests.map(req => (
                  <div
                    key={req.id}
                    style={{
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: req.triageCategory === 'Emergency' ? '#FEF2F2' : req.triageCategory === 'Urgent' ? '#FFFBEB' : '#F0FDF4',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                            {req.patientName} ({req.patientAge}y, {req.patientGender})
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '8px',
                              backgroundColor: req.triageCategory === 'Emergency' ? '#DC2626' : req.triageCategory === 'Urgent' ? '#D97706' : '#16A34A',
                              color: 'white'
                            }}
                          >
                            {req.triageCategory}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                          🆔 ABHA: {req.patientAbhaId} • Village: {req.village} • Sent: {req.createdAt}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            backgroundColor: req.status === 'Accepted' ? '#DCFCE7' : req.status === 'Pending Review' ? '#FEF3C7' : '#E0F2FE',
                            color: req.status === 'Accepted' ? '#166534' : req.status === 'Pending Review' ? '#B45309' : '#0369A1'
                          }}
                        >
                          {req.status}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                          Doctor: <strong>{req.doctorName}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Vitals Summary */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.8rem', backgroundColor: 'white', padding: '0.6rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.06)' }}>
                      <div><strong>BP:</strong> {req.vitals?.bp || 'N/A'}</div>
                      <div><strong>Pulse:</strong> {req.vitals?.pulse ? `${req.vitals.pulse} bpm` : 'N/A'}</div>
                      <div><strong>SpO2:</strong> {req.vitals?.spo2 || 'N/A'}</div>
                      <div><strong>Temp:</strong> {req.vitals?.temp || 'N/A'}</div>
                      {req.vitals?.sugar && <div><strong>Blood Sugar:</strong> {req.vitals.sugar}</div>}
                    </div>

                    {/* Symptoms & ASHA Notes */}
                    <div style={{ fontSize: '0.85rem', color: '#1e293b' }}>
                      <strong>Symptoms Reported:</strong> {req.symptoms}
                    </div>
                    {req.ashaNotes && (
                      <div style={{ fontSize: '0.8rem', color: '#0F766E' }}>
                        <strong>ASHA Observation:</strong> {req.ashaNotes}
                      </div>
                    )}

                    {/* Doctor Response / Clinical Notes */}
                    {req.doctorRemarks && (
                      <div style={{ padding: '0.6rem 0.85rem', borderRadius: '8px', backgroundColor: '#EFF6FF', borderLeft: '4px solid #3B82F6', fontSize: '0.82rem', color: '#1E40AF' }}>
                        <strong>👨‍⚕️ Doctor Clinical Response ({req.doctorName}):</strong> {req.doctorRemarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: REFERRAL NETWORK TRACKING */}
        {/* ========================================================= */}
        {activeTab === 'referrals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                  🔄 {tr('Inter-Facility Referral Tracking Network', 'अंतर-अस्पताल रेफरल ट्रैकर नेटवर्क', 'आंतर-रुग्णालय संदर्भ ट्रॅकर नेटवर्क')}
                </h2>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  {tr('Sub-Centre ↔ Primary Health Centre ↔ District Civil Hospital, Chakan', 'उप-केंद्र ↔ प्राथमिक स्वास्थ्य केंद्र ↔ जिला अस्पताल चाकण', 'उप-केंद्र ↔ प्राथमिक आरोग्य केंद्र ↔ जिल्हा रुग्णालय चाकण')}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {referralChains.map(chain => (
                <div
                  key={chain.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
                          {chain.patientName} ({chain.age}y, {chain.gender})
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#EDE9FE', color: '#6D28D9', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                          {chain.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Referral ID: <strong>{chain.id}</strong> • ABHA: {chain.abhaId} • Village: {chain.village}
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F766E', marginTop: '0.35rem' }}>
                        Condition: {chain.primaryCondition}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          backgroundColor: chain.status?.includes('Completed') ? '#DCFCE7' : '#FEF3C7',
                          color: chain.status?.includes('Completed') ? '#166534' : '#B45309',
                          padding: '0.3rem 0.85rem',
                          borderRadius: '12px'
                        }}
                      >
                        {chain.status}
                      </span>
                      <div style={{ marginTop: '0.5rem' }}>
                        <button
                          onClick={async () => {
                            await ashaService.markPatientArrivedAtFacility(chain.id, 'District Civil Hospital, Chakan');
                            addToast(`Patient marked arrived at District Hospital for Referral ${chain.id}!`, 'success');
                            loadDashboardData();
                          }}
                          className="btn btn-sm btn-outline"
                          style={{ borderColor: '#0D9488', color: '#0D9488', fontWeight: 800, fontSize: '0.75rem', borderRadius: '8px' }}
                        >
                          Mark "Patient Arrived" at Hospital
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Visual Hops Progression */}
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569', marginBottom: '0.85rem' }}>
                      FACILITY PROGRESSION HOPS / रेफरल यात्रा:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {chain.hops?.map((hop, idx) => (
                        <div
                          key={hop.hopId || idx}
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '0.85rem 1rem',
                            backgroundColor: hop.status === 'completed' ? '#F0FDF4' : '#EFF6FF',
                            borderRadius: '12px',
                            borderLeft: `4px solid ${hop.status === 'completed' ? '#22C55E' : '#3B82F6'}`
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div
                              style={{
                                width: 26,
                                height: 26,
                                borderRadius: '50%',
                                backgroundColor: hop.status === 'completed' ? '#22C55E' : '#3B82F6',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 800
                              }}
                            >
                              {hop.stepNumber || idx + 1}
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                                {hop.title}
                              </div>
                              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                {hop.date} {hop.time}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                              🏥 <strong>{hop.facility}</strong> • {hop.doctorName} ({hop.doctorRole || 'Attending'})
                            </div>
                            <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.3rem' }}>
                              <em>{hop.doctorRemarks || hop.clinicalFindings}</em>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: HIGH-RISK PATIENT MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'high-risk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', padding: '1.25rem', borderRadius: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#991B1B' }}>
                ⚠️ {tr('High-Risk Patient Longitudinal Registry', 'उच्च जोखिम मरीज निगरानी पंजिका', 'अति-जोखमीचे रुग्ण नोंदवही')}
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#7F1D1D' }}>
                {tr('Targeted priority monitoring for Maternal (ANC/PNC), Child Malnutrition, Uncontrolled Hypertension, Diabetes, and Geriatric Post-Discharge care', 'गर्भवती माता, कुपोषित बच्चे, अनियंत्रित बीपी/शुगर व वृद्ध मरीजों की विशेष देखरेख', 'गरोदर माता, कुपोषित बालके, अनियंत्रित बीपी/शुगर व वृद्ध रुग्णांची विशेष देखरेख')}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {highRiskPatients.map(pt => (
                <div
                  key={pt.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1.5px solid #FCA5A5',
                    padding: '1.25rem',
                    boxShadow: '0 2px 6px rgba(220, 38, 38, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#991B1B' }}>
                          {pt.name}
                        </h3>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                          {pt.age}y • {pt.gender} • Village: <strong>{pt.village}</strong>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          borderRadius: '12px',
                          padding: '0.25rem 0.65rem',
                          backgroundColor: pt.urgencyBadge === 'URGENT' ? '#DC2626' : '#D97706',
                          color: 'white'
                        }}
                      >
                        {pt.urgencyBadge}
                      </span>
                    </div>

                    <div style={{ margin: '0.75rem 0', padding: '0.65rem', backgroundColor: '#FFF5F5', borderRadius: '10px', fontSize: '0.82rem', color: '#7F1D1D', fontWeight: 700 }}>
                      ⚠️ {pt.riskCategory}
                    </div>

                    <div style={{ fontSize: '0.8rem', color: '#334155', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div><strong>Assigned Doctor:</strong> {pt.currentDoctor}</div>
                      <div><strong>Latest Vitals:</strong> BP: {pt.vitals?.bp || 'N/A'}, Pulse: {pt.vitals?.pulse || 'N/A'}, Sugar: {pt.vitals?.sugar || 'N/A'}, Hb: {pt.vitals?.hb || 'N/A'}</div>
                      <div><strong>Last Checkup:</strong> {pt.lastVisit} • <strong>Next Follow-up Due:</strong> <span style={{ color: '#DC2626', fontWeight: 700 }}>{pt.nextFollowUp}</span></div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #fee2e2', paddingTop: '0.75rem', marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setTriagePatientId(pt.id);
                        setActiveTab('triage');
                      }}
                      className="btn btn-sm btn-primary"
                      style={{ flex: 1, backgroundColor: '#DC2626', borderColor: '#DC2626', fontSize: '0.78rem', fontWeight: 800, borderRadius: '8px' }}
                    >
                      <Activity size={13} />
                      <span>{tr('Triage Exam', 'ट्राइएज जांच', 'ट्रायेज तपासणी')}</span>
                    </button>
                    <button
                      onClick={() => handleOpenTimeline(pt)}
                      className="btn btn-sm btn-outline"
                      style={{ flex: 1, fontSize: '0.78rem', fontWeight: 700, borderRadius: '8px' }}
                    >
                      <span>{tr('View Timeline', 'टाइमलाइन देखें', 'टाइमलाइन पहा')}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: FOLLOW-UP MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'followups' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                📅 {tr('Doctor Assigned Follow-Up Tasks for ASHA', 'डॉक्टर द्वारा सौंपे गए फॉलो-अप कार्य', 'डॉक्टरांनी सोपवलेली पाठपुरावा कार्ये')}
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {tr('Review patient recovery at home, verify medicine compliance, and report back to doctor', 'मरीज के घर जाकर स्वास्थ्य सुधार की जांच करें और डॉक्टर को सूचित करें', 'रुग्णाच्या घरी जाऊन सुधारणेची तपासणी करा आणि डॉक्टरांना कळवा')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {followUps.map(fup => (
                <div
                  key={fup.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '1.25rem',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                >
                  <div style={{ flex: 1, minWidth: 260 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                        {fup.patientName}
                      </span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '10px',
                          backgroundColor: fup.status === 'Completed' ? '#DCFCE7' : '#FEF3C7',
                          color: fup.status === 'Completed' ? '#166534' : '#B45309'
                        }}
                      >
                        {fup.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.25rem' }}>
                      📍 {fup.village} • Phone: {fup.patientPhone} • Ordered by: <strong>{fup.doctorName}</strong>
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#1e293b', backgroundColor: '#F8FAFC', padding: '0.6rem', borderRadius: '8px' }}>
                      <strong>Doctor Instructions:</strong> {fup.instructions}
                    </div>

                    {fup.completionNotes && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: '#059669' }}>
                        ✅ <strong>ASHA Completed:</strong> {fup.completionNotes} ({fup.completedBy || 'Sunita Kamble'})
                      </div>
                    )}
                  </div>

                  <div>
                    {fup.status !== 'Completed' ? (
                      <button
                        onClick={() => handleCompleteFollowUp(fup.id)}
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius: '12px', fontWeight: 800, padding: '0.6rem 1.25rem' }}
                      >
                        <Check size={14} />
                        <span>{tr('Mark Contacted & Completed', 'संपर्क व पूर्ण चिन्हित करें', 'संपर्क व पूर्ण चिन्हांकित करा')}</span>
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: '#16A34A', fontWeight: 700 }}>
                        ✓ Completed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: DIAGNOSTIC TEST COORDINATION */}
        {/* ========================================================= */}
        {activeTab === 'diagnostics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                🔬 {tr('Diagnostic Test & Report Coordination Desk', 'जांच व लैब रिपोर्ट समन्वय डेस्क', 'तपासणी व लॅब अहवाल समन्वय डेस्क')}
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {tr('Coordinate rural home sample collection, track sample processing, and download verified reports', 'ग्रामीण क्षेत्रों में सैंपल कलेक्शन समन्वय करें और जांच रिपोर्ट प्राप्त करें', 'ग्रामीण भागात नमुना संकलन समन्वय करा आणि तपासणी अहवाल मिळवा')}
              </p>
            </div>

            {/* Ready Reports */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {diagnosticData.reports?.map(rep => (
                <div
                  key={rep.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.25rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F766E' }}>
                        {rep.testName}
                      </h4>
                      <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.15rem' }}>
                        Lab: {rep.diagnosticCenter} • Date: {rep.date}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#DCFCE7', color: '#166534', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                      {rep.status}
                    </span>
                  </div>

                  <div style={{ margin: '0.85rem 0', fontSize: '0.82rem', color: '#334155', backgroundColor: '#F8FAFC', padding: '0.65rem', borderRadius: '8px' }}>
                    <strong>Doctor Referred:</strong> {rep.doctorReferred}<br />
                    <strong>Summary:</strong> {rep.summary}
                  </div>

                  {rep.parameters && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1rem', fontSize: '0.78rem' }}>
                      {rep.parameters.map((param, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dotted #e2e8f0', paddingBottom: '0.2rem' }}>
                          <span>{param.name}:</span>
                          <strong>{param.value} {param.unit} ({param.status})</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => addToast(`Downloaded ${rep.testName} report PDF!`, 'success')}
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 700 }}
                  >
                    <Download size={14} />
                    <span>Download Report PDF</span>
                  </button>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 10: PRESCRIPTIONS & MEDICINE SYNCHRONIZATION */}
        {/* ========================================================= */}
        {activeTab === 'prescriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>
                💊 {tr('Digital Prescriptions & Jan Aushadhi Stock Coordination', 'डिजिटल दवा पर्चियां व जन औषधि स्टॉक', 'डिजिटल औषध चिठ्ठ्या व जन औषध स्टॉक')}
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                {tr('Official prescriptions issued by PHC doctors; check affordable medicine availability', 'पीएचसी डॉक्टरों द्वारा जारी दवा पर्चियां और जन औषधि उपलब्धता', 'पीएचसी डॉक्टरांनी जारी केलेल्या औषध चिठ्ठ्या आणि जन औषध उपलब्धता')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {prescriptions.map(rx => (
                <div
                  key={rx.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '1.5rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.85rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0F766E' }}>
                          Rx #{rx.id}
                        </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#D1FAE5', color: '#065F46', padding: '0.2rem 0.6rem', borderRadius: '10px' }}>
                          Doctor Signed
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>
                        Patient: <strong>{rx.patientName || 'Rahul Sharma'}</strong> • Date: {rx.date} • Facility: {rx.facility}
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '0.35rem' }}>
                        Diagnosis: {rx.diagnosis}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Prescribing Doctor: <strong>{rx.doctorName}</strong>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Reg: {rx.doctorRegNo || 'MMC-2012-08-3921'}
                      </div>
                    </div>
                  </div>

                  {/* Medicines Table */}
                  <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '0.6rem' }}>Medicine Name</th>
                          <th style={{ padding: '0.6rem' }}>Dosage</th>
                          <th style={{ padding: '0.6rem' }}>Frequency</th>
                          <th style={{ padding: '0.6rem' }}>Duration</th>
                          <th style={{ padding: '0.6rem' }}>Instructions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rx.medicines?.map((med, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem', fontWeight: 700, color: '#0f172a' }}>{med.name}</td>
                            <td style={{ padding: '0.6rem', color: '#475569' }}>{med.dosage}</td>
                            <td style={{ padding: '0.6rem', color: '#475569' }}>{med.frequency}</td>
                            <td style={{ padding: '0.6rem', color: '#475569' }}>{med.duration}</td>
                            <td style={{ padding: '0.6rem', color: '#0F766E', fontStyle: 'italic' }}>{med.instructions}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rx.generalAdvice && (
                    <div style={{ fontSize: '0.8rem', color: '#334155', backgroundColor: '#F0FDFA', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                      <strong>General Advice:</strong> {rx.generalAdvice}
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 11: DOCTOR COMMUNICATION (CHAT & MESSAGING) */}
        {/* ========================================================= */}
        {activeTab === 'messages' && (
          <div style={{ maxWidth: 860, margin: '0 auto', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '650px', overflow: 'hidden' }}>
            
            {/* Chat Header */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#F0FDFA', borderBottom: '1px solid #CCFBF1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#0D9488', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                  👨‍⚕️
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F766E' }}>
                    Dr. Anjali Mehta (Medical Officer, Khed PHC)
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Direct Clinical Communication & Triage Consultation
                  </div>
                </div>
              </div>

              {/* Select Patient for Context */}
              <div>
                <select
                  value={selectedChatPatientId}
                  onChange={(e) => setSelectedChatPatientId(e.target.value)}
                  style={{ padding: '0.4rem 0.65rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 600 }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>Re: {p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#f8fafc' }}>
              {messages.map(msg => {
                const isAsha = msg.senderRole === 'asha';
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isAsha ? 'flex-end' : 'flex-start',
                      maxWidth: '75%',
                      backgroundColor: isAsha ? '#0D9488' : 'white',
                      color: isAsha ? 'white' : '#1e293b',
                      padding: '0.85rem 1.15rem',
                      borderRadius: isAsha ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      border: isAsha ? 'none' : '1px solid #e2e8f0'
                    }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: isAsha ? 0.9 : 0.6, marginBottom: '0.25rem' }}>
                      {msg.senderName} • {msg.timestamp}
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>
                      {msg.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chat Input Bar */}
            <form onSubmit={handleSendMessageToDoctor} style={{ padding: '1rem', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="Type clinical inquiry or patient status update to Dr. Mehta..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '24px',
                  border: '1px solid #cbd5e1',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ borderRadius: '24px', padding: '0 1.25rem', fontWeight: 700 }}
              >
                <Send size={16} />
                <span>Send</span>
              </button>
            </form>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 12: EMERGENCY SOS 108 TRIGGER */}
        {/* ========================================================= */}
        {activeTab === 'emergency' && (
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ backgroundColor: '#FEF2F2', border: '2px solid #EF4444', padding: '1.5rem', borderRadius: '16px', textAlign: 'center' }}>
              <Flame size={48} color="#DC2626" style={{ margin: '0 auto 0.5rem auto' }} />
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#DC2626' }}>
                🚨 108 RURAL EMERGENCY DISPATCH SOS
              </h2>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', color: '#7F1D1D' }}>
                For acute chest pain, snakebite, unconsciousness, severe maternal hemorrhage, or trauma accidents. Connects directly with District 108 Emergency Ambulance Bay.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800 }}>
                Select Patient Requiring Immediate Emergency Transport
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {patients.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPatientForEmergency(p)}
                    style={{
                      padding: '0.85rem 1rem',
                      borderRadius: '12px',
                      border: `2px solid ${selectedPatientForEmergency?.id === p.id ? '#DC2626' : '#e2e8f0'}`,
                      backgroundColor: selectedPatientForEmergency?.id === p.id ? '#FFF5F5' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                        {p.name} ({p.age}y, {p.gender})
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        📍 {p.village} • Phone: {p.phone} • Emergency: {p.emergencyContact}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626' }}>
                      {selectedPatientForEmergency?.id === p.id ? 'SELECTED' : 'TAP TO SELECT'}
                    </span>
                  </div>
                ))}
              </div>

              <button
                disabled={!selectedPatientForEmergency}
                onClick={handleConfirmEmergency}
                className="btn btn-lg"
                style={{
                  width: '100%',
                  backgroundColor: '#DC2626',
                  color: 'white',
                  fontWeight: 900,
                  fontSize: '1.05rem',
                  borderRadius: '12px',
                  boxShadow: '0 4px 14px rgba(220, 38, 38, 0.4)'
                }}
              >
                <Flame size={20} />
                <span>
                  {selectedPatientForEmergency
                    ? `DISPATCH 108 AMBULANCE FOR ${selectedPatientForEmergency.name.toUpperCase()}`
                    : 'SELECT A PATIENT ABOVE TO TRIGGER 108 SOS'}
                </span>
              </button>
            </div>

          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL 1: LONGITUDINAL PATIENT TIMELINE RECORD */}
      {/* ========================================================= */}
      {showTimelineModal && patientTimeline && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: 700, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F766E' }}>
                  📋 Longitudinal Health Timeline (EHR)
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                  {patientTimeline.patient?.name} ({patientTimeline.patient?.age}y) • ABHA: {patientTimeline.patient?.abhaId}
                </div>
              </div>
              <button onClick={() => setShowTimelineModal(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            {/* Timeline Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative', paddingLeft: '1.5rem', borderLeft: '2px solid #CCFBF1' }}>
              {patientTimeline.timeline?.map((item, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  {/* Dot */}
                  <div style={{ position: 'absolute', left: '-1.85rem', top: '0.25rem', width: 14, height: 14, borderRadius: '50%', backgroundColor: '#0D9488', border: '3px solid white', boxShadow: '0 0 0 2px #0D9488' }} />
                  
                  <div style={{ backgroundColor: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0D9488' }}>
                        {item.date}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                      {item.subtitle}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.35rem', lineHeight: 1.4 }}>
                      {item.details}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button onClick={() => setShowTimelineModal(false)} className="btn btn-outline" style={{ borderRadius: '10px' }}>
                Close Record
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: ASSISTED APPOINTMENT BOOKING */}
      {/* ========================================================= */}
      {showAppointmentModal && selectedPatientForAppointment && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: 520, width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F766E' }}>
                Book Appointment for {selectedPatientForAppointment.name}
              </h3>
              <button onClick={() => setShowAppointmentModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Doctor & Facility</label>
                <select
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                  className="form-select"
                >
                  <option value="DOC-01">Dr. Anjali Mehta (General Physician - Khed PHC Room 4)</option>
                  <option value="DOC-02">Dr. Rajesh Deshmukh (Cardiologist - Chakan Hospital)</option>
                  <option value="DOC-05">Dr. Kavita Jadhav (Gynecologist - Women Clinic)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Consultation Mode</label>
                  <select
                    value={bookingForm.mode}
                    onChange={(e) => setBookingForm({ ...bookingForm, mode: e.target.value })}
                    className="form-select"
                  >
                    <option value="offline">In-Person OPD Visit</option>
                    <option value="online">Video Teleconsultation</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Reason for Consultation</label>
                <input
                  type="text"
                  required
                  value={bookingForm.reason}
                  onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 800 }}>
                  Confirm Booking (Instant Token)
                </button>
                <button type="button" onClick={() => setShowAppointmentModal(false)} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: INITIATE REFERRAL TRANSFER */}
      {/* ========================================================= */}
      {showReferralModal && selectedPatientForReferral && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', maxWidth: 540, width: '100%', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#7C3AED' }}>
                Initiate Referral for {selectedPatientForReferral.name}
              </h3>
              <button onClick={() => setShowReferralModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmReferral} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label className="form-label">Target Healthcare Facility</label>
                <select
                  value={referralForm.targetFacility}
                  onChange={(e) => setReferralForm({ ...referralForm, targetFacility: e.target.value })}
                  className="form-select"
                >
                  <option value="District Civil Hospital, Chakan">District Civil Hospital & Trauma Centre, Chakan</option>
                  <option value="Khed Primary Health Centre (PHC)">Khed Primary Health Centre (PHC Room 4)</option>
                  <option value="Sub-District Hospital, Manchar">Sub-District Hospital, Manchar</option>
                </select>
              </div>

              <div>
                <label className="form-label">Specialist Department</label>
                <input
                  type="text"
                  value={referralForm.specialty}
                  onChange={(e) => setReferralForm({ ...referralForm, specialty: e.target.value })}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Clinical Justification & Reason</label>
                <textarea
                  rows={3}
                  required
                  value={referralForm.reason}
                  onChange={(e) => setReferralForm({ ...referralForm, reason: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn" style={{ flex: 1, backgroundColor: '#7C3AED', color: 'white', fontWeight: 800 }}>
                  Initiate Referral Chain
                </button>
                <button type="button" onClick={() => setShowReferralModal(false)} className="btn btn-outline">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
