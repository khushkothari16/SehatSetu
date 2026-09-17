import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Clock,
  Calendar,
  AlertCircle,
  Pill,
  ShieldCheck,
  CheckCircle2,
  Info,
  ExternalLink
} from 'lucide-react';
import { voiceService } from '../../services/voiceService';
import { aiService } from '../../services/aiService';
import { useLanguage } from '../../context/LanguageContext';

export const AiMedicationExplainerModal = ({ isOpen, onClose, medicine, prescription, onNavigate }) => {
  const { language, tr } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (!isOpen || !medicine) return;

    // Reset speech state
    setIsSpeaking(false);
    voiceService.stopSpeaking();

    // Fetch dynamic Gemini explanation in the background for extra personalized advice
    const fetchGeminiExplanation = async () => {
      setLoadingAi(true);
      try {
        const prompt = `Explain the following prescribed medication for a rural patient in simple words:
Medicine: ${medicine.name} (${medicine.type || 'Tablet'})
Dosage: ${medicine.dosage}
Frequency: ${medicine.frequency}
Duration: ${medicine.duration}
Doctor's Special Instructions: ${medicine.instructions || 'None'}
Diagnosis: ${prescription?.diagnosis || 'General OPD Care'}

Give 3 short practical bullet points:
1. What this medicine does and why it was prescribed
2. Exact timing schedule (morning, afternoon, night, empty stomach or after food)
3. Duration importance (why completing full course matters and precautions)`;

        const res = await aiService.callGeminiApi({
          prompt,
          language
        });

        if (res) {
          setAiInsight(res);
        }
      } catch (err) {
        console.warn('Gemini explanation fetch error:', err);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchGeminiExplanation();

    return () => {
      voiceService.stopSpeaking();
    };
  }, [isOpen, medicine, language]);

  if (!isOpen || !medicine) return null;

  // Derive human-friendly schedule breakdown
  const getFrequencySchedule = (freq = '') => {
    const f = freq.toLowerCase();
    if (f.includes('1-0-1') || f.includes('twice')) {
      return {
        slots: [
          { time: tr('Morning (After breakfast)', 'सुबह (नाश्ते के बाद)', 'सकाळी (नाश्त्यानंतर)'), icon: '🌅', active: true },
          { time: tr('Afternoon', 'दोपहर', 'दुपारी'), icon: '☀️', active: false },
          { time: tr('Night (After dinner)', 'रात (खाने के बाद)', 'रात्री (जेवणानंतर)'), icon: '🌙', active: true }
        ],
        text: tr(
          'Twice daily: 1 dose in the morning after breakfast, and 1 dose at night after dinner.',
          'दिन में 2 बार: सुबह नाश्ते के बाद और रात को खाना खाने के बाद।',
          'दिवसातून २ वेळा: सकाळी नाश्त्यानंतर आणि रात्री जेवणानंतर.'
        )
      };
    }
    if (f.includes('1-1-1') || f.includes('thrice') || f.includes('tds')) {
      return {
        slots: [
          { time: tr('Morning', 'सुबह', 'सकाळी'), icon: '🌅', active: true },
          { time: tr('Afternoon', 'दोपहर', 'दुपारी'), icon: '☀️', active: true },
          { time: tr('Night', 'रात', 'रात्री'), icon: '🌙', active: true }
        ],
        text: tr(
          '3 times daily: Morning, afternoon, and night after meals.',
          'दिन में 3 बार: सुबह, दोपहर और रात को खाना खाने के बाद।',
          'दिवसातून ३ वेळा: सकाळी, दुपारी आणि रात्री जेवणानंतर.'
        )
      };
    }
    if (f.includes('0-0-1') || f.includes('night') || f.includes('bedtime')) {
      return {
        slots: [
          { time: tr('Morning', 'सुबह', 'सकाळी'), icon: '🌅', active: false },
          { time: tr('Afternoon', 'दोपहर', 'दुपारी'), icon: '☀️', active: false },
          { time: tr('Night (Before bedtime)', 'रात (सोने से पहले)', 'रात्री (झोपण्यापूर्वी)'), icon: '🌙', active: true }
        ],
        text: tr(
          'Once daily: Only at night before going to bed.',
          'दिन में केवल 1 बार: रात को सोने से पहले।',
          'दिवसातून फक्त १ वेळा: रात्री झोपण्यापूर्वी.'
        )
      };
    }
    if (f.includes('1-0-0') || f.includes('once') || f.includes('morning')) {
      return {
        slots: [
          { time: tr('Morning', 'सुबह', 'सकाळी'), icon: '🌅', active: true },
          { time: tr('Afternoon', 'दोपहर', 'दुपारी'), icon: '☀️', active: false },
          { time: tr('Night', 'रात', 'रात्री'), icon: '🌙', active: false }
        ],
        text: tr(
          'Once daily: 1 dose in the morning.',
          'दिन में केवल 1 बार: सुबह नाश्ते के बाद (या खाली पेट यदि डॉक्टर ने कहा हो)।',
          'दिवसातून फक्त १ वेळा: सकाळी नाश्त्यानंतर (किंवा उपाशीपोटी डॉक्टरांनी सांगितल्यास).'
        )
      };
    }
    if (f.includes('sos') || f.includes('needed')) {
      return {
        slots: [
          { time: tr('As Needed (SOS)', 'जरूरत पड़ने पर', 'गरज भासल्यास (SOS)'), icon: '⚡', active: true }
        ],
        text: tr(
          'Only when needed (SOS) if you have severe fever or pain.',
          'केवल जरूरत पड़ने पर (जैसे तेज दर्द या 100°F से अधिक बुखार होने पर)।',
          'फक्त गरज भासल्यास (जसे तीव्र वेदना किंवा १००°F पेक्षा जास्त ताप असल्यास).'
        )
      };
    }
    return {
      slots: [
        { time: freq, icon: '⏰', active: true }
      ],
      text: `${tr('As prescribed:', 'डॉक्टर द्वारा निर्धारित खुराक:', 'डॉक्टरांनी सांगितल्यानुसार:')} ${freq}`
    };
  };

  const schedule = getFrequencySchedule(medicine.frequency);

  // Full speech text for Text-to-Speech
  const getFullSpeechText = () => {
    return tr(
      `Medicine details for ${medicine.name}. Prescribed dosage: ${medicine.dosage}. When to take: ${schedule.text}. Duration: You must take this for ${medicine.duration}. Special Instructions: ${medicine.instructions || 'Take with water'}. Important: Always complete the full course without skipping doses. This medicine is also available at Pradhan Mantri Jan Aushadhi Kendras at subsidized generic rates.`,
      `दवा का नाम: ${medicine.name}। खुराक: ${medicine.dosage}। समय: ${schedule.text}। अवधि: यह दवा आपको पूरे ${medicine.duration} तक लेनी है। डॉक्टर के विशेष निर्देश: ${medicine.instructions || 'पानी के साथ लें'}। ध्यान दें: एंटीबायोटिक दवाओं का कोर्स बीच में अधूरा न छोड़ें, भले ही आप पहले ठीक महसूस करने लगें। यह दवा जन औषधि केंद्र पर किफायती दाम में उपलब्ध है।`,
      `औषधाचे नाव: ${medicine.name}. प्रमाण: ${medicine.dosage}. वेळ: ${schedule.text}. कालावधी: हे औषध तुम्हाला पूर्ण ${medicine.duration} पर्यंत घ्यायचे आहे. डॉक्टरांच्या विशेष सूचना: ${medicine.instructions || 'पाण्यासोबत घ्या'}. लक्ष द्या: औषधांचा कोर्स अर्धवट सोडू नका, जरी बरे वाटू लागले तरी. हे औषध प्रधानमंत्री जन औषध केंद्रावर सवलतीच्या दरात उपलब्ध आहे.`
    );
  };

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    voiceService.speakText({
      text: aiInsight || getFullSpeechText(),
      language,
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false)
    });
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        padding: '1rem'
      }}
    >
      <div
        className="modal-dialog animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 620,
          width: '100%',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(124, 58, 237, 0.25)',
          border: '2px solid #E9D5FF'
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(4px)'
              }}
            >
              <Sparkles size={22} color="#FDE047" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#E9D5FF' }}>
                  {tr('AI MEDICATION EXPLAINER', 'एआई दवा परामर्श', 'एआय औषध सल्लागार')}
                </span>
                <span style={{ background: '#FDE047', color: '#78350F', fontSize: '0.65rem', fontWeight: 800, padding: '1px 6px', borderRadius: '8px' }}>
                  Gemini AI
                </span>
              </div>
              <h3 style={{ margin: '2px 0 0 0', fontSize: '1.2rem', fontWeight: 800 }}>
                {medicine.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', maxHeight: '72vh', overflowY: 'auto' }}>
          {/* Audio Speaker Banner */}
          <div
            style={{
              marginBottom: '1.25rem',
              padding: '0.75rem 1rem',
              borderRadius: '14px',
              backgroundColor: isSpeaking ? '#FEF2F2' : '#FAF5FF',
              border: isSpeaking ? '1.5px solid #F87171' : '1.5px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Volume2 size={20} color={isSpeaking ? '#DC2626' : '#7C3AED'} />
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: isSpeaking ? '#991B1B' : '#581C87' }}>
                {tr('Listen to complete medicine instructions aloud:', 'पूरी दवा का विवरण बोलकर सुनें:', 'संपूर्ण औषधाचा तपशील बोलून ऐका:')}
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleSpeak}
              className="btn btn-sm"
              style={{
                backgroundColor: isSpeaking ? '#DC2626' : '#7C3AED',
                color: 'white',
                fontWeight: 800,
                borderRadius: '20px',
                padding: '0.4rem 0.95rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
              }}
            >
              {isSpeaking ? (
                <>
                  <VolumeX size={15} />
                  <span>{tr('Stop', 'रोकें', 'थांबवा')}</span>
                </>
              ) : (
                <>
                  <Volume2 size={15} />
                  <span>{tr('🔊 Listen', '🔊 आवाज में सुनें', '🔊 आवाजात ऐका')}</span>
                </>
              )}
            </button>
          </div>

          {/* 1. KEY DOSAGE & TIMING SECTION */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {/* Dosage */}
            <div style={{ background: '#F8FAFC', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                📏 {tr('Dosage', 'खुराक (Dosage)', 'प्रमाण / डोस (Dosage)')}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0F172A' }}>
                {medicine.dosage}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '2px' }}>
                {medicine.type || 'Tablet/Capsule'}
              </div>
            </div>

            {/* When to take */}
            <div style={{ background: '#EFF6FF', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #BFDBFE' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: '4px' }}>
                ⏰ {tr('Frequency', 'कब लेना है (Frequency)', 'कधी घ्यायचे (वारंवारता)')}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#1E40AF' }}>
                {medicine.frequency}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#2563EB', marginTop: '2px' }}>
                {schedule.text}
              </div>
            </div>

            {/* How much time */}
            <div style={{ background: '#FEF3C7', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309', textTransform: 'uppercase', marginBottom: '4px' }}>
                ⏳ {tr('Duration', 'कितने दिन तक (Duration)', 'किती दिवस (कालावधी)')}
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#92400E' }}>
                {medicine.duration}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#B45309', marginTop: '2px' }}>
                {tr('Complete entire course', 'कोर्स पूरा करना अनिवार्य', 'संपूर्ण कोर्स पूर्ण करणे आवश्यक')}
              </div>
            </div>
          </div>

          {/* 2. VISUAL DAILY SCHEDULE (Morning, Afternoon, Night) */}
          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#F8FAFC', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={15} /> {tr('Daily Schedule:', 'दैनिक समय सारिणी (Daily Schedule):', 'दैनिक वेळापत्रक (Daily Schedule):')}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              {schedule.slots.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.75rem 0.5rem',
                    textAlign: 'center',
                    borderRadius: '10px',
                    background: s.active ? '#ECFDF5' : '#F1F5F9',
                    border: s.active ? '1.5px solid #10B981' : '1px dashed #CBD5E1',
                    color: s.active ? '#065F46' : '#94A3B8'
                  }}
                >
                  <div style={{ fontSize: '1.3rem', marginBottom: '3px' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800 }}>{s.time}</div>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      marginTop: '4px',
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: '8px',
                      background: s.active ? '#D1FAE5' : '#E2E8F0',
                      color: s.active ? '#047857' : '#64748B'
                    }}
                  >
                    {s.active ? tr('✓ Take', '✓ लेनी है', '✓ घ्यायची आहे') : tr('Skip', '✗ नहीं लेनी', '✗ नाही घ्यायची')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. SPECIAL INSTRUCTIONS & PRECAUTIONS */}
          <div style={{ marginBottom: '1.25rem', padding: '1rem', background: '#FFFBEB', borderRadius: '14px', border: '1.5px solid #FCD34D' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={15} color="#D97706" />
              {tr('Doctor Special Instructions & Precautions:', 'डॉक्टर के विशेष निर्देश व सावधानियां:', 'डॉक्टरांच्या विशेष सूचना व खबरदारी:')}
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#78350F', lineHeight: 1.5, fontWeight: 600 }}>
              {medicine.instructions || tr('Take after meals with clean drinking water.', 'ताजे पानी के साथ भोजन के बाद लें।', 'स्वच्छ पाण्यासोबत जेवणानंतर घ्या.')}
            </p>
            <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, fontSize: '0.82rem', color: '#92400E', lineHeight: 1.4 }}>
              <li>{tr('Take after meals to avoid gastrointestinal upset.', 'दवा खाली पेट न लें यदि एसिडिटी की समस्या हो।', 'ऍसिडिटीचा त्रास टाळण्यासाठी रिकाम्या पोटी औषध घेऊ नका.')}</li>
              <li>{tr('Do not double up doses if you miss one.', 'यदि कोई खुराक छूट जाए तो अगली बार दोहरी खुराक न लें।', 'एखादा डोस चुकला असल्यास पुढच्या वेळी दुप्पट डोस घेऊ नका.')}</li>
              <li>{tr('Do not discontinue prematurely even if symptoms resolve.', 'खुराक बंद करने से पहले डॉक्टर की सलाह लें।', 'लक्षणे कमी झाली तरी डॉक्टरांच्या सल्ल्याशिवाय औषध थांबवू नका.')}</li>
            </ul>
          </div>

          {/* 4. AI GEMINI SUMMARY IF AVAILABLE */}
          {aiInsight && (
            <div
              className="animate-fade-in"
              style={{
                marginBottom: '1.25rem',
                padding: '1rem',
                background: '#FAF5FF',
                borderRadius: '14px',
                border: '1.5px solid #DDD6FE'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem', color: '#6D28D9', fontWeight: 800, fontSize: '0.8rem' }}>
                <Sparkles size={14} />
                <span>{tr('Gemini AI Smart Summary:', 'Gemini AI स्मार्ट व्याख्या:', 'Gemini AI स्मार्ट विश्लेषण:')}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#4C1D95', lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                {aiInsight}
              </div>
            </div>
          )}

          {/* 5. PRADHAN MANTRI JAN AUSHADHI LINK */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              backgroundColor: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#16A34A" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#14532D' }}>
                  {tr('Jan Aushadhi Generic Savings (85% Discount)', 'प्रधानमंत्री जन औषधि केंद्र विकल्प', 'प्रधानमंत्री जन औषध केंद्र पर्याय (८५% सवलत)')}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#166534' }}>
                  {tr('Get certified affordable generic alternatives at your local PHC pharmacy.', 'यह दवा सरकारी जन औषधि केंद्रों पर न्यूनतम मूल्य में उपलब्ध है।', 'हे औषध सरकारी जन औषध केंद्रांवर अत्यंत कमी दरात उपलब्ध आहे.')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                localStorage.setItem('sehatsetu_active_med_search', medicine.name);
                if (onNavigate) onNavigate('medicines');
              }}
              className="btn btn-sm"
              style={{
                backgroundColor: '#16A34A',
                color: 'white',
                fontWeight: 800,
                borderRadius: '8px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Pill size={12} />
              <span>{tr('Check Stock', 'स्टॉक देखें', 'स्टॉक पहा')}</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem'
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary btn-sm"
            style={{ borderRadius: '8px', padding: '0.45rem 1.5rem', fontWeight: 800 }}
          >
            {tr('Understood (Close)', 'समझ गया (Close)', 'समजले (बंद करा)')}
          </button>
        </div>
      </div>
    </div>
  );
};
