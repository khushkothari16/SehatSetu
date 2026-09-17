import React, { useState, useEffect } from 'react';
import {
  Heart,
  User,
  UserCheck,
  Building,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  KeyRound,
  FileBadge,
  MapPin,
  Stethoscope,
  Camera,
  AlertTriangle,
  X,
  PhoneCall,
  Navigation,
  Clock,
  ShieldAlert,
  AlertCircle,
  Flame,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  Settings,
  Smartphone,
  RefreshCw,
  Send,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { authService } from '../services/authService';
import { emergencyService } from '../services/emergencyService';
import { locationService } from '../services/locationService';
import { LeafletMap } from '../components/common/LeafletMap';
import { BiometricPromptModal } from '../components/BiometricPromptModal';
import {
  getEnrolledCredentialForUser,
  hasAnyEnrolledBiometric,
  verifyBiometricAssertion
} from '../services/biometricService';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';
import {
  isFirebaseConfigured,
  setupRecaptcha,
  resetRecaptcha,
  sendPhoneOtpSms,
  verifyPhoneOtpSms,
  formatFirebasePhoneError,
  getFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig
} from '../config/firebase';

export const AuthPage = ({ onAuthSuccess }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const { location: accidentLocation } = useLocation();

  // Step 1: 'select_role', Step 2: 'auth_form'
  const [authStep, setAuthStep] = useState('select_role');
  const [selectedRole, setSelectedRole] = useState('patient'); // 'patient', 'doctor', 'hospital_admin'

  // Direct Accident / Emergency Reporting State (NO LOGIN REQUIRED)
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [accidentPhotos, setAccidentPhotos] = useState([]);
  const accidentPhoto = accidentPhotos[0] || null;
  const [accidentCategory, setAccidentCategory] = useState('Road Accident / Vehicle Crash');
  const [accidentDesc, setAccidentDesc] = useState('');
  const [bystanderPhone, setBystanderPhone] = useState('');
  const [isDispatchingAccident, setIsDispatchingAccident] = useState(false);
  const [dispatchedEmergencyRecord, setDispatchedEmergencyRecord] = useState(null);


  // Form mode: 'signin' or 'register'
  const [formMode, setFormMode] = useState('signin');
  // Auth method: 'phone', 'email', or 'google'
  const [authMethod, setAuthMethod] = useState('phone');

  // Input states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [bioScanState, setBioScanState] = useState('idle'); // 'idle' | 'scanning' | 'verifying' | 'success' | 'error'
  const isBioScanningRef = React.useRef(false);

  // Real-Time Firebase Phone OTP States
  const [countryCode, setCountryCode] = useState('+91');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [showFirebaseModal, setShowFirebaseModal] = useState(false);
  const [firebaseActive, setFirebaseActive] = useState(() => isFirebaseConfigured());
  const [fbConfigInput, setFbConfigInput] = useState(() => {
    const cfg = getFirebaseConfig();
    return {
      apiKey: cfg.apiKey || '',
      authDomain: cfg.authDomain || '',
      projectId: cfg.projectId || '',
      storageBucket: cfg.storageBucket || '',
      messagingSenderId: cfg.messagingSenderId || '',
      appId: cfg.appId || ''
    };
  });
  const [fbJsonInput, setFbJsonInput] = useState('');

  // 60-second Resend OTP countdown ticker
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Role-specific fields
  const [village, setVillage] = useState('Khed (Rajgurunagar)');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [medicalRegNo, setMedicalRegNo] = useState('');
  const [specialty, setSpecialty] = useState('General Medicine');
  const [hospitalName, setHospitalName] = useState('Khed Primary Health Centre (PHC)');
  const [facilityId, setFacilityId] = useState('');

  // Google Popup modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  // Background sync and location lock for Accident Reporting
  useEffect(() => {
    if (showAccidentModal) {
      locationService.getCurrentLocation().then((loc) => {
        if (loc) setAccidentLocation(loc);
      });
      const active = emergencyService.getActiveEmergencySync();
      if (active) setDispatchedEmergencyRecord(active);
    }
  }, [showAccidentModal]);

  // Live ambulance tracking ticker for unauthenticated accident report
  useEffect(() => {
    if (!dispatchedEmergencyRecord) return;
    const interval = setInterval(async () => {
      const updated = await emergencyService.tickAmbulanceLocation();
      if (updated) {
        setDispatchedEmergencyRecord(updated);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [dispatchedEmergencyRecord?.id]);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (showAccidentModal) {
        e.preventDefault();
        setShowAccidentModal(false);
        return;
      }
      if (showGoogleModal) {
        e.preventDefault();
        setShowGoogleModal(false);
        return;
      }
      if (authStep === 'auth_form') {
        e.preventDefault();
        setAuthStep('select_role');
        return;
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [showAccidentModal, showGoogleModal, authStep]);

  const handleAccidentPhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files || files.length === 0) return;

    // Support up to 8 scene photos
    const remainingSlots = 8 - accidentPhotos.length;
    if (remainingSlots <= 0) {
      addToast(tr('Maximum 8 accident photos allowed.', 'अधिकतम 8 फोटो की अनुमति है।', 'जास्तीत जास्त ८ फोटो जोडता येतील.'), 'warning');
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAccidentPhotos((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    // Reset file input so user can choose or snap another picture
    e.target.value = '';
  };

  const removeAccidentPhoto = (indexToRemove) => {
    setAccidentPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSendAccidentDispatch = async (e) => {
    e.preventDefault();
    setIsDispatchingAccident(true);
    try {
      const fullDescription = `[Accident Report] ${accidentCategory}${accidentDesc ? `: ${accidentDesc}` : ''}${bystanderPhone ? ` | Reporter Tel: ${bystanderPhone}` : ''}`;
      const record = await emergencyService.dispatchEmergency({
        targetType: 'someone_else',
        description: fullDescription,
        photoUrl: accidentPhotos[0] || null,
        photoUrls: accidentPhotos,
        userCoords: { lat: accidentLocation?.lat || 28.1878, lng: accidentLocation?.lng || 75.5001 },
        address: accidentLocation?.fullAddress || `${accidentLocation?.village || 'Current Location'}, India`,
        callerName: bystanderPhone ? `Bystander (${bystanderPhone})` : 'Bystander Citizen',
        callerPhone: bystanderPhone || '+91 98765 43210'
      });
      setDispatchedEmergencyRecord(record);
      addToast(
        tr(
          `🚨 Accident report sent with ${accidentPhotos.length} photo(s)! 108 Ambulance dispatched immediately.`,
          `🚨 दुर्घटना रिपोर्ट भेज दी गई (${accidentPhotos.length} फोटो संलग्न)! 108 एम्बुलेंस तुरंत रवाना।`,
          `🚨 अपघात अहवाल पाठवला (${accidentPhotos.length} फोटो संलग्न)! १०८ रुग्णवाहिका लगेच निघाली.`
        ),
        'error'
      );
    } catch (err) {
      addToast(err.message || 'Dispatch failed', 'error');
    } finally {
      setIsDispatchingAccident(false);
    }
  };

  const handleCancelAccidentEmergency = async () => {
    await emergencyService.cancelEmergency();
    setDispatchedEmergencyRecord(null);
    setAccidentPhotos([]);
    setAccidentDesc('');
    setShowAccidentModal(false);
    addToast('Emergency dispatch cancelled.', 'info');
  };


  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setAuthStep('auth_form');
    if (role === 'doctor') {
      setAuthMethod('email');
      setEmail('dr.anjali.mehta@phc.gov.in');
      setPassword('demo');
    } else if (role === 'hospital_admin') {
      setAuthMethod('email');
      setEmail('admin.khedphc@arogya.gov.in');
      setPassword('demo');
    } else if (role === 'asha') {
      setAuthMethod('phone');
      setPhone('9765433211');
    } else {
      setAuthMethod('phone');
      setPhone('9876543210');
    }
  };

  const handleSendOtp = async () => {
    const rawNumber = phone.replace(/[^0-9]/g, '');
    if (rawNumber.length < 10) {
      addToast('Please enter a valid 10-digit mobile number.', 'error');
      return;
    }

    if (!isFirebaseConfigured()) {
      setShowFirebaseModal(true);
      addToast('Firebase credentials required to send real SMS to physical mobile phones.', 'warning');
      return;
    }

    const cleanTenDigits = rawNumber.slice(-10);
    const fullPhoneNumber = `${countryCode} ${cleanTenDigits}`;
    setIsSendingOtp(true);

    try {
      const verifier = setupRecaptcha('recaptcha-container', () => {
        addToast('Security verification expired. Please try again.', 'warning');
        setIsSendingOtp(false);
      });

      const confirmation = await sendPhoneOtpSms(`${countryCode}${cleanTenDigits}`, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtpCountdown(60);
      setOtp('');
      addToast(`Real SMS OTP dispatched to ${fullPhoneNumber}! Check your phone messages.`, 'success');
    } catch (fbErr) {
      console.error('[Firebase Phone Auth Send OTP Error]', fbErr);
      resetRecaptcha();
      const friendlyMsg = formatFirebasePhoneError(fbErr);
      addToast(friendlyMsg, 'error');
      if (fbErr.code?.includes('api-key-not-valid') || fbErr.message?.includes('API key') || fbErr.code?.includes('app-not-authorized')) {
        setShowFirebaseModal(true);
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSaveFirebaseConfig = () => {
    if (!fbConfigInput.apiKey || !fbConfigInput.projectId) {
      addToast('Firebase API Key and Project ID are required.', 'error');
      return;
    }
    const success = saveFirebaseConfig(fbConfigInput);
    if (success) {
      setFirebaseActive(true);
      setShowFirebaseModal(false);
      addToast('Firebase config saved! Real-time SMS OTP is now live.', 'success');
    } else {
      addToast('Failed to save Firebase configuration.', 'error');
    }
  };

  const handleParseQuickJson = () => {
    try {
      const jsonStr = fbJsonInput
        .replace(/const\s+\w+\s*=\s*/g, '')
        .replace(/;\s*$/g, '')
        .trim();

      const apiKeyMatch = jsonStr.match(/apiKey:\s*["']([^"']+)["']/);
      const authDomainMatch = jsonStr.match(/authDomain:\s*["']([^"']+)["']/);
      const projectIdMatch = jsonStr.match(/projectId:\s*["']([^"']+)["']/);
      const storageBucketMatch = jsonStr.match(/storageBucket:\s*["']([^"']+)["']/);
      const messagingSenderIdMatch = jsonStr.match(/messagingSenderId:\s*["']([^"']+)["']/);
      const appIdMatch = jsonStr.match(/appId:\s*["']([^"']+)["']/);

      const parsed = {
        apiKey: apiKeyMatch ? apiKeyMatch[1] : '',
        authDomain: authDomainMatch ? authDomainMatch[1] : '',
        projectId: projectIdMatch ? projectIdMatch[1] : '',
        storageBucket: storageBucketMatch ? storageBucketMatch[1] : '',
        messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '',
        appId: appIdMatch ? appIdMatch[1] : ''
      };

      if (!parsed.apiKey && jsonStr.startsWith('{')) {
        const directJson = JSON.parse(jsonStr);
        Object.assign(parsed, directJson);
      }

      if (parsed.apiKey && parsed.projectId) {
        setFbConfigInput(parsed);
        saveFirebaseConfig(parsed);
        setFirebaseActive(true);
        setShowFirebaseModal(false);
        addToast('Firebase credentials verified and active! Live SMS ready.', 'success');
      } else {
        addToast('Could not find valid apiKey and projectId in pasted text.', 'error');
      }
    } catch (e) {
      addToast('Invalid configuration format. Please verify and try again.', 'error');
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (formMode === 'signin') {
        if (authMethod === 'phone') {
          if (!otpSent) {
            await handleSendOtp();
            setIsLoading(false);
            return;
          }
          if (!otp || otp.length < 6) {
            addToast('Please enter the 6-digit OTP code received on your phone.', 'error');
            setIsLoading(false);
            return;
          }

          setIsVerifyingOtp(true);
          let firebaseUser = null;

          if (confirmationResult) {
            try {
              const cred = await verifyPhoneOtpSms(confirmationResult, otp);
              firebaseUser = cred.user;
            } catch (err) {
              console.error('[Firebase Verify OTP Error]', err);
              addToast(formatFirebasePhoneError(err), 'error');
              setIsVerifyingOtp(false);
              setIsLoading(false);
              return;
            }
          }

          const rawNumber = phone.replace(/[^0-9]/g, '');
          const cleanTenDigits = rawNumber.slice(-10);
          const fullPhone = `${countryCode} ${cleanTenDigits}`;
          const res = await authService.loginWithPhoneOtp(fullPhone, otp, selectedRole, firebaseUser);
          addToast(`Device verified! Logged in as ${res.user.name}`, 'success');
          onAuthSuccess(res);
        } else {
          // Email
          const res = await authService.loginWithEmail(email, password, selectedRole);
          addToast(`Logged in successfully as ${res.user.name}!`, 'success');
          onAuthSuccess(res);
        }
      } else {
        // Registration
        let firebaseUser = null;
        if (authMethod === 'phone') {
          if (!otpSent) {
            await handleSendOtp();
            setIsLoading(false);
            return;
          }
          if (!otp || otp.length < 6) {
            addToast('Please enter the 6-digit OTP code received on your phone.', 'error');
            setIsLoading(false);
            return;
          }

          if (confirmationResult) {
            try {
              const cred = await verifyPhoneOtpSms(confirmationResult, otp);
              firebaseUser = cred.user;
            } catch (err) {
              console.error('[Firebase Register Verify Error]', err);
              addToast(formatFirebasePhoneError(err), 'error');
              setIsLoading(false);
              return;
            }
          }
        }

        const roleSpecificData = {};
        if (selectedRole === 'patient') {
          roleSpecificData.village = village;
          roleSpecificData.bloodGroup = bloodGroup;
        } else if (selectedRole === 'doctor') {
          roleSpecificData.medicalRegNo = medicalRegNo || 'MMC-2026-9901';
          roleSpecificData.specialty = specialty;
          roleSpecificData.hospital = hospitalName;
        } else if (selectedRole === 'hospital_admin') {
          roleSpecificData.facilityName = hospitalName;
          roleSpecificData.facilityId = facilityId || 'PHC-PUN-088';
        } else if (selectedRole === 'asha') {
          roleSpecificData.medicalRegNo = medicalRegNo || 'ASHA-MH-2026-4018';
          roleSpecificData.village = village || 'Khed Rural & Alandi Sector';
          roleSpecificData.connectedPhc = hospitalName || 'Khed Primary Health Centre (PHC)';
          roleSpecificData.phcId = 'PHC-PUN-042';
        }

        const rawNumber = phone.replace(/[^0-9]/g, '');
        const fullPhone = `${countryCode} ${rawNumber.slice(-10)}`;

        const res = await authService.registerUser({
          role: selectedRole,
          name: name || (selectedRole === 'doctor' ? 'Dr. Healthcare Provider' : selectedRole === 'asha' ? 'Sunita Kamble (ASHA)' : 'Registered User'),
          email,
          phone: fullPhone,
          password,
          roleSpecificData,
          authProvider: authMethod === 'phone' ? 'firebase_phone' : 'email',
          phoneVerified: true
        });

        addToast(`Mobile verified & registered as ${res.user.name}!`, 'success');
        onAuthSuccess(res);
      }
    } catch (err) {
      addToast(err.message || 'Authentication error', 'error');
    } finally {
      setIsLoading(false);
      setIsVerifyingOtp(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const res = await authService.loginWithGoogle(selectedRole);
      setShowGoogleModal(false);
      addToast(`Google Sign-In verified for ${res.user.name}!`, 'success');
      onAuthSuccess(res);
    } catch (err) {
      addToast('Google Sign-In failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricSuccess = async (assertion) => {
    setIsLoading(true);
    setShowBiometricModal(false);
    try {
      const res = await authService.loginWithBiometrics(selectedRole, assertion?.credential);
      addToast(
        language === 'hi'
          ? `बायोमेट्रिक सत्यापित! ${res.user.name} के रूप में लॉगिन किया गया`
          : language === 'mr'
            ? `बायोमेट्रिक प्रमाणित! ${res.user.name} म्हणून लॉगिन केले`
            : `Biometric Verified! Logged in as ${res.user.name}`,
        'success'
      );
      onAuthSuccess(res);
    } catch (err) {
      addToast(err.message || 'Biometric authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      console.warn('Audio chime skipped:', e);
    }
  };

  const handleStartInlineScan = async () => {
    if (isBioScanningRef.current) return;
    isBioScanningRef.current = true;
    setBioScanState('scanning');

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate([40, 60, 40]); } catch {}
    }

    try {
      // Step 1: Scanning ridges animation (650ms)
      await new Promise((res) => setTimeout(res, 650));
      setBioScanState('verifying');

      // Step 2: Biometric / WebAuthn validation
      const assertion = await verifyBiometricAssertion(selectedRole);

      // Step 3: Verified status & chime
      await new Promise((res) => setTimeout(res, 400));
      playSuccessChime();
      setBioScanState('success');

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(100); } catch {}
      }

      await new Promise((res) => setTimeout(res, 600));
      const res = await authService.loginWithBiometrics(selectedRole, assertion?.credential);
      addToast(
        language === 'hi'
          ? `बायोमेट्रिक सत्यापित! ${res.user.name} के रूप में लॉगिन किया गया`
          : language === 'mr'
            ? `बायोमेट्रिक प्रमाणित! ${res.user.name} म्हणून लॉगिन केले`
            : `Biometric Verified! Logged in as ${res.user.name}`,
        'success'
      );
      isBioScanningRef.current = false;
      onAuthSuccess(res);
    } catch (err) {
      console.error('[Biometric Scan Error]', err);
      isBioScanningRef.current = false;
      setBioScanState('error');
      addToast(err.message || 'Fingerprint verification failed. Tap to retry.', 'error');
    }
  };

  // Quick evaluator demo logins
  const handleQuickDemoLogin = async (demoRole) => {
    setIsLoading(true);
    try {
      if (demoRole === 'patient') {
        const res = await authService.loginWithPhoneOtp('+91 98765 43210', '1234', 'patient');
        addToast('Signed in as Demo Patient (Rahul Sharma)', 'success');
        onAuthSuccess(res);
      } else if (demoRole === 'doctor') {
        const res = await authService.loginWithEmail('dr.anjali.mehta@phc.gov.in', 'demo', 'doctor');
        addToast('Signed in as Demo Doctor (Dr. Anjali Mehta)', 'success');
        onAuthSuccess(res);
      } else if (demoRole === 'asha') {
        const res = await authService.loginWithPhoneOtp('+91 97654 33211', '1234', 'asha');
        addToast('Signed in as Frontline ASHA Worker (Sunita Kamble)', 'success');
        onAuthSuccess(res);
      } else {
        const res = await authService.loginWithEmail('admin.khedphc@arogya.gov.in', 'demo', 'hospital_admin');
        addToast('Signed in as Hospital Admin (Dr. Suresh Deshpande)', 'success');
        onAuthSuccess(res);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--primary)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <Heart size={30} fill="white" strokeWidth={1.5} />
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: '2rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)'
          }}
        >
          {t('appName')}
        </h1>
      </div>

      {/* STEP 1: ROLE SELECTION GATE */}
      {authStep === 'select_role' ? (
        <div
          className="card animate-fade-in"
          style={{
            maxWidth: 820,
            width: '100%',
            padding: '2.5rem 2rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* HIGH-PRIORITY DIRECT ACCIDENT & EMERGENCY REPORTING - COMPLETE CIRCLE EMERGENCY BUTTON */}
          <div
            onClick={() => setShowAccidentModal(true)}
            style={{
              width: 220,
              height: 220,
              maxWidth: '100%',
              borderRadius: '50%',
              margin: '0 auto 2.5rem auto',
              background: 'radial-gradient(circle, #EF4444 0%, #DC2626 60%, #991B1B 100%)',
              border: '4px solid #FFFFFF',
              boxShadow: '0 0 0 8px rgba(239, 68, 68, 0.25), 0 16px 36px -4px rgba(220, 38, 38, 0.45)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              animation: 'pulse 2s infinite',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              color: 'white'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.04)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            title="Emergency - Click to Open"
          >
            <AlertTriangle size={42} strokeWidth={2.6} style={{ marginBottom: '0.4rem', color: '#FFFFFF' }} />
            <span
              style={{
                fontSize: '1.4rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#FFFFFF'
              }}
            >
              Emergency
            </span>
          </div>

          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="badge badge-info" style={{ fontWeight: 700, marginBottom: '0.5rem' }}>
              STEP 1: ROLE SELECTION / भूमिका चयन
            </span>
            <h2 style={{ margin: '4px 0 0 0', fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {t('selectRoleTitle')}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem'
            }}
          >
            {/* 1. Patient Role */}
            <div
              className="card card-clickable"
              onClick={() => handleSelectRole('patient')}
              style={{
                padding: '1.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid var(--primary)',
                background: 'linear-gradient(to bottom, #FFFFFF, #F0FDFA)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <User size={30} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {t('rolePatientTitle')}
                </h3>
              </div>

              <div style={{ marginTop: '1.25rem', color: 'var(--primary)', fontWeight: 800, fontSize: '0.85rem' }}>
                Enter Patient Portal &rarr;
              </div>
            </div>

            {/* 2. Doctor Role */}
            <div
              className="card card-clickable"
              onClick={() => handleSelectRole('doctor')}
              style={{
                padding: '1.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid #0284C7',
                background: 'linear-gradient(to bottom, #FFFFFF, #F0F9FF)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#0284C7',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Stethoscope size={30} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0284C7' }}>
                  {t('roleDoctorTitle')}
                </h3>
              </div>

              <div style={{ marginTop: '1.25rem', color: '#0284C7', fontWeight: 800, fontSize: '0.85rem' }}>
                Enter Doctor Workspace &rarr;
              </div>
            </div>

            {/* 3. Hospital Admin Role */}
            <div
              className="card card-clickable"
              onClick={() => handleSelectRole('hospital_admin')}
              style={{
                padding: '1.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid #7C3AED',
                background: 'linear-gradient(to bottom, #FFFFFF, #FAF5FF)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#7C3AED',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <Building size={30} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#7C3AED' }}>
                  {t('roleHospitalTitle')}
                </h3>
              </div>

              <div style={{ marginTop: '1.25rem', color: '#7C3AED', fontWeight: 800, fontSize: '0.85rem' }}>
                Enter Admin Portal &rarr;
              </div>
            </div>

            {/* 4. ASHA Worker Role */}
            <div
              className="card card-clickable"
              onClick={() => handleSelectRole('asha')}
              style={{
                padding: '1.75rem 1.25rem',
                borderRadius: 'var(--radius-lg)',
                border: '2px solid #0D9488',
                background: 'linear-gradient(to bottom, #FFFFFF, #F0FDFA)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: '#0D9488',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem auto',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <HeartHandshake size={30} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0D9488' }}>
                  {language === 'hi' ? 'आशा कार्यकर्ता' : language === 'mr' ? 'आशा सेविका' : 'ASHA Worker'}
                </h3>
              </div>

              <div style={{ marginTop: '1.25rem', color: '#0D9488', fontWeight: 800, fontSize: '0.85rem' }}>
                Enter ASHA Desk &rarr;
              </div>
            </div>
          </div>

          {/* Quick Evaluator Demo Login Row */}
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-alt)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              fontSize: '0.85rem'
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              ⚡ 1-Click Demo Evaluation Sign-in:
            </span>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => handleQuickDemoLogin('patient')}
                className="btn btn-outline btn-sm"
              >
                Rahul Sharma (Patient)
              </button>
              <button
                onClick={() => handleQuickDemoLogin('doctor')}
                className="btn btn-outline btn-sm"
              >
                Dr. Anjali Mehta (Doctor)
              </button>
              <button
                onClick={() => handleQuickDemoLogin('hospital_admin')}
                className="btn btn-outline btn-sm"
              >
                Khed PHC Incharge (Admin)
              </button>
              <button
                onClick={() => handleQuickDemoLogin('asha')}
                className="btn btn-outline btn-sm"
                style={{ borderColor: '#0D9488', color: '#0D9488', fontWeight: 700 }}
              >
                👩‍⚕️ Sunita Kamble (ASHA Worker)
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: AUTHENTICATION FORM (SIGN IN / REGISTER) */
        <div
          className="card animate-fade-in"
          style={{
            maxWidth: 520,
            width: '100%',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Header & Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button
              onClick={() => { setAuthStep('select_role'); setOtpSent(false); }}
              className="btn btn-outline btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700,
                fontSize: '0.82rem',
                borderRadius: 'var(--radius-full)',
                padding: '0.35rem 0.75rem',
                borderColor: '#cbd5e1',
                color: 'var(--text-primary)'
              }}
              title="Go back to role selection"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
              <span>{language === 'hi' ? '← वापस (भूमिका चयन)' : language === 'mr' ? '← मागे (भूमिका)' : '← Back (Role Selection)'}</span>
            </button>


            <span
              className="badge"
              style={{
                backgroundColor: selectedRole === 'doctor' ? '#E0F2FE' : selectedRole === 'hospital_admin' ? '#F3E8FF' : selectedRole === 'asha' ? '#CCFBF1' : 'var(--primary-light)',
                color: selectedRole === 'doctor' ? '#0284C7' : selectedRole === 'hospital_admin' ? '#7C3AED' : selectedRole === 'asha' ? '#0D9488' : 'var(--primary)',
                fontWeight: 700
              }}
            >
              {selectedRole === 'doctor' ? '👨‍⚕️ Doctor' : selectedRole === 'hospital_admin' ? '🏥 Hospital Admin' : selectedRole === 'asha' ? '👩‍⚕️ ASHA Worker' : '🧑‍⚕️ Patient'}
            </span>
          </div>

          {/* Quick 1-Click Role Direct Entry Banner */}
          {formMode === 'signin' && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: selectedRole === 'doctor' ? '#F0F9FF' : selectedRole === 'hospital_admin' ? '#FAF5FF' : selectedRole === 'asha' ? '#F0FDFA' : '#F0FDF4',
              border: `1.5px dashed ${selectedRole === 'doctor' ? '#0284C7' : selectedRole === 'hospital_admin' ? '#7C3AED' : selectedRole === 'asha' ? '#0D9488' : '#16A34A'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {selectedRole === 'doctor'
                    ? 'Dr. Anjali Mehta (Medical Officer)'
                    : selectedRole === 'hospital_admin'
                    ? 'Dr. Suresh Deshpande (Admin)'
                    : selectedRole === 'asha'
                    ? 'Sunita Kamble (ASHA Worker)'
                    : 'Rahul Sharma (Patient)'}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {selectedRole === 'doctor' ? 'NMC-2026-9901 • Khed PHC' : 'Ready for 1-click evaluation'}
                </div>
              </div>
              <button
                type="button"
                id="quick-role-entry-btn"
                onClick={() => handleQuickDemoLogin(selectedRole)}
                className="btn btn-sm"
                style={{
                  backgroundColor: selectedRole === 'doctor' ? '#0284C7' : selectedRole === 'hospital_admin' ? '#7C3AED' : selectedRole === 'asha' ? '#0D9488' : 'var(--primary)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  padding: '0.45rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                ⚡ 1-Click Login
              </button>
            </div>
          )}

          {/* Sign In vs Register Tabs */}
          <div
            style={{
              display: 'flex',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-alt)',
              padding: '4px',
              marginBottom: '1.5rem'
            }}
          >
            <button
              type="button"
              onClick={() => { setFormMode('signin'); setOtpSent(false); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: formMode === 'signin' ? 'white' : 'transparent',
                color: formMode === 'signin' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: formMode === 'signin' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {t('signIn')}
            </button>

            <button
              type="button"
              onClick={() => { setFormMode('register'); setOtpSent(false); }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                backgroundColor: formMode === 'register' ? 'white' : 'transparent',
                color: formMode === 'register' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: formMode === 'register' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              {t('register')}
            </button>
          </div>

          {/* Sign In With Google Button (Prominent One-Tap OAuth) */}
          <button
            type="button"
            onClick={() => setShowGoogleModal(true)}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-strong)',
              backgroundColor: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              fontWeight: 700,
              fontSize: '0.925rem',
              color: '#1F2937',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1.25rem',
              transition: 'all 0.15s ease'
            }}
          >
            {/* Google SVG Logo */}
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
            </svg>
            <span>{t('signInWithGoogle')}</span>
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
          </div>

          {/* Toggle Phone vs Email vs Biometric Method */}
          <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setAuthMethod('phone')}
              className={`btn btn-sm ${authMethod === 'phone' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, minWidth: 100, fontWeight: 700 }}
            >
              <Phone size={14} /> Mobile (OTP)
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('email')}
              className={`btn btn-sm ${authMethod === 'email' ? 'btn-primary' : 'btn-outline'}`}
              style={{ flex: 1, minWidth: 100, fontWeight: 700 }}
            >
              <Mail size={14} /> Email
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('biometric');
                handleStartInlineScan();
              }}
              className={`btn btn-sm ${authMethod === 'biometric' ? 'btn-primary' : 'btn-outline'}`}
              style={{
                flex: 1.2,
                minWidth: 120,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                background: authMethod === 'biometric' ? 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)' : undefined,
                color: authMethod === 'biometric' ? 'white' : undefined,
                borderColor: authMethod === 'biometric' ? '#0D9488' : undefined
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                <path d="M2 12a10 10 0 0 1 18-6" />
                <path d="M2 16h.01" />
                <path d="M21.8 16c.2-2 .13-5.35 0-6" />
                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
              </svg>
              <span>{language === 'hi' ? 'फिंगरप्रिंट' : language === 'mr' ? 'फिंगरप्रिंट' : 'Fingerprint'}</span>
            </button>
          </div>

          {authMethod === 'biometric' ? (
            <div
              style={{
                backgroundColor: '#F0FDFA',
                border: '2px solid #0D9488',
                borderRadius: 'var(--radius-xl)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.15)',
                position: 'relative'
              }}
            >
              {/* Central Interactive Biometric Sensor Circle */}
              <div
                onClick={handleStartInlineScan}
                style={{
                  position: 'relative',
                  width: 106,
                  height: 106,
                  borderRadius: '50%',
                  background: bioScanState === 'success'
                    ? 'radial-gradient(circle, #DCFCE7 0%, #BBF7D0 100%)'
                    : bioScanState === 'error'
                    ? 'radial-gradient(circle, #FEE2E2 0%, #FECACA 100%)'
                    : bioScanState === 'scanning' || bioScanState === 'verifying'
                    ? 'radial-gradient(circle, #CCFBF1 0%, #99F6E4 100%)'
                    : 'linear-gradient(135deg, #0F766E 0%, #0D9488 100%)',
                  border: `3.5px solid ${
                    bioScanState === 'success'
                      ? '#16A34A'
                      : bioScanState === 'error'
                      ? '#DC2626'
                      : bioScanState === 'scanning' || bioScanState === 'verifying'
                      ? '#0D9488'
                      : '#0D9488'
                  }`,
                  color: 'white',
                  margin: '0 auto 1.25rem auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: bioScanState === 'scanning' || bioScanState === 'verifying' ? 'wait' : 'pointer',
                  boxShadow: bioScanState === 'scanning' || bioScanState === 'verifying'
                    ? '0 0 32px rgba(13, 148, 136, 0.6), 0 0 0 8px rgba(13, 148, 136, 0.15)'
                    : bioScanState === 'success'
                    ? '0 0 32px rgba(22, 163, 74, 0.6)'
                    : '0 8px 24px rgba(13, 148, 136, 0.35)',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.2s ease',
                  userSelect: 'none'
                }}
                onMouseEnter={(e) => { if (bioScanState === 'idle') e.currentTarget.style.transform = 'scale(1.06)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                title="Tap to scan fingerprint"
              >
                {/* Concentric Ripple Waves while scanning */}
                {(bioScanState === 'scanning' || bioScanState === 'verifying') && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '50%',
                      border: '2px solid rgba(13, 148, 136, 0.7)',
                      animation: 'pulse 1.2s infinite ease-out'
                    }}
                  />
                )}

                {/* Laser Sweep Beam */}
                {(bioScanState === 'scanning' || bioScanState === 'verifying') && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'linear-gradient(90deg, transparent 0%, #0D9488 50%, transparent 100%)',
                      boxShadow: '0 0 12px 2px #14B8A6',
                      animation: 'scanLaser 1.2s infinite ease-in-out',
                      zIndex: 10
                    }}
                  />
                )}

                {bioScanState === 'success' ? (
                  <CheckCircle2 size={54} color="#16A34A" strokeWidth={2.4} />
                ) : bioScanState === 'error' ? (
                  <AlertCircle size={54} color="#DC2626" strokeWidth={2.4} />
                ) : (
                  <svg
                    width="54"
                    height="54"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={bioScanState === 'scanning' || bioScanState === 'verifying' ? '#0D9488' : '#FFFFFF'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ transition: 'stroke 0.25s ease' }}
                  >
                    <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                    <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                    <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                    <path d="M2 12a10 10 0 0 1 18-6" />
                    <path d="M2 16h.01" />
                    <path d="M21.8 16c.2-2 .13-5.35 0-6" />
                    <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                    <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                    <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
                  </svg>
                )}
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#CCFBF1', color: '#0F766E', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 800, marginBottom: '0.6rem' }}>
                <ShieldCheck size={14} />
                {selectedRole === 'doctor'
                  ? (language === 'hi' ? 'चिकित्सक बायोमेट्रिक आईडी' : language === 'mr' ? 'डॉक्टर बायोमेट्रिक ओळख' : 'Doctor Clinical Passkey')
                  : selectedRole === 'hospital_admin'
                    ? (language === 'hi' ? 'प्रशासक बायोमेट्रिक' : language === 'mr' ? 'प्रशासक बायोमेट्रिक' : 'Hospital Admin Biometric')
                    : (language === 'hi' ? 'नागरिक आभा बायोमेट्रिक' : language === 'mr' ? 'नागरिक आभा बायोमेट्रिक' : 'ABHA Citizen Biometric')}
              </div>

              <h3 style={{ margin: '0 0 0.4rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                {bioScanState === 'scanning'
                  ? (language === 'hi' ? 'फिंगरप्रिंट स्कैन हो रहा है...' : language === 'mr' ? 'फिंगरप्रिंट स्कॅन होत आहे...' : 'Scanning Biometric Ridges...')
                  : bioScanState === 'verifying'
                  ? (language === 'hi' ? 'पहचान सत्यापित की जा रही है...' : language === 'mr' ? 'ओळख पडताळत आहे...' : 'Verifying Digital Identity...')
                  : bioScanState === 'success'
                  ? (language === 'hi' ? 'सत्यापित! लॉगिन सफल ✓' : language === 'mr' ? 'प्रमाणित! लॉगिन यशस्वी ✓' : 'Fingerprint Verified! Logging In ✓')
                  : bioScanState === 'error'
                  ? (language === 'hi' ? 'स्कैन विफल - पुनः स्पर्श करें' : language === 'mr' ? 'स्कॅन अयशस्वी - पुन्हा प्रयत्न करा' : 'Scan Failed - Tap to Retry')
                  : (language === 'hi' ? 'फिंगरप्रिंट से 1-टच लॉगिन' : language === 'mr' ? 'फिंगरप्रिंट १-टच लॉगिन' : 'One-Touch Biometric Sign In')}
              </h3>
              <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.825rem', color: '#64748B', lineHeight: 1.4 }}>
                {bioScanState === 'scanning' || bioScanState === 'verifying'
                  ? (language === 'hi' ? 'उंगली सेंसर पर स्थिर रखें, प्रमाणीकरण जारी है...' : language === 'mr' ? 'बोट सेन्सरवर स्थिर ठेवा...' : 'Hold finger still on the sensor, validating...')
                  : bioScanState === 'success'
                  ? (language === 'hi' ? 'सुरक्षित पोर्टल में प्रवेश किया जा रहा है...' : language === 'mr' ? 'सुरक्षित पोर्टलमध्ये प्रवेश करत आहे...' : 'Access granted. Redirecting to dashboard...')
                  : (language === 'hi'
                    ? 'बटन या फिंगरप्रिंट पर क्लिक करते ही तुरंत स्वचालित स्कैनिंग शुरू होगी।'
                    : language === 'mr'
                      ? 'बटणावर किंवा फिंगरप्रिंटवर क्लिक करताच तात्काळ स्वयंचलित स्कॅनिंग सुरू होईल.'
                      : 'Click the button or sensor icon to start instant automatic fingerprint scanning.')}
              </p>

              {/* Big Direct Action Button */}
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleStartInlineScan}
                disabled={bioScanState === 'scanning' || bioScanState === 'verifying'}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  borderRadius: 'var(--radius-lg)',
                  background: bioScanState === 'success' ? '#16A34A' : bioScanState === 'error' ? '#DC2626' : undefined,
                  boxShadow: bioScanState === 'scanning' || bioScanState === 'verifying'
                    ? '0 0 20px rgba(13, 148, 136, 0.5)'
                    : '0 6px 18px rgba(13, 148, 136, 0.35)'
                }}
              >
                {bioScanState === 'scanning' ? (
                  <>
                    <span style={{ width: 8, height: 8, backgroundColor: '#FFFFFF', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    <span>{language === 'hi' ? 'स्कैनिंग जारी है...' : language === 'mr' ? 'स्कॅनिंग सुरू...' : 'Scanning Biometric Ridges...'}</span>
                  </>
                ) : bioScanState === 'verifying' ? (
                  <>
                    <ShieldCheck size={20} />
                    <span>{language === 'hi' ? 'ABHA सत्यापन...' : language === 'mr' ? 'ABHA पडताळणी...' : 'Verifying Identity with ABHA...'}</span>
                  </>
                ) : bioScanState === 'success' ? (
                  <>
                    <CheckCircle2 size={20} color="#FFFFFF" />
                    <span>{language === 'hi' ? 'सत्यापित! लॉगिन हो रहा है...' : language === 'mr' ? 'प्रमाणित! लॉगिन होत आहे...' : 'Verified! Logging in...'}</span>
                  </>
                ) : bioScanState === 'error' ? (
                  <>
                    <Sparkles size={20} />
                    <span>{language === 'hi' ? 'पुनः स्कैन करें (Retry)' : language === 'mr' ? 'पुन्हा स्कॅन करा' : 'Retry Fingerprint Scan'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    <span>
                      {language === 'hi' ? 'फिंगरप्रिंट सेंसर स्कैन करें' : language === 'mr' ? 'फिंगरप्रिंट स्कॅन करा' : 'Scan Fingerprint to Log In'}
                    </span>
                  </>
                )}
              </button>

              <div style={{ marginTop: '1.2rem', fontSize: '0.72rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                <span>🔒 FIDO2 / WebAuthn Certified • ABHA Linked</span>
              </div>

              {/* In-place Laser Animation Styles */}
              <style>{`
                @keyframes scanLaser {
                  0% { top: 12%; opacity: 0.3; }
                  50% { top: 85%; opacity: 1; }
                  100% { top: 12%; opacity: 0.3; }
                }
              `}</style>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleAuthSubmit}>
              {/* Name when registering */}
              {formMode === 'register' && (
                <div className="form-group">
                  <label className="form-label">
                    {selectedRole === 'doctor' ? 'Full Name (Dr.)' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={selectedRole === 'doctor' ? 'e.g. Dr. Ramesh Kulkarni' : 'e.g. Rahul Sharma'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              {/* Real-time SMS Gateway Status Indicator */}
              {authMethod === 'phone' && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.85rem',
                  padding: '0.45rem 0.75rem',
                  backgroundColor: firebaseActive ? '#ecfdf5' : '#fffbeb',
                  border: `1px solid ${firebaseActive ? '#a7f3d0' : '#fde68a'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.78rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: firebaseActive ? '#065f46' : '#92400e', fontWeight: 600 }}>
                    <span style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: firebaseActive ? '#10b981' : '#f59e0b',
                      display: 'inline-block'
                    }}></span>
                    <span>{firebaseActive ? 'Real-Time SMS Gateway: Active' : 'SMS Gateway: Config Required'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFirebaseModal(true)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0
                    }}
                  >
                    <Settings size={12} /> {firebaseActive ? 'Gateway Settings' : 'Configure Firebase'}
                  </button>
                </div>
              )}

              {/* Hidden container required by Firebase reCAPTCHA */}
              <div id="recaptcha-container"></div>

              {/* Phone Input */}
              {authMethod === 'phone' && (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Mobile Phone Number</label>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SMS sent to physical device</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 0.75rem',
                      backgroundColor: 'var(--bg-app)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      userSelect: 'none'
                    }}>
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      className="form-input"
                      placeholder="Enter 10-digit number"
                      maxLength={10}
                      disabled={otpSent || isSendingOtp}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                      required
                      style={{ flex: 1, fontWeight: 600, letterSpacing: '0.05em' }}
                    />
                    {otpSent && (
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(''); setConfirmationResult(null); }}
                        className="btn btn-ghost btn-sm"
                        style={{ whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}
                      >
                        Change Number
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Real 6-Digit SMS OTP Input Card */}
              {authMethod === 'phone' && otpSent && (
                <div className="form-group" style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  marginTop: '0.75rem',
                  marginBottom: '1rem',
                  animation: 'fadeIn 0.2s ease-out'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <ShieldCheck size={18} color="#16a34a" />
                    <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#166534' }}>
                      Enter 6-Digit SMS Verification Code
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.85rem 0', fontSize: '0.8rem', color: '#15803d', lineHeight: 1.4 }}>
                    Real SMS OTP has been sent to <strong>+91 {phone}</strong>. Enter the 6-digit code received on your phone to unlock access.
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      fontSize: '1.75rem',
                      fontWeight: 800,
                      letterSpacing: '0.65rem',
                      textAlign: 'center',
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid #86efac',
                      backgroundColor: 'white',
                      color: '#1e293b',
                      outline: 'none',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#166534' }}>
                      {otpCountdown > 0 ? (
                        <>Resend code in <strong>{otpCountdown}s</strong></>
                      ) : (
                        <span>Didn't receive SMS?</span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={otpCountdown > 0 || isSendingOtp}
                      onClick={handleSendOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: otpCountdown > 0 ? '#9ca3af' : '#0284c7',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: otpCountdown > 0 ? 'not-allowed' : 'pointer',
                        textDecoration: otpCountdown === 0 ? 'underline' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: 0
                      }}
                    >
                      <RefreshCw size={12} className={isSendingOtp ? 'animate-spin' : ''} />
                      Resend SMS
                    </button>
                  </div>
                </div>
              )}

              {/* Email Input */}
              {authMethod === 'email' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="e.g. rahul.sharma@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {/* ROLE-SPECIFIC FIELDS FOR REGISTRATION */}
              {formMode === 'register' && selectedRole === 'patient' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Village / Block</label>
                    <input
                      type="text"
                      className="form-input"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-select"
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                    >
                      <option value="A+">A+</option>
                      <option value="B+">B+</option>
                      <option value="O+">O+</option>
                      <option value="AB+">AB+</option>
                      <option value="A-">A-</option>
                      <option value="B-">B-</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
              )}

              {formMode === 'register' && selectedRole === 'doctor' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Medical Council Registration No. (NMC)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MMC-2016-08-4120"
                      value={medicalRegNo}
                      onChange={(e) => setMedicalRegNo(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specialty</label>
                    <select
                      className="form-select"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                    >
                      <option value="General Medicine">General Medicine</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Orthopedics">Orthopedics</option>
                      <option value="Gynecology">Gynecology</option>
                      <option value="ENT">ENT</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Affiliated PHC / Hospital</label>
                    <input
                      type="text"
                      className="form-input"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {formMode === 'register' && selectedRole === 'hospital_admin' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Health Facility Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Khed Primary Health Centre"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Government Facility Registration ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. PHC-MH-PUN-0042"
                      value={facilityId}
                      onChange={(e) => setFacilityId(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}

              {formMode === 'register' && selectedRole === 'asha' && (
                <>
                  <div className="form-group">
                    <label className="form-label">ASHA Worker Registration ID</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ASHA-MH-2026-4018"
                      value={medicalRegNo}
                      onChange={(e) => setMedicalRegNo(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Assigned Village / Ward</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Khed Rural & Alandi"
                        value={village}
                        onChange={(e) => setVillage(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Connected PHC</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Khed PHC"
                        value={hospitalName}
                        onChange={(e) => setHospitalName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%',
                  marginTop: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  height: 48
                }}
                disabled={isLoading || isSendingOtp || isVerifyingOtp}
              >
                {isSendingOtp ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Dispatching Real SMS to Phone...</span>
                  </>
                ) : isVerifyingOtp ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Verifying SMS Code with Firebase...</span>
                  </>
                ) : authMethod === 'phone' && !otpSent ? (
                  <>
                    <Send size={18} />
                    <span>{t('sendOtp')}</span>
                  </>
                ) : authMethod === 'phone' && otpSent ? (
                  <>
                    <ShieldCheck size={18} />
                    <span>{t('verifyOtp')}</span>
                  </>
                ) : isLoading ? (
                  'Processing Securely...'
                ) : formMode === 'signin' ? (
                  t('signIn')
                ) : (
                  t('register')
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Interactive Google Account Chooser Simulation */}
      {showGoogleModal && (
        <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: 0 }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginBottom: 6 }}>
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
              </svg>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Sign in with Google</h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Choose an account to continue to SehatSetu
              </p>
            </div>

            <div style={{ padding: '0.75rem' }}>
              <div
                onClick={handleGoogleSignIn}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  marginBottom: '0.5rem'
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  {selectedRole === 'doctor' ? 'A' : selectedRole === 'hospital_admin' ? 'S' : 'R'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {selectedRole === 'doctor' ? 'Dr. Anjali Mehta' : selectedRole === 'hospital_admin' ? 'Dr. Suresh Deshpande' : 'Rahul Sharma'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {selectedRole === 'doctor' ? 'dr.mehta.telemed@gmail.com' : selectedRole === 'hospital_admin' ? 'admin.khedhospital@gmail.com' : 'rahul.sharma.rural@gmail.com'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', textAlign: 'right' }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowGoogleModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Firebase Phone Authentication Configuration Modal */}
      {showFirebaseModal && (
        <div className="modal-overlay" onClick={() => setShowFirebaseModal(false)} style={{ zIndex: 1100 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540, padding: 0, overflow: 'hidden' }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.25rem 1.5rem',
              backgroundColor: '#1e293b',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Smartphone size={22} color="#f59e0b" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>
                    Firebase Phone Authentication Setup
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    Sends authentic SMS OTP to physical mobile numbers (10,000 free SMS/mo)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFirebaseModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.25rem 1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
              {/* Setup Guidance Alert */}
              <div style={{
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                fontSize: '0.8rem',
                color: '#1e40af',
                marginBottom: '1rem',
                lineHeight: 1.5
              }}>
                <div style={{ fontWeight: 800, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Sparkles size={14} color="#2563eb" /> 3 Steps to Enable Live SMS on your Device:
                </div>
                <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Go to <strong>Firebase Console</strong> (<a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 700 }}>console.firebase.google.com</a>) &gt; Select or Create a Project.</li>
                  <li>In <strong>Build &gt; Authentication &gt; Sign-in method</strong>, enable <strong>Phone</strong>.</li>
                  <li>In <strong>Project Settings &gt; General &gt; Your Apps</strong> (Web), copy the config and paste below.</li>
                </ol>
              </div>

              {/* Quick Paste Box */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                  Option 1: Quick Paste Firebase Config Object
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={`Paste full config here, e.g.:\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "my-health-app",\n  ...\n};`}
                  value={fbJsonInput}
                  onChange={(e) => setFbJsonInput(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                />
                <button
                  type="button"
                  onClick={handleParseQuickJson}
                  disabled={!fbJsonInput.trim()}
                  className="btn btn-outline btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%', fontWeight: 700 }}
                >
                  <Sparkles size={13} /> Auto-Detect & Apply Config
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0' }}>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>OR ENTER MANUALLY</span>
                <div style={{ flex: 1, height: 1, backgroundColor: 'var(--border)' }}></div>
              </div>

              {/* Manual Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">API Key (apiKey) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="AIzaSy..."
                    value={fbConfigInput.apiKey}
                    onChange={(e) => setFbConfigInput({ ...fbConfigInput, apiKey: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project ID (projectId) *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="sehatsetu-rural"
                    value={fbConfigInput.projectId}
                    onChange={(e) => setFbConfigInput({ ...fbConfigInput, projectId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Auth Domain (authDomain)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="sehatsetu-rural.firebaseapp.com"
                    value={fbConfigInput.authDomain}
                    onChange={(e) => setFbConfigInput({ ...fbConfigInput, authDomain: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">App ID (appId)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="1:123456789:web:abcdef"
                    value={fbConfigInput.appId}
                    onChange={(e) => setFbConfigInput({ ...fbConfigInput, appId: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Messaging Sender ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="123456789012"
                    value={fbConfigInput.messagingSenderId}
                    onChange={(e) => setFbConfigInput({ ...fbConfigInput, messagingSenderId: e.target.value })}
                  />
                </div>
              </div>

              {/* Testing tip */}
              <div style={{
                marginTop: '0.75rem',
                padding: '0.65rem 0.85rem',
                backgroundColor: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.75rem',
                color: '#64748b'
              }}>
                💡 <strong>Instant Test Numbers:</strong> In Firebase Console under Phone Auth, you can add numbers like <code>+919999999999</code> with code <code>123456</code> to test without using real SMS carrier quota, alongside ANY real mobile number.
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '0.85rem 1.5rem',
              borderTop: '1px solid var(--border)',
              backgroundColor: 'var(--bg-card)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  clearFirebaseConfig();
                  setFirebaseActive(false);
                  setFbConfigInput({ apiKey: '', authDomain: '', projectId: '', storageBucket: '', messagingSenderId: '', appId: '' });
                  addToast('Firebase credentials reset.', 'info');
                }}
                style={{ color: '#ef4444' }}
              >
                Reset Keys
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowFirebaseModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveFirebaseConfig}
                  style={{ fontWeight: 700 }}
                >
                  Save &amp; Enable Live SMS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DIRECT ACCIDENT PHOTO DISPATCH MODAL (NO LOGIN OR REGISTRATION REQUIRED) */}
      {showAccidentModal && (
        <div
          className="modal-overlay"
          onClick={() => !dispatchedEmergencyRecord && setShowAccidentModal(false)}
          style={{ zIndex: 1000 }}
        >
          <div
            className="modal-dialog animate-fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: dispatchedEmergencyRecord ? 680 : 540,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '2px solid var(--emergency)'
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: '1px solid #FECACA',
                backgroundColor: '#FEF2F2',
                padding: '1rem 1.25rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} color="var(--emergency)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#991B1B' }}>
                  {dispatchedEmergencyRecord
                    ? tr('🚨 108 Ambulance En Route (Live Tracking)', '🚨 108 एम्बुलेंस रास्ते में है (लाइव ट्रैकिंग)', '🚨 १०८ रुग्णवाहिका येत आहे (थेट मागोवा)')
                    : tr('Accident Photo Dispatch (108 SOS)', 'सड़क दुर्घटना रिपोर्ट (सीधे 108 सहायता)', 'अपघात अहवाल (थेट १०८ मदत)')}
                </h3>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAccidentModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {dispatchedEmergencyRecord ? (
                /* LIVE AMBULANCE TRACKING SCREEN (WITHOUT SIGNING IN) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div
                    style={{
                      padding: '1rem 1.25rem',
                      backgroundColor: '#FEF2F2',
                      borderRadius: 'var(--radius-lg)',
                      border: '2px solid #FCA5A5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 2 }}>
                        <span className="pulse-indicator"></span>
                        <span className="badge badge-emergency" style={{ fontWeight: 800 }}>
                          ● {dispatchedEmergencyRecord.status}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '1.15rem', color: '#991B1B' }}>
                        Vehicle: {dispatchedEmergencyRecord.ambulanceVehicleNumber}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7F1D1D' }}>
                        Heading to: <strong>{dispatchedEmergencyRecord.address}</strong>
                      </div>
                    </div>

                    <div
                      style={{
                        textAlign: 'center',
                        background: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #FECACA'
                      }}
                    >
                      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--emergency)' }}>ETA</div>
                      <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--emergency)', lineHeight: 1 }}>
                        0{dispatchedEmergencyRecord.etaMinutes}m
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {dispatchedEmergencyRecord.distanceKm} km
                      </div>
                    </div>
                  </div>

                  {/* Leaflet Live Map */}
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: 'var(--surface-alt)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>📍 Live GPS Ambulance Movement</span>
                      <span>Updates every 4s</span>
                    </div>
                    <LeafletMap
                      center={[dispatchedEmergencyRecord.patientCoords.lat, dispatchedEmergencyRecord.patientCoords.lng]}
                      zoom={14}
                      markers={[
                        {
                          lat: dispatchedEmergencyRecord.patientCoords.lat,
                          lng: dispatchedEmergencyRecord.patientCoords.lng,
                          title: 'Reported Accident Location',
                          subtitle: dispatchedEmergencyRecord.address,
                          type: 'patient'
                        },
                        {
                          lat: dispatchedEmergencyRecord.ambulanceCoords.lat,
                          lng: dispatchedEmergencyRecord.ambulanceCoords.lng,
                          title: `Ambulance ${dispatchedEmergencyRecord.ambulanceVehicleNumber}`,
                          subtitle: `${dispatchedEmergencyRecord.distanceKm} km away • Driver: ${dispatchedEmergencyRecord.driverName}`,
                          type: 'ambulance'
                        }
                      ]}
                      height="260px"
                    />
                  </div>

                  {/* Driver Contact & Casualty Notification */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem',
                      backgroundColor: 'var(--surface-alt)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      gap: '0.75rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ambulance Driver / Pilot:</div>
                      <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                        {dispatchedEmergencyRecord.driverName} ({dispatchedEmergencyRecord.ambulanceVehicleNumber})
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <a
                        href={`tel:${dispatchedEmergencyRecord.driverPhone}`}
                        className="btn btn-primary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <Phone size={14} /> Call Driver
                      </a>
                      <a
                        href="tel:108"
                        className="btn btn-emergency btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <Phone size={14} /> Dial 108
                      </a>
                    </div>
                  </div>

                  {accidentPhotos.length > 0 && (
                    <div
                      style={{
                        padding: '0.75rem 0.85rem',
                        background: '#F8FAFC',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          📷 {accidentPhotos.length} {tr('Accident Photo(s) Transmitted', 'फोटो अस्पताल व एम्बुलेंस को प्रेषित', 'छायाचित्रे रुग्णालय व रुग्णवाहिकेकडे पाठवली')}
                        </span>
                        <span className="badge badge-success" style={{ fontSize: '0.68rem', fontWeight: 700 }}>
                          ✓ Transmitted
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                        {accidentPhotos.map((p, idx) => (
                          <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
                            <img
                              src={p}
                              alt={`Scene ${idx + 1}`}
                              style={{ width: 56, height: 56, borderRadius: 6, objectFit: 'cover', border: '1.5px solid #CBD5E1' }}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                bottom: 2,
                                right: 2,
                                background: 'rgba(0,0,0,0.65)',
                                color: 'white',
                                fontSize: '0.62rem',
                                padding: '1px 4px',
                                borderRadius: 4,
                                fontWeight: 800
                              }}
                            >
                              #{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>
                        ✓ Accident scene pictures transmitted to casualty desk at{' '}
                        <strong>{dispatchedEmergencyRecord.hospitalName}</strong>
                      </div>
                    </div>
                  )}

                  {/* HOSPITAL & ASSIGNED DOCTOR NOTIFICATION STATUS */}
                  <div
                    style={{
                      padding: '0.75rem 1rem',
                      background: '#F0FDF4',
                      borderRadius: 'var(--radius-md)',
                      border: '1.5px solid #86EFAC',
                      fontSize: '0.825rem'
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#065F46', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '4px' }}>
                      <CheckCircle2 size={16} />
                      <span>Transmitted to Hospital & Duty Doctor:</span>
                    </div>
                    <div style={{ color: '#1E293B', fontWeight: 600 }}>
                      🏥 <strong>{dispatchedEmergencyRecord.hospitalName}</strong> &bull; Trauma Bay 1 Ready
                    </div>
                    <div style={{ color: '#1E293B', fontWeight: 600, marginTop: '2px' }}>
                      👨‍⚕️ Assigned Doctor: <strong>{dispatchedEmergencyRecord.assignedDoctor?.name || 'Dr. Anjali Mehta'}</strong> ({dispatchedEmergencyRecord.assignedDoctor?.phone || '+91 98220 12345'})
                    </div>
                  </div>

                  {/* DOCTOR DIRECT ADVISORIES STREAM */}
                  {dispatchedEmergencyRecord.doctorMessages && dispatchedEmergencyRecord.doctorMessages.length > 0 && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: '#F0F9FF',
                        borderRadius: 'var(--radius-md)',
                        border: '1.5px solid #38BDF8',
                        fontSize: '0.825rem'
                      }}
                    >
                      <div style={{ fontWeight: 800, color: '#0369A1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '6px' }}>
                        <span>👨‍⚕️</span>
                        <span>Emergency Physician Advice (Dr. Anjali Mehta):</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {dispatchedEmergencyRecord.doctorMessages.map((msg) => (
                          <div
                            key={msg.id}
                            style={{
                              background: '#FFFFFF',
                              padding: '0.45rem 0.65rem',
                              borderRadius: '6px',
                              border: '1px solid #BAE6FD',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{ color: '#0F172A', fontWeight: 600 }}>
                              <strong>{msg.sender}:</strong> {msg.text}
                            </span>
                            <span style={{ color: '#94A3B8', fontSize: '0.7rem', flexShrink: 0 }}>
                              {msg.timestamp}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAccidentModal(false)}
                      className="btn btn-outline"
                      style={{ flex: 1, fontWeight: 700 }}
                    >
                      Close & Keep Ambulance En Route
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelAccidentEmergency}
                      className="btn btn-sm"
                      style={{ borderColor: '#ef4444', color: '#b91c1c', fontWeight: 700 }}
                    >
                      Cancel Dispatch
                    </button>
                  </div>
                </div>
              ) : (
                /* ACCIDENT PHOTO SUBMISSION FORM */
                <form onSubmit={handleSendAccidentDispatch}>
                  {/* 1. Camera / Multi-Photo Capture Card */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label
                        className="form-label"
                        style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)', margin: 0 }}
                      >
                        <Camera size={16} color="var(--emergency)" />
                        <span>
                          {tr('Accident Scene Photos (Multiple Photos Allowed)', 'दुर्घटना की फोटो (एक या एक से अधिक फोटो लें)', 'अपघात स्थळाचे फोटो (एकाधिक फोटो घेता येतील)')}
                        </span>
                      </label>
                      {accidentPhotos.length > 0 && (
                        <span className="badge badge-emergency" style={{ fontWeight: 800, fontSize: '0.72rem' }}>
                          📷 {accidentPhotos.length} {tr('Selected', 'फोटो', 'फोटो निवडले')} (Max 8)
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        border: accidentPhotos.length > 0 ? '2px solid var(--primary)' : '2px dashed #DC2626',
                        borderRadius: 'var(--radius-lg)',
                        padding: '1rem',
                        backgroundColor: accidentPhotos.length > 0 ? '#F0FDFA' : '#FEF2F2',
                        position: 'relative'
                      }}
                    >
                      {accidentPhotos.length > 0 ? (
                        <div>
                          {/* Thumbnail Gallery Grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
                              gap: '0.65rem',
                              marginBottom: '0.85rem'
                            }}
                          >
                            {accidentPhotos.map((photoSrc, idx) => (
                              <div
                                key={idx}
                                style={{
                                  position: 'relative',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  aspectRatio: '1/1',
                                  border: '1.5px solid #CBD5E1',
                                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                  background: '#fff'
                                }}
                              >
                                <img
                                  src={photoSrc}
                                  alt={`Accident scene ${idx + 1}`}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: 3,
                                    left: 3,
                                    background: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    fontSize: '0.65rem',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontWeight: 800
                                  }}
                                >
                                  #{idx + 1}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeAccidentPhoto(idx);
                                  }}
                                  title="Remove this photo"
                                  style={{
                                    position: 'absolute',
                                    top: 3,
                                    right: 3,
                                    width: 22,
                                    height: 22,
                                    borderRadius: '50%',
                                    background: '#DC2626',
                                    color: 'white',
                                    border: '1.5px solid white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    padding: 0,
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                  }}
                                >
                                  <X size={13} strokeWidth={3} />
                                </button>
                              </div>
                            ))}

                            {/* Add More Photos Card in Grid */}
                            {accidentPhotos.length < 8 && (
                              <label
                                htmlFor="accident-camera-input"
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '8px',
                                  border: '2px dashed var(--primary)',
                                  background: '#FFFFFF',
                                  cursor: 'pointer',
                                  aspectRatio: '1/1',
                                  color: 'var(--primary)',
                                  transition: 'all 0.15s ease'
                                }}
                                title="Add another photo"
                              >
                                <Plus size={22} strokeWidth={2.5} />
                                <span style={{ fontSize: '0.68rem', fontWeight: 800, marginTop: '2px' }}>
                                  {tr('+ Add', '+ फोटो', '+ फोटो')}
                                </span>
                              </label>
                            )}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.78rem', color: '#0F766E', fontWeight: 600 }}>
                              ✓ {accidentPhotos.length} {tr('photos attached for emergency response team', 'फोटो जोड़ी गई', 'छायाचित्रे जोडली')}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <label
                                htmlFor="accident-camera-input"
                                className="btn btn-outline btn-sm"
                                style={{ cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                              >
                                <Camera size={14} />
                                {tr('+ Add More Photos', '+ और फोटो जोड़ें', '+ आणखी फोटो जोडा')}
                              </label>
                              <button
                                type="button"
                                onClick={() => setAccidentPhotos([])}
                                className="btn btn-ghost btn-sm"
                                style={{ fontSize: '0.75rem', color: '#DC2626' }}
                              >
                                {tr('Clear All', 'सभी हटाएं', 'सर्व काढा')}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="accident-camera-input"
                          style={{
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 0'
                          }}
                        >
                          <div
                            style={{
                              width: 56,
                              height: 56,
                              borderRadius: '50%',
                              backgroundColor: 'white',
                              color: 'var(--emergency)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 4px 12px rgba(220, 38, 38, 0.2)'
                            }}
                          >
                            <Camera size={28} />
                          </div>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#991B1B' }}>
                            {tr('📷 Click Accident Pictures (Open Camera / Multi-Select)', '📷 कैमरा खोलें / एक या अधिक फोटो अपलोड करें', '📷 कॅमेरा उघडा / छायाचित्रे निवडा')}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: '#7F1D1D' }}>
                            {tr('Capture multiple photos: scene, vehicle numbers, injuries, road landmarks', 'दुर्घटना स्थल, वाहन, मरीज या स्थान की कई फोटो ले सकते हैं', 'अपघात स्थळ, वाहनाचा नंबर, जखम व परिसराचे फोटो घ्या')}
                          </span>
                        </label>
                      )}

                      <input
                        id="accident-camera-input"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleAccidentPhotoUpload}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  {/* 2. GPS Location Confirmation */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {tr('Accident Location (Auto-Locked GPS)', 'घटना का स्थान (GPS द्वारा लॉक)', 'अपघात स्थळ (जीपीएस द्वारे लॉक केलेले)')}
                    </label>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        backgroundColor: 'var(--surface-alt)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.875rem',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <MapPin size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 700, color: '#0f172a' }}>
                          {accidentLocation?.fullAddress || `${accidentLocation?.village || 'Live GPS Location'}, India`}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: accidentLocation?.isLive ? '#15803d' : 'var(--text-muted)', background: accidentLocation?.isLive ? '#dcfce7' : 'transparent', padding: '1px 6px', borderRadius: '8px', fontWeight: 700 }}>
                          ({accidentLocation?.accuracy || 'Live Location'})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. Quick Incident Category Pills */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label" style={{ fontWeight: 700 }}>
                      {tr('Incident Category:', 'दुर्घटना का प्रकार:', 'अपघाताचा प्रकार:')}
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                      {[
                        { en: 'Road Accident / Vehicle Crash', hi: 'सड़क दुर्घटना / वाहन टक्कर', mr: 'रस्ता अपघात / वाहन धडक' },
                        { en: 'Severe Bleeding / Trauma', hi: 'गंभीर रक्तस्राव / चोट', mr: 'तीव्र रक्तस्त्राव / गंभीर इजा' },
                        { en: 'Unconscious Victim', hi: 'बेहोश मरीज', mr: 'बेशुद्ध रुग्ण' },
                        { en: 'Fall from Height', hi: 'ऊंचाई से गिरना', mr: 'उंचावरून पडणे' },
                        { en: 'Fire / Burn Emergency', hi: 'आग / जलना', mr: 'आगीत भाजणे' }
                      ].map((catObj) => (
                        <button
                          key={catObj.en}
                          type="button"
                          onClick={() => setAccidentCategory(catObj.en)}
                          className={`btn btn-sm ${accidentCategory === catObj.en ? 'btn-emergency' : 'btn-outline'}`}
                          style={{ fontSize: '0.78rem', borderRadius: 'var(--radius-full)' }}
                        >
                          {tr(catObj.en, catObj.hi, catObj.mr)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Optional Description */}
                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label className="form-label">
                      {tr('Brief Description / Injured Count (Optional)', 'संक्षिप्त विवरण (वैकल्पिक)', 'थोडक्यात माहिती / जखमी व्यक्ती संख्या (ऐच्छिक)')}
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder={
                        tr(
                          'e.g. 2 motorcycle riders injured, bleeding from leg near highway...',
                          'उदा. 2 बाइक सवार घायल, सिर में चोट, बस स्टैंड के पास...',
                          'उदा. २ दुचाकीस्वार जखमी, डोक्याला दुखापत, हायवे जवळ...'
                        )
                      }
                      value={accidentDesc}
                      onChange={(e) => setAccidentDesc(e.target.value)}
                    />
                  </div>

                  {/* 5. Optional Reporter Mobile Number */}
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label className="form-label">
                      {tr(
                        'Your Phone Number (Optional - for driver to call for directions)',
                        'आपका फोन नंबर (वैकल्पिक - चालक द्वारा रास्ता पूछने हेतु)',
                        'आपला फोन नंबर (ऐच्छिक - चालकाला पत्ता विचारण्यासाठी)'
                      )}
                    </label>
                    <input
                      type="tel"
                      className="form-input"
                      placeholder="+91 98XXX XXXXX"
                      value={bystanderPhone}
                      onChange={(e) => setBystanderPhone(e.target.value)}
                    />
                  </div>

                  {/* 6. Big Red Dispatch Button */}
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAccidentModal(false)}
                      className="btn btn-outline"
                      style={{ flex: 1 }}
                      disabled={isDispatchingAccident}
                    >
                      {tr('Cancel', 'रद्द करें', 'रद्द करा')}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-emergency btn-lg"
                      style={{ flex: 2, fontWeight: 900, fontSize: '1rem' }}
                      disabled={isDispatchingAccident}
                    >
                      {isDispatchingAccident
                        ? tr('Sending Emergency Alert...', 'आपातकालीन सूचना भेजी जा रही है...', 'तातडीची मदत पाठवत आहे...')
                        : tr('🚨 SEND TO 108 EMERGENCY & PHC', '🚨 108 आपातकालीन व पीएचसी को भेजें', '🚨 १०८ रुग्णवाहिका व प्राथमिक आरोग्य केंद्रास पाठवा')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BIOMETRIC FINGERPRINT SCANNER MODAL */}
      <BiometricPromptModal
        isOpen={showBiometricModal}
        onClose={() => setShowBiometricModal(false)}
        onSuccess={handleBiometricSuccess}
        role={selectedRole}
        userName={
          selectedRole === 'doctor'
            ? 'Dr. Anjali Mehta'
            : selectedRole === 'hospital_admin'
              ? 'Dr. Suresh Deshpande'
              : 'Rahul Sharma'
        }
      />
    </div>
  );
};

