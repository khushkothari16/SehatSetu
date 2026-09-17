import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, AlertCircle, X, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { isWebAuthnSupported, verifyBiometricAssertion } from '../services/biometricService';

export const BiometricPromptModal = ({
  isOpen,
  onClose,
  onSuccess,
  role = 'patient',
  userName = 'Rahul Sharma',
  purpose = 'login' // 'login' | 'register' | 'confirm'
}) => {
  const { language } = useLanguage();
  const [scanState, setScanState] = useState('ready'); // 'ready' | 'scanning' | 'verifying' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setScanState('ready');
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.25); // G5
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

  const handleStartScan = async () => {
    if (scanState === 'scanning' || scanState === 'verifying') return;

    setScanState('scanning');
    setErrorMessage('');

    // Trigger subtle device vibration on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40]);
      } catch { }
    }

    try {
      // Step 1: Simulate laser sweep & ridge detection (600ms)
      await new Promise((res) => setTimeout(res, 600));
      setScanState('verifying');

      // Step 2: Call WebAuthn / Biometric assertion
      const assertion = await verifyBiometricAssertion(role);

      // Step 3: Complete verification
      await new Promise((res) => setTimeout(res, 400));
      playSuccessChime();
      setScanState('success');

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch { }
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(assertion);
        }
      }, 700);
    } catch (err) {
      console.error('[Biometric Scan Error]', err);
      setScanState('error');
      setErrorMessage(err.message || 'Fingerprint verification failed. Please try again.');
    }
  };

  const getRoleLabel = () => {
    if (role === 'doctor') {
      return language === 'hi' ? 'चिकित्सक (Doctor Desk)' : language === 'mr' ? 'डॉक्टर (Doctor Desk)' : 'Doctor (Clinical Desk)';
    }
    if (role === 'hospital_admin') {
      return language === 'hi' ? 'अस्पताल प्रशासक' : language === 'mr' ? 'रुग्णालय व्यवस्थापक' : 'Hospital Administrator';
    }
    return language === 'hi' ? 'मरीज / नागरिक' : language === 'mr' ? 'रुग्ण / नागरिक' : 'Patient / Citizen';
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 2500,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 420,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -12px rgba(15, 118, 110, 0.35), 0 0 0 1px rgba(13, 148, 136, 0.15)',
          overflow: 'hidden',
          animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ShieldCheck size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9 }}>
                ABDM FAST-PASS
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                {language === 'hi' ? 'बायोमेट्रिक फिंगरप्रिंट' : language === 'mr' ? 'बायोमेट्रिक फिंगरप्रिंट' : 'Biometric Fingerprint'}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '2rem 1.75rem', textAlign: 'center' }}>
          {/* Identity Tag */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#F0FDFA',
              border: '1px solid #99F6E4',
              padding: '0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              color: '#0F766E',
              fontWeight: 700,
              marginBottom: '1.5rem'
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#0D9488' }} />
            {getRoleLabel()} • {userName}
          </div>

          {/* Fingerprint Sensor Graphic & Animated Laser */}
          <div
            onClick={handleStartScan}
            style={{
              position: 'relative',
              width: 140,
              height: 140,
              margin: '0 auto 1.5rem auto',
              borderRadius: '50%',
              background: scanState === 'success'
                ? 'radial-gradient(circle, #DCFCE7 0%, #BBF7D0 100%)'
                : scanState === 'error'
                  ? 'radial-gradient(circle, #FEE2E2 0%, #FECACA 100%)'
                  : scanState === 'scanning' || scanState === 'verifying'
                    ? 'radial-gradient(circle, #CCFBF1 0%, #99F6E4 100%)'
                    : 'radial-gradient(circle, #F8FAFC 0%, #E2E8F0 100%)',
              border: `3px solid ${scanState === 'success'
                  ? '#16A34A'
                  : scanState === 'error'
                    ? '#DC2626'
                    : scanState === 'scanning' || scanState === 'verifying'
                      ? '#0D9488'
                      : '#CBD5E1'
                }`,
              boxShadow: scanState === 'scanning' || scanState === 'verifying'
                ? '0 0 25px rgba(13, 148, 136, 0.45), 0 0 0 10px rgba(13, 148, 136, 0.1)'
                : scanState === 'success'
                  ? '0 0 25px rgba(22, 163, 74, 0.45)'
                  : '0 8px 20px rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: scanState === 'scanning' || scanState === 'verifying' ? 'wait' : 'pointer',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              userSelect: 'none'
            }}
            title="Tap to scan fingerprint"
          >
            {/* Pulsing Concentric Ripple Rings while scanning */}
            {(scanState === 'scanning' || scanState === 'verifying') && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  border: '2px solid rgba(13, 148, 136, 0.6)',
                  animation: 'pulse 1.2s infinite ease-out'
                }}
              />
            )}

            {/* Glowing Laser Sweep Line */}
            {(scanState === 'scanning' || scanState === 'verifying') && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 3,
                  background: 'linear-gradient(90deg, transparent 0%, #0D9488 50%, transparent 100%)',
                  boxShadow: '0 0 12px 2px #14B8A6',
                  animation: 'scanLaser 1.4s infinite ease-in-out',
                  zIndex: 10
                }}
              />
            )}

            {/* Center Visual Icon */}
            {scanState === 'success' ? (
              <CheckCircle size={64} color="#16A34A" strokeWidth={2.4} />
            ) : scanState === 'error' ? (
              <AlertCircle size={64} color="#DC2626" strokeWidth={2.4} />
            ) : (
              /* Realistic Biometric Fingerprint SVG Pattern */
              <svg
                width="72"
                height="72"
                viewBox="0 0 24 24"
                fill="none"
                stroke={scanState === 'scanning' || scanState === 'verifying' ? '#0D9488' : '#475569'}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transition: 'stroke 0.3s ease' }}
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

          {/* Status Text & Instruction */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4
              style={{
                margin: '0 0 0.4rem 0',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: scanState === 'success'
                  ? '#16A34A'
                  : scanState === 'error'
                    ? '#DC2626'
                    : scanState === 'scanning' || scanState === 'verifying'
                      ? '#0D9488'
                      : 'var(--text-primary)'
              }}
            >
              {scanState === 'ready' && (language === 'hi' ? 'सेंसर को स्पर्श करें' : language === 'mr' ? 'सेंसरला स्पर्श करा' : 'Touch the Fingerprint Sensor')}
              {scanState === 'scanning' && (language === 'hi' ? 'फिंगरप्रिंट स्कैन हो रहा है...' : language === 'mr' ? 'फिंगरप्रिंट स्कॅन होत आहे...' : 'Scanning Biometric Ridges...')}
              {scanState === 'verifying' && (language === 'hi' ? 'पहचान सत्यापित की जा रही है...' : language === 'mr' ? 'ओळख पडताळत आहे...' : 'Verifying Digital Identity...')}
              {scanState === 'success' && (language === 'hi' ? 'सत्यापित! लॉगिन सफल ✓' : language === 'mr' ? 'प्रमाणित! लॉगिन यशस्वी ✓' : 'Fingerprint Verified! Logging in ✓')}
              {scanState === 'error' && (language === 'hi' ? 'सत्यापन विफल' : language === 'mr' ? 'पडताळणी अयशस्वी' : 'Verification Failed')}
            </h4>

            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B', lineHeight: 1.4 }}>
              {scanState === 'ready' && (
                language === 'hi'
                  ? 'अपने फोन या लैपटॉप के फिंगरप्रिंट सेंसर पर अपनी उंगली रखें या नीचे बटन दबाएं।'
                  : language === 'mr'
                    ? 'आपल्या फोन किंवा लॅपटॉपच्या फिंगरप्रिंट सेन्सरवर बोट ठेवा किंवा खालील बटण दाबा.'
                    : 'Place your finger on your device sensor or tap the button below to authenticate.'
              )}
              {scanState === 'scanning' && (
                language === 'hi' ? 'उंगली स्थिर रखें...' : language === 'mr' ? 'बोट स्थिर ठेवा...' : 'Hold finger still on the sensor...'
              )}
              {scanState === 'verifying' && (
                language === 'hi' ? 'ABHA राष्ट्रीय स्वास्थ्य रिकॉर्ड से मिलान...' : language === 'mr' ? 'ABHA राष्ट्रीय आरोग्य नोंदींशी जुळणी...' : 'Cryptographic matching against ABHA credentials...'
              )}
              {scanState === 'success' && (
                language === 'hi' ? 'सफलतापूर्वक पुष्टि की गई। स्वागत है।' : language === 'mr' ? 'यशस्वीरित्या पुष्टी झाली. स्वागत आहे.' : 'Secure hardware token validated. Entering portal...'
              )}
              {scanState === 'error' && errorMessage}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartScan}
              disabled={scanState === 'scanning' || scanState === 'verifying'}
              style={{
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Sparkles size={18} />
              <span>
                {scanState === 'error'
                  ? (language === 'hi' ? 'पुनः प्रयास करें (Retry)' : language === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry Fingerprint Scan')
                  : (language === 'hi' ? 'फिंगरप्रिंट स्कैन करें (Scan)' : language === 'mr' ? 'फिंगरप्रिंट स्कॅन करा' : 'Scan Fingerprint (Touch Now)')}
              </span>
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onClose}
              style={{ color: '#64748B', fontWeight: 600 }}
            >
              {language === 'hi' ? 'रद्द करें या पासवर्ड / ओटीपी का उपयोग करें' : language === 'mr' ? 'रद्द करा किंवा ओटीपी वापरा' : 'Cancel & Use OTP / Password'}
            </button>
          </div>

          {/* Device Hardware Info Badge */}
          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '0.85rem',
              borderTop: '1px solid #F1F5F9',
              fontSize: '0.72rem',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem'
            }}
          >
            <span>🔒 W3C WebAuthn • FIDO2 Certified • 256-Bit Hardware Encryption</span>
          </div>
        </div>
      </div>

      {/* Laser Scanning Animation Keyframes */}
      <style>{`
        @keyframes scanLaser {
          0% { top: 15%; opacity: 0.2; }
          50% { top: 85%; opacity: 1; }
          100% { top: 15%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
