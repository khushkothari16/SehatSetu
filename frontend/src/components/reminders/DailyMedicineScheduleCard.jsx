import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  Circle,
  Volume2,
  VolumeX,
  Bell,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Calendar,
  Check,
  RotateCcw
} from 'lucide-react';
import { medicineReminderService, DEFAULT_SLOTS } from '../../services/medicineReminderService';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export const DailyMedicineScheduleCard = ({ onNavigate }) => {
  const { language, tr } = useLanguage();
  const { addToast } = useNotifications();

  const [reminders, setReminders] = useState(() => medicineReminderService.getRemindersSync());
  const [speakingId, setSpeakingId] = useState(null);

  const refreshReminders = async () => {
    const list = await medicineReminderService.getReminders();
    setReminders(list);
  };

  useEffect(() => {
    refreshReminders();

    const handleUpdate = () => refreshReminders();
    window.addEventListener('medicine_reminder_updated', handleUpdate);
    window.addEventListener('dose_taken_success', handleUpdate);
    window.addEventListener('prescription_created', handleUpdate);

    return () => {
      window.removeEventListener('medicine_reminder_updated', handleUpdate);
      window.removeEventListener('dose_taken_success', handleUpdate);
      window.removeEventListener('prescription_created', handleUpdate);
    };
  }, []);

  const stats = medicineReminderService.getComplianceStats(reminders);

  const handleTakeDose = async (id, e) => {
    if (e) e.stopPropagation();
    const updated = await medicineReminderService.markDoseTaken(id);
    setReminders(updated);
    addToast(
      tr('✅ Dose recorded as taken! Keep up the good compliance.', '✅ दवा ली गई! स्वास्थ्य लाभ के लिए समय पर दवा जारी रखें।', '✅ औषध घेतले गेले! वेळेवर औषध घेणे सुरू ठेवा.'),
      'success'
    );
  };

  const handleUndoDose = async (id, e) => {
    if (e) e.stopPropagation();
    const updated = await medicineReminderService.markDosePending(id);
    setReminders(updated);
  };

  const handleTriggerTest = (reminder, e) => {
    if (e) e.stopPropagation();
    medicineReminderService.triggerReminderNow(reminder);
  };

  const handleSpeak = (reminder, e) => {
    if (e) e.stopPropagation();
    if (speakingId === reminder.id) {
      setSpeakingId(null);
    } else {
      setSpeakingId(reminder.id);
      medicineReminderService.speakReminder(reminder, language);
      setTimeout(() => setSpeakingId(null), 6000);
    }
  };

  // Group reminders by timing slot
  const slotsOrder = ['Morning', 'Afternoon', 'Evening', 'Night', 'Bedtime', 'SOS'];
  const groupedSlots = slotsOrder
    .map((slotKey) => {
      const items = reminders.filter((r) => r.timingSlot === slotKey);
      return {
        slotKey,
        config: DEFAULT_SLOTS[slotKey] || DEFAULT_SLOTS.Morning,
        items
      };
    })
    .filter((slot) => slot.items.length > 0);

  if (reminders.length === 0) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        padding: '1.4rem',
        borderRadius: 'var(--radius-xl)',
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        marginBottom: '1.5rem'
      }}
    >
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
            }}
          >
            <Pill size={24} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {tr("Today's Medicine Schedule & Reminders", 'आज की दवाइयों की अनुसूची व रिमाइंडर', 'आजचे औषधांचे वेळापत्रक व स्मरणपत्रे')}
              </h2>
              <span
                style={{
                  background: stats.percentage === 100 ? '#dcfce7' : '#e0f2fe',
                  color: stats.percentage === 100 ? '#15803d' : '#0369a1',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '0.15rem 0.55rem',
                  borderRadius: '999px'
                }}
              >
                ● {stats.taken}/{stats.total} {tr('Taken', 'पूर्ण', 'घेतले')} ({stats.percentage}%)
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {tr(
                'Personalized dose reminders with voice alerts & food instructions',
                'आवाज व भोजन निर्देशों के साथ व्यक्तिगत दवा रिमाइंडर',
                'आवाज व जेवणाच्या सूचनांसह वैयक्तिक औषध स्मरणपत्रे'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => {
              const pendingOne = reminders.find(r => r.status === 'pending') || reminders[0];
              handleTriggerTest(pendingOne);
            }}
            className="btn btn-outline btn-sm"
            style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              borderColor: '#f59e0b',
              color: '#d97706',
              borderRadius: '8px'
            }}
            title="Test notification alarm"
          >
            <Bell size={14} />
            <span>{tr('Test Reminder Alarm', 'टेस्ट रिमाइंडर बजाएं', 'टेस्ट अलार्म वाजवा')}</span>
          </button>

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('prescriptions')}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}
            >
              <span>{tr('All Prescriptions', 'सभी पर्चियां', 'सर्व चिठ्ठ्या')}</span>
              <ChevronRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Compliance Progress Bar */}
      <div style={{ marginBottom: '1.25rem', background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>
          <span>{tr('Daily Adherence Goal', 'दैनिक दवा अनुपालन', 'दैनिक औषध नियमितता')}</span>
          <span style={{ color: stats.percentage === 100 ? '#16a34a' : '#0284c7' }}>
            {stats.percentage === 100
              ? tr('🎉 All doses completed today!', '🎉 आज की सभी खुराक पूरी!', '🎉 आजचे सर्व डोस पूर्ण!')
              : `${stats.pending} ${tr('dose(s) remaining', 'खुराक बाकी', 'मात्रा बाकी')}`}
          </span>
        </div>
        <div style={{ width: '100%', height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
          <div
            style={{
              width: `${stats.percentage}%`,
              height: '100%',
              background: stats.percentage === 100
                ? 'linear-gradient(90deg, #16a34a 0%, #22c55e 100%)'
                : 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
              transition: 'width 0.4s ease'
            }}
          />
        </div>
      </div>

      {/* Slots Timeline Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {groupedSlots.map(({ slotKey, config, items }) => (
          <div
            key={slotKey}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '1rem 1.15rem'
            }}
          >
            {/* Slot Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Clock size={16} color="#0284c7" />
                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  {language === 'hi' ? config.labelHi : language === 'mr' ? config.labelMr : config.label}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, background: '#e0f2fe', color: '#0369a1', padding: '1px 7px', borderRadius: '6px' }}>
                  {config.time}
                </span>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                {items.filter(i => i.status === 'taken').length}/{items.length} {tr('Done', 'पूर्ण', 'पूर्ण')}
              </span>
            </div>

            {/* Medicines List in this Slot */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {items.map((rem) => {
                const isTaken = rem.status === 'taken';
                return (
                  <div
                    key={rem.id}
                    style={{
                      background: isTaken ? '#f0fdf4' : '#ffffff',
                      border: isTaken ? '1.5px solid #86efac' : '1.5px solid #cbd5e1',
                      borderRadius: '10px',
                      padding: '0.75rem 0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Left details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '220px' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '10px',
                          background: isTaken ? '#dcfce7' : '#e0f2fe',
                          color: isTaken ? '#16a34a' : '#0284c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                      >
                        {isTaken ? <CheckCircle2 size={20} /> : <Pill size={18} />}
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: isTaken ? '#166534' : '#0f172a', textDecoration: isTaken ? 'line-through' : 'none' }}>
                            {rem.medicineName}
                          </span>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              background: isTaken ? '#dcfce7' : '#f1f5f9',
                              color: isTaken ? '#15803d' : '#475569',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            {rem.dosage}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.76rem', color: isTaken ? '#15803d' : '#64748b', marginTop: 2 }}>
                          {rem.instructions}
                          {isTaken && rem.takenAt && (
                            <span style={{ fontWeight: 700, marginLeft: 4 }}>&bull; Taken at {rem.takenAt}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <button
                        type="button"
                        onClick={(e) => handleSpeak(rem, e)}
                        title="Speak instructions aloud"
                        style={{
                          background: speakingId === rem.id ? '#0284c7' : '#f8fafc',
                          color: speakingId === rem.id ? '#ffffff' : '#64748b',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                      >
                        <Volume2 size={15} />
                      </button>

                      {isTaken ? (
                        <button
                          type="button"
                          onClick={(e) => handleUndoDose(rem.id, e)}
                          className="btn btn-ghost btn-sm"
                          style={{
                            fontSize: '0.74rem',
                            color: '#15803d',
                            fontWeight: 700,
                            padding: '0.35rem 0.65rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                          title="Click to undo"
                        >
                          <Check size={14} color="#16a34a" />
                          <span>{tr('Taken', 'ली गई', 'घेतले')}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => handleTakeDose(rem.id, e)}
                          className="btn btn-success btn-sm"
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: 800,
                            padding: '0.4rem 0.85rem',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                            color: '#ffffff',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(22, 163, 74, 0.3)',
                            cursor: 'pointer'
                          }}
                        >
                          <Check size={14} />
                          <span>{tr('Take Dose', 'दवा लें', 'औषध घ्या')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
