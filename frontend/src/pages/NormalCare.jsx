import React from 'react';
import {
  UserCheck,
  Calendar,
  Clock,
  Video,
  FileText,
  Pill,
  Activity,
  FileCheck,
  RefreshCw,
  Share2,
  ChevronRight,
  ArrowDown,
  HeartPulse,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const NormalCare = ({ onNavigate, onGoBack }) => {
  const { t, language } = useLanguage();

  // Deduplicated and simplified patient care steps (Removed the redundant similar options: Step 1 'Find Doctor' + Step 2 'Book Appointment' consolidated into 1 clear entry)
  const journeySteps = [
    {
      step: 1,
      title: language === 'hi'
        ? 'सामान्य देखभाल और अपॉइंटमेंट बुक करें'
        : language === 'mr'
          ? 'सामान्य काळजी आणि अपॉइंटमेंट बुक करा'
          : 'Normal Care & Book Appointment',
      desc: language === 'hi'
        ? 'ओपीडी अस्पताल स्लॉट या ऑनलाइन वीडियो कॉल के लिए प्रमाणित डॉक्टर चुनें और तुरंत बुक करें।'
        : language === 'mr'
          ? 'ओपीडी किंवा ऑनलाइन व्हिडिओ कॉलसाठी डॉक्टर निवडा आणि वेळ निश्चित करा.'
          : 'Choose verified PHC & specialist doctors for In-Person OPD or Online Video consultation.',
      route: 'find-doctor',
      icon: Calendar,
      badge: language === 'hi' ? 'चरण 1: अपॉइंटमेंट' : language === 'mr' ? 'पायरी १: अपॉइंटमेंट' : 'Step 1: Booking',
      color: '#0D9488',
      bg: '#CCFBF1'
    },
    {
      step: 2,
      title: language === 'hi'
        ? 'मरीज की लाइव कतार व टोकन ट्रैकर'
        : language === 'mr'
          ? 'रुग्णाची थेट रांग व टोकन ट्रॅकर'
          : 'Live Queue of Patient & Token Tracker',
      desc: language === 'hi'
        ? 'लाइव टोकन नंबर (टोकन #27), आगे कितने मरीज हैं और अपनी बारी का समय देखें।'
        : language === 'mr'
          ? 'थेट टोकन क्रमांक (टोकन #२७), पुढील रुग्ण आणि दवाखान्यातील वेळ पहा.'
          : 'Track live token countdown, see patients ahead, and avoid crowded hospital waiting rooms.',
      route: 'queue',
      icon: Clock,
      badge: language === 'hi' ? 'चरण 2: लाइव कतार' : language === 'mr' ? 'पायरी २: थेट रांग' : 'Step 2: Live Queue',
      color: '#0284C7',
      bg: '#E0F2FE'
    },
    {
      step: 3,
      title: language === 'hi'
        ? 'दवा पर्ची इतिहास व रिकॉर्ड्स'
        : language === 'mr'
          ? 'औषध चिठ्ठी इतिहास व नोंदी'
          : 'Prescription History & Digital Records',
      desc: language === 'hi'
        ? 'डॉक्टर द्वारा हस्ताक्षरित डिजिटल पर्चियां, दवा लेने का समय और पुरानी पर्चियां देखें।'
        : language === 'mr'
          ? 'डॉक्टरांची डिजिटल स्वाक्षरी असलेली चिठ्ठी, औषधांची वेळ आणि जुने रेकॉर्ड पहा.'
          : 'Access doctor-signed digital prescriptions with ABHA QR code and dosage schedules.',
      route: 'prescriptions',
      icon: FileText,
      badge: language === 'hi' ? 'चरण 3: पर्ची इतिहास' : language === 'mr' ? 'पायरी ३: चिठ्ठी इतिहास' : 'Step 3: History',
      color: '#059669',
      bg: '#DCFCE7'
    },
    {
      step: 4,
      title: language === 'hi'
        ? 'डॉक्टर परामर्श (ओपीडी / वीडियो कॉल)'
        : language === 'mr'
          ? 'डॉक्टर सल्लामसलत (ओपीडी / व्हिडिओ)'
          : 'Doctor Consultation (OPD / Video)',
      desc: language === 'hi'
        ? 'अस्पताल के कमरा 4 में प्रत्यक्ष मिलें या सीधे फोन/वीडियो कॉल पर परामर्श लें।'
        : language === 'mr'
          ? 'खोली क्र. ४ मध्ये प्रत्यक्ष भेटा किंवा व्हिडिओ कॉलवर तपासणी करा.'
          : 'Consult in person at PHC room 4 or connect via secure audio/video teleconsultation.',
      route: 'consultation',
      icon: Video,
      badge: language === 'hi' ? 'चरण 4: परामर्श' : language === 'mr' ? 'पायरी ४: सल्ला' : 'Step 4: Consult',
      color: '#0F766E',
      bg: '#F0FDFA'
    },
    {
      step: 5,
      title: language === 'hi'
        ? 'जन औषधि दवाएं व मेडिकल स्टॉक'
        : language === 'mr'
          ? 'जन औषध केंद्र व औषध साठा'
          : 'Find Medicines & Jan Aushadhi Stock',
      desc: language === 'hi'
        ? 'पास के प्रधानमंत्री जन औषधि केंद्र में सस्ती दवाएं और मेडिकल स्टोर स्टॉक देखें।'
        : language === 'mr'
          ? 'जवळच्या जन औषधी केंद्रात स्वस्त जेनेरिक औषधे आणि उपलब्ध साठा शोधा.'
          : 'Check live medicine stock at nearby Pradhan Mantri Jan Aushadhi Kendras & 24/7 chemists.',
      route: 'medicines',
      icon: Pill,
      badge: language === 'hi' ? 'चरण 5: दवाएं' : language === 'mr' ? 'पायरी ५: औषधे' : 'Step 5: Medicines',
      color: '#D97706',
      bg: '#FEF3C7'
    },
    {
      step: 6,
      title: language === 'hi'
        ? 'जांच व लैब टेस्ट बुकिंग'
        : language === 'mr'
          ? 'लॅब चाचण्या बुकिंग'
          : 'Book Diagnostic Tests',
      desc: language === 'hi'
        ? 'रक्त जांच, डिजिटल एक्स-रे, सीबीसी और शुगर टेस्ट अस्पताल या घर से बुक करें।'
        : language === 'mr'
          ? 'रक्त तपासणी, डिजिटल एक्स-रे आणि साखर चाचणी घरून किंवा लॅबमध्ये बुक करा.'
          : 'Schedule blood tests, digital X-rays, or diabetes panels at PHC lab or home visit.',
      route: 'tests',
      icon: Activity,
      badge: language === 'hi' ? 'चरण 6: जांच' : language === 'mr' ? 'पायरी ६: चाचणी' : 'Step 6: Lab Tests',
      color: '#7C3AED',
      bg: '#F3E8FF'
    },
    {
      step: 7,
      title: language === 'hi'
        ? 'मेडिकल टेस्ट रिपोर्ट्स'
        : language === 'mr'
          ? 'वैद्यकीय तपासणी अहवाल'
          : 'Medical Lab Reports',
      desc: language === 'hi'
        ? 'प्रमाणित जांच रिपोर्ट देखें और व्हाट्सएप या पीडीएफ में तुरंत डाउनलोड करें।'
        : language === 'mr'
          ? 'तपासणी अहवाल पहा आणि पीडीएफ डाउनलोड करा.'
          : 'Instant access to certified digital reports with normal reference ranges & PDF export.',
      route: 'reports',
      icon: FileCheck,
      badge: language === 'hi' ? 'चरण 7: रिपोर्ट' : language === 'mr' ? 'पायरी ७: अहवाल' : 'Step 7: Reports',
      color: '#2563EB',
      bg: '#DBEAFE'
    },
    {
      step: 8,
      title: language === 'hi'
        ? 'फॉलो-अप परामर्श'
        : language === 'mr'
          ? 'पुढील तपासणी (फॉलो-अप)'
          : 'Follow-Up Management',
      desc: language === 'hi'
        ? 'डॉक्टर द्वारा निर्धारित अगली तारीख (18 सितंबर) और 1-क्लिक रीबुकिंग।'
        : language === 'mr'
          ? 'डॉक्टरांनी दिलेली पुढची तारीख (१८ सप्टेंबर) आणि पुढील भेट.'
          : 'Scheduled checkup dates, doctor instructions, and 1-click rebooking reminders.',
      route: 'follow-ups',
      icon: RefreshCw,
      badge: language === 'hi' ? 'चरण 8: फॉलो-अप' : language === 'mr' ? 'पायरी ८: फॉलो-अप' : 'Step 8: Follow-up',
      color: '#EA580C',
      bg: '#FFEDD5'
    },
    {
      step: 9,
      title: language === 'hi'
        ? 'विशेषज्ञ अस्पताल रेफरल'
        : language === 'mr'
          ? 'जिल्हा रुग्णालय संदर्भ (रेफरल)'
          : 'Specialist Referrals',
      desc: language === 'hi'
        ? 'पीएचसी से जिला सिविल अस्पताल के लिए डिजिटल रेफरल पर्ची देखें।'
        : language === 'mr'
          ? 'आरोग्य केंद्रातून जिल्हा रुग्णालयासाठी डिजिटल रेफरल चिठ्ठी पहा.'
          : 'Track digital referral slips from local PHC to District Civil Hospital specialists.',
      route: 'referrals',
      icon: Share2,
      badge: language === 'hi' ? 'चरण 9: रेफरल' : language === 'mr' ? 'पायरी ९: संदर्भ' : 'Step 9: Referrals',
      color: '#475569',
      bg: '#F1F5F9'
    }
  ];

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header Banner with Clean Back & Title */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F766E 0%, #0D9488 60%, #14B8A6 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.75rem',
          color: 'white',
          marginBottom: '1.75rem',
          boxShadow: '0 10px 25px -5px rgba(13, 148, 136, 0.25)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.18)', padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', fontSize: '0.785rem', fontWeight: 700, marginBottom: '0.5rem', backdropFilter: 'blur(4px)' }}>
            <HeartPulse size={14} />
            <span>{language === 'hi' ? 'ग्रामीण ओपीडी एवं स्वास्थ्य पोर्टल' : language === 'mr' ? 'ग्रामीण ओपीडी व आरोग्य पोर्टल' : 'Rural OPD & Healthcare Portal'}</span>
          </div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)' }}>
            {t('normalCare')}
          </h1>
        </div>

        {onGoBack && (
          <button
            onClick={onGoBack}
            className="btn btn-sm"
            style={{
              background: 'white',
              color: 'var(--primary-hover)',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              borderRadius: 'var(--radius-full)',
              padding: '0.6rem 1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <ArrowLeft size={16} />
            <span>{language === 'hi' ? '← पीछे जाएं' : language === 'mr' ? '← मागे जा' : '← Go Back'}</span>
          </button>
        )}
      </div>

      {/* 3 PRIMARY HERO ACTION BUTTONS (Requested by user: Book Appointment, Live Queue, Prescription History) */}
      <div style={{ marginBottom: '2.25rem' }}>
        <div style={{ marginBottom: '0.85rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {language === 'hi' ? '⚡ 3 मुख्य त्वरित सेवाएं (Primary Actions)' : language === 'mr' ? '⚡ ३ मुख्य जलद सेवा' : '⚡ 3 Core Quick Actions'}
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}
        >
          {/* 1. Normal Care & Book Appointment Button */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('find-doctor')}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDFA 100%)',
              border: '2px solid var(--primary)',
              boxShadow: '0 6px 18px -3px rgba(13, 148, 136, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
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
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.3)'
                }}
              >
                <Calendar size={28} />
              </div>
              <span className="badge badge-info" style={{ fontWeight: 800, fontSize: '0.725rem', marginBottom: '0.4rem' }}>
                {language === 'hi' ? '● स्लॉट तुरंत उपलब्ध' : language === 'mr' ? '● वेळ उपलब्ध' : '● Slots Available'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {language === 'hi'
                  ? 'सामान्य देखभाल और अपॉइंटमेंट बुक करें'
                  : language === 'mr'
                    ? 'सामान्य काळजी आणि अपॉइंटमेंट बुक करा'
                    : 'Normal Care & Book Appointment'}
              </h3>
            </div>

            <button
              className="btn btn-primary"
              style={{
                marginTop: '1.25rem',
                width: '100%',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem'
              }}
            >
              <span>{language === 'hi' ? 'अपॉइंटमेंट बुक करें' : language === 'mr' ? 'अपॉइंटमेंट बुक करा' : 'Book Appointment Now'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 2. Live Queue of Patient Button */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('queue')}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #EFF6FF 100%)',
              border: '2px solid #3B82F6',
              boxShadow: '0 6px 18px -3px rgba(59, 130, 246, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: '#2563EB',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                <Clock size={28} />
              </div>
              <span className="badge badge-warning" style={{ fontWeight: 800, fontSize: '0.725rem', marginBottom: '0.4rem' }}>
                {language === 'hi' ? '● सक्रिय टोकन #27' : language === 'mr' ? '● सक्रिय टोकन #२७' : '● Active Token #27'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {language === 'hi'
                  ? 'मरीज की लाइव कतार (Live Queue)'
                  : language === 'mr'
                    ? 'रुग्णाची थेट रांग (Live Queue)'
                    : 'Live Queue of Patient'}
              </h3>
            </div>

            <button
              className="btn btn-secondary"
              style={{
                marginTop: '1.25rem',
                width: '100%',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem'
              }}
            >
              <span>{language === 'hi' ? 'लाइव कतार देखें' : language === 'mr' ? 'थेट रांग पहा' : 'View Live Queue Status'}</span>
              <ChevronRight size={18} />
            </button>
          </div>

          {/* 3. Prescription History Button */}
          <div
            className="card card-clickable"
            onClick={() => onNavigate('prescriptions')}
            style={{
              padding: '1.5rem',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)',
              border: '2px solid #10B981',
              boxShadow: '0 6px 18px -3px rgba(16, 185, 129, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
          >
            <div>
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
                  marginBottom: '1rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                }}
              >
                <FileText size={28} />
              </div>
              <span className="badge badge-success" style={{ fontWeight: 800, fontSize: '0.725rem', marginBottom: '0.4rem' }}>
                {language === 'hi' ? '● आभा सत्यापित QR' : language === 'mr' ? '● आभा प्रमाणित' : '● ABHA Verified QR'}
              </span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0 0 0' }}>
                {language === 'hi'
                  ? 'दवा पर्ची इतिहास (Prescriptions)'
                  : language === 'mr'
                    ? 'औषध चिठ्ठी इतिहास (Prescriptions)'
                    : 'Prescription History'}
              </h3>
            </div>

            <button
              className="btn btn-outline"
              style={{
                marginTop: '1.25rem',
                width: '100%',
                fontWeight: 800,
                borderColor: '#10B981',
                color: '#047857',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.7rem'
              }}
            >
              <span>{language === 'hi' ? 'पर्ची इतिहास खोलें' : language === 'mr' ? 'चिठ्ठी इतिहास उघडा' : 'Open Prescription History'}</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Logical Step-by-Step Healthcare Pathway (Deduplicated, Clean & Easy to Understand) */}
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {language === 'hi' ? '📋 सम्पूर्ण मरीज सेवा चरण (Complete Healthcare Steps)' : language === 'mr' ? '📋 संपूर्ण रुग्ण सेवा टप्पे' : '📋 Complete Patient Care Pathway'}
          </h2>
        </div>

        {journeySteps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.step} style={{ position: 'relative' }}>
              <div
                className="card card-clickable"
                onClick={() => onNavigate(item.route)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1rem',
                  background: 'var(--surface)',
                  borderLeft: `5px solid ${item.color}`,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: item.bg,
                    color: item.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={26} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="badge badge-neutral" style={{ fontSize: '0.725rem', fontWeight: 700 }}>
                      {item.badge}
                    </span>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: item.color, fontWeight: 800, fontSize: '0.875rem' }}>
                  <span className="hidden-mobile" style={{ marginRight: '0.25rem' }}>
                    {language === 'hi' ? 'खोलें' : language === 'mr' ? 'उघडा' : 'Open'}
                  </span>
                  <ChevronRight size={18} />
                </div>
              </div>

              {index < journeySteps.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    margin: '-0.5rem 0 0.5rem 0',
                    color: 'var(--border-strong)'
                  }}
                >
                  <ArrowDown size={16} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
