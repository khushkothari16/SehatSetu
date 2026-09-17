import React from 'react';
import {
  Menu,
  X,
  Heart,
  Home,
  HeartPulse,
  UserCheck,
  Clock,
  Video,
  FileText,
  Pill,
  Activity,
  FileCheck,
  Calendar,
  Share2,
  AlertTriangle,
  Bot,
  MapPin,
  User,
  Bell,
  Building,
  Stethoscope,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const Sidebar = ({ currentRoute, onNavigate, isOpen, onToggle }) => {
  const { role, logout } = useAuth();
  const { t, tr, language } = useLanguage();

  const patientSections = [
    {
      title: t('primaryServices'),
      items: [
        { id: 'home', label: t('appName') + ' ' + tr('Home', 'मुख्य पृष्ठ', 'मुख्य पृष्ठ'), icon: Home },
        { id: 'ai-assistant', label: t('aiAssistant'), icon: Bot },
        { id: 'normal-care', label: t('normalCare'), icon: HeartPulse },
        { id: 'emergency', label: t('emergency'), icon: AlertTriangle, isEmergency: true },
        { id: 'nearby', label: t('nearbyHealthcare'), icon: MapPin }
      ]
    },
    {
      title: t('normalCareJourney'),
      items: [
        { id: 'find-doctor', label: t('findDoctor'), icon: UserCheck },
        { id: 'queue', label: t('queueManagement'), icon: Clock },
        { id: 'consultation', label: t('consultation'), icon: Video },
        { id: 'prescriptions', label: t('prescriptions'), icon: FileText },
        { id: 'medicines', label: t('medicines'), icon: Pill },
        { id: 'tests', label: t('tests'), icon: Activity },
        { id: 'reports', label: t('reports'), icon: FileCheck },
        { id: 'follow-ups', label: t('followUp'), icon: Calendar },
        { id: 'referrals', label: t('referrals'), icon: Share2 }
      ]
    },
    {
      title: t('accountAlerts'),
      items: [
        { id: 'profile', label: t('profile'), icon: User },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'auth', label: tr('Logout', 'लॉगआउट', 'लॉगआउट'), icon: LogOut }
      ]
    }
  ];

  const doctorSections = [
    {
      title: tr('Clinical OPD Services', 'चिकित्सक सेवाएं (Doctor Desk)', 'वैद्यकीय सेवा (क्लिनिकल डेस्क)'),
      items: [
        { id: 'home', label: tr('Doctor Clinical Desk', '🩺 डॉक्टर क्लिनिकल डेस्क', '🩺 डॉक्टर क्लिनिकल डेस्क'), icon: Stethoscope },
        { id: 'doctor-opd', label: tr('In-Person OPD (Room 4)', '🏢 ओपीडी कतार (Room 4)', '🏢 ओपीडी रांग (खोली क्र. ४)'), icon: Building },
        { id: 'doctor-teleconsult', label: tr('Online Teleconsultation', '📹 वीडियो टेलीकंसल्ट', '📹 ऑनलाइन व्हिडिओ सल्ला'), icon: Video },
        { id: 'doctor-rx', label: tr('E-Prescription Desk', '📝 ई-प्रिस्क्रिप्शन (Rx)', '📝 डिजिटल ई-चिठ्ठी'), icon: FileText }
      ]
    },
    {
      title: tr('Patient Records & Referrals', 'रोगी रिकॉर्ड व रेफरल', 'रुग्ण नोंदी व संदर्भ'),
      items: [
        { id: 'referrals', label: tr('Referral Network', 'अस्पताल रेफरल नेटवर्क', 'रुग्णालय संदर्भ नेटवर्क'), icon: Share2 },
        { id: 'reports', label: tr('Diagnostic Reports', 'लैब व जांच रिपोर्ट', 'लॅब व तपासणी अहवाल'), icon: FileCheck },
        { id: 'nearby', label: tr('PHC & Hospital Network', 'पीएचसी व एम्बुलेंस नेटवर्क', 'आरोग्य केंद्र व रुग्णवाहिका'), icon: MapPin }
      ]
    },
    {
      title: t('accountAlerts'),
      items: [
        { id: 'profile', label: tr('Doctor Profile & NMC', 'चिकित्सक प्रोफ़ाइल (NMC)', 'डॉक्टर प्रोफाईल (NMC)'), icon: User },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'auth', label: tr('Logout', 'लॉगआउट', 'लॉगआउट'), icon: LogOut }
      ]
    }
  ];

  const ashaSections = [
    {
      title: tr('ASHA Frontline Desk', 'आशा कार्यकर्ता सेवाएं', 'आशा सेविका सेवा'),
      items: [
        { id: 'home', label: tr('ASHA Coordinator Desk', '👩‍⚕️ आशा समन्वय डेस्क', '👩‍⚕️ आशा समन्वय डेस्क'), icon: Stethoscope },
        { id: 'asha-patients', label: tr('My Assigned Patients', '👥 मेरे मरीज (सूची)', '👥 माझे रुग्ण (यादी)'), icon: UserCheck },
        { id: 'asha-add-patient', label: tr('Register New Patient', '➕ नया मरीज जोड़ें', '➕ नवीन रुग्ण जोडा'), icon: HeartPulse },
        { id: 'asha-triage', label: tr('Digital Triage Assistance', '🚦 डिजिटल ट्राइएज जांच', '🚦 डिजिटल ट्रायेज तपासणी'), icon: Activity }
      ]
    },
    {
      title: tr('Care Coordination & Network', 'देखभाल समन्वय व नेटवर्क', 'आरोग्य समन्वय व नेटवर्क'),
      items: [
        { id: 'asha-consult-requests', label: tr('Doctor Requests & Queue', '🩺 डॉक्टर अनुरोध व कतार', '🩺 डॉक्टर विनंत्या व रांग'), icon: Clock },
        { id: 'asha-referrals', label: tr('Referral Tracking Network', '🔄 रेफरल ट्रैकर नेटवर्क', '🔄 संदर्भ ट्रॅकर नेटवर्क'), icon: Share2 },
        { id: 'asha-high-risk', label: tr('High-Risk Patients', '⚠️ उच्च जोखिम मरीज', '⚠️ अति-जोखमीचे रुग्ण'), icon: AlertTriangle },
        { id: 'asha-followups', label: tr('Follow-Up Tasks', '📅 फॉलो-अप कार्य', '📅 पाठपुरावा कार्ये'), icon: Calendar },
        { id: 'asha-diagnostics', label: tr('Diagnostic Tests & Reports', '🔬 लैब जांच व रिपोर्ट्स', '🔬 लॅब तपासणी व अहवाल'), icon: FileCheck },
        { id: 'asha-prescriptions', label: tr('Medicines & Rx Alerts', '💊 दवाइयां व पर्ची अलर्ट', '💊 औषधे व प्रिस्क्रिप्शन'), icon: Pill },
        { id: 'asha-messages', label: tr('Doctor Communication', '💬 डॉक्टर संवाद व संदेश', '💬 डॉक्टर संवाद व संदेश'), icon: Video }
      ]
    },
    {
      title: tr('Emergency & Field Tools', 'आपातकाल व फील्ड टूल्स', 'तातडीची मदत व फील्ड टूल्स'),
      items: [
        { id: 'emergency', label: tr('108 Emergency SOS', '🚨 108 आपातकालीन SOS', '🚨 १०८ आपत्कालीन SOS'), icon: AlertTriangle, isEmergency: true },
        { id: 'profile', label: tr('ASHA Worker Profile', 'मेरी प्रोफ़ाइल (ASHA ID)', 'माझे प्रोफाईल (ASHA ID)'), icon: User },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'auth', label: tr('Logout', 'लॉगआउट', 'लॉगआउट'), icon: LogOut }
      ]
    }
  ];

  const navSections = role === 'doctor' ? doctorSections : role === 'asha' ? ashaSections : patientSections;

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onToggle}
        />
      )}

      <aside
        className={`app-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
        style={{
          width: 'var(--sidebar-width)',
          height: '100vh',
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          position: 'fixed',
          left: 0,
          top: 0,
          overflowY: 'auto',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.25s ease'
        }}
      >
        {/* Top Header Row inside Sidebar (Fills the top-left corner!) */}
        <div
          style={{
            height: 'var(--header-height)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1rem',
            background: 'var(--surface)',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          {/* Brand Logo & Name */}
          <div
            onClick={() => onNavigate('home')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              cursor: 'pointer'
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Heart size={20} fill="white" strokeWidth={1.5} />
            </div>
            <div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--primary-hover)',
                  lineHeight: 1
                }}
              >
                {t('appName')}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.68rem',
                  color: 'var(--text-muted)',
                  fontWeight: 600
                }}
              >
                {t('appTagline')}
              </span>
            </div>
          </div>

          {/* Close / Hamburger toggle button */}
          <button
            onClick={onToggle}
            className="btn btn-ghost btn-sm"
            style={{ padding: '6px', borderRadius: 'var(--radius-md)' }}
            title="Toggle Menu"
          >
            <Menu size={20} color="var(--text-secondary)" />
          </button>
        </div>

        {/* Navigation Section Links */}
        <div style={{ padding: '0.75rem 0.85rem', flex: 1 }}>
          {navSections.map((section, idx) => (
            <div key={idx} style={{ marginBottom: '1.25rem' }}>
              <div
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.05em',
                  padding: '0.35rem 0.75rem',
                  textTransform: 'uppercase'
                }}
              >
                {section.title}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;
                  const isEmerg = item.isEmergency;

                  return (
                    <button
                      key={item.id}
                      onClick={async () => {
                        if (item.id === 'auth') {
                          if (logout) await logout();
                        }
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        background: isActive
                          ? isEmerg
                            ? 'var(--emergency-light)'
                            : 'var(--primary-light)'
                          : 'transparent',
                        color: isActive
                          ? isEmerg
                            ? 'var(--emergency)'
                            : 'var(--primary)'
                          : isEmerg
                            ? 'var(--emergency)'
                            : 'var(--text-secondary)',
                        fontWeight: isActive ? 700 : 600,
                        fontSize: '0.88rem',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.label}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: isEmerg ? 'var(--emergency)' : 'var(--primary)'
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
