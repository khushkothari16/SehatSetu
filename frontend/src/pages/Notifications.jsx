import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  FileText,
  Share2,
  AlertTriangle,
  FileCheck,
  Check,
  ChevronRight,
  Pill,
  Volume2,
  Sparkles,
  Calendar
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useLanguage } from '../context/LanguageContext';
import { medicineReminderService } from '../services/medicineReminderService';
import { DailyMedicineScheduleCard } from '../components/reminders/DailyMedicineScheduleCard';

export const Notifications = ({ onNavigate }) => {
  const { notifications, markAsRead, markAllAsRead, unreadCount, addToast } = useNotifications();
  const { t, language, tr } = useLanguage();
  const [filterType, setFilterType] = useState('all'); // 'all' | 'medicine' | 'clinic'
  const [speakingId, setSpeakingId] = useState(null);

  const getIcon = (type) => {
    switch (type) {
      case 'medicine_reminder':
        return <Pill size={22} color="#D97706" />;
      case 'queue':
        return <Clock size={20} color="var(--secondary)" />;
      case 'prescription':
        return <FileText size={20} color="var(--primary)" />;
      case 'report':
        return <FileCheck size={20} color="#16A34A" />;
      case 'referral':
        return <Share2 size={20} color="#7C3AED" />;
      default:
        return <Bell size={20} color="var(--primary)" />;
    }
  };

  const handleTakeDoseFromNotif = async (notif, e) => {
    if (e) e.stopPropagation();
    if (notif.medicineReminderId) {
      await medicineReminderService.markDoseTaken(notif.medicineReminderId);
    }
    await markAsRead(notif.id);
    addToast(
      tr('✅ Dose recorded as taken!', '✅ दवा सफलतापूर्वक ली गई!', '✅ औषध यशस्वीपणे घेतले गेले!'),
      'success'
    );
  };

  const handleSpeakNotif = (notif, e) => {
    if (e) e.stopPropagation();
    if (speakingId === notif.id) {
      setSpeakingId(null);
    } else {
      setSpeakingId(notif.id);
      if (notif.medicineData) {
        medicineReminderService.speakReminder(notif.medicineData, language);
      } else {
        const text = language === 'hi' ? (notif.messageHi || notif.message) : language === 'mr' ? (notif.messageMr || notif.message) : notif.message;
        medicineReminderService.speakReminder({
          medicineName: notif.title,
          dosage: '',
          instructions: text,
          doctorName: ''
        }, language);
      }
      setTimeout(() => setSpeakingId(null), 5000);
    }
  };

  const handleTestTrigger = () => {
    const reminders = medicineReminderService.getRemindersSync();
    const target = reminders.find(r => r.status === 'pending') || reminders[0];
    if (target) {
      medicineReminderService.triggerReminderNow(target);
      addToast(
        tr(
          `🔔 Medicine reminder alarm triggered for ${target.medicineName}!`,
          `🔔 ${target.medicineName} के लिए दवा रिमाइंडर अलार्म बज उठा!`,
          `🔔 ${target.medicineName} साठी औषध स्मरणपत्र अलार्म वाजला!`
        ),
        'info'
      );
    }
  };

  const medCount = notifications.filter(n => n.type === 'medicine_reminder').length;
  const clinicCount = notifications.filter(n => n.type !== 'medicine_reminder').length;

  const filtered = notifications.filter((notif) => {
    if (filterType === 'medicine') return notif.type === 'medicine_reminder';
    if (filterType === 'clinic') return notif.type !== 'medicine_reminder';
    return true;
  });

  return (
    <div className="page-wrapper animate-fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 className="page-title">
              <Bell size={28} color="var(--primary)" />
              <span>{t('notifications')}</span>
              {unreadCount > 0 && (
                <span className="badge badge-emergency" style={{ fontSize: '0.8rem' }}>
                  {unreadCount} {tr('New', 'नए', 'नवीन')}
                </span>
              )}
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {tr(
                'Timely alerts for medicine doses, OPD queue updates, and doctor reports',
                'दवा की खुराक, ओपीडी कतार व डॉक्टर रिपोर्ट के लिए समय पर अलर्ट',
                'औषधांच्या वेळा, ओपीडी रांग व डॉक्टर अहवालांसाठी वेळेवर स्मरणपत्रे'
              )}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTestTrigger}
              className="btn btn-outline btn-sm"
              style={{
                borderColor: '#f59e0b',
                color: '#d97706',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Pill size={15} />
              <span>{tr('🔔 Test Dose Alarm', '🔔 टेस्ट दवा अलार्म', '🔔 टेस्ट डोस अलार्म')}</span>
            </button>

            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn btn-outline btn-sm">
                <Check size={16} />
                <span>{tr('Mark all as read', 'सभी पढ़े गए चिह्नित करें', 'सर्व वाचलेले म्हणून चिन्हांकित करा')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setFilterType('all')}
          style={{
            padding: '0.45rem 0.95rem',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'all' ? 'var(--primary)' : 'var(--surface-alt)',
            color: filterType === 'all' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          {tr('All Notifications', 'सभी सूचनाएं', 'सर्व सूचना')} ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterType('medicine')}
          style={{
            padding: '0.45rem 0.95rem',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'medicine' ? '#d97706' : '#fffbeb',
            color: filterType === 'medicine' ? '#ffffff' : '#b45309',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}
        >
          <Pill size={14} />
          <span>{tr('Medicine Reminders', 'दवा रिमाइंडर', 'औषध स्मरणपत्रे')} ({medCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterType('clinic')}
          style={{
            padding: '0.45rem 0.95rem',
            borderRadius: '999px',
            fontSize: '0.82rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            background: filterType === 'clinic' ? '#0284c7' : 'var(--surface-alt)',
            color: filterType === 'clinic' ? '#ffffff' : 'var(--text-secondary)'
          }}
        >
          {tr('Clinic & Queue Alerts', 'क्लिनिक व ओपीडी अलर्ट', 'क्लिनिक व रांग अलर्ट')} ({clinicCount})
        </button>
      </div>

      {/* If viewing Medicine Reminders tab, show the Daily Medicine Schedule & Timing Slots */}
      {filterType === 'medicine' && (
        <div style={{ marginBottom: '1.5rem' }}>
          <DailyMedicineScheduleCard onNavigate={onNavigate} />
        </div>
      )}

      {/* Notifications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Bell size={40} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
            <h3 style={{ margin: '0 0 0.35rem 0' }}>{tr('No notifications in this category', 'इस श्रेणी में कोई सूचना नहीं है', 'या श्रेणीत कोणतीही सूचना नाही')}</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {tr('You will receive reminders when medicine doses are scheduled or queue advances.', 'दवा के समय या कतार आगे बढ़ने पर आपको समय पर रिमाइंडर प्राप्त होंगे।', 'औषधांची वेळ किंवा रांग पुढे गेल्यावर तुम्हाला सूचना मिळतील.')}
            </p>
          </div>
        ) : (
          filtered.map((notif) => {
            const isMedicine = notif.type === 'medicine_reminder';
            return (
              <div
                key={notif.id}
                className="card card-clickable"
                onClick={() => {
                  markAsRead(notif.id);
                  if (notif.link) onNavigate(notif.link.replace('/', ''));
                }}
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  backgroundColor: notif.read ? 'var(--surface)' : isMedicine ? '#fffbeb' : 'var(--primary-light)',
                  border: notif.read ? '1px solid var(--border)' : isMedicine ? '1.5px solid #fde68a' : '1px solid #99F6E4',
                  transition: 'all 0.15s ease',
                  borderRadius: '14px'
                }}
              >
                {/* Icon */}
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '12px',
                    backgroundColor: notif.read ? 'var(--surface-alt)' : isMedicine ? '#fef3c7' : '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {getIcon(notif.type)}
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3, flexWrap: 'wrap', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: notif.read ? 600 : 800, color: 'var(--text-primary)' }}>
                        {language === 'hi' ? (notif.titleHi || notif.title) : language === 'mr' ? (notif.titleMr || notif.title) : notif.title}
                      </h4>
                      {isMedicine && (
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: '4px' }}>
                          DOSE REMINDER
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {notif.time}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {language === 'hi' ? (notif.messageHi || notif.message) : language === 'mr' ? (notif.messageMr || notif.message) : notif.message}
                  </p>

                  {/* Medicine-specific quick actions right on notification card */}
                  {isMedicine && notif.medicineReminderId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={(e) => handleTakeDoseFromNotif(notif, e)}
                        className="btn btn-success btn-sm"
                        style={{
                          fontSize: '0.76rem',
                          padding: '0.35rem 0.75rem',
                          fontWeight: 800,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <Check size={14} />
                        <span>{tr('✓ Take Dose Now', '✓ दवा अभी लें', '✓ औषध आत्ता घ्या')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleSpeakNotif(notif, e)}
                        className="btn btn-outline btn-sm"
                        style={{
                          fontSize: '0.74rem',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          color: '#b45309',
                          borderColor: '#fde68a'
                        }}
                        title="Listen to medicine instructions"
                      >
                        <Volume2 size={14} />
                        <span>{tr('Listen Aloud', 'सुनें', 'ऐका')}</span>
                      </button>
                    </div>
                  )}
                </div>

                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
