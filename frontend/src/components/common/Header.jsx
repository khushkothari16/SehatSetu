import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Bell, 
  MapPin, 
  Globe, 
  AlertTriangle, 
  User, 
  Menu,
  ChevronDown,
  Navigation,
  Check,
  UserCheck,
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLocation } from '../../context/LocationContext';
import { emergencyService } from '../../services/emergencyService';

export const Header = ({ onNavigate, onGoBack, currentRoute, onTriggerEmergency, onToggleSidebar }) => {

  const { user, role, logout } = useAuth();
  const { language, changeLanguage, t, tr } = useLanguage();
  const { unreadCount } = useNotifications();
  const { location, loading: locLoading, refreshLocation, setManualLocation } = useLocation();

  const [showLocationModal, setShowLocationModal] = useState(false);
  const [manualVillage, setManualVillage] = useState('');
  const [activeEmergency, setActiveEmergency] = useState(() => emergencyService.getActiveEmergencySync());

  useEffect(() => {
    const handleEmergencyChange = (e) => {
      setActiveEmergency(e.detail || null);
    };
    window.addEventListener('emergency_state_change', handleEmergencyChange);
    return () => window.removeEventListener('emergency_state_change', handleEmergencyChange);
  }, []);

  useEffect(() => {
    const handleBackRequest = (e) => {
      if (showLocationModal) {
        e.preventDefault();
        setShowLocationModal(false);
      }
    };
    window.addEventListener('app_back_request', handleBackRequest);
    return () => window.removeEventListener('app_back_request', handleBackRequest);
  }, [showLocationModal]);

  const handleUpdateLocation = async (e) => {
    e.preventDefault();
    if (!manualVillage.trim()) return;
    await setManualLocation(manualVillage.trim());
    setShowLocationModal(false);
    setManualVillage('');
  };

  const handleDetectGps = async () => {
    await refreshLocation();
    setShowLocationModal(false);
  };

  return (
    <>
      <header
        style={{
          height: 'var(--header-height)',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
        }}
      >
        {/* Left Side: Hamburger Menu Button + Location Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Top-Left Hamburger Icon (As user requested & circled!) */}
          <button
            onClick={onToggleSidebar}
            className="btn btn-ghost"
            style={{
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              minHeight: 40,
              minWidth: 40
            }}
            title="Menu / मेनू"
          >
            <Menu size={24} strokeWidth={2.4} />
          </button>

          {/* Universal Header Back Button: Directly go back from wherever anyone is! */}
          {currentRoute !== 'home' && (
            <button
              id="global-header-back-btn"
              onClick={onGoBack}
              className="btn btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--surface-alt)',
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '0.38rem 0.85rem',
                fontWeight: 800,
                fontSize: '0.825rem',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease'
              }}
              title="Go Back / पीछे जाएं"
            >
              <ArrowLeft size={16} strokeWidth={2.5} color="var(--primary)" />
              <span>{language === 'hi' ? 'वापस' : language === 'mr' ? 'मागे' : 'Back'}</span>
            </button>
          )}

          {/* Location Badge */}

          {/* Live Location Badge */}
          <button
            onClick={() => setShowLocationModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: location?.isLive ? '#f0fdf4' : 'var(--surface-alt)',
              border: location?.isLive ? '1.5px solid #86efac' : '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.825rem',
              color: location?.isLive ? '#15803d' : 'var(--text-secondary)',
              cursor: 'pointer',
              boxShadow: location?.isLive ? '0 1px 2px rgba(22, 163, 74, 0.1)' : 'none'
            }}
            title="Current live location - Click to view coordinates or change"
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <MapPin size={15} color={location?.isLive ? '#16a34a' : 'var(--primary)'} />
              {location?.isLive && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    border: '1.5px solid #ffffff',
                    animation: 'pulse 2s infinite'
                  }}
                />
              )}
            </div>
            <span style={{ fontWeight: 800, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {location?.village || location?.city || 'Detecting Location...'}
            </span>
            <span style={{ fontSize: '0.7rem', color: location?.isLive ? '#166534' : 'var(--text-muted)', fontWeight: 700 }}>
              {location?.isLive ? '● Live' : `(${location?.accuracy || 'Set'})`}
            </span>
          </button>
        </div>

        {/* Right Side: Clean Language Switcher (Bijli Mitra Style) + 108 Emergency + Notifications + Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Quick Language Toggle Buttons (Like Bijli Mitra app!) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--surface-alt)',
              borderRadius: 'var(--radius-full)',
              padding: '3px',
              border: '1px solid var(--border)'
            }}
          >
            <button
              onClick={() => changeLanguage('hi')}
              style={{
                border: 'none',
                background: language === 'hi' ? 'var(--primary)' : 'transparent',
                color: language === 'hi' ? 'white' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.775rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              हिन्दी
            </button>
            <button
              onClick={() => changeLanguage('en')}
              style={{
                border: 'none',
                background: language === 'en' ? 'var(--primary)' : 'transparent',
                color: language === 'en' ? 'white' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.775rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              English
            </button>
            <button
              onClick={() => changeLanguage('mr')}
              style={{
                border: 'none',
                background: language === 'mr' ? 'var(--primary)' : 'transparent',
                color: language === 'mr' ? 'white' : 'var(--text-secondary)',
                fontWeight: 700,
                fontSize: '0.775rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              मराठी
            </button>
          </div>

          {/* Active 108 Ambulance En-Route Status Pill (if an active emergency is underway) */}
          {role !== 'doctor' && user?.role !== 'doctor' && activeEmergency && (
            <button
              id="header-emergency-status-pill"
              onClick={onTriggerEmergency}
              className="btn btn-emergency btn-sm"
              style={{
                fontWeight: 800,
                fontSize: '0.85rem',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                animation: 'pulse 1s infinite',
                background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
                border: '2px solid #FCA5A5',
                boxShadow: '0 0 15px rgba(220, 38, 38, 0.5)'
              }}
              title="108 Ambulance is en route! Click to track live."
            >
              <span className="pulse-indicator" style={{ backgroundColor: '#ffffff', width: 8, height: 8 }}></span>
              <span>🚑</span>
              <span className="hidden-mobile">
                {tr(`108 En Route: 0${activeEmergency.etaMinutes}m`, `108 रास्ते में: 0${activeEmergency.etaMinutes} min`, `१०८ रुग्णवाहिका येत आहे: ०${activeEmergency.etaMinutes} मि`)}
              </span>
              <span className="visible-mobile-only">
                0{activeEmergency.etaMinutes}m
              </span>
            </button>
          )}

          {/* Notifications */}
          <button
            id="header-notifications-btn"
            onClick={() => onNavigate('notifications')}
            className="btn btn-ghost"
            style={{
              position: 'relative',
              padding: '0.5rem',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  backgroundColor: 'var(--error)',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 2px var(--surface)'
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          <button
            id="header-logout-btn"
            onClick={logout}
            className="btn btn-ghost btn-sm"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: 'var(--error)',
              fontWeight: 600,
              fontSize: '0.8rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(239, 68, 68, 0.08)'
            }}
            title={tr('Logout', 'लॉगआउट', 'लॉगआउट')}
          >
            <LogOut size={16} />
            <span className="hidden-mobile">
              {tr('Logout', 'लॉगआउट', 'लॉगआउट')}
            </span>
          </button>

          {/* User Profile Mini Badge */}
          <div
            onClick={() => onNavigate('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
            title="Click to view Profile & ABHA Details"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              {user?.name ? user.name.replace('Dr. ', '').charAt(0) : 'R'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }} className="hidden-mobile">
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {tr(user?.name || 'Rahul Sharma', user?.nameHindi || user?.name || 'राहुल शर्मा', user?.nameMarathi || user?.name || 'राहुल शर्मा')}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--primary)', fontWeight: 600 }}>
                {user?.role === 'doctor'
                  ? tr('Doctor', 'चिकित्सक (Doctor)', 'वैद्यकीय अधिकारी (Doctor)')
                  : user?.role === 'hospital_admin'
                  ? tr('Hospital Admin', 'अस्पताल प्रशासक', 'रुग्णालय व्यवस्थापक')
                  : user?.role === 'asha'
                  ? tr('ASHA Worker', 'आशा कार्यकर्ता', 'आशा सेविका')
                  : t('abhaVerified')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Manual Location Modal */}
      {/* Live Location Studio Modal */}
      {showLocationModal && (
        <div className="modal-overlay" onClick={() => setShowLocationModal(false)} style={{ zIndex: 1200 }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
                <MapPin size={20} color="var(--primary)" />
                <span>{tr('Live Location & GPS Center', 'लाइव लोकेशन व क्षेत्र सेटिंग', 'थेट स्थान आणि जीपीएस केंद्र')}</span>
              </h3>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowLocationModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Active Detected Location Card */}
              <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {tr('CURRENTLY ACTIVE LOCATION', 'वर्तमान सक्रिय स्थान', 'सध्याचे सक्रिय स्थान')}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    background: location?.isLive ? '#dcfce7' : '#f1f5f9',
                    color: location?.isLive ? '#15803d' : '#475569'
                  }}>
                    {location?.accuracy || 'Active'}
                  </span>
                </div>

                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginBottom: '0.25rem' }}>
                  {location?.village || location?.city || 'Detecting...'}
                </div>

                <div style={{ fontSize: '0.78rem', color: '#475569', lineHeight: 1.4, marginBottom: '0.5rem' }}>
                  {location?.fullAddress || `${location?.village || ''}, ${location?.state || 'India'}`}
                </div>

                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>
                  <span>Lat: {location?.lat ? location.lat.toFixed(4) : '28.1289'}° N</span>
                  <span>Lng: {location?.lng ? location.lng.toFixed(4) : '75.3995'}° E</span>
                </div>
              </div>

              {/* 1-Tap Auto-Detect GPS Button */}
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDetectGps}
                disabled={locLoading}
                style={{
                  width: '100%',
                  padding: '0.7rem',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                }}
              >
                <Navigation size={18} />
                <span>{locLoading ? 'Locating Real GPS / IP...' : tr('🛰️ Refresh Live GPS & Network Location', '🛰️ लाइव जीपीएस / सटीक लोकेशन रिफ्रेश करें', '🛰️ थेट जीपीएस व स्थान रीफ्रेश करा')}</span>
              </button>

              {/* Quick Select Preset Regions Chips */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.45rem' }}>
                  {tr('Quick Presets / Popular Regions:', 'त्वरित क्षेत्र चयन (Quick Indian Locations):', 'त्वरित शहरे व परिसर:')}
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {[
                    { name: 'Jhunjhunu', dist: 'Jhunjhunu', st: 'Rajasthan' },
                    { name: 'Bagar', dist: 'Jhunjhunu', st: 'Rajasthan' },
                    { name: 'Sikar', dist: 'Sikar', st: 'Rajasthan' },
                    { name: 'Jaipur', dist: 'Jaipur', st: 'Rajasthan' },
                    { name: 'Khed', dist: 'Pune', st: 'Maharashtra' },
                    { name: 'Pune', dist: 'Pune', st: 'Maharashtra' },
                    { name: 'Mumbai', dist: 'Mumbai', st: 'Maharashtra' },
                    { name: 'New Delhi', dist: 'New Delhi', st: 'Delhi' },
                    { name: 'Lucknow', dist: 'Lucknow', st: 'Uttar Pradesh' },
                    { name: 'Patna', dist: 'Patna', st: 'Bihar' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setManualLocation(p.name, p.dist, p.st);
                        setShowLocationModal(false);
                      }}
                      className="btn btn-outline btn-xs"
                      style={{
                        borderRadius: '20px',
                        fontSize: '0.74rem',
                        padding: '0.2rem 0.6rem',
                        borderColor: '#cbd5e1',
                        color: '#1e293b'
                      }}
                    >
                      📍 {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Search Form */}
              <form onSubmit={handleUpdateLocation}>
                <div className="form-group">
                  <label className="form-label">
                    {tr('Or enter custom village / town / city:', 'या अन्य गाँव / शहर का नाम दर्ज करें', 'किंवा इतर गाव / शहराचे नाव टाका:')}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Jhunjhunu, Chakan, Khed, Alandi..."
                      value={manualVillage}
                      onChange={(e) => setManualVillage(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button
                      type="submit"
                      className="btn btn-secondary"
                      disabled={locLoading || !manualVillage.trim()}
                    >
                      {t('save')}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
