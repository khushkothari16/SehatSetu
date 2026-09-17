import React from 'react';
import { Home, HeartPulse, AlertTriangle, Bot, User } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const BottomNav = ({ currentRoute, onNavigate, onTriggerEmergency }) => {
  const { t } = useLanguage();

  return (
    <nav
      className="visible-mobile-only"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'var(--bottom-nav-height)',
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 200,
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
      }}
    >
      <button
        onClick={() => onNavigate('home')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentRoute === 'home' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: currentRoute === 'home' ? 700 : 500,
          cursor: 'pointer',
          padding: '4px 8px'
        }}
      >
        <Home size={20} />
        <span>Home</span>
      </button>

      <button
        onClick={() => onNavigate('normal-care')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentRoute === 'normal-care' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: currentRoute === 'normal-care' ? 700 : 500,
          cursor: 'pointer',
          padding: '4px 8px'
        }}
      >
        <HeartPulse size={20} />
        <span>Care</span>
      </button>

      {/* Floating Center Emergency SOS Button */}
      <button
        onClick={onTriggerEmergency}
        style={{
          position: 'relative',
          top: -12,
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: 'var(--emergency)',
          color: 'white',
          border: '3px solid var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
          cursor: 'pointer'
        }}
        title="Emergency 108"
      >
        <AlertTriangle size={22} />
        <span style={{ fontSize: '0.55rem', fontWeight: 800, textTransform: 'uppercase', lineHeight: 1 }}>SOS</span>
      </button>

      <button
        onClick={() => onNavigate('ai-assistant')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentRoute === 'ai-assistant' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: currentRoute === 'ai-assistant' ? 700 : 500,
          cursor: 'pointer',
          padding: '4px 8px'
        }}
      >
        <Bot size={20} />
        <span>AI Doctor</span>
      </button>

      <button
        onClick={() => onNavigate('profile')}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
          color: currentRoute === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
          fontSize: '0.7rem',
          fontWeight: currentRoute === 'profile' ? 700 : 500,
          cursor: 'pointer',
          padding: '4px 8px'
        }}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
