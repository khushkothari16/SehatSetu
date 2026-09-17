import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  MapPin,
  Camera,
  Phone,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Navigation,
  User,
  Users,
  ChevronRight,
  Droplets,
  HeartPulse,
  UserX,
  X,
  RefreshCw,
  ArrowLeft,
  Check,
  Building2,
  ShieldCheck,
  AlertCircle,
  Plus,
  Trash2,
  Eye,
  ChevronLeft,
  Image as ImageIcon,
  Mic,
  MicOff,
  Minus,
  Volume2
} from 'lucide-react';
import { emergencyService } from '../services/emergencyService';
import { locationService } from '../services/locationService';
import { voiceService } from '../services/voiceService';
import { LeafletMap } from '../components/common/LeafletMap';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';

export const Emergency = ({ onNavigate, onCancel }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const { location: userLocation, refreshLocation } = useLocation();

  // Instant synchronous check on mount so there is ZERO layout jump
  const [activeEmergency, setActiveEmergency] = useState(() => emergencyService.getActiveEmergencySync());
  const [step, setStep] = useState(() => (emergencyService.getActiveEmergencySync() ? 'active_tracking' : 'select'));
  const [isDispatching, setIsDispatching] = useState(false);

  // Casualty count ("how many people injured" - default 1)
  const [injuredCount, setInjuredCount] = useState(1);

  // Police Station Involvement Alert (Accident location & uploaded photos sent to nearest police station)
  const [alertPolice, setAlertPolice] = useState(false);
  const [isSeriousInjury, setIsSeriousInjury] = useState(false);

  // Form states for 'Someone Else' & 'Myself' multi-photo uploads
  const [incidentDesc, setIncidentDesc] = useState('');
  const [myselfDesc, setMyselfDesc] = useState('');
  const [bystanderPhotos, setBystanderPhotos] = useState([]);
  const [patientPhotos, setPatientPhotos] = useState([]);
  const [isUploadingLivePhotos, setIsUploadingLivePhotos] = useState(false);
  const [viewingPhotoIndex, setViewingPhotoIndex] = useState(null);

  // Voice speech-to-text recording state
  const [activeMicTarget, setActiveMicTarget] = useState(null); // 'someone' | 'myself' | 'quick' | 'chat' | null
  const recognitionRef = useRef(null);

  // In-App Cancellation Modal State (Replaces native window.confirm)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('accidental');

  // First Aid selected tab
  const [firstAidCategory, setFirstAidCategory] = useState('fa-bleeding');

  // Caller message to attending doctor
  const [userReplyText, setUserReplyText] = useState('');
  const [isSendingUserReply, setIsSendingUserReply] = useState(false);

  // Toggle voice recognition speech-to-text
  const handleToggleVoice = (target = 'someone') => {
    if (activeMicTarget === target) {
      // Stop active listening
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setActiveMicTarget(null);
      return;
    }

    if (!voiceService.isSpeechRecognitionSupported()) {
      addToast(
        language === 'hi'
          ? 'माइक सपोर्ट इस ब्राउज़र में उपलब्ध नहीं है। कृपया गूगल क्रोम या एज का उपयोग करें।'
          : language === 'mr'
          ? 'माइक सपोर्ट या ब्राउझरमध्ये उपलब्ध नाही. कृपया क्रोम वापरा.'
          : 'Speech recognition is not supported in this browser. Please use Chrome or Edge.',
        'warning'
      );
      return;
    }

    // Stop any other active listening first
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    setActiveMicTarget(target);
    addToast(
      language === 'hi'
        ? '🎙️ माइक चालू है... घटना या स्थिति का विवरण बोलें'
        : language === 'mr'
        ? '🎙️ माइक सुरू आहे... घटनेची माहिती बोला'
        : '🎙️ Microphone active... Speak incident details now',
      'info'
    );

    recognitionRef.current = voiceService.startListening({
      language,
      onResult: ({ text }) => {
        if (!text) return;
        if (target === 'someone' || target === 'quick') {
          setIncidentDesc(text);
        } else if (target === 'myself') {
          setMyselfDesc(text);
        } else if (target === 'chat') {
          setUserReplyText(text);
        }
      },
      onError: (err) => {
        console.warn('Speech recognition error:', err);
        setActiveMicTarget(null);
      },
      onEnd: () => {
        setActiveMicTarget(null);
      }
    });
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const handleSendUserReply = async (presetText = '') => {
    const text = (presetText || userReplyText).trim();
    if (!text) return;
    if (activeMicTarget === 'chat' && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setActiveMicTarget(null);
    }
    setIsSendingUserReply(true);
    try {
      await emergencyService.sendPatientReply(text);
      setUserReplyText('');
      addToast(
        tr(
          `Message sent to Dr. Anjali Mehta & ${userLocation?.village || userLocation?.city || 'Local'} PHC!`,
          `डॉक्टर अंजलि मेहता व ${userLocation?.village || userLocation?.city || 'अस्पताल'} को आपका संदेश भेजा गया!`,
          `डॉक्टर अंजली मेहता व ${userLocation?.village || userLocation?.city || 'रुग्णालय'} यांना तुमचा संदेश पाठवला!`
        ),
        'success'
      );
    } catch (err) {
      addToast(tr('Failed to send update', 'संदेश भेजने में विफल', 'संदेश पाठवण्यात अयशस्वी'), 'error');
    } finally {
      setIsSendingUserReply(false);
    }
  };

  // Background refresh of active emergency
  useEffect(() => {
    let isMounted = true;

    const refresh = async () => {
      const existing = await emergencyService.getActiveEmergency();
      if (!isMounted) return;
      if (existing) {
        setActiveEmergency(existing);
        setStep('active_tracking');
      }
    };

    refresh();

    const handleStateChange = (e) => {
      if (e.detail) {
        setActiveEmergency(e.detail);
        setStep('active_tracking');
      } else {
        setActiveEmergency(null);
        setStep('select');
      }
    };

    window.addEventListener('emergency_state_change', handleStateChange);
    return () => {
      isMounted = false;
      window.removeEventListener('emergency_state_change', handleStateChange);
    };
  }, []);

  // Live ambulance tracking ticker interval
  useEffect(() => {
    if (step !== 'active_tracking' || !activeEmergency) return;

    const interval = setInterval(async () => {
      const updated = await emergencyService.tickAmbulanceLocation();
      if (updated) {
        setActiveEmergency(updated);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [step, activeEmergency?.id]);

  const executeDispatch = async (targetType, desc, photos = [], count = injuredCount, shouldPolice = alertPolice) => {
    setIsDispatching(true);
    if (activeMicTarget && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setActiveMicTarget(null);
    }
    try {
      const photoList = Array.isArray(photos) ? photos.filter(Boolean) : (photos ? [photos] : []);
      const parsedCount = Math.max(1, parseInt(count, 10) || 1);
      const isPoliceActive = Boolean(shouldPolice || alertPolice || isSeriousInjury || parsedCount >= 2);
      const record = await emergencyService.dispatchEmergency({
        targetType,
        injuredCount: parsedCount,
        alertPolice: isPoliceActive,
        isSeriousInjury: Boolean(isSeriousInjury || parsedCount >= 2),
        description: desc || (targetType === 'myself' ? 'Immediate patient SOS medical alert' : 'Bystander reported acute incident'),
        photoUrl: photoList[0] || null,
        photoUrls: photoList,
        userCoords: { lat: userLocation?.lat || 28.1878, lng: userLocation?.lng || 75.5001 },
        address: userLocation?.fullAddress || `${userLocation?.village || userLocation?.city || 'Current Location'}, ${userLocation?.state || 'India'}`,
        userLocation
      });
      setActiveEmergency(record);
      setStep('active_tracking');
      addToast(
        language === 'hi'
          ? `🚨 108 एम्बुलेंस रवाना (${parsedCount} घायल • ${photoList.length > 0 ? `${photoList.length} फोटो संलग्न • ` : ''}${record.policeNotified ? 'थाना व 112 पीसीआर को स्थान व फोटो प्रेषित' : 'पीएचसी अलर्ट'})`
          : language === 'mr'
          ? `🚨 १०८ रुग्णवाहिका रवाना (${parsedCount} जखमी • ${photoList.length > 0 ? `${photoList.length} फोटो • ` : ''}${record.policeNotified ? 'पोलीस ठाण्याला माहिती पाठवली' : 'रुग्णालय अलर्ट'})`
          : `🚨 108 EMERGENCY AMBULANCE DISPATCHED! (${parsedCount} Casualty/Casualties • ${photoList.length > 0 ? `${photoList.length} photo(s) • ` : ''}${record.policeNotified ? 'Police alerted with location & photos' : 'Hospital alerted'})`,
        'error'
      );
    } catch (err) {
      addToast(err.message || 'Dispatch failed', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDispatchMyself = () => {
    executeDispatch('myself', myselfDesc || 'Immediate patient SOS medical alert', patientPhotos, injuredCount);
  };

  const handleDispatchSomeoneElse = (e) => {
    if (e) e.preventDefault();
    executeDispatch('someone_else', incidentDesc || 'Bystander reported emergency', bystanderPhotos, injuredCount);
  };

  const handleQuickDispatch = () => {
    executeDispatch(
      'someone_else',
      incidentDesc || tr(
        `Immediate 108 dispatch for ${injuredCount} injured casualty/casualties`,
        `${injuredCount} घायलों के लिए तत्काल 108 आपातकालीन सहायता`,
        `${injuredCount} जखमी लोकांसाठी तात्काळ १०८ रुग्णवाहिका सेवा`
      ),
      bystanderPhotos,
      injuredCount
    );
  };

  // Reusable interactive Casualty Selector ("How many people injured")
  const renderInjuredCountSelector = (compact = false) => {
    const counts = [1, 2, 3, 4, 5];
    return (
      <div
        style={{
          background: compact ? '#FEF2F2' : 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%)',
          border: '1.5px solid #FECACA',
          borderRadius: 'var(--radius-lg)',
          padding: compact ? '0.85rem 1rem' : '1.15rem 1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 2px 8px rgba(220, 38, 38, 0.06)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <label style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#991B1B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Users size={18} color="#DC2626" />
            <span>{tr('How many people are injured?', 'कितने लोग घायल हैं?', 'किती लोक जखमी आहेत?')}</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: injuredCount >= 4 ? '#991B1B' : injuredCount >= 2 ? '#DC2626' : '#EA580C',
                color: 'white',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              {injuredCount === 1
                ? tr('1 Patient (Single)', '1 मरीज (साधारण एम्बुलेंस)', '१ रुग्ण (एकटी व्यक्ती)')
                : injuredCount >= 4
                ? tr(`🚨 ${injuredCount} Casualties (Mass Casualty)`, `🚨 ${injuredCount} गंभीर घायल (MCI मल्टी-बे)`, `🚨 ${injuredCount} गंभीर जखमी (मोठा अपघात)`)
                : tr(`⚠️ ${injuredCount} Patients (High Priority)`, `⚠️ ${injuredCount} घायल (मल्टी-पेशेंट बे)`, `⚠️ ${injuredCount} जखमी रुग्ण (प्राधान्य)`)}
            </span>
          </div>
        </div>

        {/* Quick count chips + Counter Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          {counts.map((num) => {
            const isSelected = num === 5 ? injuredCount >= 5 : injuredCount === num;
            const label =
              num === 1
                ? (language === 'hi' ? '1 व्यक्ति' : language === 'mr' ? '१ व्यक्ती' : '1 Person')
                : num === 5
                ? (language === 'hi' ? '5+ गंभीर' : language === 'mr' ? '५+ गंभीर' : '5+ Mass Casualty')
                : `${num} ${language === 'hi' ? 'लोग' : language === 'mr' ? 'लोक' : 'People'}`;
            return (
              <button
                key={num}
                type="button"
                onClick={() => setInjuredCount(num)}
                style={{
                  flex: '1 1 80px',
                  padding: '0.55rem 0.65rem',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid #DC2626' : '1.5px solid #CBD5E1',
                  background: isSelected ? '#DC2626' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : '#1E293B',
                  fontWeight: 800,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none'
                }}
              >
                {label}
              </button>
            );
          })}

          {/* Stepper adjustment */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              height: 38
            }}
          >
            <button
              type="button"
              onClick={() => setInjuredCount((prev) => Math.max(1, prev - 1))}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0 0.65rem',
                cursor: 'pointer',
                fontWeight: 800,
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Decrease casualty count"
            >
              <Minus size={14} />
            </button>
            <span style={{ padding: '0 0.5rem', fontWeight: 900, color: '#0F172A', minWidth: 28, textAlign: 'center', fontSize: '0.9rem' }}>
              {injuredCount}
            </span>
            <button
              type="button"
              onClick={() => setInjuredCount((prev) => prev + 1)}
              style={{
                border: 'none',
                background: 'transparent',
                padding: '0 0.65rem',
                cursor: 'pointer',
                fontWeight: 800,
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Increase casualty count"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Triage / Hospital impact note */}
        <div style={{ marginTop: '0.65rem', fontSize: '0.75rem', color: '#7F1D1D', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>🚑</span>
          <span>
            {injuredCount === 1
              ? (language === 'hi'
                  ? '108 आपातकालीन एम्बुलेंस व 1 प्राथमिक स्ट्रेचर आरक्षित किया जाएगा।'
                  : '108 Ambulance with acute resuscitation & single patient stretcher dispatched.')
              : (language === 'hi'
                  ? `निकटतम पीएचसी में ${injuredCount} ट्रॉमा बेड और अतिरिक्त मेडिकल स्टाफ तुरंत तैयार किया जाएगा।`
                  : `108 Casualty Unit alerted: ${injuredCount} trauma beds and multi-casualty response teams reserved at local PHC.`)}
          </span>
        </div>
      </div>
    );
  };

  // Reusable Voice Input Header with active Mic toggle
  const renderVoiceInputHeader = (target, labelText) => {
    const isListening = activeMicTarget === target;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.45rem' }}>
        <label className="form-label" style={{ fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>{labelText}</span>
        </label>

        {/* Live Mic Action Button */}
        <button
          type="button"
          onClick={() => handleToggleVoice(target)}
          className={`btn btn-sm ${isListening ? 'btn-emergency' : 'btn-outline'}`}
          style={{
            fontWeight: 800,
            fontSize: '0.8rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            borderColor: isListening ? '#DC2626' : 'var(--primary)',
            color: isListening ? '#FFFFFF' : 'var(--primary)',
            background: isListening ? '#DC2626' : '#EFF6FF',
            animation: isListening ? 'pulse 1.2s infinite' : 'none',
            boxShadow: isListening ? '0 0 12px rgba(220, 38, 38, 0.45)' : 'none',
            cursor: 'pointer'
          }}
          title={isListening ? 'Click to stop listening' : 'Click to speak using your microphone instead of typing'}
        >
          {isListening ? (
            <>
              <span className="pulse-indicator" style={{ width: 8, height: 8, backgroundColor: '#FFFFFF' }}></span>
              <MicOff size={15} />
              <span>{language === 'hi' ? 'माइक बंद करें' : language === 'mr' ? 'माइक थांबवा' : 'Stop Listening'}</span>
            </>
          ) : (
            <>
              <Mic size={15} color="var(--primary)" />
              <span>{language === 'hi' ? '🎙️ बोलकर बताएं (माइक)' : language === 'mr' ? '🎙️ बोलून सांगा' : '🎙️ Speak (Mic)'}</span>
            </>
          )}
        </button>
      </div>
    );
  };

  // Reusable Police Station Alert Toggle Component
  const renderPoliceAlertToggle = () => {
    const isAuto = injuredCount >= 2 || isSeriousInjury;
    const isChecked = alertPolice || isAuto;
    return (
      <div
        style={{
          background: isChecked ? 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)' : 'var(--surface-alt)',
          border: isChecked ? '1.5px solid #3B82F6' : '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '0.85rem 1.15rem',
          marginBottom: '1.25rem',
          transition: 'all 0.2s ease',
          boxShadow: isChecked ? '0 2px 8px rgba(37, 99, 235, 0.1)' : 'none'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', cursor: 'pointer', margin: 0 }}>
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => {
              setAlertPolice(e.target.checked);
              if (e.target.checked) setIsSeriousInjury(true);
            }}
            style={{
              width: 18,
              height: 18,
              accentColor: '#1D4ED8',
              cursor: 'pointer',
              marginTop: 2
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E3A8A' }}>
                🚓 {tr('Alert Nearest Police Station (112 PCR)', 'निकटतम पुलिस थाना को भी तत्काल अलर्ट भेजें (112 PCR)', 'जवळच्या पोलीस ठाण्यालाही त्वरित अलर्ट पाठवा (११२ PCR)')}
              </span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  backgroundColor: isChecked ? '#1D4ED8' : '#64748B',
                  color: 'white'
                }}
              >
                {isAuto
                  ? tr('Auto-Alert: Multi-Casualty', 'गंभीर स्थिति — स्वतः अलर्ट', 'गंभीर प्रसंग — स्वयंचलित अलर्ट')
                  : tr('Severe Injury / Road Accident', 'सड़क दुर्घटना / गंभीर चोट', 'रस्ता अपघात / गंभीर दुखापत')}
              </span>
            </div>
          </div>
        </label>
      </div>
    );
  };

  const handlePhotoUpload = (e, target = 'someone_else') => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          if (target === 'myself') {
            setPatientPhotos((prev) => (prev.length >= 8 ? prev : [...prev, reader.result]));
          } else {
            setBystanderPhotos((prev) => (prev.length >= 8 ? prev : [...prev, reader.result]));
          }
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removePhoto = (indexToRemove, target = 'someone_else') => {
    if (target === 'myself') {
      setPatientPhotos((prev) => prev.filter((_, i) => i !== indexToRemove));
    } else {
      setBystanderPhotos((prev) => prev.filter((_, i) => i !== indexToRemove));
    }
  };

  const handleUploadLivePhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploadingLivePhotos(true);

    const readPromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    try {
      const newImages = (await Promise.all(readPromises)).filter(Boolean);
      if (newImages.length > 0) {
        const updated = await emergencyService.addEmergencyPhotos(newImages);
        if (updated) setActiveEmergency(updated);
        addToast(
          tr(
            `✓ Transmitted ${newImages.length} additional photo(s) to response unit!`,
            `✓ ${newImages.length} नई फोटो डॉक्टर व एम्बुलेंस को भेजी गई!`,
            `✓ ${newImages.length} नवीन छायाचित्रे डॉक्टर व रुग्णवाहिकेस पाठवली!`
          ),
          'success'
        );
      }
    } catch (err) {
      addToast('Failed to upload photos', 'error');
    } finally {
      setIsUploadingLivePhotos(false);
      e.target.value = '';
    }
  };

  const handleConfirmCancelEmergency = async () => {
    setShowCancelModal(false);
    await emergencyService.cancelEmergency();
    setActiveEmergency(null);
    setStep('select');
    addToast(
      language === 'hi'
        ? 'आपातकालीन एम्बुलेंस अनुरोध रद्द कर दिया गया।'
        : language === 'mr'
        ? 'रुग्णवाहिका विनंती रद्द करण्यात आली.'
        : 'Emergency ambulance request cancelled.',
      'info'
    );
  };

  const handleBack = () => {
    if (showCancelModal) {
      setShowCancelModal(false);
      return;
    }
    if (step === 'someone_else') {
      setStep('select');
      return;
    }
    if (onCancel) {
      onCancel();
    } else if (onNavigate) {
      onNavigate('home');
    }
  };

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (showCancelModal) {
        e.preventDefault();
        setShowCancelModal(false);
        return;
      }
      if (step === 'someone_else') {
        e.preventDefault();
        setStep('select');
        return;
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [showCancelModal, step]);

  const handleAlertPoliceNow = async () => {
    try {
      const updated = await emergencyService.alertPoliceForActiveEmergency();
      if (updated) {
        setActiveEmergency(updated);
        addToast(
          language === 'hi'
            ? '🚓 निकटतम पुलिस थाने व 112 पीसीआर को दुर्घटना स्थल व फोटो भेज दिए गए हैं!'
            : language === 'mr'
            ? '🚓 जवळच्या पोलीस ठाण्याला अपघाताचे ठिकाण व फोटो पाठवले गेले!'
            : '🚓 Accident location & uploaded photos transmitted to nearest police station & 112 PCR!',
          'success'
        );
      }
    } catch (err) {
      addToast(tr('Failed to alert police station', 'पुलिस स्टेशन को अलर्ट करने में विफल', 'पोलीस ठाण्याला अलर्ट करण्यात अयशस्वी'), 'error');
    }
  };

  const firstAidGuides = emergencyService.getFirstAidGuides();
  const currentGuide = firstAidGuides.find((g) => g.id === firstAidCategory) || firstAidGuides[0];

  // Map markers for live active tracking
  const mapMarkers = activeEmergency
    ? [
        {
          lat: activeEmergency.patientCoords.lat,
          lng: activeEmergency.patientCoords.lng,
          title: activeEmergency.targetType === 'myself' ? 'Rahul Sharma (You)' : 'Incident Location',
          subtitle: activeEmergency.address,
          type: 'patient'
        },
        {
          lat: activeEmergency.ambulanceCoords.lat,
          lng: activeEmergency.ambulanceCoords.lng,
          title: `Ambulance ${activeEmergency.ambulanceVehicleNumber}`,
          subtitle: `${activeEmergency.distanceKm} km away • Driver: ${activeEmergency.driverName}`,
          type: 'ambulance'
        },
        ...(activeEmergency.policeStation?.pcrCoords
          ? [
              {
                lat: activeEmergency.policeStation.pcrCoords.lat,
                lng: activeEmergency.policeStation.pcrCoords.lng,
                title: `Police Patrol (${activeEmergency.policeStation.pcrUnit})`,
                subtitle: `${activeEmergency.policeStation.stationName} • Officer: ${activeEmergency.policeStation.officerInCharge}`,
                type: 'police'
              }
            ]
          : [])
      ]
    : [];

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: 980, margin: '0 auto' }}>
      {/* Top Navigation Row: Back Button + Direct Hotlines */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <button
          onClick={handleBack}
          className="btn btn-outline btn-sm"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 700,
            background: 'var(--surface)'
          }}
        >
          <ArrowLeft size={16} />
          <span>{language === 'hi' ? '← वापस' : language === 'mr' ? '← मागे' : '← Back'}</span>
        </button>

        {/* Quick Direct Helplines */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <a
            href="tel:108"
            className="btn btn-sm"
            style={{
              backgroundColor: 'var(--emergency)',
              color: 'white',
              fontWeight: 800,
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
            title="Call 108 Ambulance directly"
          >
            <Phone size={14} /> 108 (Ambulance)
          </a>
          <a
            href="tel:112"
            className="btn btn-outline btn-sm"
            style={{
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem 0.85rem'
            }}
            title="National All-India Emergency Service"
          >
            <Phone size={14} /> 112 (National)
          </a>
          <a
            href="tel:104"
            className="btn btn-outline btn-sm hidden-mobile"
            style={{
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              padding: '0.4rem 0.85rem'
            }}
            title="Health & Medical Advice Helpline"
          >
            <Phone size={14} /> 104 (Health)
          </a>
        </div>
      </div>

      {/* Top Banner Alert */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          padding: '1.15rem 1.5rem',
          backgroundColor: 'var(--emergency)',
          color: 'white',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '1.5rem',
          boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.35)',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="pulse-indicator" style={{ backgroundColor: 'white', width: 12, height: 12 }}></div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>
              {t('emergencyModalTitle')} (108 SOS)
            </h1>
            <span style={{ fontSize: '0.825rem', opacity: 0.95 }}>
              {language === 'hi'
                ? `${userLocation?.state || 'राजस्थान'} सरकार 108 आपातकालीन एम्बुलेंस व ग्रामीण नेटवर्क`
                : language === 'mr'
                ? `${userLocation?.state || 'महाराष्ट्र'} शासन 108 आपत्कालीन रुग्णवाहिका नेटवर्क`
                : `Government of ${userLocation?.state || 'Rajasthan'} 108 Emergency Ambulance & Rural Casualty Network`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              padding: '0.35rem 0.75rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}
          >
            <MapPin size={14} />
            <span>
              {userLocation?.village || userLocation?.city || 'Live Location'}
              {userLocation?.district && userLocation.district !== (userLocation?.village || userLocation?.city)
                ? `, ${userLocation.district}`
                : userLocation?.state
                ? `, ${userLocation.state}`
                : ''}
            </span>
          </div>
        </div>
      </div>

      {/* STEP 1: INITIAL SELECTION */}
      {step === 'select' && (
        <div className="card animate-fade-in" style={{ padding: '2rem 1.75rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.4rem 0' }}>
              {t('emergencyWhoQuestion')}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', margin: 0, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
              {language === 'hi'
                ? 'माइक से बोलकर या लिखकर विवरण दें, घायलों की संख्या चुनें और 108 एम्बुलेंस तुरंत रवाना करें:'
                : language === 'mr'
                ? 'माइकने बोलून माहिती नोंदवा, जखमींची संख्या निवडा आणि १०८ रुग्णवाहिका तात्काळ बोलवा:'
                : 'Select casualty count, speak or type incident details, and dispatch 108 emergency services immediately:'}
            </p>
          </div>

          {/* QUICK INSTANT 108 DISPATCH WITH CASUALTY COUNT & VOICE MIC */}
          <div
            style={{
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 60%, #FFF1F2 100%)',
              border: '2px solid #FCA5A5',
              borderRadius: 'var(--radius-xl)',
              padding: '1.35rem 1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 6px 20px -3px rgba(220, 38, 38, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: 'var(--emergency)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#991B1B' }}>
                    {tr('⚡ Rapid 108 SOS (Mic Voice & Casualty Count)', '⚡ त्वरित 108 आपातकालीन सेवा (माइक व घायलों की संख्या)', '⚡ त्वरित १०८ आपत्कालीन नोंद (माइक व जखमी संख्या)')}
                  </h3>
                  <div style={{ fontSize: '0.75rem', color: '#B91C1C' }}>
                    {tr('Speak incident details — no typing required', 'बोलकर बताएं — टाइप करने की आवश्यकता नहीं', 'बोलून सांगा — टाइप करण्याची गरज नाही')}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  border: '1.5px solid #FECACA',
                  padding: '0.3rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  color: '#DC2626',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                <MapPin size={13} color="#DC2626" />
                <span>GPS Locked: {userLocation?.village || userLocation?.city || 'Live Location'}</span>
              </div>
            </div>

            {/* PART 1: HOW MANY PEOPLE INJURED */}
            {renderInjuredCountSelector(false)}

            {/* PART 2: MIC OPTION SO USER CAN SPEAK INSTEAD OF TYPING */}
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              {renderVoiceInputHeader('quick', tr('Incident Details (Speak or Type)', 'आपातकाल का विवरण (बोलकर बताएं या लिखें)', 'घटनेची माहिती (बोला किंवा लिहा)'))}

              {/* Active Listening Animated Banner */}
              {activeMicTarget === 'quick' && (
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.6rem 0.9rem',
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem',
                    color: '#991B1B',
                    animation: 'pulse 1.8s infinite'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pulse-indicator" style={{ width: 9, height: 9, backgroundColor: '#DC2626' }}></span>
                    <strong>
                      {language === 'hi'
                        ? '🎙️ सुन रहे हैं... बोलिए (उदा. 2 लोग बाइक से गिरे हैं, सिर पर चोट है)'
                        : language === 'mr'
                        ? '🎙️ ऐकत आहोत... बोला (उदा. २ लोक जखमी आहेत)'
                        : '🎙️ Listening... Speak incident details now (e.g. 2 injured in bike fall)'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleVoice('quick')}
                    className="btn btn-emergency btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', height: 26 }}
                  >
                    {tr('⏹️ Done', '⏹️ पूर्ण हुआ', '⏹️ पूर्ण')}
                  </button>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-textarea"
                  placeholder={
                    language === 'hi'
                      ? '🎙️ ऊपर माइक बटन दबाकर बोलें या यहाँ लिखें (उदा. 2 लोग बाइक से गिरे हैं, अस्पताल के पास, खून बह रहा है...)'
                      : language === 'mr'
                      ? '🎙️ वरील माइक दाबून बोला किंवा येथे लिहा (उदा. २ लोक जखमी आहेत...)'
                      : '🎙️ Tap the Mic button above to speak or type incident details here...'
                  }
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  rows={2}
                  style={{
                    fontSize: '0.9rem',
                    paddingRight: '2.5rem',
                    borderColor: activeMicTarget === 'quick' ? '#DC2626' : undefined,
                    boxShadow: activeMicTarget === 'quick' ? '0 0 0 3px rgba(220, 38, 38, 0.2)' : undefined
                  }}
                />
                {incidentDesc && (
                  <button
                    type="button"
                    onClick={() => setIncidentDesc('')}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#64748B'
                    }}
                    title="Clear description"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Nearest Police Station Alert Option for Serious Incidents */}
            {renderPoliceAlertToggle()}

            {/* Quick Dispatch Action Button */}
            <button
              onClick={handleQuickDispatch}
              className="btn btn-emergency btn-lg"
              style={{
                width: '100%',
                fontWeight: 800,
                fontSize: '1.05rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                padding: '0.85rem 1.5rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)'
              }}
              disabled={isDispatching}
            >
              <AlertTriangle size={20} />
              <span>
                {isDispatching
                  ? t('dispatching')
                  : language === 'hi'
                  ? `🚨 तुरंत 108 एम्बुलेंस बुलाएं (${injuredCount} घायल • जीपीएस लोकेशन)`
                  : language === 'mr'
                  ? `🚨 तात्काळ १०८ रुग्णवाहिका बोलवा (${injuredCount} जखमी)`
                  : `🚨 Instant 108 Dispatch (${injuredCount} Injured • Live GPS)`}
              </span>
            </button>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '1.25rem', position: 'relative' }}>
            <span
              style={{
                background: 'var(--surface)',
                padding: '0 1rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              {tr('— Or Select Specific Option With Photos —', '— या फोटो के साथ विस्तृत रिपोर्ट चुनें —', '— किंवा फोटोसह सविस्तर अहवाल निवडा —')}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 760, margin: '0 auto' }}>
            {/* Option A: Myself */}
            <div
              className="card card-clickable"
              onClick={() => setStep('myself_confirm')}
              style={{
                padding: '1.75rem 1.5rem',
                border: '2px solid var(--emergency)',
                background: 'linear-gradient(to bottom, #FFFFFF, #FEF2F2)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center'
              }}
            >
              <div>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    backgroundColor: 'var(--emergency)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}
                >
                  <User size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--emergency)', margin: '0 0 0.5rem 0' }}>
                  {t('myself')}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#7F1D1D', margin: 0, lineHeight: 1.45 }}>
                  {t('myselfDesc')}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  color: 'var(--emergency)',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <span>{language === 'hi' ? 'आगे बढ़ें' : language === 'mr' ? 'पुढे जा' : 'Continue for Myself'}</span>
                <ChevronRight size={16} />
              </div>
            </div>

            {/* Option B: Someone Else */}
            <div
              className="card card-clickable"
              onClick={() => setStep('someone_form')}
              style={{
                padding: '1.75rem 1.5rem',
                border: '2px solid var(--secondary)',
                background: 'linear-gradient(to bottom, #FFFFFF, #F0F9FF)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                textAlign: 'center'
              }}
            >
              <div>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    backgroundColor: 'var(--secondary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto'
                  }}
                >
                  <Users size={28} />
                </div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', margin: '0 0 0.5rem 0' }}>
                  {t('someoneElse')}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#075985', margin: 0, lineHeight: 1.45 }}>
                  {t('someoneElseDesc')}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1.25rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  color: 'var(--secondary)',
                  fontWeight: 800,
                  fontSize: '0.9rem'
                }}
              >
                <span>{language === 'hi' ? 'फोटो व विस्तृत विवरण' : language === 'mr' ? 'माहिती व फोटो भरा' : 'Report Incident with Photos'}</span>
                <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2A: MYSELF CONFIRMATION */}
      {step === 'myself_confirm' && (
        <div className="card animate-fade-in" style={{ padding: '2rem', maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <AlertTriangle size={28} color="var(--emergency)" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              {language === 'hi' ? '108 एम्बुलेंस भेजने की पुष्टि करें' : language === 'mr' ? '१०८ रुग्णवाहिका पाठवण्याची खात्री करा' : 'Confirm Immediate 108 Dispatch'}
            </h2>
          </div>


          {/* CASUALTY COUNT SELECTOR */}
          {renderInjuredCountSelector(true)}

          {/* PATIENT SYMPTOMS / CONDITION WITH VOICE MIC */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            {renderVoiceInputHeader('myself', tr('Describe Symptoms / Condition (Speak or Type)', 'लक्षण या स्थिति बोलकर बताएं या लिखें (वैकल्पिक)', 'लक्षणे किंवा परिस्थिती बोला किंवा लिहा (ऐच्छिक)'))}

            {/* Active Listening Animated Banner */}
            {activeMicTarget === 'myself' && (
              <div
                style={{
                  marginBottom: '0.5rem',
                  padding: '0.6rem 0.9rem',
                  backgroundColor: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.825rem',
                  color: '#991B1B',
                  animation: 'pulse 1.8s infinite'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="pulse-indicator" style={{ width: 9, height: 9, backgroundColor: '#DC2626' }}></span>
                  <strong>
                    {tr(
                      '🎙️ Listening... Speak symptoms now (e.g. chest pain, difficulty breathing)',
                      '🎙️ सुन रहे हैं... अपने लक्षण बोलें (उदा. छाती में तेज दर्द, सांस लेने में तकलीफ)',
                      '🎙️ ऐकत आहोत... लक्षणे बोला (उदा. छातीत दुखणे, श्वास घेण्यास त्रास)'
                    )}
                  </strong>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleVoice('myself')}
                  className="btn btn-emergency btn-sm"
                  style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', height: 26 }}
                >
                  ⏹️ Done
                </button>
              </div>
            )}

            <div style={{ position: 'relative' }}>
              <textarea
                className="form-textarea"
                placeholder={
                  tr(
                    '🎙️ Tap the Mic button above to speak or type symptoms here...',
                    '🎙️ ऊपर माइक बटन दबाकर बोलें या यहाँ लिखें (उदा. छाती में दर्द, चक्कर, बेहोशी...)',
                    '🎙️ वरील माइक दाबून बोला किंवा येथे लक्षणे लिहा...'
                  )
                }
                value={myselfDesc}
                onChange={(e) => setMyselfDesc(e.target.value)}
                rows={2}
                style={{
                  fontSize: '0.9rem',
                  paddingRight: '2.5rem',
                  borderColor: activeMicTarget === 'myself' ? '#DC2626' : undefined,
                  boxShadow: activeMicTarget === 'myself' ? '0 0 0 3px rgba(220, 38, 38, 0.2)' : undefined
                }}
              />
              {myselfDesc && (
                <button
                  type="button"
                  onClick={() => setMyselfDesc('')}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: '50%',
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: '#64748B'
                  }}
                  title="Clear text"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* OPTIONAL PATIENT / INJURY PHOTO UPLOAD */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                <Camera size={16} color="var(--emergency)" />
                <span>{tr('Injury / Medical Photos (Optional)', 'चोट / पर्ची की फोटो जोड़ें (वैकल्पिक)', 'इजा / औषध चिठ्ठीचे फोटो जोडा (ऐच्छिक)')}</span>
              </label>
              {patientPhotos.length > 0 && (
                <span className="badge badge-emergency" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                  📷 {patientPhotos.length} {tr('Selected', 'फोटो', 'फोटो निवडले')} (Max 8)
                </span>
              )}
            </div>

            <div
              style={{
                border: patientPhotos.length > 0 ? '1.5px solid var(--primary)' : '1.5px dashed #CBD5E1',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem',
                backgroundColor: patientPhotos.length > 0 ? '#F0FDFA' : 'var(--surface-alt)'
              }}
            >
              {patientPhotos.length > 0 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '0.65rem' }}>
                    {patientPhotos.map((p, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '1/1', border: '1px solid #CBD5E1' }}>
                        <img src={p} alt={`Patient photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3, fontWeight: 800 }}>
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removePhoto(idx, 'myself')}
                          style={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: '#DC2626',
                            color: 'white',
                            border: '1px solid white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            padding: 0
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {patientPhotos.length < 8 && (
                      <label
                        htmlFor="myself-camera-input"
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          border: '1.5px dashed var(--primary)',
                          background: 'white',
                          cursor: 'pointer',
                          aspectRatio: '1/1',
                          color: 'var(--primary)'
                        }}
                      >
                        <Plus size={18} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>+ Add</span>
                      </label>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#0F766E', fontWeight: 600 }}>
                      ✓ {patientPhotos.length} {tr('photo(s) attached for emergency team', 'फोटो आपातकालीन डॉक्टर को भेजी जाएगी', 'छायाचित्रे आपत्कालीन पथकासाठी जोडली')}
                    </span>
                    <label htmlFor="myself-camera-input" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                      <Camera size={13} /> {tr('+ Add More', '+ फोटो जोड़ें', '+ आणखी जोडा')}
                    </label>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="myself-camera-input"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}
                >
                  <Camera size={20} color="var(--primary)" />
                  <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {tr('📷 Click or Upload Multiple Injury / Medical Photos', '📷 चोट, सूजन या दवा की फोटो लें / अपलोड करें (मल्टीपल फोटो)', '📷 दुखापत, सूज किंवा औषधांचे फोटो घ्या / जोडा')}
                  </span>
                </label>
              )}
              <input
                id="myself-camera-input"
                type="file"
                accept="image/*"
                multiple
                capture="environment"
                onChange={(e) => handlePhotoUpload(e, 'myself')}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.75rem',
              fontSize: '0.9rem',
              background: 'var(--surface-alt)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}
          >
            <MapPin size={18} color="var(--primary)" />
            <span>
              <strong>GPS Location:</strong> {userLocation?.fullAddress || `${userLocation?.village || userLocation?.city || 'Live Location'}${userLocation?.district ? `, ${userLocation.district}` : ''}${userLocation?.state ? `, ${userLocation.state}` : ''}`} ({userLocation?.accuracy || 'High Accuracy'})
            </span>
          </div>

          {/* Nearest Police Station Alert Option for Serious Injury */}
          {renderPoliceAlertToggle()}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setStep('select')}
              className="btn btn-outline"
              style={{ flex: 1 }}
              disabled={isDispatching}
            >
              {language === 'hi' ? 'पीछे जाएं' : language === 'mr' ? 'मागे जा' : 'Back'}
            </button>
            <button
              onClick={handleDispatchMyself}
              className="btn btn-emergency btn-lg"
              style={{ flex: 2, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={isDispatching}
            >
              <AlertTriangle size={18} />
              <span>
                {isDispatching
                  ? t('dispatching')
                  : language === 'hi'
                  ? `🚨 108 एम्बुलेंस भेजें (${injuredCount} व्यक्ति)`
                  : language === 'mr'
                  ? `🚨 १०८ रुग्णवाहिका बोलवा (${injuredCount} व्यक्ती)`
                  : `🚨 Dispatch 108 (${injuredCount} Patient${injuredCount > 1 ? 's' : ''})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2B: SOMEONE ELSE FORM */}
      {step === 'someone_form' && (
        <div className="card animate-fade-in" style={{ padding: '2rem', maxWidth: 680, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Users size={28} color="var(--secondary)" />
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              {language === 'hi' ? 'किसी अन्य के लिए दुर्घटना या आपातकाल दर्ज करें' : language === 'mr' ? 'इतरांसाठी तातडीची मदत नोंदवा' : 'Report Incident for Someone Else'}
            </h2>
          </div>

          <form onSubmit={handleDispatchSomeoneElse}>
            <div className="form-group">
              <label className="form-label">
                {language === 'hi' ? 'घटना का स्थान (GPS द्वारा सत्यापित)' : language === 'mr' ? 'घटनेचे ठिकाण' : 'Incident Location (GPS Verified)'}
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem'
                }}
              >
                <MapPin size={16} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>
                  {userLocation?.fullAddress || `${userLocation?.village || userLocation?.city || 'Live Location'}${userLocation?.district ? `, ${userLocation.district} District` : userLocation?.state ? `, ${userLocation.state}` : ''}`} (Coordinates Locked)
                </span>
              </div>
            </div>

            {/* CASUALTY COUNT: HOW MANY PEOPLE INJURED */}
            {renderInjuredCountSelector(false)}

            <div className="form-group">
              {renderVoiceInputHeader('someone', tr('Brief Description of Emergency (Speak or Type)', 'आपातकाल का विवरण (बोलकर बताएं या लिखें)', 'घटनेची माहिती (बोला किंवा लिहा)'))}

              {/* Active Listening Animated Banner */}
              {activeMicTarget === 'someone' && (
                <div
                  style={{
                    marginBottom: '0.5rem',
                    padding: '0.6rem 0.9rem',
                    backgroundColor: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.825rem',
                    color: '#991B1B',
                    animation: 'pulse 1.8s infinite'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="pulse-indicator" style={{ width: 9, height: 9, backgroundColor: '#DC2626' }}></span>
                    <strong>
                      {tr(
                        '🎙️ Listening... Speak incident details now',
                        '🎙️ सुन रहे हैं... बोलिए (उदा. बस स्टैंड के पास बाइक दुर्घटना, 2 लोग घायल हैं)',
                        '🎙️ ऐकत आहोत... बोला (उदा. बस स्टँडजवळ अपघात, २ लोक जखमी आहेत)'
                      )}
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleVoice('someone')}
                    className="btn btn-emergency btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.6rem', height: 26 }}
                  >
                    ⏹️ Done
                  </button>
                </div>
              )}

              <div style={{ position: 'relative' }}>
                <textarea
                  className="form-textarea"
                  placeholder={
                    tr(
                      '🎙️ Tap the Mic button above to speak or type incident details here...',
                      '🎙️ ऊपर माइक बटन दबाकर बोलें या यहाँ लिखें (उदा. बस स्टैंड के पास बाइक दुर्घटना, पैर में चोट, व्यक्ति होश में है...)',
                      '🎙️ वरील माइक दाबून बोला किंवा येथे लिहा (उदा. रस्त्यावर अपघात झाला आहे...)'
                    )
                  }
                  value={incidentDesc}
                  onChange={(e) => setIncidentDesc(e.target.value)}
                  rows={3}
                  style={{
                    paddingRight: '2.5rem',
                    borderColor: activeMicTarget === 'someone' ? '#DC2626' : undefined,
                    boxShadow: activeMicTarget === 'someone' ? '0 0 0 3px rgba(220, 38, 38, 0.2)' : undefined
                  }}
                />
                {incidentDesc && (
                  <button
                    type="button"
                    onClick={() => setIncidentDesc('')}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      background: '#F1F5F9',
                      border: 'none',
                      borderRadius: '50%',
                      width: 22,
                      height: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: '#64748B'
                    }}
                    title="Clear text"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', margin: 0 }}>
                  <Camera size={16} color="var(--secondary)" />
                  <span>{tr('Incident Photos (Multiple Photos Allowed)', 'घटना की फोटो अपलोड करें (एक से अधिक फोटो लें)', 'अपघात स्थळाचे फोटो (एकाधिक फोटो घेता येतील)')}</span>
                </label>
                {bystanderPhotos.length > 0 && (
                  <span className="badge badge-emergency" style={{ fontSize: '0.72rem', fontWeight: 800 }}>
                    📷 {bystanderPhotos.length} {tr('Selected', 'फोटो', 'फोटो निवडले')} (Max 8)
                  </span>
                )}
              </div>

              <div
                style={{
                  border: bystanderPhotos.length > 0 ? '1.5px solid var(--secondary)' : '1.5px dashed #CBD5E1',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  backgroundColor: bystanderPhotos.length > 0 ? '#F0F9FF' : 'var(--surface-alt)'
                }}
              >
                {bystanderPhotos.length > 0 ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      {bystanderPhotos.map((p, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', aspectRatio: '1/1', border: '1px solid #CBD5E1' }}>
                          <img src={p} alt={`Incident preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: '0.6rem', padding: '1px 4px', borderRadius: 3, fontWeight: 800 }}>
                            #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removePhoto(idx, 'someone_else')}
                            style={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: '#DC2626',
                              color: 'white',
                              border: '1px solid white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              padding: 0
                            }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      {bystanderPhotos.length < 8 && (
                        <label
                          htmlFor="bystander-camera-input"
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 6,
                            border: '1.5px dashed var(--secondary)',
                            background: 'white',
                            cursor: 'pointer',
                            aspectRatio: '1/1',
                            color: 'var(--secondary)'
                          }}
                        >
                          <Plus size={18} />
                          <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>+ Add</span>
                        </label>
                      )}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#0369A1', fontWeight: 600 }}>
                        ✓ {bystanderPhotos.length} {tr('photo(s) attached for 108 team', 'फोटो 108 एम्बुलेंस और पीएचसी को भेजी जाएगी', 'छायाचित्रे १०८ रुग्णवाहिका व प्राथमिक आरोग्य केंद्रासाठी जोडली')}
                      </span>
                      <label htmlFor="bystander-camera-input" className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                        <Camera size={13} /> {tr('+ Add More', '+ फोटो जोड़ें', '+ आणखी जोडा')}
                      </label>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="bystander-camera-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.6rem',
                      cursor: 'pointer',
                      padding: '0.5rem',
                      color: 'var(--text-secondary)',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Camera size={20} color="var(--secondary)" />
                    <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                      {tr('📷 Click or Upload Multiple Incident Photos (Scene / Vehicle / Landmark)', '📷 दुर्घटना स्थल, वाहन या चोट की फोटो लें / जोड़ें (मल्टीपल फोटो)', '📷 अपघात स्थळ, वाहन किंवा जखमेचे छायाचित्र घ्या')}
                    </span>
                  </label>
                )}
                <input
                  id="bystander-camera-input"
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={(e) => handlePhotoUpload(e, 'someone_else')}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Nearest Police Station Alert Option for Serious Injury / Road Incident */}
            {renderPoliceAlertToggle()}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.75rem' }}>
              <button
                type="button"
                onClick={() => setStep('select')}
                className="btn btn-outline"
                style={{ flex: 1 }}
                disabled={isDispatching}
              >
                {language === 'hi' ? 'पीछे जाएं' : language === 'mr' ? 'मागे जा' : 'Back'}
              </button>
              <button
                type="submit"
                className="btn btn-emergency btn-lg"
                style={{ flex: 2, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                disabled={isDispatching}
              >
                <AlertTriangle size={18} />
                <span>
                  {isDispatching
                    ? t('dispatching')
                    : language === 'hi'
                    ? `🚨 108 एम्बुलेंस रवाना करें (${injuredCount} घायल)`
                    : language === 'mr'
                    ? `🚨 १०८ रुग्णवाहिका बोलवा (${injuredCount} जखमी)`
                    : `🚨 Send 108 Dispatch (${injuredCount} Injured)`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: ACTIVE AMBULANCE TRACKING SCREEN */}
      {step === 'active_tracking' && activeEmergency && (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Status Alert Header Card */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: '#FEF2F2',
              border: '2px solid #FCA5A5',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 8px 24px -4px rgba(220, 38, 38, 0.2)'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4, flexWrap: 'wrap' }}>
                <span className="pulse-indicator"></span>
                <span className="badge badge-emergency" style={{ fontWeight: 800 }}>
                  ● {activeEmergency.status}
                </span>
                <span
                  className="badge"
                  style={{
                    backgroundColor: (activeEmergency.injuredCount || 1) >= 4 ? '#991B1B' : (activeEmergency.injuredCount || 1) >= 2 ? '#DC2626' : '#C2410C',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <Users size={12} />
                  <span>
                    {activeEmergency.injuredCount || 1}{' '}
                    {language === 'hi'
                      ? (activeEmergency.injuredCount || 1) > 1
                        ? 'घायल व्यक्ति (कैजुअल्टी)'
                        : 'घायल मरीज'
                      : language === 'mr'
                      ? (activeEmergency.injuredCount || 1) > 1
                        ? 'जखमी व्यक्ती'
                        : 'रुग्ण'
                      : (activeEmergency.injuredCount || 1) > 1
                      ? 'Injured Casualties'
                      : 'Patient'}
                  </span>
                </span>
                <span style={{ fontSize: '0.8rem', color: '#7F1D1D' }}>ID: {activeEmergency.id}</span>
              </div>
              <h2 style={{ margin: '2px 0', fontSize: '1.5rem', fontWeight: 900, color: 'var(--emergency)' }}>
                {t('ambulanceOnWay')}
              </h2>
              <div style={{ fontSize: '0.875rem', color: '#7F1D1D', marginTop: '0.25rem' }}>
                Destination: <strong>{activeEmergency.address}</strong> &bull; Receiving PHC:{' '}
                <strong>{activeEmergency.hospitalName}</strong>
              </div>
            </div>

            {/* Large ETA & Distance Display */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div
                style={{
                  textAlign: 'center',
                  background: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #FECACA'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--emergency)' }}>{t('eta')}</div>
                <div
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: 'var(--emergency)',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.1
                  }}
                >
                  0{activeEmergency.etaMinutes} min
                </div>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  background: 'white',
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #FECACA'
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                  {t('distance')}
                </div>
                <div
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-heading)',
                    lineHeight: 1.1
                  }}
                >
                  {activeEmergency.distanceKm} km
                </div>
              </div>
            </div>
          </div>

          {/* Interactive OpenStreetMap Leaflet Tracking */}
          <div className="card" style={{ padding: '0.75rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.25rem 0.5rem 0.75rem 0.5rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span className="pulse-indicator" style={{ backgroundColor: 'var(--primary)' }}></span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tr('📍 Live GPS Ambulance Tracking (Updates every 4s)', '📍 लाइव जीपीएस एम्बुलेंस लोकेशन (हर 4 सेकंड में अपडेट)', '📍 थेट जीपीएस रुग्णवाहिका ट्रॅकिंग (दर ४ सेकंदांनी अपडेट)')}
                </span>
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Vehicle: {activeEmergency.ambulanceVehicleNumber}
              </span>
            </div>

            <LeafletMap
              center={[activeEmergency.patientCoords.lat, activeEmergency.patientCoords.lng]}
              zoom={14}
              markers={mapMarkers}
              height="380px"
            />
          </div>

          {/* Driver Contact, Hospital & Action Buttons */}
          <div
            className="card"
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ambulance Pilot / Driver:</div>
              <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-primary)' }}>
                {activeEmergency.driverName} ({activeEmergency.ambulanceVehicleNumber})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <a
                href={`tel:${activeEmergency.driverPhone}`}
                className="btn btn-primary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <Phone size={15} />
                {t('driverContact')}
              </a>

              <a
                href="tel:108"
                className="btn btn-emergency btn-sm"
                style={{ fontWeight: 700 }}
              >
                <Phone size={15} />
                Direct 108 Bay
              </a>

              <button
                onClick={() => setShowCancelModal(true)}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 700 }}
              >
                {tr('Cancel Emergency', 'एम्बुलेंस रद्द करें', 'रुग्णवाहिका रद्द करा')}
              </button>
            </div>
          </div>

          {/* NEAREST POLICE STATION ALERT & EVIDENCE TRANSMISSION CARD */}
          {activeEmergency.policeStation ? (
            <div
              className="card"
              style={{
                padding: '1.35rem 1.5rem',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
                border: '2px solid #3B82F6',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 4px 16px rgba(30, 58, 138, 0.12)'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: '#1D4ED8',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      boxShadow: '0 2px 8px rgba(29, 78, 216, 0.3)'
                    }}
                  >
                    🚓
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E3A8A' }}>
                        {tr('✓ Nearest Police Station Alerted & Evidence Transmitted', '✓ निकटतम पुलिस थाना को अलर्ट व साक्ष्य प्रेषित', '✓ जवळच्या पोलीस ठाण्याला माहिती व फोटो पाठवले')}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 800,
                          padding: '2px 7px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: '#1E40AF',
                          color: 'white'
                        }}
                      >
                        {activeEmergency.policeStation.diaryEntryNumber}
                      </span>
                    </div>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#1D4ED8' }}>
                      {tr(
                        'Exact accident location & uploaded scene photos transmitted to local police jurisdiction & 112 PCR patrol.',
                        'दुर्घटना स्थल का जीपीएस स्थान व अपलोड की गई फोटो पुलिस थाने व 112 पीसीआर को तुरंत पहुंचा दी गई हैं।',
                        'अपघाताचे जीपीएस ठिकाण आणि फोटो स्थानिक पोलीस ठाण्याला तात्काळ पाठवले आहेत.'
                      )}
                    </p>
                  </div>
                </div>

                {/* Live PCR ETA Badge */}
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: '1.5px solid #93C5FD',
                    textAlign: 'right'
                  }}
                >
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1E40AF' }}>
                    {tr('PCR Patrol ETA', 'पीसीआर वैन ईटीए', 'पीसीआर गाडी येण्याची वेळ')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1D4ED8', lineHeight: 1.1 }}>
                    0{activeEmergency.policeStation.etaMinutes || 5} min
                  </div>
                </div>
              </div>

              {/* Station, Patrol & Officer Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  fontSize: '0.85rem'
                }}
              >
                {/* Station Name */}
                <div style={{ background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                    <Building2 size={15} />
                    <span>{tr('Nearest Police Station:', 'नजदीकी पुलिस थाना:', 'जवळचे पोलीस ठाणे:')}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>{activeEmergency.policeStation.stationName}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                    {activeEmergency.policeStation.jurisdiction}
                  </div>
                </div>

                {/* PCR Unit */}
                <div style={{ background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                    <ShieldAlert size={15} />
                    <span>{tr('Assigned PCR Patrol Unit:', 'तैनात पीसीआर गश्ती यूनिट:', 'नेमलेली पीसीआर गस्त तुकडी:')}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>
                    {activeEmergency.policeStation.pcrUnit} ({activeEmergency.policeStation.pcrDriver})
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '2px', fontWeight: 600 }}>
                    ● {activeEmergency.policeStation.status}
                  </div>
                </div>

                {/* Duty Officer */}
                <div style={{ background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div style={{ fontWeight: 800, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                    <User size={15} />
                    <span>{tr('Officer in Charge:', 'ड्यूटी ऑफिसर / जांच अधिकारी:', 'तपास अधिकारी:')}</span>
                  </div>
                  <div style={{ fontWeight: 800, color: '#0F172A' }}>{activeEmergency.policeStation.officerInCharge}</div>
                  <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '2px' }}>
                    {tr('GD Log:', 'डायरी संदर्भ:', 'जीडी नोंद क्रमांक:')} {activeEmergency.policeStation.diaryEntryNumber}
                  </div>
                </div>
              </div>

              {/* Transmitted Location & Transmitted Photos Evidence Box */}
              <div
                style={{
                  background: '#FFFFFF',
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  border: '1.5px solid #93C5FD',
                  marginBottom: '1rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, color: '#1E40AF', fontSize: '0.85rem' }}>
                      <MapPin size={16} color="#1D4ED8" />
                      <span>{tr('Accident Location Transmitted to Police:', 'थाने को प्रेषित दुर्घटना स्थल (GPS Coordinates):', 'पोलीस ठाण्याला पाठवलेले अपघात स्थळ:')}</span>
                    </div>
                    <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', marginTop: '2px' }}>
                      {activeEmergency.policeStation.accidentLocation || activeEmergency.address}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontFamily: 'monospace', marginTop: '2px' }}>
                      Lat: {activeEmergency.policeStation.accidentCoords?.lat?.toFixed(5) || activeEmergency.patientCoords.lat.toFixed(5)}, Lng: {activeEmergency.policeStation.accidentCoords?.lng?.toFixed(5) || activeEmergency.patientCoords.lng.toFixed(5)} &bull; High Precision GPS
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: '#DCFCE7',
                      color: '#166534',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}
                  >
                    <Check size={12} /> {tr('Location Verified', 'लोकेशन सत्यापित', 'स्थान पडताळणी पूर्ण')}
                  </span>
                </div>

                {/* Uploaded Evidence Photos transmitted to police */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Camera size={14} color="#1D4ED8" />
                      <span>
                        {tr(
                          `Scene Evidence Photos Transmitted to Police Station (${(activeEmergency.policeStation.photosTransmitted?.length || activeEmergency.photoUrls?.length || (activeEmergency.photoUrl ? 1 : 0))} photos):`,
                          `थाने को प्रेषित साक्ष्य फोटो (${(activeEmergency.policeStation.photosTransmitted?.length || activeEmergency.photoUrls?.length || (activeEmergency.photoUrl ? 1 : 0))} फोटो):`,
                          `पोलीस ठाण्यास पाठवलेली छायाचित्रे (${(activeEmergency.policeStation.photosTransmitted?.length || activeEmergency.photoUrls?.length || (activeEmergency.photoUrl ? 1 : 0))} फोटो):`
                        )}
                      </span>
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#15803D', fontWeight: 700 }}>
                      ✓ {tr('Logged in Police GD', 'पुलिस रिकॉर्ड में दर्ज', 'पोलीस दप्तरी नोंद झाली')}
                    </span>
                  </div>

                  {(activeEmergency.policeStation.photosTransmitted?.length > 0 || activeEmergency.photoUrls?.length > 0 || activeEmergency.photoUrl) ? (
                    <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                      {(activeEmergency.policeStation.photosTransmitted || activeEmergency.photoUrls || [activeEmergency.photoUrl]).map((imgSrc, pIdx) => (
                        <div
                          key={pIdx}
                          style={{
                            position: 'relative',
                            width: 68,
                            height: 68,
                            borderRadius: '6px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1.5px solid #3B82F6',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}
                        >
                          <img src={imgSrc} alt={`Evidence photo ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              background: 'rgba(29, 78, 216, 0.85)',
                              color: 'white',
                              fontSize: '0.55rem',
                              fontWeight: 800,
                              padding: '1px 3px',
                              borderRadius: '2px'
                            }}
                          >
                            ✓ Police
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic', padding: '0.25rem 0' }}>
                      {tr(
                        'No photos uploaded yet. You can upload photos below; they will automatically synchronize to the police station.',
                        'कोई फोटो संलग्न नहीं। नीचे "फोटो जोड़ें" बटन से घटनास्थल की फोटो भेजें ताकि पुलिस तुरंत साक्ष्य देख सके।',
                        'कोणतेही फोटो जोडलेले नाहीत. खालील बटणाने फोटो जोडा, ते थेट पोलीस ठाण्यास पोहोचतील.'
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Direct Police Hotline Call Buttons */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <a
                  href="tel:112"
                  className="btn btn-sm"
                  style={{
                    backgroundColor: '#1D4ED8',
                    color: 'white',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <Phone size={14} />
                  {tr('Police Hotline (112)', 'पुलिस नियंत्रण कक्ष (112)', 'पोलीस नियंत्रण कक्ष (११२)')}
                </a>

                <a
                  href={`tel:${activeEmergency.policeStation.stationPhone}`}
                  className="btn btn-outline btn-sm"
                  style={{
                    borderColor: '#1D4ED8',
                    color: '#1D4ED8',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <Phone size={14} />
                  {tr('Call Thana', 'थाना फोन', 'ठाण्याला फोन')}
                </a>

                <a
                  href={`tel:${activeEmergency.policeStation.pcrPhone}`}
                  className="btn btn-outline btn-sm"
                  style={{
                    borderColor: '#1D4ED8',
                    color: '#1D4ED8',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.45rem 0.9rem',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <Phone size={14} />
                  {tr('Call PCR Patrol', 'पीसीआर ड्राइवर', 'पीसीआर चालक')}
                </a>
              </div>
            </div>
          ) : (
            /* If police was not alerted initially, provide immediate 1-click police alert */
            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                background: 'linear-gradient(135deg, #EFF6FF 0%, #FFFFFF 100%)',
                border: '1.5px solid #93C5FD',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🚓</span>
                <div>
                  <div style={{ fontWeight: 800, color: '#1E3A8A', fontSize: '0.92rem' }}>
                    {tr(
                      'Serious Accident or Crime? Alert Nearest Police Station (थाना)',
                      'गंभीर दुर्घटना या विवाद? नजदीकी पुलिस थाने को भी सूचित करें',
                      'गंभीर अपघात किंवा वाद? जवळच्या पोलीस ठाण्याला कळवा'
                    )}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#1D4ED8' }}>
                    {tr(
                      'Instantly transmits live accident location & uploaded evidence photos to local police and 112 PCR patrol.',
                      'क्लिक करते ही दुर्घटना की लाइव लोकेशन व सभी फोटो नजदीकी थाने व 112 पीसीआर को भेज दी जाएंगी।',
                      'क्लिक करताच अपघाताचे थेट स्थान आणि सर्व फोटो पोलीस व ११२ पीसीआरकडे पाठवले जातील.'
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleAlertPoliceNow}
                className="btn btn-sm"
                style={{
                  backgroundColor: '#1D4ED8',
                  color: 'white',
                  fontWeight: 800,
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)'
                }}
              >
                <span>🚓 {tr('Alert Police Station Now (112)', 'थाने को तुरंत अलर्ट भेजें (112)', 'पोलीस ठाण्याला त्वरित अलर्ट पाठवा (११२)')}</span>
              </button>
            </div>
          )}

          {/* TRANSMITTED EMERGENCY PHOTOS & REAL-TIME UPLOADER */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: '#FEF2F2',
                    color: 'var(--emergency)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Camera size={18} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tr('Emergency Scene & Patient Photos', 'संलग्न आपातकालीन फोटो (डॉक्टर व 108 टीम)', 'जोडलेले आणीबाणी फोटो (डॉक्टर व 108 टीम)')}
                  </h4>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {tr('Live telemetry available to emergency trauma team', 'पीएचसी ट्रॉमा बे और एम्बुलेंस पायलट द्वारा लाइव समीक्षा', 'पीएचसी ट्रॉमा बे आणि रुग्णवाहिका पायलटद्वारे थेट पुनरावलोकन')}
                  </div>
                </div>
                {((activeEmergency.photoUrls && activeEmergency.photoUrls.length > 0) || activeEmergency.photoUrl) && (
                  <span className="badge badge-emergency" style={{ fontSize: '0.7rem', fontWeight: 800 }}>
                    {activeEmergency.photoUrls?.length || (activeEmergency.photoUrl ? 1 : 0)} {tr('Photos', 'फोटो', 'फोटो')}
                  </span>
                )}
              </div>

              {/* Real-time live photo uploader */}
              <div>
                <input
                  id="live-emergency-photo-input"
                  type="file"
                  accept="image/*"
                  multiple
                  capture="environment"
                  onChange={handleUploadLivePhotos}
                  style={{ display: 'none' }}
                  disabled={isUploadingLivePhotos}
                />
                <label
                  htmlFor="live-emergency-photo-input"
                  className="btn btn-outline btn-sm"
                  style={{
                    cursor: isUploadingLivePhotos ? 'not-allowed' : 'pointer',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    borderColor: 'var(--emergency)',
                    color: 'var(--emergency)'
                  }}
                >
                  <Plus size={14} />
                  <span>{isUploadingLivePhotos ? tr('Sending...', 'भेजा जा रहा है...', 'पाठवले जात आहे...') : tr('+ Send More Photos Live', '+ और फोटो भेजें', '+ आणखी फोटो थेट पाठवा')}</span>
                </label>
              </div>
            </div>

            {((activeEmergency.photoUrls && activeEmergency.photoUrls.length > 0) || activeEmergency.photoUrl) ? (
              <div>
                <div style={{ display: 'flex', gap: '0.65rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
                  {(activeEmergency.photoUrls || (activeEmergency.photoUrl ? [activeEmergency.photoUrl] : [])).map((imgUrl, pIdx) => (
                    <div
                      key={pIdx}
                      onClick={() => setViewingPhotoIndex(pIdx)}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        width: 80,
                        height: 80,
                        cursor: 'pointer',
                        border: '2px solid #CBD5E1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
                      }}
                      title="Click to view full size"
                    >
                      <img src={imgUrl} alt={`Emergency Photo ${pIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'rgba(0,0,0,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          opacity: 0.8
                        }}
                      >
                        <Eye size={16} />
                      </div>
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          right: 2,
                          background: 'rgba(0,0,0,0.7)',
                          color: '#fff',
                          fontSize: '0.6rem',
                          padding: '1px 4px',
                          borderRadius: 3,
                          fontWeight: 800
                        }}
                      >
                        #{pIdx + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '0.35rem', fontWeight: 600 }}>
                  ✓ {tr('All photos synchronized with attending doctor & emergency dispatch unit.', 'सभी फोटो अस्पताल कैजुअल्टी कक्ष एवं डॉक्टर को उपलब्ध हैं।', 'सर्व फोटो रुग्णालय कॅज्युल्टी कक्ष आणि डॉक्टरांना उपलब्ध आहेत.')}
                </div>
              </div>
            ) : (
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '8px',
                  background: '#F8FAFC',
                  border: '1px dashed #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>
                  {tr(
                    'No photos attached yet. You can snap live photos of injuries or scene landmarks to help the medical team.',
                    'कोई फोटो संलग्न नहीं है। घायल या स्थान की फोटो खींचकर सीधे डॉक्टर को भेजें।',
                    'अद्याप कोणतेही फोटो जोडलेले नाहीत. जखमी व्यक्तीचे किंवा घटनास्थळाचे थेट फोटो काढून वैद्यकीय पथकाला पाठवा.'
                  )}
                </span>
                <label
                  htmlFor="live-emergency-photo-input"
                  className="btn btn-primary btn-sm"
                  style={{ cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0, marginLeft: '0.75rem' }}
                >
                  <Camera size={13} /> {tr('Snap Photo', 'फोटो लें', 'फोटो काढा')}
                </label>
              </div>
            )}
          </div>

          {/* HOSPITAL & ASSIGNED DOCTOR NOTIFICATION STATUS */}
          <div
            className="card"
            style={{
              padding: '1.25rem 1.5rem',
              background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
              border: '2px solid #86EFAC',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.85rem' }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: '#059669',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#065F46' }}>
                  {tr('✓ Hospital & Duty Doctor Received Your SOS Alert', '✓ अस्पताल एवं डॉक्टर को सूचना व लोकेशन भेजी गई', '✓ रुग्णालय आणि कर्तव्यावरील डॉक्टरांना सूचना व स्थान पाठवले')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                  {tr(
                    'Your live GPS coordinates, incident report, and emergency telemetry have been transmitted to both hospital & duty physician.',
                    'आपका जीपीएस स्थान, स्थिति का विवरण और आपातकालीन अलर्ट दोनों को तुरंत पहुंचा दिया गया है।',
                    'तुमचे थेट GPS स्थान, घटनेचा तपशील आणि आणीबाणी अलर्ट दोन्हीकडे तात्काळ पाठवले गेले आहेत.'
                  )}
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.85rem'
              }}
            >
              {/* Hospital Reception */}
              <div style={{ background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                  <Building2 size={16} />
                  <span>{tr('Receiving Hospital Desk:', 'प्राप्तकर्ता अस्पताल डेस्क:', 'स्वीकारणारे रुग्णालय डेस्क:')}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#1E293B' }}>{activeEmergency.hospitalName}</div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px' }}>
                  {tr('● Trauma Bay 1 Ready • Oxygen & Resuscitation Prepped', '● ट्रॉमा बे 1 तैयार • ऑक्सीजन और पुनर्जीवन किट तैयार', '● ट्रॉमा बे १ सज्ज • ऑक्सिजन आणि पुनरुत्थान किट सज्ज')}
                </div>
              </div>

              {/* Assigned Doctor */}
              <div style={{ background: '#FFFFFF', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #BBF7D0' }}>
                <div style={{ fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '2px' }}>
                  <User size={16} />
                  <span>{tr('Assigned Emergency Doctor:', 'नियुक्त आपातकालीन डॉक्टर:', 'नियुक्त आणीबाणी डॉक्टर:')}</span>
                </div>
                <div style={{ fontWeight: 700, color: '#1E293B' }}>
                  {activeEmergency.assignedDoctor?.name || (language === 'hi' ? 'डॉ. अंजलि मेहता' : language === 'mr' ? 'डॉ. अंजली मेहता' : 'Dr. Anjali Mehta')} ({activeEmergency.assignedDoctor?.specialty || tr('Duty Medical Officer', 'कर्तव्य चिकित्सा अधिकारी', 'कर्तव्यावरील वैद्यकीय अधिकारी')})
                </div>
                <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>● {tr('Status:', 'स्थिति:', 'स्थिती:')} {activeEmergency.assignedDoctor?.status || tr('Reviewing Case', 'मामले की समीक्षा जारी', 'प्रकरणाची समीक्षा सुरू')}</span>
                  <a
                    href={`tel:${activeEmergency.assignedDoctor?.phone || '+91 98220 12345'}`}
                    style={{ color: '#059669', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    {tr('Call Doctor', 'डॉक्टर को कॉल करें', 'डॉक्टरांना कॉल करा')}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* DOCTOR DIRECT MEDICAL ADVISORY & TWO-WAY REPLIES */}
          <div
            className="card"
            style={{
              padding: '1.5rem',
              backgroundColor: '#FFFFFF',
              border: '2px solid #38BDF8',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.12)'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: '#0284C7',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HeartPulse size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tr('👨‍⚕️ Live Medical Advisory from Dr. Anjali Mehta', '👨‍⚕️ डॉक्टर अंजलि मेहता से सीधे निर्देश व सलाह', '👨‍⚕️ डॉ. अंजली मेहता यांच्याकडून थेट वैद्यकीय सल्ला')}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {tr(
                      'Real-time guidance directly from the duty emergency physician',
                      'अस्पताल के आपातकालीन चिकित्सक द्वारा भेजे गए सीधे निर्देश',
                      'कर्तव्यावरील आपत्कालीन डॉक्टरांकडून थेट मार्गदर्शन'
                    )}
                  </p>
                </div>
              </div>

              <span className="badge badge-info" style={{ fontWeight: 700 }}>
                ● {tr('Real-Time Two-Way Channel', 'रियल-टाइम दुतर्फा संपर्क', 'थेट दुहेरी संवाद वाहिनी')}
              </span>
            </div>

            {/* Messages Thread */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                maxHeight: '260px',
                overflowY: 'auto',
                marginBottom: '1rem',
                paddingRight: '0.25rem'
              }}
            >
              {activeEmergency.doctorMessages && activeEmergency.doctorMessages.length > 0 ? (
                activeEmergency.doctorMessages.map((msg) => {
                  const isDoc = msg.isDoctor !== false;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isDoc ? 'flex-start' : 'flex-end',
                        maxWidth: '88%',
                        background: isDoc ? '#F0F9FF' : '#F1F5F9',
                        border: isDoc ? '1.5px solid #7DD3FC' : '1px solid #CBD5E1',
                        borderRadius: '12px',
                        padding: '0.75rem 1rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '3px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isDoc ? '#0369A1' : '#475569' }}>
                          {isDoc ? `👨‍⚕️ ${msg.sender} (${msg.senderRole || tr('Doctor', 'डॉक्टर', 'डॉक्टर')})` : `👤 ${tr('You', 'आप', 'तुम्ही')} (${msg.sender})`}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{msg.timestamp}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#0F172A', fontWeight: 600, lineHeight: 1.45 }}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  {tr("Awaiting doctor's clinical instructions...", 'डॉक्टर के निर्देशों की प्रतीक्षा है...', 'डॉक्टरांच्या वैद्यकीय सूचनांची प्रतीक्षा आहे...')}
                </div>
              )}
            </div>

            {/* Quick Acknowledge Chips for Patient / Bystander */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', alignSelf: 'center' }}>
                {tr('Quick Update:', 'त्वरित उत्तर:', 'त्वरित प्रतिसाद:')}
              </span>
              {[
                tr('✓ Patient is lying flat as advised', '✓ मरीज को निर्देशानुसार लिटा दिया गया है', '✓ रुग्णाला सल्ल्यानुसार सपाट झोपवले आहे'),
                tr('✓ Direct pressure applied to wound', '✓ घाव पर सीधा दबाव बनाया गया है', '✓ जखमेवर थेट दाब दिला आहे'),
                tr('✓ Airway is clear and open', '✓ श्वासनली खुली और साफ है', '✓ श्वासनलिका मोकळी आणि स्वच्छ आहे'),
                tr('✓ Bystanders are assisting at scene', '✓ आसपास के लोग मदद कर रहे हैं', '✓ घटनास्थळावरील नागरिक मदत करत आहेत')
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendUserReply(chip)}
                  style={{
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                    color: '#0284C7',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Two-Way Reply Input for Caller with Mic Voice Option */}
            {activeMicTarget === 'chat' && (
              <div
                style={{
                  marginBottom: '0.5rem',
                  padding: '0.4rem 0.75rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: '#991B1B'
                }}
              >
                <span>🎙️ {tr('Listening... Speak message to doctor', 'डॉक्टर के लिए संदेश बोलें...', 'डॉक्टरांसाठी संदेश बोला...')}</span>
                <button
                  type="button"
                  onClick={() => handleToggleVoice('chat')}
                  className="btn btn-emergency btn-sm"
                  style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', height: 22 }}
                >
                  {tr('Stop', 'रोकें', 'थांबवा')}
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder={
                  tr(
                    'Send status update, symptom change, or question to Dr. Anjali Mehta...',
                    'डॉक्टर अंजलि मेहता को मरीज की स्थिति या प्रश्न का संदेश भेजें...',
                    'डॉ. अंजली मेहता यांना रुग्णाची स्थिती किंवा प्रश्न पाठवा...'
                  )
                }
                value={userReplyText}
                onChange={(e) => setUserReplyText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendUserReply(); }}
                style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  borderColor: activeMicTarget === 'chat' ? '#DC2626' : undefined
                }}
              />
              <button
                type="button"
                onClick={() => handleToggleVoice('chat')}
                className={`btn btn-sm ${activeMicTarget === 'chat' ? 'btn-emergency' : 'btn-outline'}`}
                style={{
                  padding: '0 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: activeMicTarget === 'chat' ? '#DC2626' : 'var(--primary)',
                  color: activeMicTarget === 'chat' ? '#FFFFFF' : 'var(--primary)',
                  background: activeMicTarget === 'chat' ? '#DC2626' : '#EFF6FF'
                }}
                title={activeMicTarget === 'chat' ? tr('Stop mic', 'माइक रोकें', 'माइक थांबवा') : tr('Speak message to doctor', 'डॉक्टर को संदेश बोलें', 'डॉक्टरांना संदेश बोला')}
              >
                {activeMicTarget === 'chat' ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
              <button
                onClick={() => handleSendUserReply()}
                disabled={isSendingUserReply || !userReplyText.trim()}
                className="btn btn-primary"
                style={{ fontWeight: 800, padding: '0.5rem 1.25rem' }}
              >
                {tr('Send', 'भेजें', 'पाठवा')}
              </button>
            </div>
          </div>

          {/* FIRST-AID GUIDANCE CARDS */}
          <div className="card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <ShieldAlert size={22} color="var(--primary)" />
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {t('firstAidTitle')} ({tr('Safe Protocols while Waiting', 'एम्बुलेंस आने तक प्राथमिक उपचार', 'रुग्णवाहिका येईपर्यंत प्रथमोपचार सूचना')})
              </h3>
            </div>

            {/* Category selection tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                overflowX: 'auto',
                marginBottom: '1.25rem',
                paddingBottom: '0.25rem'
              }}
            >
              {firstAidGuides.map((guide) => (
                <button
                  key={guide.id}
                  onClick={() => setFirstAidCategory(guide.id)}
                  className={`btn btn-sm ${firstAidCategory === guide.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.8rem' }}
                >
                  {guide.title}
                </button>
              ))}
            </div>

            {/* Active Guide Card */}
            <div
              style={{
                backgroundColor: 'var(--surface-alt)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            >
              <h4 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-primary)', fontSize: '1.05rem' }}>
                {currentGuide.title}
              </h4>
              <ol
                style={{
                  paddingLeft: '1.25rem',
                  margin: 0,
                  fontSize: '0.9rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}
              >
                {currentGuide.steps.map((s, idx) => (
                  <li key={idx} style={{ marginBottom: '0.4rem' }}>
                    {s}
                  </li>
                ))}
              </ol>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  color: '#92400E',
                  fontSize: '0.8rem',
                  fontWeight: 600
                }}
              >
                ⚠️ {currentGuide.warning} {tr('Seek professional emergency care immediately.', 'तुरंत आपातकालीन चिकित्सा सहायता प्राप्त करें।', 'त्वरित व्यावसायिक आपत्कालीन वैद्यकीय मदत घ्या.')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IN-APP CANCEL EMERGENCY CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)} style={{ zIndex: 1000 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C' }}>
                <AlertCircle size={22} color="var(--emergency)" />
                {tr('Cancel Emergency Dispatch?', 'क्या आप एम्बुलेंस रद्द करना चाहते हैं?', 'तुम्हाला रुग्णवाहिका पाठवणे रद्द करायचे आहे का?')}
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCancelModal(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                {tr(
                  'The en route 108 ambulance (MH-14-EM-1084) will be notified to abort the response and returned to the station.',
                  'पुष्टि करने पर रवाना हुई 108 एम्बुलेंस (MH-14-EM-1084) को वापस बुला लिया जाएगा और खेड पीएचसी को सूचित कर दिया जाएगा।',
                  'पुष्टी केल्यास रवाना झालेल्या १०८ रुग्णवाहिकेला (MH-14-EM-1084) परत बोलावले जाईल आणि खेड पीएचसीला कळवले जाईल.'
                )}
              </p>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>
                  {tr('Reason for Cancellation:', 'रद्द करने का कारण:', 'रद्द करण्याचे कारण:')}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {[
                    { id: 'accidental', label: tr('Accidental SOS trigger', 'गलती से कॉल दर्ज हुआ', 'चुकून SOS ट्रिगर झाला') },
                    { id: 'stabilized', label: tr('Patient condition improved', 'मरीज की हालत में सुधार', 'रुग्णाच्या प्रकृतीत सुधारणा झाली') },
                    { id: 'private_vehicle', label: tr('Arranged private vehicle', 'निजी वाहन की व्यवस्था हो गई', 'खाजगी वाहनाची व्यवस्था झाली') },
                    { id: 'other', label: tr('Other reason', 'अन्य कारण', 'इतर कारण') }
                  ].map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        padding: '0.65rem 0.85rem',
                        backgroundColor: cancelReason === item.id ? '#FEF2F2' : 'var(--surface-alt)',
                        border: cancelReason === item.id ? '1px solid var(--emergency)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      <input
                        type="radio"
                        name="cancel_reason"
                        checked={cancelReason === item.id}
                        onChange={() => setCancelReason(item.id)}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCancelModal(false)}
                  style={{ flex: 1, fontWeight: 700 }}
                >
                  {tr('Keep Ambulance', 'नहीं, आने दें', 'नाही, रुग्णवाहिका येऊ द्या')}
                </button>
                <button
                  type="button"
                  className="btn btn-emergency"
                  onClick={handleConfirmCancelEmergency}
                  style={{ flex: 1, fontWeight: 800 }}
                >
                  {tr('Yes, Cancel Dispatch', 'हाँ, रद्द करें', 'होय, डिस्पॅच रद्द करा')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ENLARGED PHOTO VIEWER / LIGHTBOX MODAL */}
      {viewingPhotoIndex !== null && activeEmergency && (
        <div className="modal-overlay" onClick={() => setViewingPhotoIndex(null)} style={{ zIndex: 1200 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#991B1B' }}>
                <Camera size={18} color="var(--emergency)" />
                <span>
                  {tr('Emergency Photo', 'आपातकालीन फोटो', 'आणीबाणी फोटो')} ({viewingPhotoIndex + 1} of {(activeEmergency.photoUrls || [activeEmergency.photoUrl]).length})
                </span>
              </h3>
              <button onClick={() => setViewingPhotoIndex(null)} className="btn btn-ghost btn-sm">✕</button>
            </div>
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              <img
                src={(activeEmergency.photoUrls || [activeEmergency.photoUrl])[viewingPhotoIndex]}
                alt="Enlarged emergency photo"
                style={{ maxWidth: '100%', maxHeight: '460px', borderRadius: '8px', border: '1px solid #CBD5E1', objectFit: 'contain' }}
              />
              {((activeEmergency.photoUrls || [activeEmergency.photoUrl]).length > 1) && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                  <button
                    onClick={() => setViewingPhotoIndex((prev) => (prev > 0 ? prev - 1 : (activeEmergency.photoUrls || [activeEmergency.photoUrl]).length - 1))}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    ◀ {tr('Previous', 'पिछला', 'मागील')}
                  </button>
                  <button
                    onClick={() => setViewingPhotoIndex((prev) => (prev < (activeEmergency.photoUrls || [activeEmergency.photoUrl]).length - 1 ? prev + 1 : 0))}
                    className="btn btn-outline btn-sm"
                    style={{ fontWeight: 700 }}
                  >
                    {tr('Next', 'अगला', 'पुढील')} ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
