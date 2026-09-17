import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Phone,
  PhoneCall,
  Activity,
  User,
  CheckCircle,
  FileText,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Stethoscope,
  RefreshCw,
  X,
  Radio,
  Sparkles,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { teleconsultService } from '../services/teleconsultService';
import { webrtcService } from '../services/webrtcService';
import { INITIAL_PATIENT } from '../data/mockData';

export const Consultation = ({ onNavigate }) => {
  const { addToast } = useNotifications();
  const { language, tr, t } = useLanguage();
  const { user } = useAuth();

  const patientProfile = user || INITIAL_PATIENT;

  // View States: 'idle' (Lobby / Request) | 'calling' (Broadcasting / Ringing) | 'on_hold' (Waiting Pool) | 'active' (In Call) | 'ended' (Completed)
  const [callState, setCallState] = useState('idle');
  const [activeCallRecord, setActiveCallRecord] = useState(null);

  // Form Inputs
  const [symptomsInput, setSymptomsInput] = useState('Mild fever, headache and throat irritation since morning');
  const [callMode, setCallMode] = useState('video'); // 'video' | 'audio'

  // Connected Doctors & Availability stats
  const [availableDocsCount, setAvailableDocsCount] = useState(() => teleconsultService.getAvailableDoctorsCount());
  const [waitingPoolCount, setWaitingPoolCount] = useState(() => teleconsultService.getWaitingPool().length);
  const [doctorsList, setDoctorsList] = useState(() => teleconsultService.getDoctors());

  // In-Call state
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [callingSeconds, setCallingSeconds] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMsg, setInputMsg] = useState('');

  // WebRTC Real-Time Hardware Camera Refs & States
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const webrtcSessionRef = useRef(null);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);
  const [hasLocalVideo, setHasLocalVideo] = useState(false);
  const [cameraNotice, setCameraNotice] = useState('');

  const activeCallRecordRef = useRef(activeCallRecord);
  activeCallRecordRef.current = activeCallRecord;

  // Synchronize with teleconsultService events
  useEffect(() => {
    const handleStateChange = () => {
      setAvailableDocsCount(teleconsultService.getAvailableDoctorsCount());
      setWaitingPoolCount(teleconsultService.getWaitingPool().length);
      setDoctorsList(teleconsultService.getDoctors());
    };

    const handleCallAccepted = (e) => {
      const { call, doctor, callId } = e.detail || {};
      const currentCall = activeCallRecordRef.current;
      const targetId = call?.id || callId;
      if (currentCall && (currentCall.id === targetId || !targetId || currentCall.patientId === (call?.patientId || patientProfile.id))) {
        setActiveCallRecord(call || currentCall);
        setCallState('active');
        setCallDuration(0);
        setChatMessages([
          {
            sender: 'doctor',
            text: `Namaste ${patientProfile.name}. I am ${doctor?.name || 'Dr. Anjali Mehta'} from ${doctor?.facility || 'PHC Telemedicine'}. I have accepted your instant teleconsultation request. How are you feeling right now?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        addToast(`Connected with ${doctor?.name || 'Doctor'}! Starting consultation...`, 'success');
      }
    };

    const handleCallEnded = (e) => {
      const currentCall = activeCallRecordRef.current;
      const isTargetCall = !e.detail?.callId || e.detail?.callId === 'all' || !currentCall || currentCall.id === e.detail?.callId;
      if (isTargetCall) {
        if (webrtcSessionRef.current) {
          try {
            webrtcSessionRef.current.destroy();
          } catch (err) {}
          webrtcSessionRef.current = null;
        }
        setCallState('ended');
        setHasRemoteVideo(false);
        setHasLocalVideo(false);
        addToast('Doctor concluded teleconsultation session. Digital prescription ready.', 'info');
      }
    };

    window.addEventListener('teleconsult_state_change', handleStateChange);
    window.addEventListener('teleconsult_call_accepted', handleCallAccepted);
    window.addEventListener('teleconsult_call_ended', handleCallEnded);

    return () => {
      window.removeEventListener('teleconsult_state_change', handleStateChange);
      window.removeEventListener('teleconsult_call_accepted', handleCallAccepted);
      window.removeEventListener('teleconsult_call_ended', handleCallEnded);
    };
  }, [patientProfile.name, patientProfile.id, addToast]);

  // Calling timer simulation & live acceptance sync
  useEffect(() => {
    let timer;
    let pollInterval;
    if (callState === 'calling') {
      timer = setInterval(() => {
        setCallingSeconds((prev) => prev + 1);
      }, 1000);

      // Real-time synchronization check: see if doctor accepted the call
      pollInterval = setInterval(() => {
        const state = teleconsultService.getStateSync();
        const currentCall = activeCallRecordRef.current;
        const acceptedCall = state.activeCalls?.find(c => (currentCall && c.id === currentCall.id) || c.patientId === patientProfile.id);
        if (acceptedCall && acceptedCall.status === 'accepted') {
          setActiveCallRecord(acceptedCall);
          setCallState('active');
          setCallDuration(0);
          setChatMessages([
            {
              sender: 'doctor',
              text: `Namaste ${patientProfile.name}. I am ${acceptedCall.acceptedBy?.name || 'Dr. Anjali Mehta'} from ${acceptedCall.acceptedBy?.facility || 'PHC Telemedicine'}. I have accepted your instant teleconsultation request. How are you feeling right now?`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          addToast(`Connected with ${acceptedCall.acceptedBy?.name || 'Doctor'}! Starting consultation...`, 'success');
        }
      }, 1000);
    } else {
      setCallingSeconds(0);
    }
    return () => {
      clearInterval(timer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [callState, patientProfile.id, patientProfile.name, addToast]);

  // WebRTC Real Camera Session for Active Video Consultation
  useEffect(() => {
    if (callState === 'active' && activeCallRecord?.id) {
      let isMounted = true;
      setCameraNotice('Accessing your camera & connecting with doctor...');

      const session = webrtcService.createSession({
        callId: activeCallRecord.id,
        isInitiator: false, // Patient is Answerer; Doctor initiates WebRTC Offer
        onLocalStream: (stream) => {
          if (!isMounted) return;
          setHasLocalVideo(true);
          setCameraNotice('');
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        },
        onRemoteStream: (stream) => {
          if (!isMounted) return;
          setHasRemoteVideo(true);
          setCameraNotice('');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            remoteVideoRef.current.muted = false;
            remoteVideoRef.current.volume = 1.0;
            remoteVideoRef.current.play().catch((e) => console.warn('[Patient Remote Video Play Note]', e));
          }
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = stream;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch((e) => console.warn('[Patient Remote Audio Play Note]', e));
          }
        },
        onStatusChange: (status) => {
          // console.log('[Patient WebRTC State]', status);
        }
      });

      webrtcSessionRef.current = session;
      session.initialize().catch((err) => {
        if (!isMounted) return;
        console.warn('[WebRTC Error]', err);
        setCameraNotice('Camera permission required. Please allow camera in browser to enable real video.');
        addToast('Please allow camera access for live video consultation.', 'warning');
      });

      return () => {
        isMounted = false;
        session.destroy();
        webrtcSessionRef.current = null;
        setHasRemoteVideo(false);
        setHasLocalVideo(false);
      };
    }
  }, [callState, activeCallRecord?.id, addToast]);

  // Active call duration timer
  useEffect(() => {
    let timer;
    if (callState === 'active') {
      timer = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Request Instant Call
  const handleRequestCall = async () => {
    if (!symptomsInput.trim()) {
      addToast('Please enter brief symptoms or reason for consultation.', 'warning');
      return;
    }

    try {
      const call = await teleconsultService.requestInstantTeleconsult({
        patient: patientProfile,
        symptoms: symptomsInput.trim(),
        callMode
      });

      setActiveCallRecord(call);

      if (call.status === 'ringing') {
        setCallState('calling');
        addToast('Ringing available General Doctors...', 'info');
      } else if (call.status === 'waiting_pool') {
        setCallState('on_hold');
        addToast('All doctors currently in OPD exams. You are placed in priority waiting pool.', 'warning');
      }
    } catch (err) {
      addToast('Failed to request call: ' + err.message, 'error');
    }
  };

  // Cancel Request
  const handleCancelRequest = async () => {
    if (activeCallRecord) {
      await teleconsultService.cancelRequest(activeCallRecord.id);
    }
    setActiveCallRecord(null);
    setCallState('idle');
    addToast('Teleconsultation request cancelled.', 'info');
  };

  // End Call
  const handleEndCall = async () => {
    if (webrtcSessionRef.current) {
      try {
        webrtcSessionRef.current.destroy();
      } catch (err) {}
      webrtcSessionRef.current = null;
    }
    const callRec = activeCallRecord || activeCallRecordRef.current;
    if (callRec?.id) {
      await teleconsultService.endCall(
        callRec.id,
        callRec.acceptedBy?.id || 'DOC-01'
      );
    } else {
      cloudSyncService.publish('teleconsult_call_ended', { callId: 'all' });
    }
    setCallState('ended');
    setHasRemoteVideo(false);
    setHasLocalVideo(false);
    addToast('Teleconsultation ended. Proceeding to digital prescription view.', 'success');
  };

  const handleToggleMic = () => {
    const next = !micEnabled;
    setMicEnabled(next);
    if (webrtcSessionRef.current) {
      webrtcSessionRef.current.toggleAudio(next);
    }
  };

  const handleToggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (webrtcSessionRef.current) {
      webrtcSessionRef.current.toggleVideo(next);
    }
  };

  // Chat message send
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;
    const newMsg = {
      sender: 'patient',
      text: inputMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setInputMsg('');

    // Simulated doctor response
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'doctor',
          text: `I have noted that. I will add Paracetamol 650mg and Cetirizine into your digital e-prescription with exact timings.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  const quickSymptoms = [
    { en: 'Fever & Body Ache', hi: 'बुखार और बदन दर्द', mr: 'ताप आणि अंगदुखी' },
    { en: 'Dry Cough & Cold', hi: 'सूखी खांसी और जुकाम', mr: 'कोरडा खोकला आणि सर्दी' },
    { en: 'Throat Pain', hi: 'गले में खराश / दर्द', mr: 'घसा दुखणे / खवखव' },
    { en: 'Stomach Ache / Acidity', hi: 'पेट दर्द / एसिडिटी', mr: 'पोटदुखी / ऍसिडिटी' },
    { en: 'Headache & Weakness', hi: 'सिरदर्द और कमजोरी', mr: 'डोकेदुखी आणि अशक्तपणा' },
    { en: 'Skin Rash / Allergy', hi: 'त्वचा पर चकत्ते / एलर्जी', mr: 'त्वचेवर पुरळ / ऍलर्जी' }
  ];

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: '2.5rem' }}>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', fontWeight: 800 }}>
              <Video size={28} color="#059669" />
              <span>{tr('General Doctor Teleconsultation Hub', 'सामान्य डॉक्टर टेलीकंसल्टेशन केंद्र', 'सामान्य डॉक्टर टेलीकन्सल्टेशन केंद्र')}</span>
            </h1>
          </div>

          {/* Real-Time Doctor Availability Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                background: availableDocsCount > 0 ? '#ecfdf5' : '#fef3c7',
                border: `1.5px solid ${availableDocsCount > 0 ? '#10b981' : '#f59e0b'}`,
                borderRadius: '999px',
                padding: '0.4rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: availableDocsCount > 0 ? '#065f46' : '#92400e'
              }}
            >
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: '50%',
                  background: availableDocsCount > 0 ? '#10b981' : '#f59e0b',
                  boxShadow: availableDocsCount > 0 ? '0 0 0 3px rgba(16, 185, 129, 0.25)' : 'none'
                }}
              />
              <span>
                {availableDocsCount > 0
                  ? tr(`${availableDocsCount} General Doctors Online & Free`, `${availableDocsCount} सामान्य डॉक्टर ऑनलाइन व उपलब्ध`, `${availableDocsCount} सामान्य डॉक्टर ऑनलाइन आणि उपलब्ध`)
                  : tr('All Doctors Currently in Physical OPD Exams', 'सभी डॉक्टर अभी ओपीडी जांच में व्यस्त हैं', 'सर्व डॉक्टर सध्या ओपीडी तपासणीत व्यस्त आहेत')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STATE 1: IDLE - DIRECT CALL REQUEST CONSOLE (NO APPOINTMENT)  */}
      {/* ------------------------------------------------------------- */}
      {callState === 'idle' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left: Call Request Form */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ width: 40, height: 40, borderRadius: '10px', background: '#dcfce7', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneCall size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                  {tr('Request Instant Teleconsultation', 'त्वरित टेलीकंसल्टेशन का अनुरोध करें', 'त्वरित टेलीकन्सल्टेशनची विनंती करा')}
                </h3>
              </div>
            </div>

            {/* Patient Info Card */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>{tr('Patient Details', 'मरीज का विवरण', 'रुग्णाचा तपशील')}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                  {patientProfile.name} ({patientProfile.age} Y / {patientProfile.gender})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  ABHA: {patientProfile.abhaId} &bull; {tr('Village:', 'गांव:', 'गाव:')} {patientProfile.village}
                </div>
              </div>
              <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: 700 }}>
                {tr('Verified Profile', 'सत्यापित प्रोफाइल', 'सत्यापित प्रोफाइल')}
              </span>
            </div>

            {/* Symptoms Input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                {tr('Reason for Consultation / Symptoms:', 'परामर्श का कारण / लक्षण:', 'सल्ल्याचे कारण / लक्षणे:')}
              </label>
              <textarea
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                rows={3}
                className="form-input"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', boxSizing: 'border-box' }}
                placeholder={tr('Describe what symptoms you have (e.g. fever, headache, cold, nausea)...', 'अपने लक्षण लिखें (उदा. बुखार, सिरदर्द, सर्दी, उल्टी)...', 'तुमची लक्षणे लिहा (उदा. ताप, डोकेदुखी, सर्दी, मळमळ)...')}
              />

              {/* Quick symptom tags */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {quickSymptoms.map((symObj) => {
                  const symLabel = tr(symObj.en, symObj.hi, symObj.mr);
                  return (
                    <button
                      key={symObj.en}
                      type="button"
                      onClick={() => setSymptomsInput(symLabel)}
                      style={{
                        background: symptomsInput === symLabel ? '#dcfce7' : '#f1f5f9',
                        borderColor: symptomsInput === symLabel ? '#16a34a' : '#cbd5e1',
                        color: symptomsInput === symLabel ? '#166534' : '#475569',
                        borderRadius: '999px',
                        padding: '0.25rem 0.65rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: '1px solid',
                        cursor: 'pointer'
                      }}
                    >
                      + {symLabel}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Call Mode Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem' }}>
                {tr('Select Consultation Channel:', 'परामर्श का माध्यम चुनें:', 'सल्ल्याचे माध्यम निवडा:')}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div
                  onClick={() => setCallMode('video')}
                  style={{
                    border: callMode === 'video' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: callMode === 'video' ? '#f0fdf4' : '#ffffff',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: callMode === 'video' ? '#059669' : '#f1f5f9', color: callMode === 'video' ? '#ffffff' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{tr('Video Call', 'वीडियो कॉल', 'व्हिडिओ कॉल')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{tr('4G / Wi-Fi • Face to face', '4G / वाई-फाई • आमने-सामने', '4G / वाय-फाय • समोरासमोर')}</div>
                  </div>
                </div>

                <div
                  onClick={() => setCallMode('audio')}
                  style={{
                    border: callMode === 'audio' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: callMode === 'audio' ? '#f0fdf4' : '#ffffff',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '8px', background: callMode === 'audio' ? '#059669' : '#f1f5f9', color: callMode === 'audio' ? '#ffffff' : '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Phone size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{tr('Audio Call', 'ऑडियो कॉल', 'ऑडिओ कॉल')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{tr('Rural 2G/3G • Low data', 'ग्रामीण 2G/3G • कम डेटा', 'ग्रामीण 2G/3G • कमी डेटा')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Big Action Button */}
            <button
              onClick={handleRequestCall}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem 1.25rem',
                fontSize: '1rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                borderColor: '#047857',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)'
              }}
            >
              <PhoneCall size={20} />
              <span>{tr('Connect with a General Doctor Now', 'अभी सामान्य डॉक्टर से जुड़ें', 'आत्ताच सामान्य डॉक्टरांशी संपर्क साधा')}</span>
            </button>
          </div>

          {/* Right: Connected Doctors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Doctors on Duty Network Card */}
            <div className="card" style={{ padding: '1.25rem', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                  <Stethoscope size={16} color="#059669" />
                  <span>{tr(`General Doctors On Duty (${doctorsList.length})`, `ड्यूटी पर सामान्य डॉक्टर (${doctorsList.length})`, `कर्तव्यावर असलेले सामान्य डॉक्टर (${doctorsList.length})`)}</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 700 }}>
                  {tr('High Availability', 'उच्च उपलब्धता', 'उच्च उपलब्धता')}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {doctorsList.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      background: '#ffffff',
                      border: '1px solid #f1f5f9'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <img
                        src={doc.avatar}
                        alt={doc.name}
                        style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{doc.specialty} &bull; {doc.facility}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: doc.status === 'available' ? '#dcfce7' : doc.status === 'in_call' ? '#e0f2fe' : '#fef3c7',
                        color: doc.status === 'available' ? '#166534' : doc.status === 'in_call' ? '#0369a1' : '#92400e'
                      }}
                    >
                      {doc.status === 'available' ? tr('🟢 Online', '🟢 ऑनलाइन', '🟢 ऑनलाइन') : doc.status === 'in_call' ? tr('🔵 In Call', '🔵 कॉल में', '🔵 कॉलवर') : tr('🟡 In OPD Exam', '🟡 ओपीडी में', '🟡 ओपीडी तपासणीत')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATE 2: CALLING / RINGING AVAILABLE GENERAL DOCTORS          */}
      {/* ------------------------------------------------------------- */}
      {callState === 'calling' && (
        <div style={{ maxWidth: 640, margin: '2rem auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2.5rem 2rem', borderRadius: '20px', border: '1px solid #86efac', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)', boxShadow: '0 10px 30px rgba(5,150,105,0.1)' }}>
            {/* Pulsing Radar Ring Icon */}
            <div style={{ position: 'relative', width: 90, height: 90, margin: '0 auto 1.5rem auto' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#bbf7d0', animation: 'ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.75 }} />
              <div style={{ position: 'absolute', inset: -10, borderRadius: '50%', background: '#dcfce7', animation: 'ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite', opacity: 0.45 }} />
              <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', boxShadow: '0 4px 14px rgba(5,150,105,0.4)' }}>
                <PhoneCall size={38} />
              </div>
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {tr('Broadcasting Call to Available General Doctors...', 'उपलब्ध सामान्य डॉक्टरों को कॉल कनेक्ट किया जा रहा है...', 'उपलब्ध सामान्य डॉक्टरांना कॉल कनेक्ट केला जात आहे...')}
            </h2>

            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 700, marginBottom: '1rem' }}>
              {tr(`Ringing across ${availableDocsCount} online medical officers • Elapsed: ${formatDuration(callingSeconds)}`, `${availableDocsCount} ऑनलाइन डॉक्टरों को रिंग हो रहा है • समय: ${formatDuration(callingSeconds)}`, `${availableDocsCount} ऑनलाइन डॉक्टरांना रिंग होत आहे • वेळ: ${formatDuration(callingSeconds)}`)}
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', maxWidth: 440, margin: '0 auto 1.75rem auto', lineHeight: 1.5 }}>
              {tr('Any free General Doctor can accept your call. The doctor who clicks Accept first will immediately begin your consultation.', 'कोई भी उपलब्ध सामान्य डॉक्टर आपकी कॉल स्वीकार कर सकते हैं। जो डॉक्टर पहले स्वीकार करेंगे, उनसे तुरंत परामर्श शुरू हो जाएगा।', 'कोणतेही उपलब्ध सामान्य डॉक्टर तुमचा कॉल स्वीकारू शकतात. जे डॉक्टर प्रथम स्वीकार करतील, त्यांच्याशी त्वरित सल्ला सुरू होईल.')}
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', maxWidth: 460, margin: '0 auto 1.75rem auto', textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{tr('Reason for Call:', 'कॉल का कारण:', 'कॉलचे कारण:')}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>"{symptomsInput}"</div>
              <div style={{ fontSize: '0.72rem', color: '#0284c7', marginTop: '0.25rem' }}>{tr('Channel:', 'माध्यम:', 'माध्यम:')} {callMode === 'video' ? tr('Video Teleconsultation', 'वीडियो टेलीकंसल्टेशन', 'व्हिडिओ टेलीकन्सल्टेशन') : tr('Audio Call', 'ऑडियो कॉल', 'ऑडिओ कॉल')}</div>
            </div>

            <button
              onClick={handleCancelRequest}
              className="btn btn-outline"
              style={{ borderColor: '#fca5a5', color: '#dc2626', padding: '0.6rem 1.5rem', borderRadius: '8px', fontWeight: 700 }}
            >
              {tr('Cancel Call Request', 'कॉल अनुरोध रद्द करें', 'कॉल विनंती रद्द करा')}
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATE 3: ON HOLD / WAITING POOL (ALL DOCTORS BUSY IN OPD)      */}
      {/* ------------------------------------------------------------- */}
      {callState === 'on_hold' && (
        <div style={{ maxWidth: 680, margin: '2rem auto' }}>
          <div className="card" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid #fde68a', background: 'linear-gradient(180deg, #fffbeb 0%, #ffffff 100%)', boxShadow: '0 8px 30px rgba(217,119,6,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.55rem', borderRadius: '999px', fontWeight: 800, display: 'inline-block', marginBottom: '0.25rem' }}>
                  {tr('CALL PLACED ON HOLD • WAITING POOL', 'कॉल होल्ड पर • प्रतीक्षा सूची', 'कॉल होल्डवर • प्रतीक्षा यादी')}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  {tr('All General Doctors Currently in Physical OPD Exams', 'सभी सामान्य डॉक्टर अभी ओपीडी जांच में व्यस्त हैं', 'सर्व सामान्य डॉक्टर सध्या ओपीडी तपासणीत व्यस्त आहेत')}
                </h3>
              </div>
            </div>

            {/* Waiting position card */}
            <div style={{ background: '#ffffff', border: '1.5px solid #fde68a', borderRadius: '12px', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{tr('YOUR POSITION IN POOL:', 'प्रतीक्षा सूची में स्थान:', 'प्रतीक्षा यादीत स्थान:')}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#d97706' }}>
                  {tr('#1 in Priority Queue', '#1 प्राथमिकता कतार', '#1 प्राधान्य रांग')}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>{tr('ESTIMATED WAIT:', 'अनुमानित प्रतीक्षा:', 'अंदाजे प्रतीक्षा:')}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#16a34a' }}>
                  {tr('~1 to 2 Minutes', '~1 से 2 मिनट', '~1 ते 2 मिनिटे')}
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              {tr('Offline patients are being examined in OPD rooms. As soon as any General Doctor finishes their current exam or becomes available, your call will be automatically forwarded and attended to.', 'ओपीडी में मरीजों की जांच चल रही है। जैसे ही कोई डॉक्टर उपलब्ध होगा, आपका कॉल तुरंत कनेक्ट हो जाएगा।', 'ओपीडीमध्ये रुग्णांची तपासणी सुरू आहे. कोणतेही डॉक्टर उपलब्ध होताच, तुमचा कॉल त्वरित जोडला जाईल.')}
            </p>

            {/* Health Tip while waiting */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sparkles size={20} color="#16a34a" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                <strong>{tr('Tip while waiting:', 'प्रतीक्षा करते समय सुझाव:', 'वाट पाहताना सूचना:')}</strong> {tr('Sip lukewarm water and have any prior prescriptions or lab reports handy so the doctor can review them quickly.', 'गुनगुना पानी पिएं और पिछली पर्चियां या रिपोर्ट तैयार रखें ताकि डॉक्टर जल्दी जांच सकें।', 'कोमट पाणी प्या आणि मागील प्रिस्क्रिप्शन किंवा अहवाल तयार ठेवा जेणेकरून डॉक्टर लवकर तपासू शकतील.')}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#64748b' }}>
                <span className="pulse-indicator" style={{ background: '#f59e0b' }} />
                <span>{tr('Monitoring doctor availability in real-time...', 'डॉक्टरों की उपलब्धता जांची जा रही है...', 'डॉक्टरांची उपलब्धता तपासली जात आहे...')}</span>
              </div>

              <button
                onClick={handleCancelRequest}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#cbd5e1', color: '#64748b' }}
              >
                {tr('Cancel Call Request', 'कॉल अनुरोध रद्द करें', 'कॉल विनंती रद्द करा')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATE 4: ACTIVE TELECONSULTATION SCREEN (CONNECTED WITH DOC)  */}
      {/* ------------------------------------------------------------- */}
      {callState === 'active' && activeCallRecord && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
          {/* Left Column: Video Feeds & Controls */}
          <div>
            <div className="card" style={{ padding: '1rem', background: '#0f172a', color: 'white', borderRadius: '18px', boxShadow: '0 8px 30px rgba(15,23,42,0.3)' }}>
              {/* Status bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', padding: '0 0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="pulse-indicator" style={{ backgroundColor: '#10b981' }} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399' }}>
                    {tr(`Live Consultation (${formatDuration(callDuration)})`, `लाइव परामर्श (${formatDuration(callDuration)})`, `थेट सल्ला (${formatDuration(callDuration)})`)}
                  </span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem', background: '#064e3b', color: '#6ee7b7' }}>
                  {tr('Encrypted • WebRTC Connected', 'एन्क्रिप्टेड • सुरक्षित कनेक्शन', 'एनक्रिप्टेड • सुरक्षित कनेक्शन')}
                </span>
              </div>

              {/* Video Screen */}
              <div className="video-grid" style={{ height: 380, position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#020617' }}>
                {/* Dedicated Unmuted Remote Doctor Audio Output Stream (Bypasses display:none muting) */}
                <audio
                  ref={remoteAudioRef}
                  autoPlay
                  playsInline
                  style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
                />

                {/* Real Live Remote Doctor Webcam Stream */}
                {callMode === 'video' && (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    onLoadedMetadata={(e) => {
                      e.target.play().catch(() => {});
                    }}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: hasRemoteVideo ? 'block' : 'none'
                    }}
                  />
                )}

                {/* Fallback Display while doctor is connecting or camera is loading */}
                {(!hasRemoteVideo || callMode === 'audio') && (
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img
                      src={activeCallRecord.acceptedBy?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80'}
                      alt={activeCallRecord.acceptedBy?.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(2, 6, 23, 0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '1rem', textAlign: 'center' }}>
                      <div style={{ background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', padding: '0.65rem 1.25rem', borderRadius: '999px', border: '1px solid rgba(56, 189, 248, 0.35)', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', fontWeight: 700 }}>
                        <span className="pulse-indicator" style={{ backgroundColor: '#38bdf8' }} />
                        <span>
                          {callMode === 'audio'
                            ? tr('Audio Teleconsultation Active', 'ऑडियो परामर्श चालू है', 'ऑडिओ सल्ला सुरू आहे')
                            : cameraNotice || tr('Doctor Connected • Syncing Live Camera Feed...', 'डॉक्टर कनेक्टेड • लाइव कैमरा फीड सिंक हो रहा है...', 'डॉक्टर कनेक्ट झाले • थेट कॅमेरा फीड सिंक होत आहे...')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Doctor Overlay Tag */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: 16,
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    padding: '0.4rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <div style={{ color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span>{activeCallRecord.acceptedBy?.name}</span>
                    {hasRemoteVideo && (
                      <span style={{ background: '#16a34a', color: 'white', fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px' }}>
                        LIVE CAM
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                    {activeCallRecord.acceptedBy?.specialty} &bull; {activeCallRecord.acceptedBy?.facility}
                  </div>
                </div>

                {/* Self PIP Feed (Patient's Real Hardware Webcam) */}
                <div
                  className="self-video-feed"
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    right: 16,
                    width: 125,
                    height: 90,
                    borderRadius: '10px',
                    background: '#1e293b',
                    border: hasLocalVideo ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.3)',
                    overflow: 'hidden',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.5)'
                  }}
                >
                  {videoEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.7rem' }}>
                      {tr('Cam Off', 'कैमरा बंद', 'कॅमेरा बंद')}
                    </div>
                  )}
                  <span style={{ position: 'absolute', bottom: 3, left: 4, fontSize: '0.6rem', fontWeight: 800, background: 'rgba(0,0,0,0.75)', color: 'white', padding: '1px 5px', borderRadius: '4px' }}>
                    {tr('You (Patient)', 'आप (मरीज)', 'तुम्ही (रुग्ण)')}
                  </span>
                </div>
              </div>

              {/* Bottom Call Controls */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '1rem',
                  paddingTop: '0.75rem',
                  borderTop: '1px solid #334155'
                }}
              >
                <button
                  className="btn"
                  onClick={handleToggleMic}
                  style={{
                    borderRadius: '50%',
                    width: 46,
                    height: 46,
                    padding: 0,
                    backgroundColor: micEnabled ? '#334155' : '#ef4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micEnabled ? <Mic size={18} /> : <MicOff size={18} />}
                </button>

                <button
                  className="btn"
                  onClick={handleToggleVideo}
                  style={{
                    borderRadius: '50%',
                    width: 46,
                    height: 46,
                    padding: 0,
                    backgroundColor: videoEnabled ? '#334155' : '#ef4444',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  title={videoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                <button
                  className="btn btn-emergency"
                  onClick={handleEndCall}
                  style={{
                    borderRadius: '999px',
                    padding: '0.55rem 1.4rem',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <PhoneOff size={16} />
                  <span>{tr('End Call', 'कॉल समाप्त करें', 'कॉल समाप्त करा')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: In-Call Chat & Patient Vitals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Synced Vitals */}
            <div className="card" style={{ padding: '1rem', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <Activity size={16} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>
                  {tr('Patient Vitals (ABHA Record)', 'मरीज के वाइटल्स (ABHA रिकॉर्ड)', 'रुग्णाचे व्हायटल्स (आभा रेकॉर्ड)')}
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{tr('BLOOD PRESSURE', 'रक्तचाप', 'रक्तदाब')}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>120/80 mmHg</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{tr('PULSE RATE', 'नाड़ी की दर', 'नाडीचा वेग')}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>76 bpm</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{tr('TEMPERATURE', 'तापमान', 'तापमान')}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>98.6 °F</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '0.5rem', borderRadius: '6px' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{tr('SPO2', 'ऑक्सीजन (SPO2)', 'ऑक्सिजन (SPO2)')}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#16a34a' }}>{tr('99% Normal', '99% सामान्य', '99% सामान्य')}</div>
                </div>
              </div>
            </div>

            {/* In-Call Messages */}
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1rem', borderRadius: '12px', minHeight: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <MessageSquare size={16} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>
                  {tr("Doctor's Live Notes & Chat", 'डॉक्टर के लाइव नोट्स और चैट', 'डॉक्टरांच्या थेट नोंदी आणि चॅट')}
                </h4>
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  paddingRight: '0.25rem',
                  marginBottom: '0.65rem',
                  maxHeight: '200px'
                }}
              >
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      alignSelf: msg.sender === 'patient' ? 'flex-end' : 'flex-start',
                      maxWidth: '85%',
                      backgroundColor: msg.sender === 'patient' ? '#059669' : '#f1f5f9',
                      color: msg.sender === 'patient' ? 'white' : '#0f172a',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem'
                    }}
                  >
                    <div>{msg.text}</div>
                    <div style={{ fontSize: '0.62rem', textAlign: 'right', marginTop: 2, opacity: 0.8 }}>
                      {msg.time}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, minHeight: 34, fontSize: '0.8rem', padding: '0.35rem 0.65rem' }}
                  placeholder={tr('Type message to doctor...', 'डॉक्टर को संदेश लिखें...', 'डॉक्टरांना संदेश लिहा...')}
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }} disabled={!inputMsg.trim()}>
                  {tr('Send', 'भेजें', 'पाठवा')}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* STATE 5: CONSULTATION ENDED                                   */}
      {/* ------------------------------------------------------------- */}
      {callState === 'ended' && (
        <div style={{ maxWidth: 600, margin: '2rem auto', textAlign: 'center' }}>
          <div className="card" style={{ padding: '2.5rem 2rem', borderRadius: '18px', border: '1px solid #bbf7d0', background: 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)', boxShadow: '0 6px 24px rgba(5,150,105,0.1)' }}>
            <CheckCircle size={52} color="#16a34a" style={{ margin: '0 auto 1rem auto' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem 0' }}>
              {tr('Consultation Concluded', 'परामर्श पूरा हुआ', 'सल्ला पूर्ण झाला')}
            </h2>
            <p style={{ color: '#475569', fontSize: '0.88rem', maxWidth: 450, margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
              {tr(`Your teleconsultation with ${activeCallRecord?.acceptedBy?.name || 'the General Doctor'} has completed. The doctor has issued your signed digital e-prescription.`, `${activeCallRecord?.acceptedBy?.name || 'डॉक्टर'} के साथ आपका टेलीकंसल्टेशन पूरा हो गया है। डॉक्टर ने आपका डिजिटल ई-प्रिस्क्रिप्शन जारी कर दिया है।`, `${activeCallRecord?.acceptedBy?.name || 'डॉक्टरां'}सोबत तुमचे टेलीकन्सल्टेशन पूर्ण झाले आहे. डॉक्टरांनी तुमचे डिजिटल ई-प्रिस्क्रिप्शन जारी केले आहे.`)}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={() => onNavigate('prescriptions')}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.25rem', fontWeight: 800 }}
              >
                <FileText size={16} />
                <span>{tr('View Digital E-Prescription', 'डिजिटल ई-पर्चे देखें', 'डिजिटल ई-प्रिस्क्रिप्शन पहा')}</span>
              </button>

              <button
                onClick={() => {
                  setCallState('idle');
                  setActiveCallRecord(null);
                }}
                className="btn btn-outline"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                {tr('New Consultation', 'नया परामर्श', 'नवीन सल्ला')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
