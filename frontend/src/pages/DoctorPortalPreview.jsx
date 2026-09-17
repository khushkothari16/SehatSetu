import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  Stethoscope,
  Camera,
  ShieldCheck,
  Building,
  Phone,
  Mail,
  FileBadge,
  Calendar,
  Clock,
  Video,
  PhoneCall,
  Mic,
  MicOff,
  VideoOff,
  FileText,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  LogOut,
  UserCheck,
  FileCheck,
  Zap,
  RefreshCw,
  Sparkles,
  Users,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Download,
  Share2,
  Activity,
  Plus,
  Trash2,
  Search,
  User,
  MapPin,
  ClipboardList,
  Pill,
  Send,
  Printer,
  QrCode,
  Check,
  AlertCircle,
  X,
  Eye,
  Sliders,
  Maximize2,
  Bell,
  Volume2,
  CheckSquare,
  Thermometer,
  Radio,
  Wand2,
  MessageSquare,
  Syringe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import { prescriptionService } from '../services/prescriptionService';
import { aiTranscribeService, MEDICAL_SAMPLE_VOICES } from '../services/aiTranscribeService';
import { emergencyService } from '../services/emergencyService';
import { appointmentService } from '../services/appointmentService';
import { queueService } from '../services/queueService';
import { referralTrackingService } from '../services/referralTrackingService';
import { ReferralTrackingTimeline } from '../components/referral/ReferralTrackingTimeline';
import { teleconsultService } from '../services/teleconsultService';
import { webrtcService } from '../services/webrtcService';
import { followUpService } from '../services/followUpService';
import { staffDispatchService, AVAILABLE_STAFF_ROSTER } from '../services/staffDispatchService';
import { DoctorStaffDispatchModal } from '../components/DoctorStaffDispatchModal';
import { ashaService } from '../services/ashaService';
import { DoctorAshaRequestsModal } from '../components/DoctorAshaRequestsModal';

export const DoctorPortalPreview = ({ onNavigateToPatient, onLogout, currentSubView, onNavigate }) => {
  const { user } = useAuth();
  const { t, tr, language, changeLanguage } = useLanguage();
  const { addToast } = useNotifications();
  const { location: userLoc } = useLocation();

  // Primary Consultation Mode: 'offline' (In-Person OPD) or 'online' (Teleconsultation Video/Audio)
  const [consultationType, setConsultationType] = useState('offline');

  // Sub-Tab under active mode: 'queue' or 'prescribe'
  const [activeTab, setActiveTab] = useState('queue');

  // High-level Doctor Workspace View (Matching Patient Portal architecture): 'home' | 'queue' | 'patient' | 'prescribe' | 'teleconsult'
  const [doctorView, setDoctorView] = useState('home');

  // Real-time live queue status
  const [liveQueue, setLiveQueue] = useState(() => queueService.getQueueStatusSync());

  // Real-time Urgent Medical Staff / Home Injection Requests
  const [activeStaffRequests, setActiveStaffRequests] = useState(() => staffDispatchService.getAllRequestsSync());
  const [showStaffDispatchModal, setShowStaffDispatchModal] = useState(false);

  // Real-time ASHA Field Consultation & Triage Requests
  const [ashaRequests, setAshaRequests] = useState(() => ashaService.getConsultationRequestsSync());
  const [showAshaRequestsModal, setShowAshaRequestsModal] = useState(false);

  useEffect(() => {
    const syncLiveQueue = () => setLiveQueue(queueService.getQueueStatusSync());
    window.addEventListener('queue_state_change', syncLiveQueue);
    window.addEventListener('appointment_booked', syncLiveQueue);
    return () => {
      window.removeEventListener('queue_state_change', syncLiveQueue);
      window.removeEventListener('appointment_booked', syncLiveQueue);
    };
  }, []);

  useEffect(() => {
    const syncStaffRequests = () => setActiveStaffRequests(staffDispatchService.getAllRequestsSync());
    window.addEventListener('staff_request_change', syncStaffRequests);
    window.addEventListener('storage', syncStaffRequests);
    return () => {
      window.removeEventListener('staff_request_change', syncStaffRequests);
      window.removeEventListener('storage', syncStaffRequests);
    };
  }, []);

  useEffect(() => {
    const syncAshaRequests = () => setAshaRequests(ashaService.getConsultationRequestsSync());
    window.addEventListener('asha_consultation_request_created', syncAshaRequests);
    window.addEventListener('asha_consultation_request_updated', syncAshaRequests);
    window.addEventListener('storage', syncAshaRequests);
    return () => {
      window.removeEventListener('asha_consultation_request_created', syncAshaRequests);
      window.removeEventListener('asha_consultation_request_updated', syncAshaRequests);
      window.removeEventListener('storage', syncAshaRequests);
    };
  }, []);

  useEffect(() => {
    if (currentSubView === 'doctor-teleconsult') {
      setDoctorView('teleconsult');
      setConsultationType('online');
      setActiveTab('queue');
    } else if (currentSubView === 'doctor-rx') {
      setDoctorView('prescribe');
      setActiveTab('prescribe');
    } else if (currentSubView === 'doctor-opd' || currentSubView === 'queue') {
      setDoctorView('queue');
      setConsultationType('offline');
      setActiveTab('queue');
    } else if (currentSubView === 'home' || !currentSubView) {
      setDoctorView('home');
    }
  }, [currentSubView]);

  // Selected Patient in Queue (Default: #35)
  const [selectedPatientId, setSelectedPatientId] = useState('PAT-35');

  // Completed Checkups & History State
  const [completedCheckups, setCompletedCheckups] = useState(() => {
    try {
      const saved = localStorage.getItem('sehatsetu_completed_checkups');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [confirmCompletePatient, setConfirmCompletePatient] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [viewCompletedPatientRecord, setViewCompletedPatientRecord] = useState(null);
  const [completedSearchQuery, setCompletedSearchQuery] = useState('');

  // Follow-Up & Conclude Checkup States
  const [isFollowUpRequired, setIsFollowUpRequired] = useState(true);
  const [followUpDate, setFollowUpDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Modals / Pop-ups State (Keeps UI clean!)
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showOfficialRxModal, setShowOfficialRxModal] = useState(false);

  // Referral Tracking Chain & Specialist Transfer Studio State
  const [activeTrackingChain, setActiveTrackingChain] = useState(null);
  const [referralStudioTab, setReferralStudioTab] = useState('tracker'); // 'tracker' | 'new_referral'
  const [referTargetFacility, setReferTargetFacility] = useState('District Civil Hospital & Trauma Centre, Chakan');
  const [referSpecialty, setReferSpecialty] = useState('Department of Cardiology & Cath Lab');
  const [referDoctorName, setReferDoctorName] = useState('Dr. Vikram Joshi, DM');
  const [referPriority, setReferPriority] = useState('High Priority');
  const [referRemarks, setReferRemarks] = useState('');
  const [referAppointmentDate, setReferAppointmentDate] = useState('18 Sep 2026, 11:00 AM');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // OFFLINE IN-PERSON CONSULTATION STATES
  const [offlineCallBuzzerActive, setOfflineCallBuzzerActive] = useState(false);
  const [patientRoomStatus, setPatientRoomStatus] = useState('In Consultation (Room 4)');
  const [physicalExamNotes, setPhysicalExamNotes] = useState({
    chestAuscultation: 'Normal vesicular breath sounds, mild rhonchi in right base',
    throatExam: 'Mild pharyngeal erythema, no tonsillar exudates',
    bpVerified: '124/82 mmHg (Manual Sphygmomanometer)',
    tempLogged: '99.4°F (Digital Oral Thermometer)',
    abdomen: 'Soft, non-tender, no organomegaly'
  });

  // ONLINE TELECONSULTATION STATES
  const [callMode, setCallMode] = useState('video'); // 'video' or 'audio'
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [teleconsultNotes, setTeleconsultNotes] = useState('');
  const [useRealCamera, setUseRealCamera] = useState(false);
  const realVideoRef = useRef(null);
  const realStreamRef = useRef(null);

  // WebRTC Real-Time Hardware Camera Refs & States (Doctor Workbench)
  const doctorRemoteVideoRef = useRef(null);
  const doctorRemoteAudioRef = useRef(null);
  const doctorLocalVideoRef = useRef(null);
  const webrtcDoctorSessionRef = useRef(null);
  const [hasDoctorRemoteVideo, setHasDoctorRemoteVideo] = useState(false);
  const [hasDoctorLocalVideo, setHasDoctorLocalVideo] = useState(false);
  const [doctorCameraNotice, setDoctorCameraNotice] = useState('');

  // REAL-TIME ON-DEMAND TELECONSULTATION STATES (BROADCAST & WAITING POOL)
  const [doctorAvailability, setDoctorAvailability] = useState('available'); // 'available' | 'busy_opd'
  const [incomingCallBroadcast, setIncomingCallBroadcast] = useState(null);
  const [activeTeleconsultCall, setActiveTeleconsultCall] = useState(null);
  const [waitingPool, setWaitingPool] = useState(() => teleconsultService.getWaitingPool());
  const [activeBroadcasts, setActiveBroadcasts] = useState(() => teleconsultService.getActiveBroadcasts());
  const [teleconsultDocs, setTeleconsultDocs] = useState(() => teleconsultService.getDoctors());
  const [callClaimNotice, setCallClaimNotice] = useState('');
  const ringAudioIntervalRef = useRef(null);

  const stopIncomingCallChime = () => {
    if (ringAudioIntervalRef.current) {
      clearInterval(ringAudioIntervalRef.current);
      ringAudioIntervalRef.current = null;
    }
  };

  const playIncomingCallChime = () => {
    stopIncomingCallChime();
    const playChimeTone = () => {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        if (ctx.state === 'suspended') {
          ctx.resume();
        }
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';
        osc1.frequency.setValueAtTime(520, ctx.currentTime);
        osc2.frequency.setValueAtTime(660, ctx.currentTime);

        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.65);
        osc2.stop(ctx.currentTime + 0.65);
      } catch (err) {}
    };

    playChimeTone();
    ringAudioIntervalRef.current = setInterval(playChimeTone, 2200);
  };

  // E-Prescription State
  const [rxDiagnosis, setRxDiagnosis] = useState('Acute Upper Respiratory Tract Infection (Mild Viral Bronchitis)');
  const [rxInstructions, setRxInstructions] = useState('भाप लें, गुनगुना पानी पिएं। धूल और ठंडी चीजों से बचें। (Steam inhalation, drink warm water, avoid dust).');
  const [rxFollowUpDays, setRxFollowUpDays] = useState('5');
  const [rxMedicines, setRxMedicines] = useState([
    {
      name: 'Amoxicillin 500mg',
      type: 'Capsule',
      dosage: '1 cap',
      frequency: '1-0-1 (Twice daily)',
      duration: '5 days',
      instructions: 'Take strictly after food with warm water'
    },
    {
      name: 'Paracetamol 650mg',
      type: 'Tablet',
      dosage: '1 tab',
      frequency: 'SOS / 1-0-1 (Twice daily)',
      duration: '3 days',
      instructions: 'Take when fever exceeds 99.5°F'
    },
    {
      name: 'Cetirizine 10mg',
      type: 'Tablet',
      dosage: '1 tab',
      frequency: '0-0-1 (Night only)',
      duration: '5 days',
      instructions: 'Take at bedtime; may cause drowsiness'
    }
  ]);
  const [lastGeneratedRx, setLastGeneratedRx] = useState(null);

  // New Medicine input
  const [newMedName, setNewMedName] = useState('');
  const [newMedType, setNewMedType] = useState('Tablet');
  const [newMedDosage, setNewMedDosage] = useState('1 tablet');
  const [newMedFreq, setNewMedFreq] = useState('1-0-1 (Twice daily)');
  const [newMedDuration, setNewMedDuration] = useState('5 days');
  const [newMedInstr, setNewMedInstr] = useState('After meals');

  // AI Voice Medical Transcribe & Auto-Prescribe State
  const [isLiveTranscribing, setIsLiveTranscribing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState(MEDICAL_SAMPLE_VOICES[0].transcript);
  const [parsedAiRx, setParsedAiRx] = useState(() => aiTranscribeService.parseMedicalTranscript(MEDICAL_SAMPLE_VOICES[0].transcript));
  const speechRecognizerRef = useRef(null);
  const [activeVoicePreset, setActiveVoicePreset] = useState(MEDICAL_SAMPLE_VOICES[0].id);
  const [audioWaves, setAudioWaves] = useState([40, 70, 30, 90, 60, 80, 45, 95, 65, 50, 75, 35]);
  const [transcribeLang, setTranscribeLang] = useState('en-IN');
  const [speechError, setSpeechError] = useState(null);
  const [showTranscribeModal, setShowTranscribeModal] = useState(false);
  const [showEmergencyStudioModal, setShowEmergencyStudioModal] = useState(false);
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showPhysicalExamModal, setShowPhysicalExamModal] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Real-Time 108 Emergency SOS Reception & Two-Way Doctor Advisory
  const [activeEmergency, setActiveEmergency] = useState(() => emergencyService.getActiveEmergencySync());
  const [doctorReplyText, setDoctorReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [showIncidentPhotoModal, setShowIncidentPhotoModal] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const emergencyPhotos = (activeEmergency?.photoUrls && activeEmergency.photoUrls.length > 0)
    ? activeEmergency.photoUrls
    : (activeEmergency?.photoUrl ? [activeEmergency.photoUrl] : []);

  useEffect(() => {
    const handleEmergChange = (e) => {
      setActiveEmergency(e.detail || null);
    };
    window.addEventListener('emergency_state_change', handleEmergChange);
    return () => window.removeEventListener('emergency_state_change', handleEmergChange);
  }, []);

  const handleSendDoctorReply = async (presetText = '') => {
    const textToSend = (presetText || doctorReplyText).trim();
    if (!textToSend) return;
    setIsSendingReply(true);
    try {
      await emergencyService.sendDoctorReply(textToSend, doctorData.name);
      setDoctorReplyText('');
      addToast(
        tr(
          'Medical advisory sent to patient & bystander!',
          'मरीज व मददगार को तुरंत चिकित्सकीय सलाह भेज दी गई!',
          'रुग्ण व मदतनीसांना तात्काळ वैद्यकीय सल्ला पाठवला गेला!'
        ),
        'success'
      );
    } catch (err) {
      addToast('Failed to send advisory: ' + err.message, 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Audio wave animation during live voice transcription
  useEffect(() => {
    let waveInterval;
    if (isLiveTranscribing) {
      waveInterval = setInterval(() => {
        setAudioWaves(Array.from({ length: 12 }, () => Math.floor(20 + Math.random() * 80)));
      }, 150);
    }
    return () => clearInterval(waveInterval);
  }, [isLiveTranscribing]);

  const handleStartTranscribe = (defaultText = null) => {
    setSpeechError(null);
    setIsLiveTranscribing(true);

    if (defaultText !== null) {
      setLiveTranscript(defaultText);
      const parsed = aiTranscribeService.parseMedicalTranscript(defaultText);
      if (parsed) {
        setParsedAiRx(parsed);
        if (parsed.medicines && parsed.medicines.length > 0) {
          setRxMedicines(parsed.medicines);
        }
      }
    }

    if (aiTranscribeService.isSpeechRecognitionSupported()) {
      try {
        if (speechRecognizerRef.current) {
          try {
            speechRecognizerRef.current.stop();
          } catch (e) { }
        }

        const recognizer = aiTranscribeService.createSpeechRecognizer({
          language: transcribeLang,
          onResult: ({ final, interim, full }) => {
            const current = full || final || interim;
            if (current) {
              setLiveTranscript(current);
              const p = aiTranscribeService.parseMedicalTranscript(current);
              if (p) {
                setParsedAiRx(p);
                if (p.medicines && p.medicines.length > 0) {
                  setRxMedicines(p.medicines);
                }
              }
            }
          },
          onError: (err) => {
            console.warn('Live transcribe error:', err);
            if (err === 'not-allowed' || err === 'service-not-allowed') {
              setSpeechError('Microphone permission was denied. Please allow microphone access in your browser to speak.');
              addToast('Microphone access blocked. Please allow microphone access in your browser settings.', 'error');
              setIsLiveTranscribing(false);
            } else if (err === 'network') {
              setSpeechError('Speech recognition network error. Please check your internet connection.');
            }
          },
          onEnd: () => {
            setIsLiveTranscribing(false);
          }
        });

        if (recognizer) {
          recognizer.start();
          speechRecognizerRef.current = recognizer;
        }
      } catch (err) {
        console.warn('Speech recognizer initialization error:', err);
        setSpeechError('Could not start speech recognition: ' + (err.message || 'Unknown error'));
        setIsLiveTranscribing(false);
      }
    } else {
      setSpeechError('Live speech recognition is not supported in this browser. You can type or use the presets below.');
      addToast('Speech recognition not supported in this browser.', 'warning');
    }

    addToast(
      tr(
        'AI Live Transcribe Started - Dictate medicine, days & timings...',
        'एआई लाइव ट्रांसक्राइब शुरू (दवा, दिन और समय बोलें)...',
        'एआय थेट ट्रान्सक्राइब सुरू (औषध, दिवस आणि वेळ बोला)...'
      ),
      'info'
    );
  };

  const handleStopTranscribe = () => {
    setIsLiveTranscribing(false);
    if (speechRecognizerRef.current) {
      try {
        speechRecognizerRef.current.stop();
      } catch (e) { }
      speechRecognizerRef.current = null;
    }
    addToast(tr('AI Live Transcribe Paused', 'एआई लाइव ट्रांसक्राइब रोका गया', 'एआय थेट ट्रान्सक्राइब थांबवले'), 'info');
  };

  const handleApplyVoicePreset = (preset) => {
    setActiveVoicePreset(preset.id);
    setLiveTranscript(preset.transcript);
    setSpeechError(null);
    const parsed = aiTranscribeService.parseMedicalTranscript(preset.transcript);
    setParsedAiRx(parsed);
    if (parsed && parsed.medicines && parsed.medicines.length > 0) {
      setRxMedicines(parsed.medicines);
    }
    addToast(
      tr(
        `Medicine Transcribe Loaded: ${preset.label}`,
        `दवा ट्रांसक्राइब लोड: ${preset.hindiLabel || preset.label}`,
        `औषध ट्रान्सक्राइब लोड झाले: ${preset.marathiLabel || preset.hindiLabel || preset.label}`
      ),
      'success'
    );
  };

  const handleClearTranscript = () => {
    setLiveTranscript('');
    setActiveVoicePreset(null);
    setSpeechError(null);
    const emptyParsed = { rawTranscript: '', medicines: [], totalCount: 0 };
    setParsedAiRx(emptyParsed);
    if (isLiveTranscribing) {
      handleStopTranscribe();
    }
  };

  const handleRemoveTranscribedMed = (index) => {
    if (!parsedAiRx || !parsedAiRx.medicines) return;
    const updated = parsedAiRx.medicines.filter((_, i) => i !== index);
    const updatedParsed = {
      ...parsedAiRx,
      medicines: updated,
      totalCount: updated.length
    };
    setParsedAiRx(updatedParsed);
    setRxMedicines(updated);
  };

  const handleDirectSendFromTranscribe = async () => {
    const meds = (parsedAiRx && parsedAiRx.medicines?.length > 0) ? parsedAiRx.medicines : rxMedicines;
    const diag = rxDiagnosis || selectedPatient.problem || selectedPatient.symptoms || 'General Clinical Consultation';
    const instr = rxInstructions || 'Take prescribed medications strictly according to timings with water.';
    const follow = rxFollowUpDays || '5';

    if (!meds || meds.length === 0) {
      addToast('Please dictate or add at least one medication with duration and timings.', 'error');
      return;
    }

    try {
      const rxRecord = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientVillage: selectedPatient.village,
        patientAbhaId: selectedPatient.abhaId,
        doctorName: doctorData.name,
        doctorSpecialty: doctorData.specialty,
        doctorRegNo: doctorData.medicalRegNo,
        facility: doctorData.hospital,
        consultationType: consultationType === 'offline' ? 'In-Person PHC Consultation (AI Voice Transcribed)' : 'Telemedicine Live Consultation (AI Video Transcribed)',
        diagnosis: diag,
        medicines: meds,
        advice: instr,
        followUpDays: follow,
        transcribedVoiceAudio: true,
        verifiedStamp: true
      };

      const savedRx = await prescriptionService.createPrescription(rxRecord);
      setLastGeneratedRx(savedRx);
      setShowTranscribeModal(false);
      handleStopTranscribe();
      addToast(
        tr(
          `AI Voice Prescription generated! Proceeding to follow-up & complete checkup (${selectedPatient.name}).`,
          `एआई वॉइस प्रिस्क्रिप्शन जनरेट हो गया! फॉलो-अप व जांच समापन पर आगे बढ़ रहे हैं (${selectedPatient.name})।`,
          `एआय व्हॉईस प्रिस्क्रिप्शन तयार झाले! पुढील तपासणी व तपासणी समापनाकडे जात आहोत (${selectedPatient.name}).`
        ),
        'success'
      );
      handleInitiateCompleteCheckup(selectedPatient);
    } catch (err) {
      addToast(err.message || tr('Failed to send prescription', 'पर्चे भेजने में विफल', 'प्रिस्क्रिप्शन पाठवण्यात अयशस्वी'), 'error');
    }
  };

  // Call timer simulation
  useEffect(() => {
    let timer;
    if (isCallActive) {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCallActive]);

  const handleDoctorGoBack = () => {
    // 1. Close open popups / modals first
    if (showIncidentPhotoModal) { setShowIncidentPhotoModal(false); return; }
    if (showEmergencyStudioModal) { setShowEmergencyStudioModal(false); return; }
    if (showVitalsModal) { setShowVitalsModal(false); return; }
    if (showPhysicalExamModal) { setShowPhysicalExamModal(false); return; }
    if (showAddMedModal) { setShowAddMedModal(false); return; }
    if (showTranscribeModal) { setShowTranscribeModal(false); return; }
    if (showOfficialRxModal) { setShowOfficialRxModal(false); return; }
    if (showHistoryModal) { setShowHistoryModal(false); return; }
    if (showReferralModal) { setShowReferralModal(false); return; }
    if (showProfileModal) { setShowProfileModal(false); return; }
    if (showCompletedModal) { setShowCompletedModal(false); return; }
    if (confirmCompletePatient) { setConfirmCompletePatient(null); return; }
    if (viewCompletedPatientRecord) { setViewCompletedPatientRecord(null); return; }
    if (isCallActive) { setIsCallActive(false); return; }

    // 2. If in a specific workspace view, return to Doctor Home Dashboard
    if (doctorView !== 'home') {
      setDoctorView('home');
      setActiveTab('queue');
      return;
    }

    // 3. If in prescription builder tab, go back to patient queue
    if (activeTab === 'prescribe') { setActiveTab('queue'); return; }

    // 4. If in teleconsultation mode, go back to offline OPD mode
    if (consultationType === 'online') { setConsultationType('offline'); return; }

    // 5. If at root, return to role selection / logout
    if (onLogout) { onLogout(); }
  };

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (showIncidentPhotoModal || showEmergencyStudioModal || showVitalsModal || showPhysicalExamModal || showAddMedModal || showTranscribeModal || showOfficialRxModal || showHistoryModal || showReferralModal || showProfileModal || isCallActive || showCompletedModal || confirmCompletePatient || viewCompletedPatientRecord) {
        e.preventDefault();
        setShowIncidentPhotoModal(false);
        setShowEmergencyStudioModal(false);
        setShowVitalsModal(false);
        setShowPhysicalExamModal(false);
        setShowAddMedModal(false);
        setShowTranscribeModal(false);
        setShowOfficialRxModal(false);
        setShowHistoryModal(false);
        setShowReferralModal(false);
        setShowProfileModal(false);
        setShowCompletedModal(false);
        setConfirmCompletePatient(null);
        setViewCompletedPatientRecord(null);
        setIsCallActive(false);
        return;
      }
      if (activeTab === 'prescribe') {
        e.preventDefault();
        setActiveTab('queue');
        return;
      }
      if (consultationType === 'online') {
        e.preventDefault();
        setConsultationType('offline');
        return;
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [showIncidentPhotoModal, showEmergencyStudioModal, showVitalsModal, showPhysicalExamModal, showAddMedModal, showTranscribeModal, showOfficialRxModal, showHistoryModal, showReferralModal, showProfileModal, showCompletedModal, confirmCompletePatient, viewCompletedPatientRecord, isCallActive, activeTab, consultationType]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const doctorData = {
    name: user?.name || 'Dr. Anjali Mehta',
    specialty: user?.specialty || 'General Medicine (ग्रामीण विशेषज्ञ)',
    medicalRegNo: user?.medicalRegNo || 'MCI-2012-08-3921',
    hospital: user?.hospital || `${userLoc?.village || userLoc?.city || 'Local'} Primary Health Centre (PHC)`,
    room: 'Room 4 (General Medicine OPD)',
    district: user?.district || userLoc?.district || 'District PHC',
    state: user?.state || userLoc?.state || 'Rajasthan',
    email: user?.email || 'dr.anjali.mehta@phc.gov.in',
    phone: user?.phone || '+91 98221 44556',
    hprId: user?.hprId || 'HPR-9941-2026',
    authProvider: user?.authProvider || 'google'
  };

  // Live Synchronized Patients list (Loaded dynamically from patient bookings & queue)
  const [allPatients, setAllPatients] = useState(() => appointmentService.getDoctorPatientsSync(doctorData.id));

  const loadPatients = () => {
    const list = appointmentService.getDoctorPatientsSync(doctorData.id);
    setAllPatients(list);
  };

  useEffect(() => {
    loadPatients();

    const handleNewBooking = (e) => {
      const newApt = e.detail;
      loadPatients();
      if (newApt) {
        addToast(`✨ Live Patient Synced! Token #${newApt.tokenNumber} (${newApt.patientName}) booked an appointment!`, 'success');
        if (newApt.mode) {
          setConsultationType(newApt.mode);
        }
        setSelectedPatientId(newApt.patientId || `PAT-${newApt.tokenNumber}`);
      }
    };

    const handleTeleconsultStateChange = () => {
      setWaitingPool(teleconsultService.getWaitingPool());
      setActiveBroadcasts(teleconsultService.getActiveBroadcasts());
      setTeleconsultDocs(teleconsultService.getDoctors());
    };

    const handleTeleconsultBroadcast = (e) => {
      const call = e.detail;
      if (!call) return;
      setActiveBroadcasts(teleconsultService.getActiveBroadcasts());
      setWaitingPool(teleconsultService.getWaitingPool());
      if (doctorAvailability === 'available' && !isCallActive) {
        setIncomingCallBroadcast(call);
        playIncomingCallChime();
        addToast(`🚨 Incoming Teleconsultation Call from ${call.patientName} (${call.patientVillage})!`, 'info');
      }
    };

    const handleTeleconsultAccepted = (e) => {
      const { callId, call, doctor } = e.detail;
      stopIncomingCallChime();
      if (incomingCallBroadcast && incomingCallBroadcast.id === callId) {
        if (doctor?.id === doctorData.id) {
          setActiveTeleconsultCall(call);
          setIsCallActive(true);
          setDoctorView('teleconsult');
          setConsultationType('online');
          setIncomingCallBroadcast(null);
        } else {
          setCallClaimNotice(`Call was accepted by ${doctor?.name || 'another doctor'}. Dismissing...`);
          setTimeout(() => {
            setIncomingCallBroadcast(null);
            setCallClaimNotice('');
          }, 1800);
        }
      }
    };

    const handleTeleconsultCancelled = (e) => {
      stopIncomingCallChime();
      if (incomingCallBroadcast && incomingCallBroadcast.id === e.detail.callId) {
        setIncomingCallBroadcast(null);
        addToast('Patient cancelled the teleconsultation request.', 'info');
      }
    };

    const handleTeleconsultEnded = (e) => {
      stopIncomingCallChime();
      if (webrtcDoctorSessionRef.current) {
        try {
          webrtcDoctorSessionRef.current.destroy();
        } catch (err) {}
        webrtcDoctorSessionRef.current = null;
      }
      if (realStreamRef.current) {
        try {
          realStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch (err) {}
        realStreamRef.current = null;
      }
      setIsCallActive(false);
      setActiveTeleconsultCall(null);
      setUseRealCamera(false);
      setHasDoctorRemoteVideo(false);
      setHasDoctorLocalVideo(false);
      setDoctorView('prescribe');
      setActiveTab('prescribe');
      addToast('Patient ended the teleconsultation session. Transitioning to prescription writer.', 'info');
    };

    // Check if an incoming call is already active/ringing upon mount
    const existingBroadcasts = teleconsultService.getActiveBroadcasts();
    if (existingBroadcasts.length > 0 && doctorAvailability === 'available' && !isCallActive && !incomingCallBroadcast) {
      setIncomingCallBroadcast(existingBroadcasts[0]);
    }

    window.addEventListener('appointment_booked', handleNewBooking);
    window.addEventListener('queue_state_change', loadPatients);
    window.addEventListener('storage', loadPatients);
    window.addEventListener('teleconsult_state_change', handleTeleconsultStateChange);
    window.addEventListener('teleconsult_broadcast', handleTeleconsultBroadcast);
    window.addEventListener('teleconsult_call_accepted', handleTeleconsultAccepted);
    window.addEventListener('teleconsult_call_cancelled', handleTeleconsultCancelled);
    window.addEventListener('teleconsult_call_ended', handleTeleconsultEnded);

    return () => {
      stopIncomingCallChime();
      window.removeEventListener('appointment_booked', handleNewBooking);
      window.removeEventListener('queue_state_change', loadPatients);
      window.removeEventListener('storage', loadPatients);
      window.removeEventListener('teleconsult_state_change', handleTeleconsultStateChange);
      window.removeEventListener('teleconsult_broadcast', handleTeleconsultBroadcast);
      window.removeEventListener('teleconsult_call_accepted', handleTeleconsultAccepted);
      window.removeEventListener('teleconsult_call_cancelled', handleTeleconsultCancelled);
      window.removeEventListener('teleconsult_call_ended', handleTeleconsultEnded);
    };
  }, [doctorAvailability, isCallActive, incomingCallBroadcast, doctorData.id]);

  // WebRTC Real Camera Session for Doctor Workbench
  useEffect(() => {
    if (isCallActive && activeTeleconsultCall?.id && doctorView === 'teleconsult') {
      let isMounted = true;
      setDoctorCameraNotice('Connecting real webcam & establishing secure tele-bridge...');

      const session = webrtcService.createSession({
        callId: activeTeleconsultCall.id,
        isInitiator: true, // Doctor initiates the WebRTC offer
        onLocalStream: (stream) => {
          if (!isMounted) return;
          setHasDoctorLocalVideo(true);
          setDoctorCameraNotice('');
          if (doctorLocalVideoRef.current) {
            doctorLocalVideoRef.current.srcObject = stream;
          }
        },
        onRemoteStream: (stream) => {
          if (!isMounted) return;
          setHasDoctorRemoteVideo(true);
          setDoctorCameraNotice('');
          if (doctorRemoteVideoRef.current) {
            doctorRemoteVideoRef.current.srcObject = stream;
            doctorRemoteVideoRef.current.muted = false;
            doctorRemoteVideoRef.current.volume = 1.0;
            doctorRemoteVideoRef.current.play().catch((e) => console.warn('[Doctor Video Play Note]', e));
          }
          if (doctorRemoteAudioRef.current) {
            doctorRemoteAudioRef.current.srcObject = stream;
            doctorRemoteAudioRef.current.volume = 1.0;
            doctorRemoteAudioRef.current.play().catch((e) => console.warn('[Doctor Audio Play Note]', e));
          }
        },
        onStatusChange: (status) => {
          // console.log('[Doctor WebRTC State]', status);
        }
      });

      webrtcDoctorSessionRef.current = session;
      session.initialize().catch((err) => {
        if (!isMounted) return;
        console.warn('[Doctor WebRTC Init Warning]', err);
        setDoctorCameraNotice('Camera permission needed. Please click Allow in your browser.');
        addToast('Please allow camera access for live video consultation.', 'warning');
      });

      return () => {
        isMounted = false;
        session.destroy();
        webrtcDoctorSessionRef.current = null;
        setHasDoctorRemoteVideo(false);
        setHasDoctorLocalVideo(false);
      };
    }
  }, [isCallActive, activeTeleconsultCall?.id, doctorView, addToast]);

  // Filter patients by active consultation mode (Offline vs Online)
  // CRITICAL: OPD Queue must always be in ascending token order: #35 -> #36 -> #37 -> #38
  const currentModePatients = allPatients
    .filter((p) => p.mode === consultationType)
    .sort((a, b) => {
      const tokenA = Number(a.tokenNumber || String(a.token || '').replace(/\D/g, '')) || 0;
      const tokenB = Number(b.tokenNumber || String(b.token || '').replace(/\D/g, '')) || 0;
      return tokenA - tokenB;
    });

  const filteredPatients = currentModePatients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.symptoms && p.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
      String(p.token).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // Filtered completed checkups for 4. Checkup Complete history
  const filteredCompletedList = completedCheckups.filter((c) => {
    if (!completedSearchQuery.trim()) return true;
    const q = completedSearchQuery.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.village && c.village.toLowerCase().includes(q)) ||
      (c.diagnosis && c.diagnosis.toLowerCase().includes(q)) ||
      String(c.token).toLowerCase().includes(q) ||
      (c.abhaId && c.abhaId.toLowerCase().includes(q))
    );
  });

  const selectedPatient = currentModePatients.find((p) => p.id === selectedPatientId) || currentModePatients[0] || allPatients[0];

  // Load and synchronize active patient's clinical referral tracking chain
  const loadReferralChainForPatient = async () => {
    if (!selectedPatient) return;
    try {
      const chain = await referralTrackingService.getChainByPatient({
        name: selectedPatient.name,
        patientId: selectedPatient.id,
        abhaId: selectedPatient.abhaId
      });
      setActiveTrackingChain(chain);

      // Pre-populate sensible default remarks for doctor
      if (selectedPatient.name.includes('Rahul')) {
        setReferRemarks('Evaluated in Room 4 OPD. Resting ECG shows lateral ST depression. Troponin-I rapid card borderline positive. Patient stabilized on dual antiplatelets. Initiating priority referral to Tertiary Cath Lab for Urgent Coronary Angiography and 2D-Echo.');
      } else {
        setReferRemarks(`Evaluated at ${doctorData.facility}. Patient presents with ${selectedPatient.symptoms}. Specialist consultation and advanced diagnostic workup recommended.`);
      }
    } catch (err) {
      console.error('Error loading referral chain:', err);
    }
  };

  useEffect(() => {
    loadReferralChainForPatient();
  }, [selectedPatient?.id, selectedPatient?.name]);

  useEffect(() => {
    const handleSync = () => {
      loadReferralChainForPatient();
    };
    window.addEventListener('referral_chain_updated', handleSync);
    return () => window.removeEventListener('referral_chain_updated', handleSync);
  }, [selectedPatient?.id]);

  // Handler for doctor issuing a new referral transfer hop
  const handleSubmitNewReferral = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!referRemarks.trim()) {
      addToast('Please enter your clinical remarks and directives for the next specialist.', 'error');
      return;
    }

    const trackingId = activeTrackingChain ? activeTrackingChain.id : `REF-TRK-2026-${Date.now().toString().slice(-4)}`;

    const hopData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientNameHindi: selectedPatient.nameHindi,
      abhaId: selectedPatient.abhaId,
      age: selectedPatient.age,
      gender: selectedPatient.gender,
      village: selectedPatient.village,
      title: `Specialist Referral to ${referSpecialty}`,
      titleHindi: `${referSpecialty} विशेषज्ञ रेफरल`,
      doctorName: referDoctorName,
      doctorDegree: 'Consultant Specialist',
      doctorRole: 'Attending Specialist',
      facility: referTargetFacility,
      facilityType: referTargetFacility.includes('District') ? 'District Civil Hospital' : 'Tertiary Super-Speciality Hospital',
      department: referSpecialty,
      priority: referPriority,
      date: referAppointmentDate.split(',')[0] || '18 Sep 2026',
      time: referAppointmentDate.split(',')[1]?.trim() || '11:00 AM',
      vitals: {
        bp: selectedPatient.referral?.vitalsAtReferral?.bp || '130/84 mmHg',
        pulse: selectedPatient.referral?.vitalsAtReferral?.pulse || '88 bpm',
        spo2: selectedPatient.referral?.vitalsAtReferral?.spo2 || '98%',
        temp: selectedPatient.referral?.vitalsAtReferral?.temp || '98.6°F'
      },
      clinicalFindings: `Referred by ${doctorData.name} from ${doctorData.facility}. Clinical Symptoms: ${selectedPatient.symptoms}`,
      doctorRemarks: referRemarks.trim(),
      actionTaken: `Referred to ${referTargetFacility} (${referSpecialty})`,
      chainStatus: 'In Transit to Specialist'
    };

    const res = await referralTrackingService.addReferralHop(trackingId, hopData);
    setActiveTrackingChain(res.chain);
    setReferralStudioTab('tracker');
    addToast(`✅ Successfully referred to ${referDoctorName}! Referral tracking chain updated and synced.`, 'success');
  };

  const getFutureDateStr = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + Number(days || 5));
    return d.toISOString().split('T')[0];
  };

  // Complete checkup action: opens follow-up & completion modal
  const handleInitiateCompleteCheckup = (patient = selectedPatient) => {
    if (!patient) return;
    setConfirmCompletePatient(patient);
    setIsFollowUpRequired(true);
    const days = Number(rxFollowUpDays) || 5;
    setFollowUpDate(getFutureDateStr(days));
    setFollowUpNotes(rxInstructions || '');
  };

  // Confirmed checkup completion handler
  const handleConfirmCompleteCheckup = async () => {
    if (!confirmCompletePatient) return;
    const target = confirmCompletePatient;

    try {
      const tokenClean = Number(target.tokenNumber || String(target.token || '').replace(/\D/g, '')) || 35;
      const fupDueDate = followUpDate || getFutureDateStr(5);

      // 1. If follow-up required, save to follow-ups schedule
      if (isFollowUpRequired) {
        await followUpService.createFollowUp({
          patientId: target.id,
          patientName: target.name,
          patientNameHindi: target.nameHindi || '',
          patientAge: target.age,
          patientGender: target.gender,
          patientVillage: target.village,
          patientPhone: target.phone,
          patientAbhaId: target.abhaId,
          doctorName: doctorData.name,
          specialty: doctorData.specialty,
          facility: doctorData.hospital,
          dueDate: fupDueDate,
          status: 'Upcoming',
          instructions: followUpNotes || completionNotes || rxInstructions || 'Follow-up clinical examination and review of symptoms.',
          previousAppointmentDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          prescriptionRef: lastGeneratedRx?.id || (target.history?.pastTreatments?.[0]?.treatment) || 'RX-2026'
        });
      }

      // 2. Create permanent completed checkup record (preserves all medical records, vitals, history, medicines)
      const completedRecord = {
        id: target.id,
        patientId: target.id,
        token: `#${tokenClean}`,
        tokenNumber: tokenClean,
        appointmentId: target.appointmentId,
        name: target.name,
        nameHindi: target.nameHindi || '',
        age: target.age,
        gender: target.gender,
        village: target.village,
        district: target.district || doctorData.district,
        bloodGroup: target.bloodGroup,
        abhaId: target.abhaId,
        phone: target.phone,
        time: target.time,
        symptoms: target.symptoms || 'Routine OPD Consultation',
        diagnosis: rxDiagnosis || target.diagnosis || (target.history?.pastTreatments?.[0]?.diagnosis) || 'Clinical Examination Concluded',
        vitals: target.referral?.vitalsAtReferral || { bp: '120/80 mmHg', pulse: '76 bpm', spo2: '98%', temp: '98.6°F', weight: '65 kg' },
        completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        completedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        doctorNotes: completionNotes || 'Checkup concluded. Patient examined in Room 4 and treatment issued.',
        followUpRequired: isFollowUpRequired,
        followUpDate: isFollowUpRequired ? fupDueDate : null,
        followUpInstructions: isFollowUpRequired ? (followUpNotes || completionNotes) : null,
        medicines: rxMedicines && rxMedicines.length > 0 ? [...rxMedicines] : [],
        // Crucial requirement: Do NOT delete patient's medical record. Fully preserve all data
        history: target.history || { pastTreatments: [], allergies: [], chronicConditions: '', labReports: [] },
        referral: target.referral || null,
        fullRecord: { ...target }
      };

      // 3. Add to "Checkup Complete" history (saved in localStorage)
      const updatedHistory = [completedRecord, ...completedCheckups.filter(c => c.id !== completedRecord.id && c.tokenNumber !== completedRecord.tokenNumber)];
      setCompletedCheckups(updatedHistory);
      localStorage.setItem('sehatsetu_completed_checkups', JSON.stringify(updatedHistory));

      // 4. Mark appointment as completed in storage (NOT deleted)
      const appointments = JSON.parse(localStorage.getItem('sehatsetu_appointments') || '[]');
      const updatedAppointments = appointments.map(a => {
        if ((target.appointmentId && a.id === target.appointmentId) || (!target.appointmentId && a.tokenNumber === tokenClean)) {
          return { ...a, status: 'Completed', completedAt: new Date().toISOString() };
        }
        return a;
      });
      localStorage.setItem('sehatsetu_appointments', JSON.stringify(updatedAppointments));
      window.dispatchEvent(new CustomEvent('appointment_updated', { detail: { id: target.id, status: 'Completed' } }));

      // 5. Advance queue and reload active patients (target is removed from active OPD queue)
      await queueService.advanceQueue();
      const updatedPatientsList = appointmentService.getDoctorPatientsSync(doctorData.id);
      setAllPatients(updatedPatientsList);

      // 6. Show next patient/token in the queue (strictly in ascending order)
      const remainingPatients = updatedPatientsList
        .filter(p => p.mode === consultationType && p.id !== target.id && p.tokenNumber !== tokenClean)
        .sort((a, b) => {
          const tA = Number(a.tokenNumber || String(a.token || '').replace(/\D/g, '')) || 0;
          const tB = Number(b.tokenNumber || String(b.token || '').replace(/\D/g, '')) || 0;
          return tA - tB;
        });

      const followUpMsg = isFollowUpRequired
        ? ` & Follow-Up scheduled for ${fupDueDate}`
        : '';
      const followUpMsgHi = isFollowUpRequired
        ? ` एवं ${fupDueDate} को फॉलो-अप निर्धारित किया गया`
        : '';
      const followUpMsgMr = isFollowUpRequired
        ? ` व ${fupDueDate} रोजी पुढील तपासणी निश्चित केली गेली`
        : '';

      if (remainingPatients.length > 0) {
        const nextPat = remainingPatients[0];
        setSelectedPatientId(nextPat.id);
        try {
          await queueService.callPatientToken(nextPat.tokenNumber, nextPat.name, doctorData.name, doctorData.room);
        } catch (e) { }
        addToast(
          tr(
            `✅ Checkup completed for ${target.name}${followUpMsg}! Next patient: Token #${nextPat.tokenNumber} (${nextPat.name})`,
            `✅ ${target.name} की जांच पूर्ण${followUpMsgHi}! अगला मरीज: टोकन #${nextPat.tokenNumber} (${nextPat.name})`,
            `✅ ${target.name} यांची तपासणी पूर्ण${followUpMsgMr}! पुढील रुग्ण: टोकन #${nextPat.tokenNumber} (${nextPat.name})`
          ),
          'success'
        );
      } else {
        setSelectedPatientId(null);
        addToast(
          tr(
            `✅ Checkup completed for ${target.name}${followUpMsg}! All active OPD patients have been examined.`,
            `✅ ${target.name} की जांच पूर्ण${followUpMsgHi}! ओपीडी कतार के सभी मरीजों की जांच पूरी हो गई है।`,
            `✅ ${target.name} यांची तपासणी पूर्ण${followUpMsgMr}! ओपीडी रांगेतील सर्व रुग्णांची तपासणी पूर्ण झाली आहे.`
          ),
          'success'
        );
      }

      setConfirmCompletePatient(null);
      setCompletionNotes('');
    } catch (err) {
      addToast('Error completing checkup: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleCompleteAppointment = handleInitiateCompleteCheckup;

  // Buzzer trigger for calling offline patient to physical room with live queue synchronization
  const handleCallOfflinePatient = async () => {
    const targetPatient = selectedPatient || currentModePatients[0] || allPatients[0];
    if (!targetPatient) {
      addToast('No waiting patients in queue.', 'info');
      return;
    }
    if (!selectedPatient || selectedPatient.id !== targetPatient.id) {
      setSelectedPatientId(targetPatient.id);
    }
    setOfflineCallBuzzerActive(true);
    setPatientRoomStatus(`Called into Room 4 (Buzzer Alert Sent to Patient's Phone)`);
    addToast(`🔔 Calling Token ${targetPatient.token || targetPatient.tokenNumber || ''} (${targetPatient.name}) into Room 4! Corridor alert sent.`, 'info');

    // Direct two-way sync: Notify patient portal queue that it is their turn!
    await queueService.callPatientToken(
      targetPatient.tokenNumber || 1,
      targetPatient.name,
      doctorData.name,
      doctorData.room
    );

    setTimeout(() => {
      setOfflineCallBuzzerActive(false);
    }, 2500);
  };

  const handleMarkPresentInRoom = () => {
    setPatientRoomStatus('Patient Present in Examination Chair (Room 4)');
    addToast(`Token ${selectedPatient.token} is now in consultation room. Ready for physical exam.`, 'success');
  };

  // Teleconsultation Actions
  const handleStartCall = (mode) => {
    setCallMode(mode);
    setIsCallActive(true);
    addToast(`Connected ${mode === 'video' ? 'Video' : 'Audio'} Call with ${activeTeleconsultCall?.patientName || selectedPatient.name}`, 'info');
  };

  const handleAcceptIncomingCall = async (callId) => {
    stopIncomingCallChime();
    try {
      const res = await teleconsultService.acceptCall(callId, doctorData);
      if (res.success) {
        setActiveTeleconsultCall(res.call);
        setIsCallActive(true);
        setCallMode(res.call.callMode || 'video');
        setDoctorView('teleconsult');
        setConsultationType('online');
        setActiveTab('queue');
        setIncomingCallBroadcast(null);
        setCallDuration(0);
        setRxDiagnosis(`Teleconsultation: ${res.call.symptoms}`);
        setActiveBroadcasts(teleconsultService.getActiveBroadcasts());
        setWaitingPool(teleconsultService.getWaitingPool());
        addToast(`✅ Call accepted with ${res.call.patientName}! Teleconsultation connected.`, 'success');
      } else {
        setCallClaimNotice(res.reason);
        setTimeout(() => {
          setIncomingCallBroadcast(null);
          setCallClaimNotice('');
        }, 1800);
        addToast(res.reason, 'warning');
      }
    } catch (err) {
      addToast('Error accepting call: ' + err.message, 'error');
    }
  };

  const handleAcceptBroadcastCall = async (callId) => {
    await handleAcceptIncomingCall(callId);
  };

  const handleAttendWaitingPatient = async (callId) => {
    await handleAcceptIncomingCall(callId);
  };

  const handleDeclineIncomingCall = (callId) => {
    stopIncomingCallChime();
    teleconsultService.declineCall(callId, doctorData.id);
    setIncomingCallBroadcast(null);
    addToast('Call request dismissed from your screen.', 'info');
  };

  const handleSimulatePatientCall = async () => {
    const demoPatients = [
      { name: 'Sunita Patil', age: 42, gender: 'Female', village: 'Chakan, Pune', symptoms: 'Severe migraine, nausea and dizziness since morning' },
      { name: 'Kisanrao Shinde', age: 58, gender: 'Male', village: 'Khed (Rajgurunagar)', symptoms: 'Persistent dry cough and mild fever for 2 days' },
      { name: 'Pooja Jadhav', age: 26, gender: 'Female', village: 'Alandi Sub-Centre', symptoms: 'Throat irritation, difficulty swallowing and body ache' }
    ];
    const p = demoPatients[Math.floor(Math.random() * demoPatients.length)];
    try {
      const call = await teleconsultService.requestInstantTeleconsult({
        patient: {
          id: `PAT-DEMO-${Math.floor(100 + Math.random() * 900)}`,
          name: p.name,
          age: p.age,
          gender: p.gender,
          village: p.village,
          phone: '+91 98220 54321',
          abhaId: '91-3829-9941-2026'
        },
        symptoms: p.symptoms,
        callMode: 'video'
      });
      addToast(`📞 Incoming patient call simulated for ${p.name}!`, 'info');
    } catch (e) {
      addToast(e.message, 'error');
    }
  };

  const handleEndCall = async () => {
    setIsCallActive(false);
    if (webrtcDoctorSessionRef.current) {
      try {
        webrtcDoctorSessionRef.current.destroy();
      } catch (err) {}
      webrtcDoctorSessionRef.current = null;
    }
    const callToEnd = activeTeleconsultCall;
    if (callToEnd) {
      await teleconsultService.endCall(callToEnd.id, doctorData.id);
    }
    setActiveTeleconsultCall(null);
    if (realStreamRef.current) {
      try {
        realStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {}
      realStreamRef.current = null;
    }
    setUseRealCamera(false);
    setHasDoctorRemoteVideo(false);
    setHasDoctorLocalVideo(false);
    setDoctorView('prescribe');
    setActiveTab('prescribe');
    addToast('Teleconsultation ended. Proceeding to digital prescription writer.', 'info');
  };

  const toggleRealCamera = async () => {
    if (useRealCamera) {
      if (realStreamRef.current) {
        realStreamRef.current.getTracks().forEach((track) => track.stop());
        realStreamRef.current = null;
      }
      setUseRealCamera(false);
      addToast('Switched to simulated clinical stream', 'info');
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('WebRTC camera not supported in this browser environment');
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        realStreamRef.current = stream;
        setUseRealCamera(true);
        setTimeout(() => {
          if (realVideoRef.current) {
            realVideoRef.current.srcObject = stream;
          }
        }, 100);
        addToast('Connected real device camera & microphone!', 'success');
      } catch (err) {
        console.warn('Real camera access error:', err);
        addToast('Could not access live camera: ' + (err.message || 'Permission denied'), 'error');
      }
    }
  };

  // Quick Prescription Templates
  const applyTemplate = (templateType) => {
    if (templateType === 'viral') {
      setRxDiagnosis('Acute Viral Upper Respiratory Infection & Bronchial Irritation');
      setRxInstructions('भाप लें, गुनगुना पानी पिएं। धूल और ठंडी चीजों से बचें। (Steam inhalation, warm water).');
      setRxMedicines([
        { name: 'Paracetamol 650mg', type: 'Tablet', dosage: '1 tab', frequency: '1-0-1 after food', duration: '3 days', instructions: 'SOS for fever > 99.5°F' },
        { name: 'Amoxicillin 500mg', type: 'Capsule', dosage: '1 cap', frequency: '1-0-1', duration: '5 days', instructions: 'Complete full course strictly' },
        { name: 'Cetirizine 10mg', type: 'Tablet', dosage: '1 tab', frequency: '0-0-1 (Night)', duration: '5 days', instructions: 'Take at bedtime' },
        { name: 'Ambroxol Syrup', type: 'Syrup', dosage: '10 ml', frequency: '1-1-1 after food', duration: '5 days', instructions: 'With lukewarm water' }
      ]);
      addToast('Applied Viral Respiratory Rx Template', 'info');
    } else if (templateType === 'hypertension') {
      setRxDiagnosis('Essential Hypertension Stage 2 (Blood Pressure Optimization)');
      setRxInstructions('नमक कम खाएं (Low sodium diet). रोजाना 30 मिनट टहलें। BP की दैनिक निगरानी करें।');
      setRxMedicines([
        { name: 'Telmisartan 40mg', type: 'Tablet', dosage: '1 tab', frequency: '1-0-0 (Morning)', duration: '30 days', instructions: 'Before breakfast' },
        { name: 'Amlodipine 5mg', type: 'Tablet', dosage: '1 tab', frequency: '0-0-1 (Night)', duration: '30 days', instructions: 'At bedtime' }
      ]);
      addToast('Applied Hypertension Regimen Template', 'info');
    } else if (templateType === 'gastro') {
      setRxDiagnosis('Acute Gastroenteritis with Mild Dehydration');
      setRxInstructions('ओआरएस का घोल बार-बार पिएं। हल्का खाना खाएं (खिचड़ी, केला, दही)।');
      setRxMedicines([
        { name: 'ORS Sachets (W.H.O. Formula)', type: 'Powder', dosage: '1 packet in 1L water', frequency: 'Sip frequently', duration: '3 days', instructions: 'Drink 2-3 litres daily' },
        { name: 'Ciprofloxacin 500mg', type: 'Tablet', dosage: '1 tab', frequency: '1-0-1', duration: '3 days', instructions: 'After meals' }
      ]);
      addToast('Applied Gastroenteritis & ORS Template', 'info');
    }
  };

  const handleAddMedicine = () => {
    if (!newMedName.trim()) {
      addToast('Please enter medicine name.', 'error');
      return;
    }
    const newMed = {
      name: newMedName.trim(),
      type: newMedType,
      dosage: newMedDosage,
      frequency: newMedFreq,
      duration: newMedDuration,
      instructions: newMedInstr
    };
    setRxMedicines([...rxMedicines, newMed]);
    setNewMedName('');
    addToast(`Added ${newMed.name} to prescription`, 'success');
  };

  const handleRemoveMedicine = (index) => {
    setRxMedicines(rxMedicines.filter((_, i) => i !== index));
  };

  const handleIssuePrescription = async () => {
    if (rxMedicines.length === 0) {
      addToast('Please add at least one medication.', 'error');
      return;
    }

    try {
      const rxRecord = {
        patientId: selectedPatient.id,
        patientName: selectedPatient.name,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientVillage: selectedPatient.village,
        patientAbhaId: selectedPatient.abhaId,
        doctorName: doctorData.name,
        doctorSpecialty: doctorData.specialty,
        doctorRegNo: doctorData.medicalRegNo,
        facility: doctorData.hospital,
        consultationType: consultationType === 'offline' ? 'In-Person PHC Consultation' : 'Telemedicine Consultation (Video/Audio)',
        diagnosis: rxDiagnosis,
        medicines: rxMedicines,
        advice: rxInstructions,
        followUpDays: rxFollowUpDays,
        verifiedStamp: true
      };

      const savedRx = await prescriptionService.createPrescription(rxRecord);
      setLastGeneratedRx(savedRx);
      addToast(
        tr(
          `Prescription ${savedRx.id} issued! Proceeding to Follow-Up & Checkup Completion.`,
          `पर्ची ${savedRx.id} तैयार! फॉलो-अप व जांच समापन पर आगे बढ़ रहे हैं।`,
          `चिठ्ठी ${savedRx.id} दिली! पुढील तपासणी व तपासणी समापनाकडे जात आहोत.`
        ),
        'success'
      );
      handleInitiateCompleteCheckup(selectedPatient);
    } catch (err) {
      addToast('Failed to save prescription: ' + err.message, 'error');
    }
  };

  // Quick touch-friendly clinical tools and services (Matching Patient Portal architecture)
  const doctorServices = [
    {
      id: 'voice-dictate',
      label: tr('AI VOICE DICTATE', 'एआई वॉयस डिक्टेशन', 'एआय व्हॉइस डिक्टेशन'),
      sub: tr('Speech-to-Text Rx & Notes', 'बोलकर पर्ची व नोट्स लिखें', 'बोलून चिठ्ठी व नोट्स लिहा'),
      icon: Mic,
      color: '#9333EA',
      bg: '#F5F3FF',
      onClick: () => setShowTranscribeModal(true)
    },
    {
      id: 'vitals-telemetry',
      label: tr('PATIENT VITALS', 'मरीज वाइटल्स जांच', 'रुग्ण व्हायटल्स तपासणी'),
      sub: tr('BP, SpO2, Pulse & Temp', 'बीपी, एसपीओ2, नब्ज व तापमान', 'बीपी, एसपीओ२, नाडी व तापमान'),
      icon: Activity,
      color: '#2563EB',
      bg: '#DBEAFE',
      onClick: () => setShowVitalsModal(true)
    },
    {
      id: 'physical-exam',
      label: tr('PHYSICAL EXAM', 'शारीरिक जांच नोट्स', 'शारीरिक तपासणी नोट्स'),
      sub: tr('Chest, Throat, Abdomen & ENT', 'छाती, गला, पेट व स्टेथोस्कोप', 'छाती, घसा, पोट व स्टेथोस्कोप'),
      icon: Stethoscope,
      color: '#059669',
      bg: '#D1FAE5',
      onClick: () => setShowPhysicalExamModal(true)
    },
    {
      id: 'fast-rx-kits',
      label: tr('FAST RX KITS', 'जन औषधि फास्ट किट', 'जलद औषध किट्स'),
      sub: tr('1-Click Viral & BP Clinical Kits', '1-क्लिक फ्लू, बीपी व उदर किट', '१-क्लिक व्हायरल व बीपी किट'),
      icon: Zap,
      color: '#D97706',
      bg: '#FEF3C7',
      onClick: () => { setDoctorView('prescribe'); setActiveTab('prescribe'); }
    },
    {
      id: 'official-rx',
      label: tr('OFFICIAL ABHA RX', 'हस्ताक्षरित डिजिटल पर्ची', 'डिजिटल आभा चिठ्ठी'),
      sub: tr('View QR & Signed Print', 'क्यूआर कोड व प्रिंट देखें', 'क्यूआर कोड व स्वाक्षरी पहा'),
      icon: FileCheck,
      color: '#7C3AED',
      bg: '#F3E8FF',
      onClick: () => setShowOfficialRxModal(true)
    },
    {
      id: 'call-buzzer',
      label: tr('CALL BUZZER', 'मरीज बजर बजाएं', 'रुग्ण बजर वाजवा'),
      sub: tr('Call Next Patient to Room 4', 'अगला मरीज कमरा 4 में बुलाएं', 'पुढील रुग्ण खोली ४ मध्ये बोलवा'),
      icon: Bell,
      color: '#EA580C',
      bg: '#FFEDD5',
      onClick: handleCallOfflinePatient
    },
    {
      id: 'patient-history',
      label: tr('MEDICAL HISTORY', 'पुरानी बीमारी व एलर्जी', 'वैद्यकीय इतिहास व ॲलर्जी'),
      sub: tr('Allergies, Chronic & Surgeries', 'एलर्जी व पूर्व उपचार', 'ॲलर्जी, जुने आजार व शस्त्रक्रिया'),
      icon: ClipboardList,
      color: '#475569',
      bg: '#F1F5F9',
      onClick: () => setShowHistoryModal(true)
    },
    {
      id: 'room-status',
      label: tr('MARK IN CHAIR', 'कमरा 4 उपस्थिति', 'खोली ४ उपस्थिती'),
      sub: tr('Update In-Chair OPD Status', 'मरीज परीक्षण स्थिति बदलें', 'रुग्ण तपासणी स्थिती बदला'),
      icon: CheckSquare,
      color: '#0891B2',
      bg: '#CFFAFE',
      onClick: handleMarkPresentInRoom
    },
    {
      id: 'staff-dispatch',
      label: tr('STAFF DISPATCH DESK', 'स्टाफ डिस्पैच डेस्क', 'स्टाफ डिस्पॅच डेस्क'),
      sub: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
        ? `🚨 ${activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length} ${tr('Active Request(s)', 'सक्रिय अनुरोध', 'सक्रिय विनंत्या')}`
        : tr('Dispatch Nurse for Injections', 'नर्स व इंजेक्शन सहायता', 'परिचारिका व इंजेक्शन मदत'),
      icon: Syringe,
      color: '#E11D48',
      bg: '#FFE4E6',
      onClick: () => setShowStaffDispatchModal(true)
    },
    {
      id: 'asha-field-triage',
      label: tr('ASHA FIELD TRIAGE', 'आशा फील्ड ट्राइएज', 'आशा फील्ड ट्रायज'),
      sub: (Array.isArray(ashaRequests) ? ashaRequests : []).filter(r => r.status === 'Submitted' || r.status === 'Pending').length > 0
        ? `🚨 ${(Array.isArray(ashaRequests) ? ashaRequests : []).filter(r => r.status === 'Submitted' || r.status === 'Pending').length} ${tr('Pending Field Requests', 'लंबित फील्ड अनुरोध', 'प्रलंबित फील्ड विनंत्या')}`
        : tr('Rural Field Triage & Requests', 'फील्ड ट्राइएज व परामर्श डेस्क', 'फील्ड ट्रायज व सल्लामसलत डेस्क'),
      icon: Users,
      color: '#059669',
      bg: '#D1FAE5',
      onClick: () => setShowAshaRequestsModal(true)
    }
  ];

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: '1440px', margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: '1.5rem 1.25rem' }}>
      {/* 1. DOCTOR GREETING & NMC REGISTRATION HERO BANNER (Matching Patient Portal) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          marginBottom: '1.5rem',
          padding: '1.5rem 1.75rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 50%, #0F766E 100%)',
          color: 'white',
          boxShadow: '0 8px 24px -4px rgba(2, 132, 199, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, opacity: 0.95, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              NMC ID: {doctorData.regNo}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: 700 }}>
              ✓ {tr('NMC Verified', 'एनएमसी सत्यापित', 'एनएमसी प्रमाणित')}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.18)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: 600 }}>
              {doctorData.hospital} &bull; {doctorData.room}
            </span>
          </div>

          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            {tr(`Welcome back, ${doctorData.name}! 🩺`, `स्वागत है, ${doctorData.name}! 🩺`, `स्वागत आहे, ${doctorData.name}! 🩺`)}
          </h1>

          {/* Quick Metric Badges & Teleconsult Duty Status Toggle */}
          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Users size={14} />
              <span>{allPatients.filter(p => p.mode === 'offline').length} {tr('OPD Patients', 'ओपीडी मरीज', 'ओपीडी रुग्ण')}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', padding: '0.35rem 0.75rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={14} />
              <span>{tr('OPD Token', 'ओपीडी टोकन', 'ओपीडी टोकन')}: #{Number(selectedPatient?.tokenNumber || String(selectedPatient?.token || '').replace(/\D/g, '')) || 35}</span>
            </div>

            {/* Live Teleconsult Duty Toggle */}
            <div style={{ background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(4px)', padding: '0.25rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Radio size={14} color={doctorAvailability === 'available' ? '#4ade80' : '#fde047'} />
              <span>{tr('Teleconsult Duty:', 'टेलीकंसल्ट ड्यूटी:', 'टेलिकन्सल्ट ड्युटी:')}</span>
              <button
                type="button"
                onClick={() => {
                  const nextStatus = doctorAvailability === 'available' ? 'busy_opd' : 'available';
                  setDoctorAvailability(nextStatus);
                  teleconsultService.setDoctorStatus(doctorData.id, nextStatus);
                  addToast(nextStatus === 'available' ? '🟢 You are now Available for Teleconsultation calls' : '🟡 Status set to In Physical OPD Exam (Busy)', 'info');
                }}
                style={{
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.15rem 0.55rem',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: doctorAvailability === 'available' ? '#10b981' : '#f59e0b',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}
              >
                <span>{doctorAvailability === 'available' ? '🟢 Free / Available' : '🟡 In OPD Exam'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🚨 COMPACT BUTTON-DRIVEN 108 EMERGENCY SOS ALERT BAR (Always visible if active emergency exists) */}
      {activeEmergency && activeEmergency.status !== 'Cancelled' && (
        <div
          className="animate-fade-in"
          style={{
            marginBottom: '1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1.5px solid #EF4444',
            borderRadius: '12px',
            padding: '0.65rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px -2px rgba(220, 38, 38, 0.2)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <span className="badge badge-emergency" style={{ fontWeight: 800, fontSize: '0.7rem', padding: '0.1rem 0.45rem' }}>
                  ● 108 SOS ALERT
                </span>
                <span style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 800 }}>
                  {activeEmergency.targetType === 'myself' ? activeEmergency.callerName : `Bystander Report (${activeEmergency.callerName})`}
                </span>
                <span style={{ fontSize: '0.74rem', color: '#7F1D1D' }}>
                  &bull; ETA: <strong>0{activeEmergency.etaMinutes} min</strong> ({activeEmergency.distanceKm} km) &bull; {activeEmergency.ambulanceVehicleNumber}
                </span>
                {emergencyPhotos.length > 0 && (
                  <span
                    onClick={() => { setActivePhotoIndex(0); setShowIncidentPhotoModal(true); }}
                    style={{
                      fontSize: '0.72rem',
                      background: '#DC2626',
                      color: 'white',
                      padding: '0.1rem 0.5rem',
                      borderRadius: '999px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                    title="Click to view transmitted incident photos"
                  >
                    📷 {emergencyPhotos.length} Photo(s) Attached
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1px' }}>
                Location: <strong>{activeEmergency.address}</strong> &bull; {activeEmergency.description}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <a
              href={`tel:${activeEmergency.callerPhone}`}
              className="btn btn-sm"
              style={{
                background: '#ffffff',
                color: '#DC2626',
                border: '1.5px solid #DC2626',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '8px'
              }}
            >
              <PhoneCall size={13} />
              <span>Call ({activeEmergency.callerPhone})</span>
            </a>

            <button
              onClick={() => setShowEmergencyStudioModal(true)}
              className="btn btn-sm"
              style={{
                background: '#DC2626',
                color: 'white',
                border: 'none',
                fontWeight: 800,
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(220, 38, 38, 0.3)'
              }}
            >
              <span>🚨 Emergency Studio & Reply</span>
              {activeEmergency.doctorMessages?.length > 0 && (
                <span style={{ background: 'white', color: '#DC2626', padding: '0.05rem 0.35rem', borderRadius: '999px', fontSize: '0.65rem' }}>
                  {activeEmergency.doctorMessages.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. DOCTOR HOME DASHBOARD (Matching Patient Portal Experience) */}
      {/* ============================================================ */}
      {doctorView === 'home' ? (
        <div className="animate-fade-in">
          {/* PRIMARY CLINICAL GATEWAYS SECTION */}
          <div style={{ marginBottom: '2rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
                marginBottom: '1.25rem'
              }}
            >
              {/* Left Title */}
              <div>
                <h2 className="page-title" style={{ fontSize: '1.4rem', margin: 0 }}>
                  {tr('PRIMARY CLINICAL GATEWAYS', 'प्राथमिक क्लिनिकल गेटवे', 'मुख्य क्लिनिकल सेवा')}
                </h2>
              </div>

              {/* RIGHT SIDE: LIVE OPD QUEUE DISPLAY BOX (Matching Patient Portal Live Queue Box) */}
              <div
                onClick={() => {
                  setDoctorView('queue');
                  setConsultationType('offline');
                  setActiveTab('queue');
                }}
                style={{
                  background: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '14px',
                  padding: '0.6rem 1.15rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  boxShadow: '0 2px 10px rgba(2, 132, 199, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to view full live OPD queue details"
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    background: '#0284c7',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Clock size={20} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      {tr('Live OPD Queue • Room 4', 'लाइव ओपीडी कतार (कमरा 4)', 'थेट ओपीडी रांग • खोली ४')}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: '999px',
                        background: '#dbeafe',
                        color: '#1e40af'
                      }}
                    >
                      {allPatients.filter(p => p.mode === 'offline').length} {tr('Physical', 'ओपीडी मरीज', 'प्रत्यक्ष रुग्ण')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                    <span style={{ color: '#0284c7' }}>
                      {tr('Now Serving:', 'चल रहा:', 'सध्या सुरू:')} <strong>#{Number(selectedPatient?.tokenNumber || String(selectedPatient?.token || '').replace(/\D/g, '')) || 35}</strong>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>&bull;</span>
                    <span style={{ color: '#0f172a' }}>
                      {selectedPatient?.name || 'Rahul Sharma'}
                    </span>
                    <span style={{ color: '#cbd5e1' }}>&bull;</span>
                    <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600 }}>
                      {patientRoomStatus}
                    </span>
                  </div>
                </div>

                <ChevronRight size={16} color="#0284c7" style={{ marginLeft: '0.35rem' }} />
              </div>
            </div>

            {/* THE 6 PRIMARY CLINICAL GATEWAY CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.25rem'
              }}
            >
              {/* Card 1: In-Person OPD Queue (Room 4) - Button 1 */}
              <div
                className="card card-clickable"
                onClick={() => {
                  setDoctorView('queue');
                  setConsultationType('offline');
                  setActiveTab('queue');
                }}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
                  border: '2px solid #0284C7',
                  boxShadow: '0 6px 20px -3px rgba(2, 132, 199, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#0284C7',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <Users size={28} />
                    </div>
                    <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af' }}>
                      ● {allPatients.filter(p => p.mode === 'offline').length} {tr('In Line • Room 4', 'कतार में • कमरा 4', 'रांगेत • खोली ४')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('🏢 In-Person OPD Queue', '🏢 ओपीडी मरीज कतार (कमरा 4)', '🏢 ओपीडी रुग्ण रांग (खोली ४)')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(2, 132, 199, 0.15)'
                  }}
                >
                  <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open OPD Queue Desk', 'ओपीडी कतार खोलें', 'ओपीडी रांग उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#0284C7" />
                </div>
              </div>

              {/* Card 2: Current Patient in Consultation - Button 2 */}
              <div
                className="card card-clickable"
                onClick={() => {
                  setDoctorView('patient');
                  setActiveTab('queue');
                }}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
                  border: '2px solid #059669',
                  boxShadow: '0 6px 20px -3px rgba(5, 150, 105, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#059669',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                      }}
                    >
                      <UserCheck size={28} />
                    </div>
                    <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.75rem', background: '#dcfce7', color: '#15803d' }}>
                      ● {tr('Serving Token #', 'टोकन सेवा जारी #', 'टोकन क्र. सुरू #')}{Number(selectedPatient?.tokenNumber || String(selectedPatient?.token || '').replace(/\D/g, '')) || 35}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('🩺 Active Patient Consultation', '🩺 वर्तमान मरीज परामर्श', '🩺 सध्याचे रुग्ण तपासणी')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(5, 150, 105, 0.15)'
                  }}
                >
                  <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open Patient Workbench', 'मरीज परामर्श खोलें', 'रुग्ण तपासणी उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#059669" />
                </div>
              </div>

              {/* Card 3: Digital E-Prescription Desk */}
              <div
                className="card card-clickable"
                onClick={() => {
                  setDoctorView('prescribe');
                  setActiveTab('prescribe');
                }}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
                  border: '2px solid #7C3AED',
                  boxShadow: '0 6px 20px -3px rgba(124, 58, 237, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#7C3AED',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
                      }}
                    >
                      <FileText size={28} />
                    </div>
                    <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.75rem', background: '#f3e8ff', color: '#6b21a8' }}>
                      ● {rxMedicines.length} {tr('Meds • Jan Aushadhi', 'दवाएं • जन औषधि', 'औषधे • जन औषध')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('📝 Digital E-Prescription Desk', '📝 ई-पर्ची व जन औषधि डेस्क', '📝 डिजिटल ई-चिठ्ठी डेस्क')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(124, 58, 237, 0.15)'
                  }}
                >
                  <span style={{ color: '#7C3AED', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open E-Prescription Desk', 'ई-पर्ची डेस्क खोलें', 'ई-चिठ्ठी डेस्क उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#7C3AED" />
                </div>
              </div>

              {/* Card 4: Online Teleconsultation */}
              <div
                className="card card-clickable"
                onClick={() => {
                  setDoctorView('teleconsult');
                  setConsultationType('online');
                  setActiveTab('queue');
                }}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)',
                  border: '2px solid #0D9488',
                  boxShadow: '0 6px 20px -3px rgba(13, 148, 136, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#0D9488',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                      }}
                    >
                      <Video size={28} />
                    </div>
                    <span className="badge" style={{ fontWeight: 800, fontSize: '0.75rem', background: '#ccfbf1', color: '#0f766e' }}>
                      ● {allPatients.filter(p => p.mode === 'online').length || 2} {tr('Online In Queue', 'ऑनलाइन कतार में', 'ऑनलाइन रांगेत')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('📹 Online Teleconsultation', '📹 ऑनलाइन टेलीकंसल्टेशन', '📹 ऑनलाइन व्हिडिओ सल्ला')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(13, 148, 136, 0.15)'
                  }}
                >
                  <span style={{ color: '#0D9488', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open Teleconsultation Hub', 'टेलीकंसल्टेशन हब खोलें', 'टेलीकन्सल्टेशन हब उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#0D9488" />
                </div>
              </div>

              {/* Card 5: Clinical Referral Network */}
              <div
                className="card card-clickable"
                onClick={() => {
                  setReferralStudioTab('tracker');
                  setShowReferralModal(true);
                }}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)',
                  border: '2px solid #0284C7',
                  boxShadow: '0 6px 20px -3px rgba(2, 132, 199, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: '#0284C7',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                      }}
                    >
                      <Share2 size={28} />
                    </div>
                    <span className="badge badge-neutral" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                      ● {tr('District Civil Hospital Chain', 'जिला सिविल अस्पताल', 'जिल्हा शासकीय रुग्णालय')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('🔗 Clinical Referral Network', '🔗 अस्पताल रेफरल नेटवर्क', '🔗 रुग्णालय संदर्भ नेटवर्क')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(2, 132, 199, 0.15)'
                  }}
                >
                  <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open Referral Tracker', 'रेफरल फॉर्म व ट्रैकर', 'रेफरल ट्रॅकर उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#0284C7" />
                </div>
              </div>


              {/* Card 6: Urgent Staff & Home Injections */}
              <div
                className="card card-clickable"
                onClick={() => setShowStaffDispatchModal(true)}
                style={{
                  padding: '1.6rem',
                  borderRadius: 'var(--radius-xl)',
                  background: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
                    ? 'linear-gradient(135deg, #FFFFFF 0%, #FFF1F2 100%)'
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)',
                  border: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
                    ? '2px solid #E11D48'
                    : '2px solid #0D9488',
                  boxShadow: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
                    ? '0 6px 20px -3px rgba(225, 29, 72, 0.18)'
                    : '0 6px 20px -3px rgba(13, 148, 136, 0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0 ? '#E11D48' : '#0D9488',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
                          ? '0 4px 12px rgba(225, 29, 72, 0.3)'
                          : '0 4px 12px rgba(13, 148, 136, 0.3)'
                      }}
                    >
                      <Syringe size={28} />
                    </div>
                    <span
                      className="badge"
                      style={{
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        background: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0 ? '#FFE4E6' : '#CCFBF1',
                        color: activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0 ? '#9F1239' : '#0F766E'
                      }}
                    >
                      {activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length > 0
                        ? `● ${activeStaffRequests.filter(r => r.status !== 'Completed' && r.status !== 'Cancelled').length} ${tr('Active Requests', 'सक्रिय अनुरोध', 'सक्रिय विनंत्या')}`
                        : tr('● Nurses on Standby', '● स्टाफ उपलब्ध', '● परिचारिका सज्ज')}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    {tr('💉 Urgent Staff & Injections', '💉 घर पर नर्स व इंजेक्शन', '💉 तातडीची परिचारिका व इंजेक्शन')}
                  </h3>
                </div>

                <div
                  style={{
                    marginTop: '1.35rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '0.75rem',
                    borderTop: '1px solid rgba(225, 29, 72, 0.15)'
                  }}
                >
                  <span style={{ color: '#E11D48', fontWeight: 800, fontSize: '0.925rem' }}>
                    {tr('Open Dispatch Desk', 'स्टाफ डिस्पैच डेस्क खोलें', 'स्टाफ डिस्पॅच डेस्क उघडा')} →
                  </span>
                  <ChevronRight size={18} color="#E11D48" />
                </div>
              </div>
            </div>
          </div>

          {/* EXPLORE CLINICAL TOOLS & SERVICES SECTION (Matching Patient Portal Services Grid) */}
          <div style={{ marginBottom: '2rem' }}>
            <div className="page-header" style={{ marginBottom: '1rem' }}>
              <h2 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
                {tr('EXPLORE CLINICAL TOOLS & SERVICES', 'त्वरित क्लिनिकल उपकरण व सेवाएं', 'क्लिनिकल साधने आणि सेवा')}
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                gap: '1rem'
              }}
            >
              {doctorServices.map((action) => {
                const Icon = action.icon;
                return (
                  <div
                    key={action.id}
                    className="card card-clickable"
                    onClick={action.onClick}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.4rem 1rem',
                      textAlign: 'center',
                      background: '#FFFFFF',
                      borderRadius: 'var(--radius-lg)',
                      border: '1px solid var(--border)',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: '14px',
                        backgroundColor: action.bg,
                        color: action.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '0.75rem',
                        boxShadow: `0 4px 10px ${action.color}25`
                      }}
                    >
                      <Icon size={26} />
                    </div>

                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.825rem',
                        color: 'var(--text-primary)',
                        marginBottom: '4px',
                        letterSpacing: '0.02em'
                      }}
                    >
                      {action.label}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.3
                      }}
                    >
                      {action.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ============================================================ */
        /* 3. DEDICATED FOCUSED WORKSPACE VIEW (With Back to Dashboard) */
        /* ============================================================ */
        <div className="animate-fade-in">
          {/* TOP BACK TO DASHBOARD & WORKSTATION SWITCHER BAR */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setDoctorView('home');
                setActiveTab('queue');
              }}
              className="btn btn-outline btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontWeight: 800,
                color: '#0284c7',
                borderColor: '#0284c7',
                background: '#f0f9ff',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <ArrowLeft size={16} />
              <span>{tr('← Back to Doctor Dashboard', '← वापस डॉक्टर डैशबोर्ड', '← मागे डॉक्टर डॅशबोर्ड')}</span>
            </button>

            {/* Quick Switcher Workstation Pills */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setDoctorView('queue');
                  setConsultationType('offline');
                  setActiveTab('queue');
                }}
                className="btn btn-sm"
                style={{
                  background: doctorView === 'queue' ? '#0284c7' : '#f1f5f9',
                  color: doctorView === 'queue' ? '#ffffff' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Users size={14} />
                <span>1. OPD Queue</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorView('patient');
                  setActiveTab('queue');
                }}
                className="btn btn-sm"
                style={{
                  background: doctorView === 'patient' ? '#059669' : '#f1f5f9',
                  color: doctorView === 'patient' ? '#ffffff' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <UserCheck size={14} />
                <span>2. Current Patient ({selectedPatient?.name || 'Rahul'})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDoctorView('prescribe');
                  setActiveTab('prescribe');
                }}
                className="btn btn-sm"
                style={{
                  background: doctorView === 'prescribe' ? '#7c3aed' : '#f1f5f9',
                  color: doctorView === 'prescribe' ? '#ffffff' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.76rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '999px',
                  padding: '0.35rem 0.85rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} />
                <span>3. E-Prescription Desk</span>
              </button>
            </div>
          </div>

          {/* SUBVIEW 1: IN-PERSON OPD QUEUE (FULL WORKBENCH) */}
          {doctorView === 'queue' && (
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {/* Header: Mode Name, Patient Count & Live Sync Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0284c7' }}>
                    🏢 In-Person OPD Patient Queue (Room 4)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    {allPatients.filter(p => p.mode === 'offline').length} Patients in line &bull; Physical Clinic Examination Desk
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      loadPatients();
                      addToast('🔄 Patient Queue re-synced with live appointments!', 'info');
                    }}
                    title="Sync Patient Queue / मरीज कतार ताज़ा करें"
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <RefreshCw size={13} color="#22c55e" />
                    <span>Sync Queue</span>
                  </button>

                  <button
                    onClick={handleCallOfflinePatient}
                    style={{
                      background: offlineCallBuzzerActive ? '#ea580c' : '#0284c7',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <Bell size={13} />
                    <span>{offlineCallBuzzerActive ? '🔔 Buzzer Ringing!' : tr('Call Next Patient', 'अगला मरीज बुलाएं', 'पुढील रुग्ण बोलवा')}</span>
                  </button>
                </div>
              </div>

              {/* Search and Priority Pills */}
              <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Search patient by name, symptoms, ABHA ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.85rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {['all', 'Routine', 'Follow-Up', 'High Priority'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        background: priorityFilter === p ? '#0284c7' : '#f1f5f9',
                        color: priorityFilter === p ? '#ffffff' : '#64748b'
                      }}
                    >
                      {p === 'all' ? 'All Patients' : p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Patient Cards in Queue Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '1rem'
                }}
              >
                {filteredPatients.map((patient) => {
                  const isSelected = patient.id === selectedPatientId;
                  return (
                    <div
                      key={patient.id}
                      style={{
                        padding: '1.15rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #0284c7' : '1.5px solid #e2e8f0',
                        background: isSelected ? '#f0f9ff' : '#ffffff',
                        boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.15)' : 'var(--shadow-sm)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.85rem',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: '10px',
                                background: isSelected ? '#0284c7' : '#e0f2fe',
                                color: isSelected ? '#ffffff' : '#0369a1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '1.1rem'
                              }}
                            >
                              #{Number(patient.tokenNumber || String(patient.token || '').replace(/\D/g, '')) || 35}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                                {patient.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                {patient.age}Y &bull; {patient.gender} &bull; {patient.village}
                              </div>
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.2rem 0.55rem',
                              borderRadius: '999px',
                              background:
                                patient.priority === 'High Priority'
                                  ? '#fee2e2'
                                  : patient.priority === 'Follow-Up'
                                    ? '#fef3c7'
                                    : '#dbeafe',
                              color:
                                patient.priority === 'High Priority'
                                  ? '#b91c1c'
                                  : patient.priority === 'Follow-Up'
                                    ? '#92400e'
                                    : '#1e40af'
                            }}
                          >
                            ● {patient.priority}
                          </span>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '0.5rem 0.65rem', borderRadius: '8px', fontSize: '0.78rem', color: '#334155' }}>
                          <strong>Symptoms:</strong> {patient.symptoms?.join ? patient.symptoms.join(', ') : patient.symptoms || 'General clinical checkup'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            setDoctorView('patient');
                            setActiveTab('queue');
                            addToast(`Opened clinical workbench for ${patient.name}`, 'info');
                          }}
                          className="btn btn-primary btn-sm"
                          style={{
                            flex: 1,
                            fontWeight: 800,
                            padding: '0.45rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            background: '#0284c7',
                            borderRadius: '8px'
                          }}
                        >
                          <UserCheck size={14} />
                          <span>Examine Patient &rarr;</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatientId(patient.id);
                            handleCallOfflinePatient();
                          }}
                          className="btn btn-outline btn-sm"
                          style={{
                            borderColor: '#cbd5e1',
                            padding: '0.45rem 0.65rem',
                            borderRadius: '8px'
                          }}
                          title="Ring buzzer for this token"
                        >
                          <Bell size={14} color="#ea580c" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUBVIEW 2: CURRENT PATIENT CONSULTATION WORKBENCH */}
          {doctorView === 'patient' && (
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              {/* Patient Top Identity Card */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.85rem',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: '#059669',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.25rem'
                    }}
                  >
                    {selectedPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
                        {selectedPatient.name}
                      </h2>
                      <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        ({selectedPatient.nameHindi})
                      </span>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '999px'
                        }}
                      >
                        Token #{Number(selectedPatient.tokenNumber || String(selectedPatient.token || '').replace(/\D/g, '')) || 35} &bull; Room 4 OPD
                      </span>
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                      ABHA: <strong>{selectedPatient.abhaId}</strong> &bull; {selectedPatient.age} Yrs &bull; {selectedPatient.gender} &bull; Blood Group: <strong>{selectedPatient.bloodGroup}</strong> &bull; Village: <strong>{selectedPatient.village}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => handleInitiateCompleteCheckup(selectedPatient)}
                    className="btn btn-success btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: 'white',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                    title="Complete checkup for this patient, archive records, and advance queue"
                  >
                    <CheckCircle2 size={16} />
                    <span>✓ Complete Checkup</span>
                  </button>

                  <button
                    onClick={() => {
                      setDoctorView('prescribe');
                      setActiveTab('prescribe');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{
                      background: '#7c3aed',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.45rem 0.95rem',
                      borderRadius: '8px'
                    }}
                  >
                    <FileText size={15} />
                    <span>Write Prescription (Rx) &rarr;</span>
                  </button>
                </div>
              </div>

              {/* BUTTONS TOOLBAR (Clean, touch-friendly blocks instead of confusing open clutter) */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.6rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  alignItems: 'center'
                }}
              >
                {/* Button: Vitals Modal */}
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(true)}
                  className="btn btn-sm"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#0f172a',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="View complete vitals and telemetry breakdown"
                >
                  <Activity size={15} color="#0284c7" />
                  <span>📊 Vitals:</span>
                  <span style={{ color: '#0284c7', fontWeight: 800 }}>{selectedPatient.referral.vitalsAtReferral.bp}</span>
                  <span style={{ color: '#64748b' }}>&bull;</span>
                  <span style={{ color: selectedPatient.referral.vitalsAtReferral.spo2.includes('94') || selectedPatient.referral.vitalsAtReferral.spo2.includes('95') ? '#dc2626' : '#16a34a', fontWeight: 800 }}>
                    SpO2: {selectedPatient.referral.vitalsAtReferral.spo2}
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>▼</span>
                </button>

                {/* Button: Drug Allergies */}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="btn btn-sm"
                  style={{
                    background: selectedPatient.history.allergies.length > 0 && !selectedPatient.history.allergies[0].includes('NKDA') && !selectedPatient.history.allergies[0].includes('No known') ? '#fef2f2' : '#f0fdf4',
                    border: selectedPatient.history.allergies.length > 0 && !selectedPatient.history.allergies[0].includes('NKDA') && !selectedPatient.history.allergies[0].includes('No known') ? '1.5px solid #fca5a5' : '1.5px solid #86efac',
                    color: selectedPatient.history.allergies.length > 0 && !selectedPatient.history.allergies[0].includes('NKDA') && !selectedPatient.history.allergies[0].includes('No known') ? '#b91c1c' : '#15803d',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Click to view full drug allergy profile & medical history"
                >
                  <AlertCircle size={15} />
                  <span>⚠️ Allergies:</span>
                  <span>{selectedPatient.history.allergies[0] || 'None'}</span>
                </button>

                {/* Button: Referral Tracking & History Modal */}
                <button
                  type="button"
                  onClick={() => {
                    setReferralStudioTab('tracker');
                    setShowReferralModal(true);
                  }}
                  className="btn btn-sm"
                  style={{
                    background: '#f0f9ff',
                    border: '1.5px solid #7dd3fc',
                    color: '#0369a1',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="View complete multi-hop referral tracking chain"
                >
                  <Share2 size={15} color="#0284c7" />
                  <span>🔗 Referral Tracker ({activeTrackingChain?.hops?.length || 1} Hops)</span>
                </button>

                {/* Button: Medical History Modal */}
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  className="btn btn-sm"
                  style={{
                    background: '#ffffff',
                    border: '1.5px solid #cbd5e1',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.4rem 0.8rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <ClipboardList size={15} color="#0284c7" />
                  <span>Medical History ({selectedPatient.history.pastTreatments.length})</span>
                </button>

                {/* Button: AI Voice Dictation Modal */}
                <button
                  type="button"
                  onClick={() => setShowTranscribeModal(true)}
                  className="btn btn-sm"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    border: 'none',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.95rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginLeft: 'auto'
                  }}
                >
                  <Mic size={15} />
                  <span>🎙️ AI Voice Dictate</span>
                </button>
              </div>

              {/* Physical In-Clinic Room Control Bar */}
              <div style={{ padding: '0.85rem 1rem', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#0369a1', fontWeight: 800 }}>CLINIC CORRIDOR & ROOM 4 STATUS:</span>
                    <span style={{ background: '#0284c7', color: 'white', padding: '0.15rem 0.55rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 800 }}>
                      {patientRoomStatus}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Token #{selectedPatient.token} &bull; Booked via SehatSetu Patient App
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={handleCallOfflinePatient}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontWeight: 800,
                      background: offlineCallBuzzerActive ? '#ea580c' : '#0284c7',
                      animation: offlineCallBuzzerActive ? 'pulse 0.5s infinite' : 'none'
                    }}
                  >
                    <Bell size={14} />
                    <span>{offlineCallBuzzerActive ? '🔔 Buzzer Ringing!' : '🔔 Call Token to Room 4'}</span>
                  </button>

                  <button
                    onClick={handleMarkPresentInRoom}
                    className="btn btn-outline btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderColor: '#16a34a', color: '#16a34a', fontWeight: 700 }}
                  >
                    <CheckSquare size={14} />
                    <span>Mark in Chair</span>
                  </button>
                </div>
              </div>

              {/* In-Person Physical Clinical Examination Section */}
              <div style={{ padding: '1.15rem', background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Stethoscope size={20} color="#0284c7" />
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                      Physical Clinical Examination Findings
                    </h4>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowPhysicalExamModal(true)}
                      className="btn btn-sm"
                      style={{
                        background: '#0284c7',
                        color: 'white',
                        border: 'none',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Sliders size={13} />
                      <span>Log / Edit Findings</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTranscribeModal(true)}
                      className="btn btn-sm"
                      style={{
                        background: '#eff6ff',
                        color: '#0284c7',
                        border: '1px solid #bfdbfe',
                        fontWeight: 800,
                        fontSize: '0.76rem',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Mic size={13} />
                      <span>🎙️ AI Voice Dictate</span>
                    </button>
                  </div>
                </div>

                {/* Clean preview chips of recorded findings */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                  <div
                    onClick={() => setShowPhysicalExamModal(true)}
                    style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>CHEST & LUNGS (स्टेथोस्कोप जांच)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {physicalExamNotes.chestAuscultation}
                    </div>
                  </div>

                  <div
                    onClick={() => setShowPhysicalExamModal(true)}
                    style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>THROAT & ORAL (गला व टॉन्सिल)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {physicalExamNotes.throatExam}
                    </div>
                  </div>

                  <div
                    onClick={() => setShowPhysicalExamModal(true)}
                    style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>BP VERIFIED (MANUAL)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {physicalExamNotes.bpVerified}
                    </div>
                  </div>

                  <div
                    onClick={() => setShowPhysicalExamModal(true)}
                    style={{ background: '#f8fafc', padding: '0.75rem 0.95rem', borderRadius: '10px', border: '1px solid #e2e8f0', cursor: 'pointer' }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>ABDOMEN (पेट की जांच)</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginTop: '3px' }}>
                      {physicalExamNotes.abdomen}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Complete Checkup & Write Rx */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleInitiateCompleteCheckup(selectedPatient)}
                    className="btn btn-success btn-sm"
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      fontWeight: 800,
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      borderRadius: '10px',
                      fontSize: '0.92rem',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)'
                    }}
                  >
                    <CheckCircle2 size={18} />
                    <span>✓ Complete Checkup</span>
                  </button>

                  <button
                    onClick={() => {
                      setDoctorView('prescribe');
                      setActiveTab('prescribe');
                    }}
                    className="btn btn-primary btn-sm"
                    style={{
                      flex: 1,
                      minWidth: '240px',
                      fontWeight: 800,
                      padding: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      borderRadius: '10px',
                      fontSize: '0.92rem'
                    }}
                  >
                    <FileText size={18} />
                    <span>Proceed to Write & Issue E-Prescription (Rx) &rarr;</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SUBVIEW 3: DIGITAL E-PRESCRIPTION DESK (FULL WORKBENCH) */}
          {doctorView === 'prescribe' && (
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#ffffff',
                borderRadius: '14px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#7c3aed' }}>
                    📝 E-Prescription Desk for {selectedPatient.name}
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                    Mode: <strong>{consultationType === 'offline' ? 'In-Clinic Physical Visit' : 'Telemedicine Remote Consultation'}</strong> &bull; {selectedPatient.village} &bull; ABHA: {selectedPatient.abhaId}
                  </span>
                </div>

                {/* Clean Action Buttons Bar */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setShowTranscribeModal(true)}
                    className="btn btn-sm"
                    style={{
                      background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                      color: 'white',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: '0.76rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <Mic size={14} />
                    <span>🎙️ AI Voice to Rx</span>
                  </button>

                  <button type="button" onClick={() => applyTemplate('viral')} className="btn btn-outline btn-sm" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                    + Viral Flu Kit
                  </button>
                  <button type="button" onClick={() => applyTemplate('hypertension')} className="btn btn-outline btn-sm" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                    + Hypertension Kit
                  </button>
                  <button type="button" onClick={() => applyTemplate('gastro')} className="btn btn-outline btn-sm" style={{ fontSize: '0.74rem', padding: '0.3rem 0.65rem' }}>
                    + Gastro Kit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddMedModal(true)}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.76rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800, background: '#7c3aed' }}
                  >
                    <Plus size={14} />
                    <span>Add Medicine</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  DIAGNOSIS (रोग का निदान)
                </label>
                <input
                  type="text"
                  value={rxDiagnosis}
                  onChange={(e) => setRxDiagnosis(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.88rem', fontWeight: 700, borderRadius: '8px' }}
                />
              </div>

              {/* Prescribed Medicines List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', margin: 0 }}>
                    PRESCRIBED MEDICINES ({rxMedicines.length}) &bull; GENERIC JAN AUSHADHI ALTERNATIVES
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddMedModal(true)}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '2px 10px', fontWeight: 700 }}
                  >
                    + Add New Medicine
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {rxMedicines.length === 0 ? (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.84rem' }}>
                      No medicines added yet. Click <strong>+ Add Medicine</strong> or choose a <strong>Clinical Kit</strong> above.
                    </div>
                  ) : (
                    rxMedicines.map((med, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.95rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.84rem' }}>
                        <div>
                          <strong>{med.name}</strong> ({med.type}) &bull; <span style={{ color: '#0284c7', fontWeight: 700 }}>{med.dosage} - {med.frequency} - {med.duration}</span>
                          <div style={{ color: '#64748b', fontSize: '0.74rem', marginTop: '2px' }}>Instructions: {med.instructions}</div>
                        </div>
                        <button onClick={() => handleRemoveMedicine(idx)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }} title="Remove">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Clinical Advice */}
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  CLINICAL ADVICE & DIET (परामर्श)
                </label>
                <input
                  type="text"
                  value={rxInstructions}
                  onChange={(e) => setRxInstructions(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', fontSize: '0.84rem', borderRadius: '8px' }}
                />
              </div>

              {/* Action Buttons: Issue Rx & Complete Checkup */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleIssuePrescription}
                  className="btn btn-primary btn-sm"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    borderRadius: '10px',
                    fontSize: '0.92rem'
                  }}
                >
                  <Send size={16} />
                  <span>
                    {consultationType === 'offline'
                      ? tr('Issue Prescription & Proceed to Follow-Up / Complete Checkup', 'पर्ची जारी करें और फॉलो-अप व जांच समापन पर आगे बढ़ें', 'चिठ्ठी द्या व पुढील तपासणी / तपासणी समापनाकडे जा')
                      : tr('Upload Digital Rx & Complete Checkup', 'डिजिटल पर्ची अपलोड करें व जांच पूर्ण करें', 'डिजिटल चिठ्ठी अपलोड करा व तपासणी पूर्ण करा')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleInitiateCompleteCheckup(selectedPatient)}
                  className="btn btn-outline btn-sm"
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    borderColor: '#16a34a',
                    color: '#15803d',
                    borderRadius: '10px',
                    fontSize: '0.86rem'
                  }}
                >
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span>
                    {tr('Direct Follow-Up & Complete Checkup (Skip Rx)', 'सीधे फॉलो-अप व जांच पूर्ण करें (पर्ची छोड़ें)', 'थेट पुढील तपासणी व तपासणी पूर्ण करा')}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* SUBVIEW 4: ONLINE TELECONSULTATION (VIDEO/AUDIO) WORKBENCH */}
          {doctorView === 'teleconsult' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* CASE A: LIVE ACTIVE CALL CONNECTED */}
              {isCallActive ? (
                <div
                  className="card"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    background: '#090d16',
                    color: 'white',
                    borderRadius: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    maxWidth: '820px',
                    margin: '0 auto',
                    width: '100%',
                    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  {/* Call Top Status Bar */}
                  <div style={{ padding: '0.75rem 1.25rem', background: '#131c2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                        {callMode === 'video' ? '📹 Video Teleconsultation' : '📞 Rural Audio Call'} &bull; {activeTeleconsultCall?.patientName || selectedPatient.name}
                      </span>
                      <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontSize: '0.72rem', padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 800 }}>
                        Connected & Locked
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                        {formatTimer(callDuration)}
                      </span>
                      <span style={{ background: '#1e293b', color: '#94a3b8', fontSize: '0.72rem', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                        {activeTeleconsultCall?.patientVillage || selectedPatient.village || 'Tele-Bridge'}
                      </span>
                    </div>
                  </div>

                  {/* Video / Audio Screen Area */}
                  <div
                    style={{
                      position: 'relative',
                      height: '380px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: '#020617',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Dedicated Unmuted Remote Patient Audio Output Stream (Never hidden by display:none) */}
                    <audio
                      ref={doctorRemoteAudioRef}
                      autoPlay
                      playsInline
                      style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                    />

                    {callMode === 'video' && !isVideoOff ? (
                      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
                        {/* Real-Life Patient Webcam Stream via WebRTC */}
                        <video
                          ref={doctorRemoteVideoRef}
                          autoPlay
                          playsInline
                          onLoadedMetadata={(e) => {
                            e.target.play().catch(() => {});
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: hasDoctorRemoteVideo ? 'block' : 'none'
                          }}
                        />

                        {/* Patient Placeholder when patient camera is connecting */}
                        {!hasDoctorRemoteVideo && (
                          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                            <img
                              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80"
                              alt="Patient Stream"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center 18%',
                                opacity: 0.8
                              }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.55)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '1rem', textAlign: 'center' }}>
                              <div style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', padding: '0.65rem 1.25rem', borderRadius: '999px', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}>
                                <span className="pulse-indicator" style={{ backgroundColor: '#38bdf8' }} />
                                <span>{doctorCameraNotice || 'Patient Connected • Syncing Patient Camera...'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Live Bluetooth Telemetry Overlay */}
                        <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span>TELEMETRY VITAL SENSORS</span>
                            {hasDoctorRemoteVideo && <span style={{ background: '#16a34a', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: '3px' }}>PATIENT CAM LIVE</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.2rem', fontSize: '0.82rem', fontWeight: 800 }}>
                            <span style={{ color: '#38bdf8' }}>HR: 76 bpm</span>
                            <span style={{ color: '#4ade80' }}>SpO2: 98%</span>
                            <span style={{ color: '#fbbf24' }}>BP: 122/80</span>
                          </div>
                        </div>

                        {/* Patient Chief Complaint Overlay */}
                        <div style={{ position: 'absolute', bottom: 14, left: 14, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(6px)', padding: '0.45rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', maxWidth: '65%' }}>
                          <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 800 }}>CHIEF COMPLAINT</div>
                          <div style={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                            {activeTeleconsultCall?.symptoms || selectedPatient.symptoms || 'General Malaise'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2.5rem' }}>
                        <div style={{ width: 76, height: 76, borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.85rem', border: '2px solid #38bdf8', animation: 'pulse 2s infinite' }}>
                          <User size={38} color="#38bdf8" />
                        </div>
                        <h4 style={{ margin: 0, fontSize: '1.25rem' }}>{activeTeleconsultCall?.patientName || selectedPatient.name}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0.35rem 0 0' }}>
                          {callMode === 'audio' ? '📞 Audio Tele-Link Active (Optimized for Low Rural Bandwidth)' : 'Camera Off'}
                        </p>
                        <div style={{ marginTop: '0.85rem', display: 'inline-block', background: '#1e293b', padding: '0.35rem 0.95rem', borderRadius: '999px', fontSize: '0.78rem', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                          Symptoms: {activeTeleconsultCall?.symptoms || selectedPatient.symptoms}
                        </div>
                      </div>
                    )}

                    {/* Doctor PiP Feed (Doctor's Own Real Webcam) */}
                    <div style={{ position: 'absolute', bottom: 14, right: 14, width: '135px', height: '100px', borderRadius: '10px', overflow: 'hidden', border: hasDoctorLocalVideo ? '2px solid #22c55e' : '2px solid #38bdf8', background: '#1e293b', boxShadow: '0 4px 14px rgba(0,0,0,0.6)' }}>
                      <video
                        ref={doctorLocalVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: hasDoctorLocalVideo ? 'block' : 'none'
                        }}
                      />
                      {!hasDoctorLocalVideo && (
                        <img
                          src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80"
                          alt="Doctor"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                      <span style={{ position: 'absolute', bottom: 3, left: 4, fontSize: '0.62rem', fontWeight: 800, background: hasDoctorLocalVideo ? '#15803d' : 'rgba(0,0,0,0.7)', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>
                        {hasDoctorLocalVideo ? '🟢 Dr. Cam' : doctorData.name}
                      </span>
                    </div>
                  </div>

                  {/* Teleconsult Controls Strip */}
                  <div style={{ padding: '0.85rem 1.25rem', background: '#131c2e', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        const next = !isMuted;
                        setIsMuted(next);
                        if (webrtcDoctorSessionRef.current) {
                          webrtcDoctorSessionRef.current.toggleAudio(!next);
                        }
                      }}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: isMuted ? '#ef4444' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                    >
                      {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                    <button
                      onClick={() => {
                        const next = !isVideoOff;
                        setIsVideoOff(next);
                        if (webrtcDoctorSessionRef.current) {
                          webrtcDoctorSessionRef.current.toggleVideo(!next);
                        }
                      }}
                      style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: isVideoOff ? '#ef4444' : '#334155', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
                    >
                      {isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
                    </button>
                    <button onClick={() => setCallMode(callMode === 'video' ? 'audio' : 'video')} className="btn btn-outline btn-sm" style={{ borderColor: '#64748b', color: '#f8fafc', fontSize: '0.78rem' }}>
                      {callMode === 'video' ? '📞 Switch Audio' : '📹 Switch Video'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLiveTranscribing) handleStopTranscribe();
                        else handleStartTranscribe();
                      }}
                      className="btn btn-sm"
                      style={{
                        background: isLiveTranscribing ? '#ef4444' : '#0284c7',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '0.45rem 1rem',
                        borderRadius: '999px',
                        border: isLiveTranscribing ? '2px solid #fca5a5' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer'
                      }}
                    >
                      <Mic size={14} />
                      <span>{isLiveTranscribing ? '⏹ Transcribing Rx Live...' : '🎙️ Live AI Transcribe'}</span>
                    </button>
                    <button
                      onClick={() => {
                        handleEndCall();
                        setDoctorView('prescribe');
                        setActiveTab('prescribe');
                      }}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#dc2626', color: 'white', border: 'none', borderRadius: '999px', padding: '0.5rem 1.25rem', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer' }}
                    >
                      <PhoneCall size={15} />
                      <span>End Call & Write Rx</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* CASE B: TELECONSULTATION AVAILABILITY & BROADCAST HUB */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Availability Status Card */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%)',
                      color: 'white',
                      padding: '1.4rem 1.6rem',
                      borderRadius: '14px',
                      boxShadow: '0 4px 14px rgba(6, 78, 59, 0.25)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            On-Demand Rural Tele-Care
                          </span>
                          <span style={{ fontSize: '0.72rem', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                            Zero Token / No Booking Required
                          </span>
                        </div>
                        <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.3rem', fontWeight: 800 }}>
                          Real-Time General Doctor Availability Network
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.92, maxWidth: '650px', lineHeight: 1.45 }}>
                          Patients directly initiate calls when medical consultation is needed. Call requests are broadcast to all available General Doctors connected to the platform. First doctor to accept attends the patient.
                        </p>
                      </div>

                      {/* Availability Toggle & Simulation */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.25)', padding: '0.45rem 0.95rem', borderRadius: '10px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Your Teleconsult Status:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = doctorAvailability === 'available' ? 'busy_opd' : 'available';
                              setDoctorAvailability(next);
                              teleconsultService.setDoctorStatus(doctorData.id, next);
                              addToast(next === 'available' ? '🟢 You are now Available for Teleconsultation calls' : '🟡 Status set to In Physical OPD Exam (Busy)', 'info');
                            }}
                            style={{
                              border: 'none',
                              borderRadius: '999px',
                              padding: '0.35rem 0.85rem',
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              background: doctorAvailability === 'available' ? '#10b981' : '#f59e0b',
                              color: '#ffffff'
                            }}
                          >
                            {doctorAvailability === 'available' ? '🟢 Available for Calls' : '🟡 In OPD Exam (Busy)'}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSimulatePatientCall}
                          style={{
                            background: '#ffffff',
                            color: '#065f46',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.45rem 0.95rem',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                          }}
                        >
                          <PhoneCall size={14} color="#065f46" />
                          <span>Simulate Incoming Patient Call (Demo)</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Incoming Broadcast Calls */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Radio size={18} color={activeBroadcasts.length > 0 ? '#ef4444' : '#10b981'} />
                        <span>Active Call Broadcasts ({activeBroadcasts.length})</span>
                      </h4>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Ringing simultaneously across all connected General Doctors
                      </span>
                    </div>

                    {activeBroadcasts.length === 0 ? (
                      <div style={{ background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: '12px', padding: '1.75rem', textAlign: 'center' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' }}>
                          <Radio size={24} />
                        </div>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                          Teleconsult Radar Active & Ready
                        </div>
                        <p style={{ margin: '0.25rem 0 0.75rem', fontSize: '0.8rem', color: '#64748b' }}>
                          No patients currently requesting teleconsultation. Any incoming call will instantly trigger an audio-visual broadcast alert.
                        </p>
                        <button
                          type="button"
                          onClick={handleSimulatePatientCall}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: '0.78rem', fontWeight: 700 }}
                        >
                          Simulate Test Patient Request
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeBroadcasts.map((call) => (
                          <div
                            key={call.id}
                            style={{
                              background: '#fef2f2',
                              border: '2px solid #ef4444',
                              borderRadius: '12px',
                              padding: '1rem 1.25rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '0.75rem'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s infinite', display: 'inline-block' }} />
                                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#991b1b' }}>
                                  {call.patientName}
                                </span>
                                <span style={{ background: '#fee2e2', color: '#991b1b', fontSize: '0.72rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '999px' }}>
                                  {call.patientVillage}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.82rem', color: '#7f1d1d', marginTop: '0.2rem' }}>
                                <strong>Symptoms:</strong> {call.symptoms} &bull; Broadcast Ringing
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAcceptBroadcastCall(call.id)}
                              style={{
                                background: '#16a34a',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.55rem 1.25rem',
                                fontWeight: 800,
                                fontSize: '0.84rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                              }}
                            >
                              <PhoneCall size={16} />
                              <span>Accept & Connect Call</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 3. Priority Waiting Pool (On-Hold Patient Queue) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Clock size={16} color="#d97706" />
                        <span>Priority Waiting Pool ({waitingPool.length})</span>
                      </h4>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Calls placed on hold when all doctors are in physical OPD exams
                      </span>
                    </div>

                    {waitingPool.length === 0 ? (
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                        No patients currently waiting on hold. Queue is clear!
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {waitingPool.map((p, idx) => (
                          <div
                            key={p.id}
                            style={{
                              background: '#fffbeb',
                              border: '1px solid #fde68a',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.78rem'
                            }}
                          >
                            <div>
                              <strong>#{idx + 1} {p.patientName}</strong> ({p.patientVillage}) &bull; <span style={{ color: '#b45309', fontWeight: 700 }}>Wait: ~{p.waitMinutes || 2}m</span>
                              <div style={{ color: '#78350f', fontSize: '0.72rem' }}>Symptoms: {p.symptoms}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAttendWaitingPatient(p.id)}
                              className="btn btn-sm"
                              style={{ background: '#d97706', color: 'white', border: 'none', fontWeight: 800, fontSize: '0.72rem', padding: '0.25rem 0.65rem', borderRadius: '6px' }}
                            >
                              Attend Now
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4. Connected General Doctors Live Teleconsult Roster */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Users size={16} color="#0284c7" />
                      <span>Connected General Doctors Live Teleconsult Roster ({teleconsultDocs.length})</span>
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.65rem' }}>
                      {teleconsultDocs.map((doc) => {
                        const isMe = doc.id === doctorData.id;
                        const currentStatus = isMe ? doctorAvailability : doc.status;
                        return (
                          <div
                            key={doc.id}
                            style={{
                              background: '#ffffff',
                              border: isMe ? '2px solid #0284c7' : '1px solid #e2e8f0',
                              borderRadius: '8px',
                              padding: '0.65rem 0.85rem',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
                                {doc.name} {isMe && <span style={{ color: '#0284c7', fontSize: '0.7rem' }}>(You)</span>}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                                {doc.specialty} &bull; {doc.location}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                padding: '2px 6px',
                                borderRadius: '999px',
                                background: currentStatus === 'available' ? '#dcfce7' : currentStatus === 'busy_opd' ? '#fef3c7' : '#e0e7ff',
                                color: currentStatus === 'available' ? '#15803d' : currentStatus === 'busy_opd' ? '#b45309' : '#3730a3'
                              }}
                            >
                              {currentStatus === 'available' ? '🟢 Available' : currentStatus === 'busy_opd' ? '🟡 In OPD Exam' : '🔵 In Call'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* POP-UP MODAL 1: DOCTOR CREDENTIALS & FACILITY */}
      {/* ============================================================ */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="#0284c7" />
                <span>Doctor Credentials & Clinic Facility</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowProfileModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '10px', marginBottom: '1rem' }}>
                <div style={{ width: 60, height: 60, borderRadius: '16px', background: '#0284c7', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                  {doctorData.name.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{doctorData.name}</h4>
                    <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.7rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px' }}>
                      NMC Verified
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#0284c7', fontWeight: 600, marginTop: '0.15rem' }}>
                    {doctorData.specialty}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                    {doctorData.hospital} &bull; {doctorData.room}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>MEDICAL COUNCIL REG NO.</div>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {doctorData.medicalRegNo}
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>ABHA PROFESSIONAL ID</div>
                  <div style={{ fontWeight: 800, color: '#0284c7', marginTop: '0.15rem', fontFamily: 'monospace' }}>
                    {doctorData.hprId}
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>OFFICIAL EMAIL</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>
                    {doctorData.email}
                  </div>
                </div>

                <div style={{ background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TELECOM CONTACT</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>
                    {doctorData.phone}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(user, null, 2));
                    const dl = document.createElement('a');
                    dl.setAttribute('href', dataStr);
                    dl.setAttribute('download', `doctor_${doctorData.medicalRegNo}.json`);
                    document.body.appendChild(dl);
                    dl.click();
                    dl.remove();
                    addToast('Exported doctor credentials JSON', 'info');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Download size={14} />
                  <span>Export JSON Record</span>
                </button>

                <button
                  onClick={onLogout}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POP-UP MODAL 2: CLINICAL REFERRAL TRACKING & TRANSFER STUDIO */}
      {/* ============================================================ */}
      {showReferralModal && (
        <div className="modal-overlay" onClick={() => setShowReferralModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 840, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '1rem 1.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                  <Share2 size={22} color="#0284c7" />
                  <span>Clinical Referral Tracking & Specialist Transfer Studio</span>
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>
                  Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.nameHindi}) &bull; ABHA: <strong>{selectedPatient.abhaId}</strong> &bull; Token: <strong>{selectedPatient.token}</strong>
                </p>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowReferralModal(false)}>
                <X size={18} />
              </button>
            </div>

            {/* Studio Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.4rem 1.5rem 0', borderBottom: '1px solid #e2e8f0', gap: '0.5rem' }}>
              <button
                onClick={() => setReferralStudioTab('tracker')}
                style={{
                  padding: '0.6rem 1.1rem',
                  border: 'none',
                  borderBottom: referralStudioTab === 'tracker' ? '3px solid #0284c7' : '3px solid transparent',
                  background: 'transparent',
                  color: referralStudioTab === 'tracker' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>📦 Referral Journey Tracker ({activeTrackingChain?.hops?.length || 1} Hops)</span>
              </button>

              <button
                onClick={() => setReferralStudioTab('new_referral')}
                style={{
                  padding: '0.6rem 1.1rem',
                  border: 'none',
                  borderBottom: referralStudioTab === 'new_referral' ? '3px solid #0284c7' : '3px solid transparent',
                  background: 'transparent',
                  color: referralStudioTab === 'new_referral' ? '#0284c7' : '#64748b',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <span>➡️ Refer to Another Doctor / Facility</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              {referralStudioTab === 'tracker' ? (
                <div>
                  <ReferralTrackingTimeline
                    chain={activeTrackingChain}
                    isDoctorView={true}
                    onOpenReferModal={() => setReferralStudioTab('new_referral')}
                  />
                </div>
              ) : (
                /* TAB 2: REFER TO ANOTHER DOCTOR FORM */
                <form onSubmit={handleSubmitNewReferral} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <ShieldCheck size={22} color="#16a34a" />
                    <div style={{ fontSize: '0.8rem', color: '#166534' }}>
                      <strong>Ayushman Bharat Certified Clinical Referral Gateway:</strong> When you refer this patient, a new node is digitally appended to their live Flipkart-style tracking chain and synchronized across all doctor and patient portals immediately.
                    </div>
                  </div>

                  {/* Target Facility & Department Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Receiving Facility / Hospital:
                      </label>
                      <select
                        value={referTargetFacility}
                        onChange={(e) => setReferTargetFacility(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="District Civil Hospital & Trauma Centre, Chakan">District Civil Hospital & Trauma Centre, Chakan (Secondary)</option>
                        <option value="SMS Medical College & Super-Speciality Hospital, Jaipur">SMS Medical College & Super-Speciality Hospital, Jaipur (Tertiary)</option>
                        <option value="Talegaon General Hospital (Orthopedics & Surgery)">Talegaon General Hospital (Sub-District Ortho Unit)</option>
                        <option value="AIIMS Tele-Medicine & Super-Specialist Hub">AIIMS National Tele-Consultation Hub (Virtual)</option>
                        <option value="Khed CHC & Rural Trauma Unit">Khed Community Health Centre (CHC)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Specialist Department / Clinical Unit:
                      </label>
                      <select
                        value={referSpecialty}
                        onChange={(e) => setReferSpecialty(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="Department of Cardiology & Cath Lab">Department of Cardiology & Cath Lab</option>
                        <option value="Orthopedic Surgery & Trauma">Orthopedic Surgery & Trauma</option>
                        <option value="Pediatrics & Neonatal Care">Pediatrics & Neonatal Care</option>
                        <option value="Obstetrics & High-Risk Maternal Care">Obstetrics & High-Risk Maternal Care</option>
                        <option value="Neurology & Neurosurgical OPD">Neurology & Neurosurgical OPD</option>
                        <option value="General & Laparoscopic Surgery">General & Laparoscopic Surgery</option>
                        <option value="Pulmonology & Chest Medicine">Pulmonology & Chest Medicine</option>
                      </select>
                    </div>
                  </div>

                  {/* Doctor Name, Priority & Date Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Referred Specialist Doctor:
                      </label>
                      <input
                        type="text"
                        value={referDoctorName}
                        onChange={(e) => setReferDoctorName(e.target.value)}
                        className="form-control"
                        placeholder="e.g. Dr. Vikram Joshi, DM"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Referral Urgency Priority:
                      </label>
                      <select
                        value={referPriority}
                        onChange={(e) => setReferPriority(e.target.value)}
                        className="form-control"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      >
                        <option value="High Priority">High Priority (Within 24-48 Hours)</option>
                        <option value="Emergency / Immediate Cath Lab">Emergency / Immediate Cath Lab / ICU</option>
                        <option value="Routine Follow-Up">Routine Follow-Up (Within 7 Days)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                        Appointment / Transfer Slot:
                      </label>
                      <input
                        type="text"
                        value={referAppointmentDate}
                        onChange={(e) => setReferAppointmentDate(e.target.value)}
                        className="form-control"
                        placeholder="e.g. 18 Sep 2026, 11:00 AM"
                        style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* CRITICAL USER REQUIREMENT: DOCTOR'S CLINICAL REMARKS */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <MessageSquare size={15} color="#0284c7" />
                        <span>Doctor's Clinical Remarks & Reason for Transfer (Required):</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        Will be prominently highlighted in patient's live tracker
                      </span>
                    </div>

                    <textarea
                      rows={4}
                      value={referRemarks}
                      onChange={(e) => setReferRemarks(e.target.value)}
                      placeholder="Write your clinical evaluation findings, reason for referring to this specialist, medication given so far, and specific instructions for the receiving doctor..."
                      className="form-control"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        borderRadius: '8px',
                        border: '1.5px solid #0284c7',
                        fontSize: '0.85rem',
                        lineHeight: 1.5,
                        boxSizing: 'border-box'
                      }}
                      required
                    />

                    {/* Quick Preset Tags for Doctor */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', alignSelf: 'center', fontWeight: 700 }}>Quick Presets:</span>
                      {[
                        'Requires Urgent 2D-Echo & Coronary Angiogram',
                        'Suspected High-Risk Pre-Eclampsia - Tertiary ICU Backup',
                        'Complex Fracture - Requires Orthopedic Fixation',
                        'Unresponsive to Primary Treatment - Advanced Diagnostic Workup'
                      ].map((preset, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setReferRemarks((prev) => prev ? `${prev} ${preset}.` : `${preset}.`)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '999px',
                            padding: '0.2rem 0.6rem',
                            fontSize: '0.7rem',
                            color: '#334155',
                            cursor: 'pointer'
                          }}
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Vitals Summary to be attached */}
                  <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>CLINICAL VITALS TO BE ATTACHED TO REFERRAL SLIP:</div>
                    <div style={{ display: 'flex', gap: '1.25rem', color: '#0f172a', fontWeight: 700 }}>
                      <span>BP: <strong>{selectedPatient.referral?.vitalsAtReferral?.bp || '130/84 mmHg'}</strong></span>
                      <span>Pulse: <strong>{selectedPatient.referral?.vitalsAtReferral?.pulse || '88 bpm'}</strong></span>
                      <span>SpO2: <strong style={{ color: '#16a34a' }}>{selectedPatient.referral?.vitalsAtReferral?.spo2 || '98%'}</strong></span>
                      <span>Temp: <strong>{selectedPatient.referral?.vitalsAtReferral?.temp || '98.6°F'}</strong></span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => setReferralStudioTab('tracker')}
                      className="btn btn-outline"
                      style={{ padding: '0.55rem 1.25rem' }}
                    >
                      Cancel & Return to Tracker
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{
                        padding: '0.55rem 1.5rem',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        boxShadow: '0 4px 12px rgba(2, 132, 199, 0.35)'
                      }}
                    >
                      <Share2 size={16} />
                      <span>Confirm & Issue Referral Transfer</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POP-UP MODAL 3: MEDICAL HISTORY */}
      {/* ============================================================ */}
      {showHistoryModal && (
        <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ClipboardList size={20} color="#0284c7" />
                <span>Patient Medical Dossier & Lab Records</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowHistoryModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>CHRONIC CONDITIONS</div>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px' }}>
                  {selectedPatient.history.chronicConditions}
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>PAST CONSULTATIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedPatient.history.pastTreatments.map((t, idx) => (
                    <div key={idx} style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, color: '#0f172a' }}>
                        <span>{t.diagnosis}</span>
                        <span style={{ color: '#64748b', fontSize: '0.72rem' }}>{t.date}</span>
                      </div>
                      <div style={{ color: '#0284c7', fontSize: '0.75rem', marginTop: '0.15rem' }}>{t.doctor}</div>
                      <div style={{ color: '#475569', fontSize: '0.75rem', marginTop: '0.15rem' }}>Treatment: {t.treatment}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.35rem' }}>DIAGNOSTIC LAB REPORTS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {selectedPatient.history.labReports.map((l, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '0.78rem' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{l.name}</span>
                      <span style={{ color: '#059669', fontWeight: 700 }}>{l.result}</span>
                      <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{l.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* POP-UP MODAL 4: OFFICIAL SIGNED PRESCRIPTION (PRINT / DOWNLOAD) */}
      {/* ============================================================ */}
      {showOfficialRxModal && (
        <div className="modal-overlay" onClick={() => setShowOfficialRxModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 0 }}>
            <div style={{ padding: '1.5rem', background: '#ffffff', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #0284c7', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0369a1', fontWeight: 900 }}>{doctorData.hospital}</h3>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Govt of {doctorData.state || 'India'} &bull; Public Health Dept &bull; {doctorData.room}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, marginTop: '0.25rem' }}>{doctorData.name} ({doctorData.specialty})</div>
                  <div style={{ fontSize: '0.72rem', color: '#475569' }}>Reg No: {doctorData.medicalRegNo}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <ShieldCheck size={14} /> ABHA Synced
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Date: {new Date().toLocaleDateString('en-GB')}
                  </div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', marginBottom: '0.85rem' }}>
                Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.age}Y/{selectedPatient.gender}) &bull; ABHA: {selectedPatient.abhaId} &bull; Mode: <strong>{consultationType === 'offline' ? 'In-Person PHC' : 'Telemedicine Remote'}</strong>
              </div>

              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                Diagnosis: {rxDiagnosis}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.5rem', marginBottom: '0.85rem' }}>
                {rxMedicines.map((m, i) => (
                  <div key={i} style={{ padding: '0.35rem 0', borderBottom: '1px dashed #f1f5f9', fontSize: '0.78rem' }}>
                    <strong>{i + 1}. {m.name}</strong> ({m.type}) &bull; <span style={{ color: '#0284c7', fontWeight: 700 }}>{m.dosage} - {m.frequency} - {m.duration}</span>
                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>Note: {m.instructions}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', color: '#166534', marginBottom: '1rem' }}>
                <strong>Doctor's Advice:</strong> {rxInstructions}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <QrCode size={34} color="#0f172a" />
                  <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '0.1rem' }}>Jan Aushadhi QR</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '1.25rem', color: '#0369a1' }}>{doctorData.name}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Digitally Signed & Validated</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => {
                    window.print();
                    addToast('Prescription printed for pharmacy', 'info');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                >
                  <Printer size={14} />
                  <span>Print Rx</span>
                </button>
                <button
                  onClick={() => {
                    setShowOfficialRxModal(false);
                    handleInitiateCompleteCheckup(selectedPatient);
                  }}
                  className="btn btn-primary btn-sm"
                  style={{
                    flex: 1.5,
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: 'white',
                    fontWeight: 800,
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <span>✓ Next: Follow-Up & Complete Checkup</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INCIDENT PHOTO ENLARGE MODAL WITH MULTI-PHOTO VIEWER */}
      {showIncidentPhotoModal && activeEmergency && (
        <div className="modal-overlay" onClick={() => setShowIncidentPhotoModal(false)} style={{ zIndex: 1200 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={20} color="#DC2626" />
                <span>
                  Emergency Incident Photos &bull; Photo {Math.min(activePhotoIndex, Math.max(0, emergencyPhotos.length - 1)) + 1} of {Math.max(1, emergencyPhotos.length)}
                </span>
              </h3>
              <button onClick={() => setShowIncidentPhotoModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '1.25rem', textAlign: 'center' }}>
              <div style={{ background: '#0F172A', borderRadius: '10px', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '340px' }}>
                {emergencyPhotos.length > 0 ? (
                  <img
                    src={emergencyPhotos[Math.min(activePhotoIndex, emergencyPhotos.length - 1)]}
                    alt={`Emergency scene ${activePhotoIndex + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '460px', borderRadius: '6px', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: '#94A3B8', padding: '2rem' }}>No photo available</div>
                )}
              </div>

              {/* Navigation controls if multiple photos */}
              {emergencyPhotos.length > 1 && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.25rem', marginBottom: '0.75rem' }}>
                    <button
                      onClick={() => setActivePhotoIndex((prev) => (prev > 0 ? prev - 1 : emergencyPhotos.length - 1))}
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      ◀ Previous
                    </button>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>
                      Photo {Math.min(activePhotoIndex, emergencyPhotos.length - 1) + 1} of {emergencyPhotos.length}
                    </span>
                    <button
                      onClick={() => setActivePhotoIndex((prev) => (prev < emergencyPhotos.length - 1 ? prev + 1 : 0))}
                      className="btn btn-outline btn-sm"
                      style={{ fontWeight: 700 }}
                    >
                      Next ▶
                    </button>
                  </div>

                  {/* Thumbnail Row */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                    {emergencyPhotos.map((thumb, idx) => (
                      <img
                        key={idx}
                        src={thumb}
                        alt={`Thumb ${idx + 1}`}
                        onClick={() => setActivePhotoIndex(idx)}
                        style={{
                          width: 54,
                          height: 54,
                          borderRadius: '6px',
                          objectFit: 'cover',
                          cursor: 'pointer',
                          border: activePhotoIndex === idx ? '2.5px solid #DC2626' : '1.5px solid #CBD5E1',
                          opacity: activePhotoIndex === idx ? 1 : 0.6,
                          transition: 'all 0.15s ease'
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: '#64748B' }}>
                Reported by: <strong>{activeEmergency.callerName}</strong> ({activeEmergency.callerPhone}) &bull; Location: <strong>{activeEmergency.address}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EMERGENCY 108 RESPONSE & CLINICAL ADVISORY STUDIO */}
      {/* ============================================================ */}
      {showEmergencyStudioModal && activeEmergency && (
        <div className="modal-overlay" onClick={() => setShowEmergencyStudioModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ background: '#fef2f2', borderBottom: '2px solid #f87171' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#991b1b', fontWeight: 800 }}>
                    Emergency 108 SOS Response Studio
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
                    Incident ID: {activeEmergency.id} &bull; Status: <strong>{activeEmergency.status}</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowEmergencyStudioModal(false)} className="btn btn-ghost btn-sm">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {/* Top alert stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700 }}>AMBULANCE ETA</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#dc2626' }}>
                    ~{activeEmergency.etaMinutes || 8} mins ({activeEmergency.distanceKm || 2.4} km)
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Vehicle: {activeEmergency.ambulanceVehicleNumber || '108-EM-Ambulance'}</div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700 }}>REPORTED BY</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                    {activeEmergency.callerName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Phone size={12} /> {activeEmergency.callerPhone}
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.68rem', color: '#991b1b', fontWeight: 700 }}>RECEIVING FACILITY</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                    {activeEmergency.hospitalName || `${doctorData.hospital} Trauma Bay`}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 700 }}>Trauma Bay 1 Prepped</div>
                </div>
              </div>

              {/* Accident context & photo if present */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>LOCATION / LANDMARK</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <MapPin size={14} color="#dc2626" /> {activeEmergency.address}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, marginTop: '0.65rem' }}>REPORTED PROBLEM / SITUATION</div>
                    <div style={{ fontSize: '0.85rem', color: '#334155', marginTop: '0.15rem', fontStyle: 'italic' }}>
                      "{activeEmergency.description}"
                    </div>
                  </div>

                  {emergencyPhotos.length > 0 && (
                    <div style={{ textAlign: 'left', maxWidth: '280px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Camera size={13} />
                        <span>INCIDENT PHOTOS ({emergencyPhotos.length})</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                        {emergencyPhotos.map((img, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => {
                              setActivePhotoIndex(pIdx);
                              setShowIncidentPhotoModal(true);
                            }}
                            style={{
                              position: 'relative',
                              cursor: 'pointer',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              border: '2px solid #ef4444',
                              width: 72,
                              height: 54,
                              flexShrink: 0
                            }}
                            title={`Photo ${pIdx + 1} - Click to enlarge`}
                          >
                            <img src={img} alt={`Scene ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.6rem', fontWeight: 800 }}>
                              #{pIdx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: '0.25rem' }}>
                        Click photo to view full size
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 1-Click First Aid Advisory Chips */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="#0284c7" />
                  <span>1-Click Immediate First-Aid Directives (Doctor to Bystander/Patient):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[
                    'Keep airway clear and head tilted gently to side',
                    'Apply direct firm pressure on bleeding wound with clean cloth',
                    'Do not give liquids, water, or food orally',
                    'Check breathing; start gentle chest compressions if unresponsive',
                    'Keep patient warm, elevate legs slightly to prevent shock',
                    'Ambulance en route. Keep phone line clear for driver call'
                  ].map((tip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendDoctorReply(tip)}
                      disabled={isSendingReply}
                      className="btn btn-outline btn-xs"
                      style={{ borderRadius: '20px', fontSize: '0.73rem', background: '#ffffff', borderColor: '#cbd5e1', color: '#1e293b' }}
                    >
                      + {tip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Doctor Advisory Input */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.85rem', marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#166534', marginBottom: '0.35rem' }}>
                  Transmit Custom Clinical Advisory / Direct Instructions:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={doctorReplyText}
                    onChange={(e) => setDoctorReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendDoctorReply();
                    }}
                    placeholder="Type urgent instructions for bystander or paramedic on site..."
                    style={{ flex: 1, padding: '0.55rem 0.85rem', borderRadius: '6px', border: '1px solid #86efac', fontSize: '0.82rem' }}
                  />
                  <button
                    onClick={() => handleSendDoctorReply()}
                    disabled={isSendingReply || !doctorReplyText.trim()}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                  >
                    <Send size={14} />
                    <span>{isSendingReply ? 'Transmitting...' : 'Send Advisory'}</span>
                  </button>
                </div>
              </div>

              {/* Sent Advisories History Log */}
              {activeEmergency.doctorMessages && activeEmergency.doctorMessages.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.5rem' }}>
                    TRANSMITTED ADVISORIES LOG ({activeEmergency.doctorMessages.length}):
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {activeEmergency.doctorMessages.map((msg, idx) => (
                      <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.78rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.7rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 800, color: '#0369a1' }}>{msg.sender} ({msg.senderRole || 'Doctor'})</span>
                          <span>{msg.timestamp} &bull; Delivered to 108 Mobile</span>
                        </div>
                        <div style={{ color: '#0f172a' }}>{msg.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowEmergencyStudioModal(false)} className="btn btn-secondary btn-sm">
                Close Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PATIENT VITALS & ALLERGIES BREAKDOWN */}
      {/* ============================================================ */}
      {showVitalsModal && (
        <div className="modal-overlay" onClick={() => setShowVitalsModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Patient Vitals & Clinical Alerts &bull; {selectedPatient.name}
                </h3>
              </div>
              <button onClick={() => setShowVitalsModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              {/* High-priority Drug Allergies Banner */}
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991b1b' }}>CRITICAL DRUG ALLERGY WARNING:</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#b91c1c' }}>
                    {selectedPatient.allergies || (Array.isArray(selectedPatient.history?.allergies) ? selectedPatient.history.allergies.join(', ') : selectedPatient.history?.allergies) || 'Penicillin (Severe Rash / Anaphylaxis Risk)'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#7f1d1d' }}>Do not prescribe Beta-lactams or related compounds.</div>
                </div>
              </div>

              {/* Vitals Telemetry Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>BLOOD PRESSURE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedPatient.vitals?.bp || selectedPatient.referral?.vitalsAtReferral?.bp || '124/82 mmHg'}
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>Normal Range</span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>HEART RATE / PULSE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedPatient.vitals?.pulse || selectedPatient.referral?.vitalsAtReferral?.pulse || '88 bpm'}
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>Regular Rhythm</span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>SPO2 (OXYGEN)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: (selectedPatient.vitals?.spo2 || selectedPatient.referral?.vitalsAtReferral?.spo2 || '95%').includes('94') || (selectedPatient.vitals?.spo2 || selectedPatient.referral?.vitalsAtReferral?.spo2 || '95%').includes('95') ? '#d97706' : '#059669', margin: '0.2rem 0' }}>
                    {selectedPatient.vitals?.spo2 || selectedPatient.referral?.vitalsAtReferral?.spo2 || '95%'}
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>Room Air</span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>TEMPERATURE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedPatient.vitals?.temp || selectedPatient.referral?.vitalsAtReferral?.temp || '102.2°F'}
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>Mild Febrile</span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>WEIGHT</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>
                    {selectedPatient.vitals?.weight || selectedPatient.referral?.vitalsAtReferral?.weight || '68 kg'}
                  </div>
                  <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>BMI ~22.4</span>
                </div>

                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700 }}>RESPIRATORY RATE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0.2rem 0' }}>18 /min</div>
                  <span style={{ fontSize: '0.65rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>Eupneic</span>
                </div>
              </div>

              {/* Chronic Conditions & ABHA Note */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>DOCUMENTED CHRONIC CONDITIONS:</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', marginTop: '0.2rem' }}>
                  {selectedPatient.history?.chronicConditions || 'None reported'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#0284c7', marginTop: '0.35rem' }}>
                  ABHA ID: {selectedPatient.abhaId} &bull; Recorded by Sub-Centre Nurse at 09:15 AM
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowVitalsModal(false)} className="btn btn-primary btn-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: IN-PERSON OPD PHYSICAL EXAMINATION FINDINGS */}
      {/* ============================================================ */}
      {showPhysicalExamModal && (
        <div className="modal-overlay" onClick={() => setShowPhysicalExamModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Stethoscope size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Log / Edit Physical Examination Findings
                </h3>
              </div>
              <button onClick={() => setShowPhysicalExamModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Chest & Lung Auscultation:
                  </label>
                  <input
                    type="text"
                    value={physicalExamNotes.chestAuscultation}
                    onChange={(e) => setPhysicalExamNotes({ ...physicalExamNotes, chestAuscultation: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                    {['Normal vesicular breath sounds', 'Mild rhonchi in bases', 'Bilateral wheezing', 'Crepitations right base'].map((preset, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPhysicalExamNotes({ ...physicalExamNotes, chestAuscultation: preset })}
                        className="btn btn-ghost btn-xs"
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem', border: '1px dashed #cbd5e1' }}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Throat & Pharyngeal Examination:
                  </label>
                  <input
                    type="text"
                    value={physicalExamNotes.throatExam}
                    onChange={(e) => setPhysicalExamNotes({ ...physicalExamNotes, throatExam: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Verified Blood Pressure:
                    </label>
                    <input
                      type="text"
                      value={physicalExamNotes.bpVerified}
                      onChange={(e) => setPhysicalExamNotes({ ...physicalExamNotes, bpVerified: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Oral Temperature Logged:
                    </label>
                    <input
                      type="text"
                      value={physicalExamNotes.tempLogged}
                      onChange={(e) => setPhysicalExamNotes({ ...physicalExamNotes, tempLogged: e.target.value })}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Abdominal Palpation & Findings:
                  </label>
                  <input
                    type="text"
                    value={physicalExamNotes.abdomen}
                    onChange={(e) => setPhysicalExamNotes({ ...physicalExamNotes, abdomen: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowPhysicalExamModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowPhysicalExamModal(false);
                  addToast('Physical examination findings saved to clinical chart', 'success');
                }}
                className="btn btn-primary btn-sm"
              >
                Save Findings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ADD CUSTOM MEDICATION */}
      {/* ============================================================ */}
      {showAddMedModal && (
        <div className="modal-overlay" onClick={() => setShowAddMedModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={20} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  Add Medicine to Prescription
                </h3>
              </div>
              <button onClick={() => setShowAddMedModal(false)} className="btn btn-ghost btn-sm">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Medicine / Drug Name:
                  </label>
                  <input
                    type="text"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    placeholder="e.g. Azithromycin 500mg, Pantoprazole 40mg"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Dosage Form:
                    </label>
                    <select
                      value={newMedType}
                      onChange={(e) => setNewMedType(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      {['Tablet', 'Capsule', 'Syrup', 'Injection', 'Inhaler', 'Drops', 'Ointment'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Dose Quantity:
                    </label>
                    <input
                      type="text"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      placeholder="e.g. 1 tab, 10ml"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Frequency:
                    </label>
                    <select
                      value={newMedFreq}
                      onChange={(e) => setNewMedFreq(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    >
                      <option value="1-0-1 (Twice daily)">1-0-1 (Twice daily)</option>
                      <option value="1-1-1 (Thrice daily)">1-1-1 (Thrice daily)</option>
                      <option value="1-0-0 (Morning only)">1-0-0 (Morning only)</option>
                      <option value="0-0-1 (Night only)">0-0-1 (Night only)</option>
                      <option value="SOS (As needed)">SOS (As needed)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                      Duration:
                    </label>
                    <input
                      type="text"
                      value={newMedDuration}
                      onChange={(e) => setNewMedDuration(e.target.value)}
                      placeholder="e.g. 5 days, 1 week"
                      style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                    Special Instructions:
                  </label>
                  <input
                    type="text"
                    value={newMedInstr}
                    onChange={(e) => setNewMedInstr(e.target.value)}
                    placeholder="e.g. Strictly after food with warm water"
                    style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem' }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setShowAddMedModal(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!newMedName.trim()) {
                    addToast('Please enter medication name', 'error');
                    return;
                  }
                  setRxMedicines([
                    ...rxMedicines,
                    {
                      name: newMedName.trim(),
                      type: newMedType,
                      dosage: newMedDosage,
                      frequency: newMedFreq,
                      duration: newMedDuration,
                      instructions: newMedInstr
                    }
                  ]);
                  setNewMedName('');
                  setShowAddMedModal(false);
                  addToast(`Added ${newMedName} to prescription`, 'success');
                }}
                className="btn btn-primary btn-sm"
              >
                Add to Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: AI VOICE MEDICAL TRANSCRIBE & AUTO-PRESCRIBE STUDIO */}
      {/* FOCUS: ONLY MEDICINE, FOR HOW MANY DAYS, AND AT WHAT TIMINGS */}
      {/* ============================================================ */}
      {showTranscribeModal && (
        <div className="modal-overlay" onClick={() => setShowTranscribeModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780, maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '0.85rem 1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(2,132,199,0.25)' }}>
                  <Mic size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 800 }}>
                      AI Medicine Voice Transcriber
                    </h3>
                    <span style={{ fontSize: '0.65rem', background: '#e0f2fe', color: '#0369a1', padding: '0.12rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                      Medicine &bull; Days &bull; Timings Only
                    </span>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Dictate medicines, duration (how many days), and intake timings (morning/afternoon/night, before/after meals)
                  </div>
                </div>
              </div>
              <button onClick={() => setShowTranscribeModal(false)} className="btn btn-ghost btn-sm" style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem' }}>
              {/* Mic Active status banner & waveform */}
              <div style={{ background: isLiveTranscribing ? '#f0fdf4' : '#f8fafc', border: `1px solid ${isLiveTranscribing ? '#86efac' : '#e2e8f0'}`, borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: isLiveTranscribing ? '#16a34a' : '#94a3b8' }} />
                    {isLiveTranscribing && <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #22c55e', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isLiveTranscribing ? '#15803d' : '#475569' }}>
                      {isLiveTranscribing ? 'Listening & Transcribing Doctor Voice...' : 'Microphone Ready (Click Start Speaking)'}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      Patient: <strong>{selectedPatient.name}</strong> ({selectedPatient.age}Y/{selectedPatient.gender}) &bull; Lang: <strong>{transcribeLang === 'hi-IN' ? 'Hindi (हिंदी)' : 'English (India)'}</strong>
                    </div>
                  </div>
                </div>

                {isLiveTranscribing && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: 26 }}>
                    {audioWaves.map((h, i) => (
                      <div key={i} style={{ width: 3, height: `${h}%`, background: '#16a34a', borderRadius: '2px', transition: 'height 0.15s ease' }} />
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {/* Language Toggle */}
                  <div style={{ display: 'inline-flex', background: '#e2e8f0', borderRadius: '6px', padding: '2px' }}>
                    <button
                      type="button"
                      onClick={() => setTranscribeLang('en-IN')}
                      style={{
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: 'none',
                        background: transcribeLang === 'en-IN' ? '#ffffff' : 'transparent',
                        color: transcribeLang === 'en-IN' ? '#0369a1' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      EN
                    </button>
                    <button
                      type="button"
                      onClick={() => setTranscribeLang('hi-IN')}
                      style={{
                        padding: '0.2rem 0.45rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        borderRadius: '4px',
                        border: 'none',
                        background: transcribeLang === 'hi-IN' ? '#ffffff' : 'transparent',
                        color: transcribeLang === 'hi-IN' ? '#0369a1' : '#64748b',
                        cursor: 'pointer'
                      }}
                    >
                      हिंदी
                    </button>
                  </div>

                  {!isLiveTranscribing ? (
                    <button
                      onClick={() => handleStartTranscribe()}
                      className="btn btn-primary btn-sm"
                      style={{ background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                    >
                      <Mic size={15} />
                      <span>Start Speaking</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleStopTranscribe}
                      className="btn btn-outline btn-sm"
                      style={{ color: '#dc2626', borderColor: '#fca5a5', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                    >
                      <MicOff size={15} />
                      <span>Stop Listening</span>
                    </button>
                  )}

                  <button
                    onClick={handleClearTranscript}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '0.74rem', padding: '0.35rem 0.6rem', color: '#64748b', borderColor: '#cbd5e1' }}
                    title="Clear transcript & extracted medicines"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Speech Error Banner if any */}
              {speechError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.75rem', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} color="#dc2626" />
                  <span>{speechError}</span>
                </div>
              )}

              {/* One-click voice demo presets */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
                  Quick Medical Dictation Presets (1-Click Test):
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {MEDICAL_SAMPLE_VOICES.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyVoicePreset(preset)}
                      className="btn btn-outline btn-xs"
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.55rem',
                        background: activeVoicePreset === preset.id ? '#e0f2fe' : '#ffffff',
                        borderColor: activeVoicePreset === preset.id ? '#0284c7' : '#cbd5e1',
                        color: activeVoicePreset === preset.id ? '#0369a1' : '#334155'
                      }}
                    >
                      🎙️ {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dictated Speech Transcript box */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                    Doctor's Spoken Speech Transcript (Live & Editable):
                  </label>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                    Type or speak &bull; AI extracts medicines in real-time
                  </span>
                </div>
                <textarea
                  value={liveTranscript}
                  onChange={(e) => {
                    setLiveTranscript(e.target.value);
                    const p = aiTranscribeService.parseMedicalTranscript(e.target.value);
                    if (p) {
                      setParsedAiRx(p);
                      if (p.medicines && p.medicines.length > 0) {
                        setRxMedicines(p.medicines);
                      }
                    }
                  }}
                  rows={3}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.82rem', fontFamily: 'monospace', lineHeight: 1.5 }}
                  placeholder="Doctor dictation will appear here as you speak (e.g., Tablet Paracetamol 650mg twice daily for 3 days after meals, Capsule Amoxicillin 500mg twice daily for 5 days after food)..."
                />
              </div>

              {/* Real-Time AI Formatted Rx Preview Card */}
              {parsedAiRx && (
                <div style={{ background: '#f8fafc', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', fontWeight: 800, color: '#0369a1' }}>
                      <Wand2 size={16} color="#0284c7" />
                      <span>AI Extracted Medications ({parsedAiRx.medicines?.length || 0}):</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', background: '#dcfce7', color: '#166534', padding: '0.15rem 0.55rem', borderRadius: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={12} />
                      <span>Medicine &bull; Days &bull; Timings</span>
                    </span>
                  </div>

                  {(!parsedAiRx.medicines || parsedAiRx.medicines.length === 0) ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', background: '#ffffff', borderRadius: '6px', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: '0.8rem' }}>
                      <Pill size={22} color="#94a3b8" style={{ marginBottom: '0.35rem', display: 'inline-block' }} />
                      <div>No medicines detected yet. Speak or type medicine name, duration (days), and timings above.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      {parsedAiRx.medicines.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '0.65rem 0.85rem',
                            display: 'grid',
                            gridTemplateColumns: 'minmax(180px, 1.3fr) minmax(130px, 0.9fr) minmax(200px, 1.5fr) 36px',
                            alignItems: 'center',
                            gap: '0.75rem',
                            fontSize: '0.78rem'
                          }}
                        >
                          {/* 1. Medicine Name & Type */}
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <span style={{ fontWeight: 800, color: '#0f172a' }}>{idx + 1}. {m.name}</span>
                              <span style={{ fontSize: '0.65rem', background: '#f1f5f9', color: '#475569', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 700 }}>
                                {m.type}
                              </span>
                            </div>
                            <div style={{ color: '#0284c7', fontSize: '0.7rem', fontWeight: 700 }}>
                              Dosage: {m.dosage}
                            </div>
                          </div>

                          {/* 2. For How Many Days */}
                          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '0.35rem 0.55rem' }}>
                            <div style={{ fontSize: '0.65rem', color: '#166534', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Calendar size={11} />
                              <span>HOW MANY DAYS:</span>
                            </div>
                            <div style={{ fontWeight: 800, color: '#15803d', fontSize: '0.8rem' }}>
                              {m.duration}
                            </div>
                          </div>

                          {/* 3. At What Timings to Take */}
                          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '6px', padding: '0.35rem 0.55rem' }}>
                            <div style={{ fontSize: '0.65rem', color: '#0369a1', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={11} />
                              <span>INTAKE TIMINGS:</span>
                            </div>
                            <div style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.78rem' }}>
                              {m.timing || m.frequency}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                              {m.instructions}
                            </div>
                          </div>

                          {/* Remove button */}
                          <div style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveTranscribedMed(idx)}
                              style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: '0.25rem', borderRadius: '4px' }}
                              title="Remove this medicine"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '0.73rem', color: '#0369a1', background: '#eff6ff', border: '1px solid #dbeafe', padding: '0.45rem 0.75rem', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>
                      <strong>Patient Diagnosis:</strong> {rxDiagnosis || selectedPatient.problem || selectedPatient.symptoms || 'OPD Consultation'}
                    </span>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                      Extracted strictly: <strong>Medicine &bull; Days &bull; Timings</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={() => setShowTranscribeModal(false)} className="btn btn-secondary btn-sm">
                Close
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setShowTranscribeModal(false);
                    setActiveTab('prescribe');
                    addToast('Prescription loaded into builder studio', 'info');
                  }}
                  className="btn btn-outline btn-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <span>Load into Prescribe Studio</span>
                  <ArrowRight size={14} />
                </button>

                <button
                  onClick={handleDirectSendFromTranscribe}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#16a34a', borderColor: '#15803d', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Send size={14} />
                  <span>Direct Issue & Send to Patient</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🚨 FLOATING INCOMING TELECONSULTATION CALL MODAL (REAL-TIME BROADCAST) */}
      {incomingCallBroadcast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            width: '430px',
            maxWidth: 'calc(100vw - 32px)',
            background: 'linear-gradient(145deg, #090d16 0%, #0f172a 100%)',
            border: '2.5px solid #22c55e',
            borderRadius: '16px',
            boxShadow: '0 20px 45px -5px rgba(0, 0, 0, 0.7), 0 0 30px rgba(34, 197, 94, 0.45)',
            color: '#ffffff',
            padding: '1.25rem',
            animation: 'pulse 1.8s infinite'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: '#16a34a',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'bounce 1s infinite',
                  flexShrink: 0
                }}
              >
                <PhoneCall size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  🚨 INCOMING TELECONSULTATION
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc' }}>
                  {incomingCallBroadcast.patientName}
                </div>
              </div>
            </div>

            <button
              onClick={() => handleDeclineIncomingCall(incomingCallBroadcast.id)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                borderRadius: '50%',
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>

          {/* Patient Details & Chief Complaint */}
          <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '0.75rem', marginBottom: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>
                {incomingCallBroadcast.patientAge} Yrs &bull; {incomingCallBroadcast.patientGender}
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                📍 {incomingCallBroadcast.patientVillage || 'Rural Tele-SubCentre'}
              </span>
            </div>

            <div style={{ marginTop: '0.45rem', fontSize: '0.82rem', color: '#fef08a', fontWeight: 700, lineHeight: 1.4 }}>
              Chief Complaint: <span style={{ color: '#ffffff', fontWeight: 500 }}>{incomingCallBroadcast.symptoms}</span>
            </div>

            <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#38bdf8', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                {incomingCallBroadcast.callMode === 'video' ? '📹 Video Request' : '📞 Audio Request'}
              </span>
              <span style={{ fontSize: '0.65rem', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', padding: '2px 7px', borderRadius: '4px', fontWeight: 800 }}>
                Direct On-Demand &bull; No Token Needed
              </span>
            </div>
          </div>

          {/* First-to-Accept Notice or Claim Banner */}
          {callClaimNotice ? (
            <div style={{ background: '#fef3c7', color: '#92400e', padding: '0.6rem 0.85rem', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 800, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} />
              <span>{callClaimNotice}</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.72rem', color: '#cbd5e1', marginBottom: '0.85rem', background: 'rgba(255,255,255,0.06)', padding: '0.45rem 0.65rem', borderRadius: '6px' }}>
              ⚡ <strong>Real-time Broadcast:</strong> This call is ringing on all available General Doctors' portals. The first doctor to accept locks the call.
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              onClick={() => handleAcceptIncomingCall(incomingCallBroadcast.id)}
              disabled={!!callClaimNotice}
              style={{
                flex: 1,
                background: callClaimNotice ? '#64748b' : 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem',
                fontWeight: 900,
                fontSize: '0.85rem',
                cursor: callClaimNotice ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)'
              }}
            >
              <Check size={16} />
              <span>⚡ Accept & Connect Now</span>
            </button>

            <button
              onClick={() => handleDeclineIncomingCall(incomingCallBroadcast.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer'
              }}
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* 🚑 DOCTOR STAFF DISPATCH & HOME INJECTION DESK MODAL */}
      <DoctorStaffDispatchModal
        isOpen={showStaffDispatchModal}
        onClose={() => setShowStaffDispatchModal(false)}
        activeRequests={activeStaffRequests}
        language={language}
      />

      {/* 👩‍⚕️ DOCTOR ASHA FIELD TRIAGE & TELE-CONSULTATION DESK MODAL */}
      <DoctorAshaRequestsModal
        isOpen={showAshaRequestsModal}
        onClose={() => setShowAshaRequestsModal(false)}
        onSelectPatientForRx={(req) => {
          setDoctorView('prescribe');
          setActiveTab('prescribe');
          setRxDiagnosis(req.symptoms || 'Acute Upper Respiratory Tract Infection (Mild Viral Bronchitis)');
          addToast(`Loaded ${req.patientName} into prescription workbench`, 'info');
        }}
        onSelectPatientForReferral={(req) => {
          setShowReferralModal(true);
          setReferralStudioTab('new_referral');
          setReferRemarks(`Referred from ASHA field triage (${req.triageCategory}): ${req.symptoms}. Submitted by ASHA ${req.ashaName}.`);
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 1: FOLLOW-UP CONSULTATION & CONFIRM COMPLETE PATIENT CHECKUP
      ═══════════════════════════════════════════════════════════════════ */}
      {confirmCompletePatient && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setConfirmCompletePatient(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '1.6rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              animation: 'scaleIn 0.18s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.15rem' }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '14px',
                  backgroundColor: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.25)'
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {tr('Follow-Up & Complete Checkup', 'फॉलो-अप व मरीज जांच पूर्ण करें', 'पुढील तपासणी व रुग्ण तपासणी पूर्ण करा')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                  {tr(
                    'Schedule follow-up date, conclude consultation, and advance queue',
                    'फॉलो-अप की तारीख तय करें, परामर्श समाप्त करें व कतार में आगे बढ़ें',
                    'पुढील तपासणीची तारीख ठरवा, सल्लामसलत समाप्त करा व रांगेत पुढे जा'
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmCompletePatient(null)}
                style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Current Patient Summary Card */}
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1.5px solid #e2e8f0',
                padding: '0.9rem 1.15rem',
                marginBottom: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>
                  {confirmCompletePatient.name}
                  {confirmCompletePatient.nameHindi && (
                    <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}> ({confirmCompletePatient.nameHindi})</span>
                  )}
                </div>
                <span
                  style={{
                    background: '#0284c7',
                    color: 'white',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '999px',
                    fontWeight: 800,
                    fontSize: '0.78rem'
                  }}
                >
                  Token #{Number(confirmCompletePatient.tokenNumber || String(confirmCompletePatient.token || '').replace(/\D/g, '')) || 35}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <span>Age: <strong>{confirmCompletePatient.age}Y</strong></span>
                <span>&bull;</span>
                <span>Gender: <strong>{confirmCompletePatient.gender}</strong></span>
                <span>&bull;</span>
                <span>Village: <strong>{confirmCompletePatient.village}</strong></span>
                <span>&bull;</span>
                <span>ABHA: <strong>{confirmCompletePatient.abhaId}</strong></span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.45rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#334155' }}>
                  <strong>Diagnosis:</strong> {rxDiagnosis || confirmCompletePatient.diagnosis || 'Upper Respiratory Tract Infection'}
                </div>
                {lastGeneratedRx && (
                  <button
                    type="button"
                    onClick={() => setShowOfficialRxModal(true)}
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: '0.74rem', color: '#0284c7', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                  >
                    <FileText size={12} />
                    <span>View Prescribed Rx ({lastGeneratedRx.id})</span>
                  </button>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                QUESTION: IS FOLLOW-UP REQUIRED?
            ═══════════════════════════════════════════════════════════ */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
                {tr('Is Follow-Up Consultation Required for This Patient?', 'क्या इस मरीज़ के लिए फॉलो-अप परामर्श आवश्यक है?', 'या रुग्णासाठी पुढील तपासणी आवश्यक आहे का?')}
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                {/* Option 1: Yes Follow-Up Required */}
                <div
                  onClick={() => setIsFollowUpRequired(true)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: isFollowUpRequired ? '2px solid #16a34a' : '1.5px solid #cbd5e1',
                    background: isFollowUpRequired ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <input
                      type="radio"
                      checked={isFollowUpRequired}
                      onChange={() => setIsFollowUpRequired(true)}
                      style={{ accentColor: '#16a34a', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: isFollowUpRequired ? '#166534' : '#1e293b' }}>
                      {tr('Yes, Follow-Up Required', 'हाँ, फॉलो-अप आवश्यक है', 'होय, पुढील तपासणी आवश्यक आहे')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: isFollowUpRequired ? '#15803d' : '#64748b', paddingLeft: '1.4rem' }}>
                    {tr('Patient will be scheduled & sent to Follow-Ups roster', 'मरीज़ को फॉलो-अप सूची में दर्ज किया जाएगा', 'रुग्णाचा पुढील तपासणीच्या यादीत समावेश होईल')}
                  </span>
                </div>

                {/* Option 2: No Follow-Up Required */}
                <div
                  onClick={() => setIsFollowUpRequired(false)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    border: !isFollowUpRequired ? '2px solid #64748b' : '1.5px solid #cbd5e1',
                    background: !isFollowUpRequired ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <input
                      type="radio"
                      checked={!isFollowUpRequired}
                      onChange={() => setIsFollowUpRequired(false)}
                      style={{ accentColor: '#64748b', cursor: 'pointer' }}
                    />
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: !isFollowUpRequired ? '#1e293b' : '#64748b' }}>
                      {tr('No Follow-Up Needed', 'फॉलो-अप की आवश्यकता नहीं', 'पुढील तपासणीची गरज नाही')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', paddingLeft: '1.4rem' }}>
                    {tr('Routine single visit concluded. Complete checkup only.', 'आज ही जांच पूर्ण। केवल परामर्श समाप्त करें।', 'आजच तपासणी पूर्ण. केवळ सल्लामसलत समाप्त.')}
                  </span>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════
                IF YES: DATE PICKER & CLINICAL INSTRUCTIONS
            ═══════════════════════════════════════════════════════════ */}
            {isFollowUpRequired && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1.15rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 800, color: '#166534', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={16} color="#16a34a" />
                    <span>{tr('On Which Date Should Patient Follow Up?', 'मरीज़ को किस तारीख को फॉलो-अप के लिए आना चाहिए?', 'रुग्णाने कोणत्या तारखेला पुढील तपासणीसाठी यावे?')}</span>
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                    {new Date(followUpDate).toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-GB', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Quick select duration pills */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                  {[
                    { label: '+3 Days', days: 3 },
                    { label: '+5 Days', days: 5 },
                    { label: '+1 Week (7D)', days: 7 },
                    { label: '+2 Weeks (14D)', days: 14 },
                    { label: '+1 Month (30D)', days: 30 }
                  ].map((p) => {
                    const pillDate = getFutureDateStr(p.days);
                    const isSelected = followUpDate === pillDate;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setFollowUpDate(pillDate)}
                        style={{
                          padding: '0.25rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          border: isSelected ? '1.5px solid #16a34a' : '1px solid #cbd5e1',
                          background: isSelected ? '#16a34a' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>

                {/* Date Input */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: '1.5px solid #86efac',
                      background: '#ffffff',
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: '#0f172a',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Follow-Up Clinical Instruction */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#166534', marginBottom: '0.3rem' }}>
                    {tr('Follow-Up Instructions / Review Objective:', 'फॉलो-अप निर्देश / समीक्षा का उद्देश्य:', 'पुढील तपासणीच्या सूचना / उद्दिष्ट:')}
                  </label>
                  <input
                    type="text"
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder={tr('E.g. Review fever resolution, assess BP response, repeat chest auscultation', 'उदा. बुखार कम हुआ या नहीं जांचें, बीपी व सीने की जांच दोहराएं', 'उदा. ताप कमी झाला का तपासा, बीपी तपासा')}
                    style={{
                      width: '100%',
                      padding: '0.45rem 0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #86efac',
                      fontSize: '0.8rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            )}

            {/* Doctor's Closing Remarks */}
            <div style={{ marginBottom: '1.15rem' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                {tr("Doctor's Closing Remarks / Notes (Optional):", 'डॉक्टर के अंतिम निर्देश / नोट्स (वैकल्पिक):', 'डॉक्टरांच्या अंतिम सूचना / नोंदी (पर्यायी):')}
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="E.g. Vitals stabilized. Advised 5-day course of medications, hydration, and review on scheduled date."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '0.82rem',
                  resize: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Action Guarantee Banner */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '1.15rem', fontSize: '0.76rem', color: '#475569' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.2rem' }}>
                <ShieldCheck size={15} color="#16a34a" />
                <span>Workflow execution on completion:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.15rem', lineHeight: 1.45 }}>
                <li>Mark patient checkup as <strong>Completed</strong> & advance active OPD queue.</li>
                {isFollowUpRequired ? (
                  <li>Schedule follow-up on <strong>{followUpDate}</strong> & add patient directly to <strong>Follow-Ups</strong>.</li>
                ) : (
                  <li>Single routine checkup concluded (no follow-up scheduled).</li>
                )}
                <li>All patient medical records and prescriptions are permanently preserved.</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setConfirmCompletePatient(null);
                  setCompletionNotes('');
                }}
                className="btn btn-outline btn-sm"
                style={{
                  padding: '0.55rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: 700,
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                {tr('Cancel', 'रद्द करें', 'रद्द करा')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCompleteCheckup}
                className="btn btn-success btn-sm"
                style={{
                  background: isFollowUpRequired
                    ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                    : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  fontWeight: 800,
                  padding: '0.6rem 1.4rem',
                  borderRadius: '8px',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(22, 163, 74, 0.35)',
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                <CheckCircle2 size={17} />
                <span>
                  {isFollowUpRequired
                    ? tr('✓ Complete Checkup & Send to Follow-Ups', '✓ जांच पूर्ण करें व फॉलो-अप में भेजें', '✓ तपासणी पूर्ण करा व पुढील यादीत जोडा')
                    : tr('✓ Complete Checkup (No Follow-Up)', '✓ जांच पूर्ण करें (फॉलो-अप नहीं)', '✓ तपासणी पूर्ण करा (पुढील तपासणी नाही)')}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 2: 4. CHECKUP COMPLETE HISTORY
      ═══════════════════════════════════════════════════════════════════ */}
      {showCompletedModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={() => setShowCompletedModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '1.25rem 1.6rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '14px',
                    backgroundColor: '#16a34a',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}
                >
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#166534' }}>
                    {tr('4. Checkup Complete History', '४. पूर्ण जांच इतिहास', '४. पूर्ण तपासणी इतिहास')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#15803d' }}>
                    {completedCheckups.length} Patient Consultation{completedCheckups.length === 1 ? '' : 's'} Completed &bull; Medical Records Intact & Archived
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCompletedModal(false)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: 36,
                  height: 36,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Search / Filter Bar */}
            <div style={{ padding: '0.85rem 1.6rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                <Search size={15} style={{ position: 'absolute', left: 12, top: 11, color: '#94a3b8' }} />
                <input
                  type="text"
                  placeholder="Search completed patients by name, token, village, or diagnosis..."
                  value={completedSearchQuery}
                  onChange={(e) => setCompletedSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem 0.5rem 2.2rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>
                {filteredCompletedList.length} of {completedCheckups.length} Records
              </div>
            </div>

            {/* List Body */}
            <div style={{ padding: '1.25rem 1.6rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {filteredCompletedList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: '#94a3b8' }}>
                  <CheckCircle2 size={54} color="#cbd5e1" style={{ margin: '0 auto 1rem auto' }} />
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#475569' }}>
                    {completedCheckups.length === 0 ? 'No completed checkups recorded yet' : 'No records match search'}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: '#94a3b8', maxWidth: '440px', margin: '0.45rem auto 0 auto', lineHeight: 1.5 }}>
                    {completedCheckups.length === 0
                      ? 'When you examine patients in the Current Patient workbench and click "✓ Complete Checkup", their records, diagnosis, and visit summaries will be preserved here.'
                      : 'Try adjusting your search keywords.'}
                  </p>
                </div>
              ) : (
                filteredCompletedList.map((record) => (
                  <div
                    key={record.id}
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      flexWrap: 'wrap',
                      boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                      <div
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: '12px',
                          background: '#dcfce7',
                          color: '#15803d',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.1rem'
                        }}
                      >
                        #{Number(record.tokenNumber || String(record.token || '').replace(/\D/g, '')) || 35}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '1.02rem', color: '#0f172a' }}>
                            {record.name}
                          </span>
                          {record.nameHindi && (
                            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                              ({record.nameHindi})
                            </span>
                          )}
                          <span
                            style={{
                              background: '#dcfce7',
                              color: '#166534',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.55rem',
                              borderRadius: '999px'
                            }}
                          >
                            ✓ Checkup Completed
                          </span>
                          {record.followUpDate && (
                            <span
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                padding: '0.15rem 0.55rem',
                                borderRadius: '999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Calendar size={11} />
                              <span>Follow-Up: {record.followUpDate}</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>
                          {record.age}Y &bull; {record.gender} &bull; {record.village} &bull; ABHA: {record.abhaId}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.35rem' }}>
                          <strong>Diagnosis:</strong> {record.diagnosis} &bull; <span style={{ color: '#64748b' }}>Completed at {record.completedAt} ({record.completedDate})</span>
                        </div>
                        {record.doctorNotes && (
                          <div style={{ fontSize: '0.76rem', color: '#475569', fontStyle: 'italic', marginTop: '0.25rem' }}>
                            &ldquo;{record.doctorNotes}&rdquo;
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => setViewCompletedPatientRecord(record)}
                        className="btn btn-sm btn-outline"
                        style={{
                          borderColor: '#cbd5e1',
                          color: '#0284c7',
                          fontWeight: 800,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          borderRadius: '8px',
                          padding: '0.45rem 0.9rem',
                          cursor: 'pointer'
                        }}
                      >
                        <ClipboardList size={15} />
                        <span>View Full Medical Record</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MODAL 3: FULL MEDICAL RECORD VIEWER (VERIFIES ZERO DATA LOSS)
      ═══════════════════════════════════════════════════════════════════ */}
      {viewCompletedPatientRecord && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            padding: '1rem'
          }}
          onClick={() => setViewCompletedPatientRecord(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              animation: 'scaleIn 0.2s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
                borderTopLeftRadius: '16px',
                borderTopRightRadius: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '12px',
                    backgroundColor: '#0284c7',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    {viewCompletedPatientRecord.name} &bull; Complete Medical Record
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>
                    Token #{Number(viewCompletedPatientRecord.tokenNumber || String(viewCompletedPatientRecord.token || '').replace(/\D/g, '')) || 35} &bull; ABHA: {viewCompletedPatientRecord.abhaId} &bull; Permanent Clinical Archive
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewCompletedPatientRecord(null)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Preserved Status Notice */}
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="#16a34a" />
                <span><strong>Medical Record Preserved:</strong> Patient completed checkup on {viewCompletedPatientRecord.completedDate} at {viewCompletedPatientRecord.completedAt}. All clinical records, vitals, and notes are securely preserved.</span>
              </div>

              {/* Vitals Summary */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Recorded Vitals & Telemetry
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>BLOOD PRESSURE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0284c7' }}>{viewCompletedPatientRecord.vitals?.bp || '120/80 mmHg'}</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>PULSE RATE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>{viewCompletedPatientRecord.vitals?.pulse || '76 bpm'}</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>OXYGEN SPO2</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#16a34a' }}>{viewCompletedPatientRecord.vitals?.spo2 || '98%'}</div>
                  </div>
                  <div style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700 }}>TEMPERATURE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#d97706' }}>{viewCompletedPatientRecord.vitals?.temp || '98.6°F'}</div>
                  </div>
                </div>
              </div>

              {/* Diagnosis & Notes */}
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                  Diagnosis & Doctor's Closing Directives
                </h4>
                <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                  {viewCompletedPatientRecord.diagnosis}
                </div>
                {viewCompletedPatientRecord.doctorNotes && (
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: '0.35rem', fontStyle: 'italic' }}>
                    &ldquo;{viewCompletedPatientRecord.doctorNotes}&rdquo;
                  </div>
                )}
              </div>

              {/* Follow-Up Status */}
              {viewCompletedPatientRecord.followUpDate ? (
                <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '10px', padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} color="#16a34a" />
                  <div>
                    <div style={{ fontWeight: 800 }}>
                      Follow-Up Scheduled: {viewCompletedPatientRecord.followUpDate}
                    </div>
                    {viewCompletedPatientRecord.followUpInstructions && (
                      <div style={{ fontSize: '0.78rem', color: '#15803d', marginTop: '2px' }}>
                        Instructions: &ldquo;{viewCompletedPatientRecord.followUpInstructions}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.65rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>
                  Single consultation concluded &bull; No follow-up scheduled.
                </div>
              )}

              {/* Chronic conditions & Allergies */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>CHRONIC CONDITIONS</div>
                  <div style={{ fontSize: '0.82rem', color: '#0f172a' }}>
                    {viewCompletedPatientRecord.history?.chronicConditions || 'None diagnosed'}
                  </div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: '0.25rem' }}>ALLERGIES</div>
                  <div style={{ fontSize: '0.82rem', color: '#b91c1c', fontWeight: 700 }}>
                    {viewCompletedPatientRecord.history?.allergies?.join ? viewCompletedPatientRecord.history.allergies.join(', ') : viewCompletedPatientRecord.history?.allergies || 'No known drug allergies (NKDA)'}
                  </div>
                </div>
              </div>

              {/* Past Treatments & Lab Reports */}
              {viewCompletedPatientRecord.history?.pastTreatments && viewCompletedPatientRecord.history.pastTreatments.length > 0 && (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                    Past Treatments ({viewCompletedPatientRecord.history.pastTreatments.length})
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {viewCompletedPatientRecord.history.pastTreatments.map((t, idx) => (
                      <div key={idx} style={{ background: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a' }}>
                          <span>{t.diagnosis}</span>
                          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>{t.date} &bull; {t.doctor}</span>
                        </div>
                        <div style={{ color: '#475569', fontSize: '0.76rem', marginTop: '0.15rem' }}>{t.treatment}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
