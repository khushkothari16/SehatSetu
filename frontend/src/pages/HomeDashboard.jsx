import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  AlertTriangle,
  Bot,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Pill,
  Activity,
  FileCheck,
  ChevronRight,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  UserCheck,
  Video,
  Share2,
  RefreshCw,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Syringe,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useLocation } from '../context/LocationContext';
import { PrescriptionRecordsCard } from '../components/records/PrescriptionRecordsCard';
import { emergencyService } from '../services/emergencyService';
import { queueService } from '../services/queueService';
import { staffDispatchService } from '../services/staffDispatchService';
import { voiceService } from '../services/voiceService';
import { UrgentStaffModal } from '../components/UrgentStaffModal';

export const HomeDashboard = ({ onNavigate, onTriggerEmergency }) => {
  const { user } = useAuth();
  const { t, language, tr } = useLanguage();
  const { location } = useLocation();
  const [activeEmergency, setActiveEmergency] = useState(() => emergencyService.getActiveEmergencySync());
  const [liveQueue, setLiveQueue] = useState(() => queueService.getQueueStatusSync());
  const [activeStaffRequest, setActiveStaffRequest] = useState(() => staffDispatchService.getActiveRequestSync());
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [speakingCardId, setSpeakingCardId] = useState(null);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      voiceService.stopSpeaking();
    };
  }, []);

  const handleToggleSpeak = (id, textToSpeak, e) => {
    if (e) e.stopPropagation();
    if (speakingCardId === id) {
      voiceService.stopSpeaking();
      setSpeakingCardId(null);
      return;
    }
    voiceService.stopSpeaking();
    setSpeakingCardId(id);
    voiceService.speakText({
      text: textToSpeak,
      language,
      onStart: () => setSpeakingCardId(id),
      onEnd: () => setSpeakingCardId(null),
      onError: () => setSpeakingCardId(null)
    });
  };

  useEffect(() => {
    const handleStaffChange = (e) => {
      setActiveStaffRequest(e.detail !== undefined ? e.detail : staffDispatchService.getActiveRequestSync());
    };
    window.addEventListener('staff_request_change', handleStaffChange);
    window.addEventListener('storage', handleStaffChange);
    return () => {
      window.removeEventListener('staff_request_change', handleStaffChange);
      window.removeEventListener('storage', handleStaffChange);
    };
  }, []);

  useEffect(() => {
    const handleEmergencyChange = (e) => {
      setActiveEmergency(e.detail || null);
    };
    window.addEventListener('emergency_state_change', handleEmergencyChange);
    return () => window.removeEventListener('emergency_state_change', handleEmergencyChange);
  }, []);

  useEffect(() => {
    const syncQueue = () => {
      setLiveQueue(queueService.getQueueStatusSync());
    };
    syncQueue();
    const handleQueueChange = (e) => {
      if (e && e.detail !== undefined) {
        setLiveQueue(e.detail);
      } else {
        syncQueue();
      }
    };

    window.addEventListener('queue_state_change', handleQueueChange);
    window.addEventListener('appointment_booked', syncQueue);
    window.addEventListener('storage', syncQueue);
    return () => {
      window.removeEventListener('queue_state_change', handleQueueChange);
      window.removeEventListener('appointment_booked', syncQueue);
      window.removeEventListener('storage', syncQueue);
    };
  }, []);

  // Focused touch-friendly health services (Deduplicated: Primary actions live queue, booking, and prescriptions are prominently in hero gateways above)
  const patientServices = [
    {
      id: 'urgent-staff',
      label: language === 'hi' ? 'घर पर नर्स / स्टाफ' : language === 'mr' ? 'घरी परिचारिका / स्टाफ' : 'URGENT MEDICAL STAFF',
      sub: language === 'hi' ? 'इंजेक्शन, ड्रेसिंग व ड्रिप' : language === 'mr' ? 'इंजेक्शन व मलमपट्टी' : 'Home Injections & Nursing',
      icon: Syringe,
      color: '#E11D48',
      bg: '#FFE4E6',
      onClick: () => setShowStaffModal(true)
    },
    {
      id: 'medicines',
      label: language === 'hi' ? 'जन औषधि दवाएं' : language === 'mr' ? 'जन औषध केंद्र' : 'FIND MEDICINES',
      sub: language === 'hi' ? 'दवा स्टॉक व मेडिकल' : language === 'mr' ? 'औषध साठा' : 'Stock & Chemist Map',
      icon: Pill,
      color: '#D97706',
      bg: '#FEF3C7'
    },
    {
      id: 'tests',
      label: language === 'hi' ? 'जांच व लैब टेस्ट' : language === 'mr' ? 'लॅब चाचण्या' : 'LAB TESTS',
      sub: language === 'hi' ? 'रक्त व एक्स-रे जांच' : language === 'mr' ? 'रक्त तपासणी' : 'Book Pathology/X-Ray',
      icon: Activity,
      color: '#7C3AED',
      bg: '#F3E8FF'
    },
    {
      id: 'reports',
      label: language === 'hi' ? 'टेस्ट रिपोर्ट' : language === 'mr' ? 'तपासणी अहवाल' : 'TEST REPORTS',
      sub: language === 'hi' ? 'डाउनलोड करें' : language === 'mr' ? 'डाउनलोड करा' : 'Download Reports',
      icon: FileCheck,
      color: '#2563EB',
      bg: '#DBEAFE'
    },
    {
      id: 'consultation',
      label: language === 'hi' ? 'वीडियो डॉक्टर' : language === 'mr' ? 'व्हिडिओ डॉक्टर' : 'TELECONSULT',
      sub: language === 'hi' ? 'फोन पर परामर्श' : language === 'mr' ? 'व्हिडिओ कॉल' : 'Online Video Call',
      icon: Video,
      color: '#0F766E',
      bg: '#CCFBF1'
    },
    {
      id: 'follow-ups',
      label: language === 'hi' ? 'दोबारा जांच' : language === 'mr' ? 'पुढील तपासणी' : 'FOLLOW-UPS',
      sub: language === 'hi' ? '18 सितंबर 2026' : language === 'mr' ? '१८ सप्टेंबर' : 'Due: 18 Sep 2026',
      icon: RefreshCw,
      color: '#EA580C',
      bg: '#FFEDD5'
    },
    {
      id: 'referrals',
      label: language === 'hi' ? 'अस्पताल रेफरल' : language === 'mr' ? 'रुग्णालय संदर्भ' : 'REFERRALS',
      sub: language === 'hi' ? 'सिविल अस्पताल' : language === 'mr' ? 'जिल्हा रुग्णालय' : 'District Hospital',
      icon: Share2,
      color: '#475569',
      bg: '#F1F5F9'
    },
    {
      id: 'nearby',
      label: language === 'hi' ? 'नजदीकी केंद्र' : language === 'mr' ? 'जवळची केंद्रे' : 'NEARBY PHC',
      sub: language === 'hi' ? 'पीएचसी व अस्पताल' : language === 'mr' ? 'आरोग्य केंद्र' : 'Hospitals & Clinics',
      icon: MapPin,
      color: '#0891B2',
      bg: '#CFFAFE'
    },
    {
      id: 'ai-assistant',
      label: language === 'hi' ? 'एआई स्वास्थ्य सहायक' : language === 'mr' ? 'एआय डॉक्टर' : 'AI ASSISTANT',
      sub: language === 'hi' ? 'बोलकर पूछें' : language === 'mr' ? 'बोलून विचारा' : 'Voice & Symptoms',
      icon: Bot,
      color: '#9333EA',
      bg: '#F5F3FF'
    }
  ];

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Patient Greeting & Status Banner (Clean, calm, without duplicate confusing buttons) */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          marginBottom: '1.5rem',
          padding: '1.5rem 1.75rem',
          borderRadius: 'var(--radius-xl)',
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)',
          color: 'white',
          boxShadow: '0 8px 24px -4px rgba(13, 148, 136, 0.25)'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.785rem', fontWeight: 700, opacity: 0.92, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('abhaIdLabel')}: {user?.abhaId || '91-4829-1029-4819'}
            </span>
            <span style={{ background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.725rem', fontWeight: 700 }}>
              ✓ {tr('Verified', 'सत्यापित', 'प्रमाणित')}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            {t('welcomeBack')}, {language === 'hi' ? (user?.nameHindi || 'राहुल शर्मा') : language === 'mr' ? (user?.nameMarathi || 'राहुल शर्मा') : (user?.name || 'Rahul Sharma')}! 👋
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div
            onClick={() => {
              const el = document.querySelector('header button[title*="location"]');
              if (el) el.click();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255,255,255,0.22)',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.85rem',
              fontWeight: 700,
              backdropFilter: 'blur(4px)',
              cursor: 'pointer'
            }}
            title="Current live location - Click to view or change"
          >
            <MapPin size={16} />
            <span>{location?.village || location?.city || 'Detecting Location...'}</span>
            <span style={{ fontSize: '0.72rem', opacity: 0.95, background: 'rgba(255,255,255,0.25)', padding: '2px 7px', borderRadius: '10px', fontWeight: 800 }}>
              {location?.isLive ? '● Live GPS' : (location?.state || 'India')}
            </span>
          </div>
        </div>
      </div>

      {/* ACTIVE EMERGENCY DISPATCH BANNER */}
      {activeEmergency && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: '#FEF2F2',
            border: '2px solid #F87171',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: '0 10px 25px -5px rgba(220, 38, 38, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: 'var(--emergency)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px' }}>
                <span className="badge badge-emergency" style={{ fontWeight: 800 }}>
                  ● {activeEmergency.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#991B1B', fontWeight: 700 }}>
                  ETA: 0{activeEmergency.etaMinutes} min ({activeEmergency.distanceKm} km)
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#991B1B' }}>
                {tr('🚨 108 Ambulance En Route to Your Location', '🚨 108 एम्बुलेंस आपके स्थान के लिए रवाना है', '🚨 १०८ रुग्णवाहिका आपल्या स्थानाकडे निघाली आहे')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#7F1D1D' }}>
                {tr('Vehicle', 'वाहन', 'वाहन')}: <strong>{activeEmergency.ambulanceVehicleNumber}</strong> &bull; {tr('Driver', 'चालक', 'चालक')}: <strong>{activeEmergency.driverName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a
              href={`tel:${activeEmergency.driverPhone}`}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#DC2626', color: '#991B1B', fontWeight: 700 }}
            >
              <PhoneCall size={14} /> {tr('Call Driver', 'चालक को कॉल करें', 'चालकाला फोन करा')}
            </a>
            <button
              onClick={onTriggerEmergency}
              className="btn btn-emergency btn-sm"
              style={{ fontWeight: 800, padding: '0.5rem 1rem' }}
            >
              {tr('Track Live Map →', 'लाइव नक्शा देखें →', 'थेट नकाशा पहा →')}
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE URGENT MEDICAL STAFF / INJECTION REQUEST BANNER */}
      {activeStaffRequest && activeStaffRequest.status !== 'Cancelled' && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '1.25rem 1.5rem',
            backgroundColor: activeStaffRequest.status === 'Dispatched & En Route' ? '#F0FDFA' : '#FFF1F2',
            border: activeStaffRequest.status === 'Dispatched & En Route' ? '2px solid #0D9488' : '2px solid #F43F5E',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '1.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            boxShadow: activeStaffRequest.status === 'Dispatched & En Route' ? '0 8px 24px -4px rgba(13, 148, 136, 0.2)' : '0 8px 24px -4px rgba(225, 29, 72, 0.2)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                backgroundColor: activeStaffRequest.status === 'Dispatched & En Route' ? '#0D9488' : '#E11D48',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'pulse 1.5s infinite',
                flexShrink: 0
              }}
            >
              <Syringe size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    background: activeStaffRequest.status === 'Dispatched & En Route' ? '#0D9488' : '#E11D48',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '999px'
                  }}
                >
                  ● {activeStaffRequest.status}
                </span>
                <span style={{ fontSize: '0.8rem', color: activeStaffRequest.status === 'Dispatched & En Route' ? '#0F766E' : '#9F1239', fontWeight: 700 }}>
                  {activeStaffRequest.assignedStaff
                    ? `${tr('ETA', 'समय', 'वेळ')}: ~${activeStaffRequest.assignedStaff.etaMinutes} min (${activeStaffRequest.assignedStaff.distanceKm} km)`
                    : tr(
                        'Doctor & PHC Notified • Locating nearest nurse',
                        'डॉक्टर व पीएचसी को सूचित कर दिया गया है • नजदीकी नर्स खोजी जा रही है',
                        'डॉक्टर आणि प्राथमिक आरोग्य केंद्राला कळवले आहे • जवळची परिचारिका शोधत आहे'
                      )}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: activeStaffRequest.status === 'Dispatched & En Route' ? '#0F766E' : '#881337' }}>
                {activeStaffRequest.status === 'Dispatched & En Route'
                  ? tr(
                      `🟢 ${activeStaffRequest.assignedStaff.name} (${activeStaffRequest.assignedStaff.role}) is En Route to your home`,
                      `🟢 ${activeStaffRequest.assignedStaff.name} (${activeStaffRequest.assignedStaff.role}) आपके पते के लिए रवाना हैं`,
                      `🟢 ${activeStaffRequest.assignedStaff.name} (${activeStaffRequest.assignedStaff.role}) आपल्या घराकडे निघाल्या आहेत`
                    )
                  : tr(
                      `🟡 Medical Staff Requested: ${activeStaffRequest.purpose}`,
                      `🟡 मेडिकल स्टाफ अनुरोध: ${activeStaffRequest.purpose}`,
                      `🟡 वैद्यकीय कर्मचारी विनंती: ${activeStaffRequest.purpose}`
                    )}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#475569' }}>
                {tr('Procedure', 'उपचार', 'उपचार')}: <strong>{activeStaffRequest.medicationDetails}</strong> &bull; {tr('Address', 'पता', 'पत्ता')}: <strong>{activeStaffRequest.address}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {activeStaffRequest.assignedStaff?.phone && (
              <a
                href={`tel:${activeStaffRequest.assignedStaff.phone}`}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#0D9488', color: '#0F766E', fontWeight: 700 }}
              >
                <PhoneCall size={14} /> Call Nurse ({activeStaffRequest.assignedStaff.phone})
              </a>
            )}

            {activeStaffRequest.status === 'Pending Staff' && (
              <button
                type="button"
                onClick={async () => {
                  await staffDispatchService.cancelStaffRequest(activeStaffRequest.id);
                  setActiveStaffRequest(null);
                }}
                className="btn btn-sm"
                style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', fontWeight: 700 }}
              >
                Cancel Request
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowStaffModal(true)}
              className="btn btn-sm"
              style={{
                background: activeStaffRequest.status === 'Dispatched & En Route' ? '#0D9488' : '#E11D48',
                color: 'white',
                fontWeight: 800
              }}
            >
              Request Details &rarr;
            </button>
          </div>
        </div>
      )}


      {/* 1. PRIMARY HEALTHCARE GATEWAYS: AI Health Assistant + Normal Care + Teleconsultation + Prescription History + Nearby + 108 SOS */}
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
              {t('primaryGateways')}
            </h2>
          </div>

          {/* RIGHT SIDE: LIVE QUEUE DISPLAY BOX (DISPLAY ONLY IF ACTIVE APPOINTMENT/QUEUE EXISTS) */}
          {liveQueue && liveQueue.userToken && liveQueue.status !== 'Completed' && (
            <div
              onClick={() => onNavigate('queue')}
            style={{
              background: liveQueue.status === 'Your Turn'
                ? '#f0fdf4'
                : liveQueue.status === 'Almost Your Turn'
                ? '#fffbeb'
                : '#ffffff',
              border: liveQueue.status === 'Your Turn'
                ? '1.5px solid #86efac'
                : liveQueue.status === 'Almost Your Turn'
                ? '1.5px solid #fde68a'
                : '1.5px solid #cbd5e1',
              borderRadius: '14px',
              padding: '0.6rem 1.15rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to view full live queue details"
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: liveQueue.status === 'Your Turn' ? '#16a34a' : '#2563EB',
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
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                  {tr('Live OPD Queue', 'लाइव ओपीडी कतार', 'थेट ओपीडी रांग')}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background:
                      liveQueue.status === 'Your Turn'
                        ? '#dcfce7'
                        : liveQueue.status === 'Almost Your Turn'
                        ? '#fef3c7'
                        : '#dbeafe',
                    color:
                      liveQueue.status === 'Your Turn'
                        ? '#15803d'
                        : liveQueue.status === 'Almost Your Turn'
                        ? '#b45309'
                        : '#1e40af'
                  }}
                >
                  {liveQueue.status === 'Your Turn'
                    ? tr('🔔 Your Turn!', '🔔 आपकी बारी है!', '🔔 आपली पाळी आहे!')
                    : liveQueue.status === 'Almost Your Turn'
                    ? tr('⚠️ Almost Turn', '⚠️ लगभग आपकी बारी', '⚠️ जवळजवळ आपली पाळी')
                    : tr('● In Queue', '● कतार में', '● रांगेत')}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2px', fontSize: '0.84rem', fontWeight: 800, color: '#0f172a' }}>
                <span style={{ color: '#1d4ed8' }}>
                  {tr('Your Token:', 'टोकन:', 'आपला टोकन:')} <strong>#{liveQueue.userToken}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>&bull;</span>
                <span style={{ color: '#15803d' }}>
                  {tr('Now Serving:', 'चल रहा:', 'सुरू टोकन:')} <strong>#{liveQueue.currentToken}</strong>
                </span>
                <span style={{ color: '#cbd5e1' }}>&bull;</span>
                <span style={{ color: '#64748b', fontSize: '0.76rem', fontWeight: 600 }}>
                  {liveQueue.patientsAhead === 0
                    ? tr('Enter Room 4', 'कमरा 4 में जाएं', 'खोली क्र. ४ मध्ये जा')
                    : `${liveQueue.patientsAhead} ${tr('ahead', 'मरीज आगे', 'रुग्ण पुढे')} (~${liveQueue.estimatedWaitMinutes}m)`}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.35rem' }}>
              {/* Speaker Button on Live Queue Box */}
              <button
                type="button"
                onClick={(e) => {
                  const queueText = language === 'hi'
                    ? `लाइव ओपीडी कतार। आपका टोकन नंबर ${liveQueue.userToken} है। अभी चल रहा टोकन नंबर ${liveQueue.currentToken} है। ${liveQueue.patientsAhead === 0 ? 'आपकी बारी है, कमरा 4 में जाएं' : `${liveQueue.patientsAhead} मरीज आगे हैं, अनुमानित समय ${liveQueue.estimatedWaitMinutes} मिनट`}`
                    : language === 'mr'
                    ? `थेट ओपीडी रांग. आपला टोकन नंबर ${liveQueue.userToken} आहे. चालू टोकन नंबर ${liveQueue.currentToken} आहे. ${liveQueue.patientsAhead === 0 ? 'आपली पाळी आहे, खोली क्र. ४ मध्ये जा' : `${liveQueue.patientsAhead} रुग्ण पुढे आहेत, अंदाजे वेळ ${liveQueue.estimatedWaitMinutes} मिनिटे`}`
                    : `Live OPD Queue. Your token is number ${liveQueue.userToken}. Currently serving token ${liveQueue.currentToken}. ${liveQueue.patientsAhead === 0 ? 'Your turn, please enter Room 4' : `${liveQueue.patientsAhead} patients ahead, estimated wait ${liveQueue.estimatedWaitMinutes} minutes`}.`;
                  handleToggleSpeak('live_queue_box', queueText, e);
                }}
                style={{
                  background: speakingCardId === 'live_queue_box' ? '#fee2e2' : '#dbeafe',
                  border: 'none',
                  borderRadius: '50%',
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: speakingCardId === 'live_queue_box' ? '#dc2626' : '#1d4ed8',
                  cursor: 'pointer'
                }}
                title={speakingCardId === 'live_queue_box' ? 'Stop listening' : 'Listen to queue status (कतार स्थिति सुनें)'}
              >
                {speakingCardId === 'live_queue_box' ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <ChevronRight size={16} color="#2563EB" />
            </div>
          </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* Card 1: AI Health Assistant */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('ai-assistant')}
            style={{
              padding: '1.6rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)',
              border: '2px solid #A855F7',
              boxShadow: '0 6px 20px -3px rgba(168, 85, 247, 0.18)',
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
                  <Bot size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800, fontSize: '0.75rem' }}>
                    <Sparkles size={12} /> {t('multimodal')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak('card_ai', t('cardAiTitle'), e)}
                    style={{
                      background: speakingCardId === 'card_ai' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_ai' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_ai' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {t('cardAiTitle')}
              </h3>
            </div>

            <div
              style={{
                marginTop: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(168, 85, 247, 0.15)'
              }}
            >
              <span style={{ color: '#7C3AED', fontWeight: 800, fontSize: '0.925rem' }}>
                {t('askAi')} →
              </span>
              <ChevronRight size={18} color="#7C3AED" />
            </div>
          </div>

          {/* Card 2: Normal Care & Book Appointment */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('find-doctor')}
            style={{
              padding: '1.6rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)',
              border: '2px solid var(--primary)',
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
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                  }}
                >
                  <Calendar size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {language === 'hi' ? '● ओपीडी व वीडियो' : language === 'mr' ? '● ओपीडी व व्हिडिओ' : '● OPD & Video Slots'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak('card_normal', `${t('cardNormalTitle')}. ${t('cardNormalDesc')}`, e)}
                    style={{
                      background: speakingCardId === 'card_normal' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_normal' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_normal' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {t('cardNormalTitle')}
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
              <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.925rem' }}>
                {t('exploreOpd')} →
              </span>
              <ChevronRight size={18} color="var(--primary)" />
            </div>
          </div>

          {/* Card 3: Teleconsultation */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('consultation')}
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
                  <Video size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {language === 'hi' ? '● बिना टोकन / सीधा कॉल' : language === 'mr' ? '● थेट कॉल' : '● Instant Call • No Token'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      const text = language === 'hi'
                        ? 'टेलीकंसल्टेशन (वीडियो डॉक्टर)'
                        : language === 'mr'
                        ? 'टेलीकन्सल्टेशन (व्हिडिओ डॉक्टर)'
                        : 'Teleconsultation Online Call';
                      handleToggleSpeak('card_teleconsult', text, e);
                    }}
                    style={{
                      background: speakingCardId === 'card_teleconsult' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_teleconsult' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_teleconsult' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {language === 'hi' ? 'टेलीकंसल्टेशन (वीडियो डॉक्टर)' : language === 'mr' ? 'टेलीकन्सल्टेशन (व्हिडिओ कॉल)' : 'Teleconsultation (Online Call)'}
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
                {tr('Start Teleconsultation', 'तुरंत कॉल शुरू करें', 'तातडीने व्हिडिओ कॉल सुरू करा')} →
              </span>
              <ChevronRight size={18} color="#059669" />
            </div>
          </div>

          {/* Card 4: Prescription History */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('prescriptions')}
            style={{
              padding: '1.6rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
              border: '2px solid #10B981',
              boxShadow: '0 6px 20px -3px rgba(16, 185, 129, 0.18)',
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
                  <FileText size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {language === 'hi' ? '● 3 डिजिटल पर्चियां' : language === 'mr' ? '● ३ चिठ्ठ्या' : '● 3 Digital Records'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak('card_rx_history', `${t('prescriptionHistoryBtn')}. ${t('prescriptionHistoryDesc')}`, e)}
                    style={{
                      background: speakingCardId === 'card_rx_history' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_rx_history' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_rx_history' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {t('prescriptionHistoryBtn')}
              </h3>
            </div>

            <div
              style={{
                marginTop: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(16, 185, 129, 0.15)'
              }}
            >
              <span style={{ color: '#059669', fontWeight: 800, fontSize: '0.925rem' }}>
                {language === 'hi' ? 'पर्ची इतिहास देखें' : language === 'mr' ? 'चिठ्ठी इतिहास पहा' : 'View Prescription History'} →
              </span>
              <ChevronRight size={18} color="#059669" />
            </div>
          </div>

          {/* Card 5: Nearby Healthcare (Restored into Dashboard Gateways as requested) */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('nearby')}
            style={{
              padding: '1.6rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0F9FF 100%)',
              border: '2px solid #38BDF8',
              boxShadow: '0 6px 20px -3px rgba(56, 189, 248, 0.18)',
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
                  <MapPin size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-neutral" style={{ fontWeight: 800, fontSize: '0.75rem' }}>
                    {language === 'hi' ? '● पीएचसी व केंद्र' : language === 'mr' ? '● आरोग्य केंद्रे' : '● PHCs & Clinics'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak('card_nearby', t('cardNearbyTitle'), e)}
                    style={{
                      background: speakingCardId === 'card_nearby' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_nearby' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_nearby' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {t('cardNearbyTitle')}
              </h3>
            </div>

            <div
              style={{
                marginTop: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(56, 189, 248, 0.15)'
              }}
            >
              <span style={{ color: '#0284C7', fontWeight: 800, fontSize: '0.925rem' }}>
                {t('viewMapFacilities')} →
              </span>
              <ChevronRight size={18} color="#0284C7" />
            </div>
          </div>

          {/* Card 6: Emergency SOS (108) */}
          <div
            className="card card-clickable"
            onClick={onTriggerEmergency}
            style={{
              padding: '1.6rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
              border: '2px solid #FCA5A5',
              boxShadow: '0 6px 20px -3px rgba(220, 38, 38, 0.2)',
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
                    backgroundColor: 'var(--emergency)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)'
                  }}
                >
                  <AlertTriangle size={28} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span className="badge badge-emergency" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                    {activeEmergency ? `● ETA: 0${activeEmergency.etaMinutes}m` : t('dial108')}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak('card_emergency', t('cardEmergencyTitle'), e)}
                    style={{
                      background: speakingCardId === 'card_emergency' ? '#FEE2E2' : 'rgba(0,0,0,0.05)',
                      border: 'none',
                      borderRadius: '50%',
                      width: 28,
                      height: 28,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === 'card_emergency' ? '#DC2626' : '#475569',
                      cursor: 'pointer'
                    }}
                    title="Listen aloud (बोलकर सुनें)"
                  >
                    {speakingCardId === 'card_emergency' ? <VolumeX size={15} /> : <Volume2 size={15} />}
                  </button>
                </div>
              </div>

              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--emergency)', margin: 0 }}>
                {activeEmergency
                  ? tr('🚨 Ambulance En Route', '🚨 108 एम्बुलेंस रास्ते में है', '🚨 १०८ रुग्णवाहिका येत आहे')
                  : t('cardEmergencyTitle')}
              </h3>
              {activeEmergency && (
                <p style={{ color: '#7F1D1D', fontSize: '0.85rem', lineHeight: 1.4, margin: '0.35rem 0 0 0' }}>
                  {language === 'hi'
                    ? `वाहन ${activeEmergency.ambulanceVehicleNumber} आ रहा है। दूरी: ${activeEmergency.distanceKm} किमी।`
                    : language === 'mr'
                    ? `रुग्णवाहिका ${activeEmergency.ambulanceVehicleNumber} येत आहे. अंतर: ${activeEmergency.distanceKm} किमी.`
                    : `Ambulance ${activeEmergency.ambulanceVehicleNumber} is heading to your GPS location.`}
                </p>
              )}
            </div>

            <div
              style={{
                marginTop: '1.35rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.75rem',
                borderTop: '1px solid rgba(220, 38, 38, 0.15)'
              }}
            >
              <span style={{ color: 'var(--emergency)', fontWeight: 800, fontSize: '0.925rem' }}>
                {activeEmergency ? tr('View Live Tracking', 'लाइव ट्रैकिंग देखें', 'थेट ट्रॅकिंग पहा') : t('activateSos')} →
              </span>
              <ChevronRight size={18} color="var(--emergency)" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. PATIENT SERVICES MENU (Clean, touch-friendly, deduplicated tiles) */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="page-header" style={{ marginBottom: '1rem' }}>
          <h2 className="page-title" style={{ fontSize: '1.35rem', margin: 0 }}>
            {t('quickActionsTitle')}
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
            gap: '1rem'
          }}
        >
          {patientServices.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.id}
                className="card card-clickable"
                onClick={() => (action.onClick ? action.onClick() : onNavigate(action.id))}
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
                  minHeight: '135px'
                }}
              >
                <div
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    backgroundColor: action.bg,
                    color: action.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative'
                  }}
                >
                  <Icon size={26} strokeWidth={2.2} />
                  <button
                    type="button"
                    onClick={(e) => handleToggleSpeak(`svc_${action.id}`, `${action.label}. ${action.sub}`, e)}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -8,
                      background: speakingCardId === `svc_${action.id}` ? '#FEE2E2' : '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: speakingCardId === `svc_${action.id}` ? '#DC2626' : '#64748B',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      cursor: 'pointer'
                    }}
                    title="Listen (सुनें)"
                  >
                    {speakingCardId === `svc_${action.id}` ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>

                <div
                  style={{
                    fontWeight: 800,
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '0.02em',
                    lineHeight: 1.25
                  }}
                >
                  {action.label}
                </div>

                <div
                  style={{
                    fontSize: '0.725rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px'
                  }}
                >
                  {action.sub}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. RECENT PRESCRIPTION RECORDS CARD */}
      <div style={{ marginBottom: '2rem' }}>
        <PrescriptionRecordsCard onNavigate={onNavigate} />
      </div>

      {/* URGENT MEDICAL STAFF / HOME INJECTION MODAL */}
      <UrgentStaffModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        user={user}
        location={location}
        language={language}
        onSuccess={(newReq) => {
          setActiveStaffRequest(newReq);
        }}
      />
    </div>
  );
};
