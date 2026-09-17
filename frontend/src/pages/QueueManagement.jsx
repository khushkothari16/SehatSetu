import React, { useState, useEffect } from 'react';
import {
  Clock,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Volume2,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { queueService } from '../services/queueService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const QueueManagement = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [queue, setQueue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [audioAlertEnabled, setAudioAlertEnabled] = useState(true);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const data = await queueService.getQueueStatus();
      setQueue(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();

    const handleQueueChange = (e) => {
      if (e.detail) {
        setQueue(e.detail);
        if (e.detail.status === 'Your Turn') {
          addToast(`🔔 DING-DONG! Token #${e.detail.userToken}: Dr. ${e.detail.doctorName || 'Anjali Mehta'} is calling you into ${e.detail.room || 'OPD Room 4'}!`, 'success');
        }
      } else {
        fetchQueue();
      }
    };

    window.addEventListener('queue_state_change', handleQueueChange);
    window.addEventListener('appointment_booked', fetchQueue);
    return () => {
      window.removeEventListener('queue_state_change', handleQueueChange);
      window.removeEventListener('appointment_booked', fetchQueue);
    };
  }, []);



  if (loading) {
    return (
      <div className="page-wrapper animate-fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
        {t('loading')}
      </div>
    );
  }

  if (!queue || !queue.userToken) {
    return (
      <div className="page-wrapper animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">
            <Clock size={28} color="var(--primary)" />
            {t('queueManagement')}
          </h1>
        </div>

        <div
          className="card animate-scale-up"
          style={{
            maxWidth: 680,
            margin: '2rem auto',
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem'
            }}
          >
            <Clock size={36} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.6rem' }}>
            {tr('No Active OPD Appointment', 'कोई सक्रिय ओपीडी अपॉइंटमेंट नहीं है', 'कोणतीही सक्रिय ओपीडी तपासणी वेळ नाही')}
          </h2>

          <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: 480, margin: '0 auto 1.75rem', lineHeight: 1.6 }}>
            {tr(
              'You have not taken an OPD appointment yet. Once you book an appointment, your live token number, queue countdown, and doctor room alerts will be displayed here in real time.',
              'आपने अभी तक कोई ओपीडी अपॉइंटमेंट नहीं ली है। जब आप अपॉइंटमेंट लेंगे, तभी आपका लाइव टोकन नंबर, कतार की स्थिति और डॉक्टर कक्ष बुलावा यहां दिखेगा।',
              'तुम्ही अद्याप कोणतीही ओपीडी अपॉइंटमेंट घेतलेली नाही. अपॉइंटमेंट बुक केल्यानंतर तुमचा थेट टोकन नंबर व प्रतीक्षा वेळ येथे दिसेल.'
            )}
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate && onNavigate('find-doctor')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: 700 }}
            >
              <span>{tr('Book OPD Appointment Now', 'ओपीडी अपॉइंटमेंट बुक करें', 'ओपीडी अपॉइंटमेंट बुक करा')}</span>
              <span>&rarr;</span>
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={() => onNavigate && onNavigate('home')}
              style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}
            >
              {tr('Back to Home', 'होम पर वापस जाएं', 'मुख्य पृष्ठावर परत जा')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate progress percentage
  const totalSpan = Math.max(1, queue.userToken);
  const progressPercent = Math.min(100, Math.round((queue.currentToken / totalSpan) * 100));

  const getStatusBadge = () => {
    switch (queue.status) {
      case 'Your Turn':
        return <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>{tr('● YOUR TURN - ENTER OPD', '● आपकी बारी है - कमरा 4 में जाएं', '● आपली पाळी आहे - ओपीडी खोलीत जा')}</span>;
      case 'Almost Your Turn':
        return <span className="badge badge-warning" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>{tr('● ALMOST YOUR TURN (NEAR OPD)', '● लगभग आपकी बारी (ओपीडी के बाहर रहें)', '● जवळजवळ आपली पाळी (ओपीडीबाहेर थांबा)')}</span>;
      case 'Completed':
        return <span className="badge badge-neutral" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>{tr('✓ CONSULTATION COMPLETED', '✓ परामर्श पूर्ण हुआ', '✓ तपासणी पूर्ण झाली')}</span>;
      default:
        return <span className="badge badge-info" style={{ fontSize: '0.85rem', padding: '0.4rem 0.9rem' }}>{tr('● WAITING IN QUEUE', '● कतार में प्रतीक्षा', '● रांगेत प्रतीक्षा')}</span>;
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <Clock size={28} color="var(--primary)" />
          {t('queueManagement')}
        </h1>
      </div>

      {/* Main Queue Dashboard Display */}
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <div
          className="card"
          style={{
            padding: '2rem',
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          {/* Facility & Doctor Banner */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '1rem',
              paddingBottom: '1.5rem',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {tr('PRIMARY HEALTHCARE OPD QUEUE', 'प्राथमिक स्वास्थ्य केंद्र ओपीडी कतार', 'प्राथमिक आरोग्य केंद्र ओपीडी रांग')}
              </span>
              <h2 style={{ margin: '4px 0', fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {queue.doctorName}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <MapPin size={16} color="var(--primary)" />
                <span>{queue.facility} &bull; <strong>{queue.room}</strong></span>
              </div>
            </div>

            <div>{getStatusBadge()}</div>
          </div>

          {/* Large Token Numbers Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              margin: '2rem 0'
            }}
          >
            {/* User Token */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--primary-light)',
                border: '2px solid var(--primary)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-hover)', textTransform: 'uppercase' }}>
                {t('tokenNumber')}
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                #{queue.userToken}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {tr(`Assigned to ${queue.patientName || 'Patient'}`, `मरीज: ${queue.patientName || 'Patient'}`, `रुग्ण: ${queue.patientName || 'Patient'}`)}
              </div>
            </div>

            {/* Current Serving Token */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#F1F5F9',
                border: '2px solid var(--border-strong)',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {t('currentToken')}
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                #{queue.currentToken}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {tr('Currently Inside OPD Room', 'वर्तमान में डॉक्टर के पास', 'सध्या तपासणी खोलीमध्ये')}
              </div>
            </div>

            {/* Patients Ahead & Estimated Time */}
            <div
              style={{
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: queue.patientsAhead <= 2 ? '#FEF3C7' : '#F0F9FF',
                border: `2px solid ${queue.patientsAhead <= 2 ? '#F59E0B' : '#BAE6FD'}`,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: queue.patientsAhead <= 2 ? '#92400E' : '#0369A1', textTransform: 'uppercase' }}>
                {t('patientsAhead')}
              </div>
              <div style={{ fontSize: '3.5rem', fontWeight: 900, color: queue.patientsAhead <= 2 ? '#B45309' : '#0284C7', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>
                {queue.patientsAhead}
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                ~ {queue.estimatedWaitMinutes} {tr('mins wait', 'मिनट प्रतीक्षा', 'मिनिटे प्रतीक्षा')}
              </div>
            </div>
          </div>

          {/* Visual Progress Bar */}
          <div style={{ margin: '1.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              <span>{tr('OPD Progression:', 'ओपीडी प्रगति:', 'ओपीडी प्रगती:')} {progressPercent}%</span>
              <span>{tr('Updated:', 'अद्यतन:', 'अपडेट:')} {queue.updatedAt}</span>
            </div>
            <div
              style={{
                width: '100%',
                height: 12,
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--surface-alt)',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  backgroundColor: queue.status === 'Your Turn' ? 'var(--success)' : 'var(--primary)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>

          {/* Audio Alert Toggle & Simulation Controls */}
          <div
            style={{
              marginTop: '2rem',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-alt)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Volume2 size={20} color={audioAlertEnabled ? 'var(--primary)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {tr('Audio Token Announcements', 'बोलकर टोकन घोषणा (ऑडियो)', 'बोलून टोकन घोषणा (ऑडिओ)')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {tr('Plays gentle chime and vocal alert when your turn is near.', 'आपकी बारी आने पर घंटी और आवाज द्वारा सूचना देता है।', 'आपली पाळी जवळ आल्यावर सूचना आणि आवाज देईल.')}
                </div>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={audioAlertEnabled}
                onChange={(e) => setAudioAlertEnabled(e.target.checked)}
              />
              <span>{tr('Enabled', 'सक्रिय', 'सक्रिय')}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
