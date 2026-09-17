import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle2,
  FileText,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { followUpService } from '../services/followUpService';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';

export const FollowUp = ({ onNavigate }) => {
  const { t, language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const data = await followUpService.getFollowUps();
      setFollowUps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
    const handleCreated = () => fetchFollowUps();
    window.addEventListener('followup_created', handleCreated);
    return () => window.removeEventListener('followup_created', handleCreated);
  }, []);

  const formatDueDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="page-wrapper animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Calendar size={28} color="var(--primary)" />
          <span>{tr('Follow-Up & Review Schedules', 'फॉलो-अप और समीक्षा अनुसूची', 'पुढील तपासणी व आढावा वेळापत्रक')}</span>
        </h1>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>{t('loading')}</div>
      ) : followUps.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>{tr('No follow-ups due', 'कोई फॉलो-अप देय नहीं है', 'कोणतीही पुढील तपासणी बाकी नाही')}</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 860, margin: '0 auto' }}>
          {followUps.map((fup) => (
            <div
              key={fup.id}
              className="card"
              style={{
                padding: '1.75rem',
                borderLeft: '5px solid var(--primary)',
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <span className="badge badge-warning" style={{ fontWeight: 700, marginBottom: 4, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={13} />
                    <span>
                      {tr('Scheduled Review:', 'निर्धारित जांच:', 'नियोजित तपासणी:')} {formatDueDate(fup.dueDate) || fup.dueDate || '18 September 2026'}
                    </span>
                  </span>
                  {fup.patientName && (
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: 2 }}>
                      {tr('Patient:', 'मरीज़:', 'रुग्ण:')} {fup.patientName} {fup.patientAbhaId ? `(ABHA: ${fup.patientAbhaId})` : ''}
                    </div>
                  )}
                  <h3 style={{ margin: '4px 0', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {tr('Follow-Up with', 'फॉलो-अप परामर्श:', 'पुढील तपासणी:')} {fup.doctorName}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {fup.specialty} &bull; {fup.facility}
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('find-doctor')}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  <RefreshCw size={15} />
                  <span>{tr('Book Review Slot', 'जांच स्लॉट बुक करें', 'तपासणी स्लॉट बुक करा')}</span>
                </button>
              </div>

              {/* Instructions Box */}
              <div
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--surface-alt)',
                  marginBottom: '1rem',
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>
                  {tr("Doctor's Clinical Instruction:", 'डॉक्टर के चिकित्सीय निर्देश:', 'डॉक्टरांच्या वैद्यकीय सूचना:')}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  "{fup.instructions}"
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                <span>{tr('Initial OPD Visit:', 'प्रारंभिक ओपीडी परामर्श:', 'पहिली ओपीडी भेट:')} {fup.previousAppointmentDate}</span>
                <button
                  onClick={() => onNavigate('prescriptions')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.8rem', color: 'var(--primary)' }}
                >
                  <FileText size={14} />
                  <span>{tr('View Associated Prescription', 'संबंधित पर्ची देखें', 'संबंधित चिठ्ठी पहा')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
