import React, { useState, useEffect } from 'react';
import {
  Share2,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Lock,
  Clock,
  ArrowRight,
  AlertCircle,
  Activity,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  PlusCircle,
  QrCode
} from 'lucide-react';
import { referralTrackingService } from '../services/referralTrackingService';
import { ReferralTrackingTimeline } from '../components/referral/ReferralTrackingTimeline';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const Referrals = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [chains, setChains] = useState([]);
  const [activeChainId, setActiveChainId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchChains = async (quiet = false) => {
    if (!quiet) setLoading(true);
    try {
      const data = await referralTrackingService.getTrackingChains();
      setChains(data);
      if (data.length > 0 && (!activeChainId || !data.some(c => c.id === activeChainId))) {
        setActiveChainId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChains();

    // Listen for live referral updates emitted when a Doctor refers a patient!
    const handleReferralUpdate = (e) => {
      fetchChains(true);
      addToast(
        tr(
          '🔔 Doctor updated your referral tracking chain!',
          '🔔 डॉक्टर ने आपका रेफरल ट्रैकर अपडेट कर दिया है!',
          '🔔 डॉक्टरांनी तुमचा रेफरल ट्रॅकर अपडेट केला आहे!'
        ),
        'info'
      );
    };

    window.addEventListener('referral_chain_updated', handleReferralUpdate);
    return () => window.removeEventListener('referral_chain_updated', handleReferralUpdate);
  }, [language]);

  const activeChain = chains.find(c => c.id === activeChainId) || chains[0];

  return (
    <div className="page-wrapper animate-fade-in" style={{ paddingBottom: '3rem' }}>
      {/* Header Banner */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Share2 size={28} color="var(--primary)" />
            <span>{tr('Clinical Referral Tracking System', 'चिकित्सकीय रेफरल ट्रैकिंग सिस्टम', 'वैद्यकीय संदर्भ (रेफरल) ट्रॅकिंग प्रणाली')}</span>
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={() => {
              fetchChains(false);
              addToast(tr('Referral tracking synchronized!', 'रेफरल डेटा सिंक हुआ!', 'रेफरल माहिती सिंक झाली!'), 'success');
            }}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}
          >
            <RefreshCw size={14} />
            <span>{tr('Sync Live', 'ताज़ा करें', 'रिफ्रेश करा')}</span>
          </button>

          <button
            onClick={() => onNavigate('find-doctor')}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={15} />
            <span>{tr('Book Consultation', 'परामर्श बुक करें', 'सल्ला बुक करा')}</span>
          </button>
        </div>
      </div>

      {/* Case Selector Tabs (if multiple tracking orders exist) */}
      {chains.length > 1 && (
        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1.25rem' }}>
          {chains.map((chain) => {
            const isSelected = chain.id === activeChainId;
            return (
              <button
                key={chain.id}
                onClick={() => setActiveChainId(chain.id)}
                style={{
                  padding: '0.6rem 1.1rem',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid #e2e8f0',
                  background: isSelected ? 'var(--primary-light)' : '#ffffff',
                  color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isSelected ? '0 2px 6px rgba(2, 132, 199, 0.15)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <Activity size={14} color={isSelected ? 'var(--primary)' : '#64748b'} />
                <span>{chain.primaryCondition}</span>
                <span
                  style={{
                    background: isSelected ? 'var(--primary)' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569',
                    fontSize: '0.7rem',
                    padding: '0.1rem 0.4rem',
                    borderRadius: '999px',
                    fontWeight: 800
                  }}
                >
                  {chain.hops.length} {tr('Hops', 'चरण', 'टप्पे')}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
          <div
            style={{
              width: 42,
              height: 42,
              border: '3.5px solid #e2e8f0',
              borderTopColor: 'var(--primary)',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite'
            }}
          />
          <p>{t('loading')}...</p>
        </div>
      ) : !activeChain ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
          <AlertCircle size={40} color="#94a3b8" style={{ margin: '0 auto 0.75rem' }} />
          <h3 style={{ margin: 0, color: '#1e293b' }}>{tr('No Active Referrals Found', 'कोई सक्रिय रेफरल नहीं मिला', 'कोणताही सक्रिय रेफरल आढळला नाही')}</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            {tr(
              'When a Sub-centre or PHC doctor refers you to a specialist hospital, your live package-tracking timeline will appear here.',
              'जब कोई उप-केंद्र या पीएचसी डॉक्टर आपको विशेषज्ञ अस्पताल में रेफर करेंगे, तो आपकी लाइव ट्रैकिंग यहां दिखाई देगी।',
              'जेव्हा एखादे उपकेंद्र किंवा प्राथमिक आरोग्य केंद्राचे डॉक्टर तुम्हाला विशेषज्ञ रुग्णालयात रेफर करतील, तेव्हा तुमची थेट ट्रॅकिंग टाइमलाइन येथे दिसेल.'
            )}
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: 940, margin: '0 auto' }}>
          {/* Reusable Flipkart-Style Clinical Tracking Timeline */}
          <ReferralTrackingTimeline chain={activeChain} isDoctorView={false} />
        </div>
      )}
    </div>
  );
};
