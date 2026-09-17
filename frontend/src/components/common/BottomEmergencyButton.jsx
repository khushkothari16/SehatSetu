import React, { useState, useEffect } from 'react';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { emergencyService } from '../../services/emergencyService';

export const BottomEmergencyButton = ({ currentRoute, onTriggerEmergency }) => {
  const { t, tr, language } = useLanguage();
  const [activeEmergency, setActiveEmergency] = useState(() => emergencyService.getActiveEmergencySync());

  useEffect(() => {
    const handleEmergencyChange = (e) => {
      setActiveEmergency(e.detail || null);
    };
    window.addEventListener('emergency_state_change', handleEmergencyChange);
    return () => window.removeEventListener('emergency_state_change', handleEmergencyChange);
  }, []);

  // Hide when already on the emergency page or auth
  if (currentRoute === 'emergency' || currentRoute === 'auth') {
    return null;
  }

  return (
    <div
      id="bottom-emergency-container"
      style={{
        position: 'fixed',
        bottom: '22px',
        right: '24px',
        zIndex: 180,
        display: 'flex',
        alignItems: 'center',
        filter: 'drop-shadow(0 6px 18px rgba(220, 38, 38, 0.42))'
      }}
    >
      <button
        id="bottom-emergency-btn"
        type="button"
        onClick={onTriggerEmergency}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          padding: '0.65rem 1.25rem',
          borderRadius: '9999px',
          background: activeEmergency
            ? 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)'
            : 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
          color: '#ffffff',
          border: '2px solid rgba(254, 226, 226, 0.75)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: '0.9rem',
          letterSpacing: '0.01em',
          boxShadow: '0 4px 14px rgba(220, 38, 38, 0.35)',
          transition: 'all 0.2s ease',
          outline: 'none'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(220, 38, 38, 0.55)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 14px rgba(220, 38, 38, 0.35)';
        }}
        title={activeEmergency ? 'Ambulance is en route! Click to track live' : 'Trigger 108 Emergency SOS Ambulance'}
      >
        {/* Pulsing Beacon Dot */}
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '12px',
            height: '12px'
          }}
        >
          <span
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#FEF08A',
              animation: 'ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: 0.75
            }}
          />
          <span
            style={{
              position: 'relative',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#FFFFFF'
            }}
          />
        </span>

        <AlertTriangle size={20} strokeWidth={2.6} />

        {activeEmergency ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>
              {tr(
                `108 En Route: 0${activeEmergency.etaMinutes}m`,
                `108 रास्ते में: 0${activeEmergency.etaMinutes} मिनट`,
                `१०८ रुग्णवाहिका येत आहे: ०${activeEmergency.etaMinutes} मि`
              )}
            </span>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>&bull; {tr('Track Live', 'लाइव देखें', 'थेट पहा')}</span>
            <ChevronRight size={16} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>
              {tr('108 Emergency SOS', '108 आपातकालीन SOS', '१०८ आपत्कालीन SOS')}
            </span>
            <ChevronRight size={16} />
          </div>
        )}
      </button>

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @media (max-width: 768px) {
          #bottom-emergency-container {
            bottom: 74px !important;
            right: 14px !important;
          }
          #bottom-emergency-btn {
            padding: 0.55rem 0.95rem !important;
            font-size: 0.8rem !important;
          }
        }
      `}</style>
    </div>
  );
};
