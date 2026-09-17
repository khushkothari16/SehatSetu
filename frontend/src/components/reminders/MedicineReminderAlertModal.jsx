import React, { useState, useEffect } from 'react';
import {
  Pill,
  Clock,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Calendar,
  AlertTriangle,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { medicineReminderService } from '../../services/medicineReminderService';
import { voiceService } from '../../services/voiceService';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';

export const MedicineReminderAlertModal = () => {
  const { language, tr } = useLanguage();
  const { addToast } = useNotifications();
  const [activeReminder, setActiveReminder] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleDoseAlert = (e) => {
      if (e.detail) {
        setActiveReminder(e.detail);
        // Automatically speak reminder for hands-free rural accessibility
        medicineReminderService.speakReminder(e.detail, language);
        setIsSpeaking(true);
      }
    };

    window.addEventListener('medicine_dose_alert', handleDoseAlert);
    return () => {
      window.removeEventListener('medicine_dose_alert', handleDoseAlert);
      voiceService.stopSpeaking();
    };
  }, [language]);

  if (!activeReminder) return null;

  const handleTakeDose = async () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    await medicineReminderService.markDoseTaken(activeReminder.id);
    addToast(
      tr(
        `✅ Dose recorded as taken: ${activeReminder.medicineName} (${activeReminder.dosage})`,
        `✅ दवा ली गई: ${activeReminder.medicineName} (${activeReminder.dosage})`,
        `✅ औषध घेतले गेले: ${activeReminder.medicineName} (${activeReminder.dosage})`
      ),
      'success'
    );
    setActiveReminder(null);
  };

  const handleSnooze = async () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    await medicineReminderService.snoozeReminder(activeReminder.id, 15);
    addToast(
      tr(
        `⏰ Snoozed for 15 minutes: ${activeReminder.medicineName}`,
        `⏰ 15 मिनट के लिए स्नूज़ किया गया: ${activeReminder.medicineName}`,
        `⏰ १५ मिनिटांसाठी पुढे ढकलले: ${activeReminder.medicineName}`
      ),
      'info'
    );
    setActiveReminder(null);
  };

  const handleToggleVoice = () => {
    if (isSpeaking) {
      voiceService.stopSpeaking();
      setIsSpeaking(false);
    } else {
      medicineReminderService.speakReminder(activeReminder, language);
      setIsSpeaking(true);
    }
  };

  const handleDismiss = () => {
    voiceService.stopSpeaking();
    setIsSpeaking(false);
    setActiveReminder(null);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999999,
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={handleDismiss}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          maxWidth: '520px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '2px solid #f59e0b',
          animation: 'scaleIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Pulsing Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Pill size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.95 }}>
                {tr('MEDICINE TIME REMINDER', 'दवा लेने का समय', 'औषध घेण्याची वेळ')}
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff' }}>
                {activeReminder.timingSlot} {tr('Dose', 'खुराक', 'मात्रा')} &bull; {activeReminder.scheduledTime}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={handleToggleVoice}
              title="Listen Aloud"
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                border: 'none',
                background: isSpeaking ? '#ffffff' : 'rgba(255,255,255,0.2)',
                color: isSpeaking ? '#d97706' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                border: 'none',
                background: 'rgba(255,255,255,0.2)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '1.5rem' }}>
          {/* Main Medicine Card Box */}
          <div
            style={{
              background: '#fffbeb',
              border: '1.5px solid #fde68a',
              borderRadius: '14px',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <div>
                <span
                  style={{
                    display: 'inline-block',
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    marginBottom: '0.35rem'
                  }}
                >
                  {activeReminder.medicineType} &bull; {activeReminder.frequency}
                </span>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#1e293b' }}>
                  {activeReminder.medicineName}
                </h2>
              </div>
              <div
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '999px',
                  boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)'
                }}
              >
                {activeReminder.dosage}
              </div>
            </div>

            {/* Doctor's Intake Instructions */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #fef08a',
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                fontSize: '0.86rem',
                color: '#854d0e',
                marginTop: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Clock size={18} color="#d97706" style={{ flexShrink: 0 }} />
              <div>
                <strong>{tr('Instructions:', 'निर्देश:', 'सूचना:')}</strong> {activeReminder.instructions}
              </div>
            </div>

            {/* Doctor Context */}
            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>Prescribed by: <strong>{activeReminder.doctorName}</strong></span>
              <span>Ref: <strong>{activeReminder.prescriptionId}</strong></span>
            </div>
          </div>

          {/* Action Guarantee Pill */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '0.65rem 0.9rem',
              fontSize: '0.78rem',
              color: '#475569',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <ShieldCheck size={16} color="#16a34a" />
            <span>
              {tr(
                'Taking prescribed medicines on schedule ensures fast recovery and prevents bacterial resistance.',
                'समय पर दवा लेने से तेजी से सुधार होता है और बीमारी दोबारा नहीं फैलती।',
                'वेळेवर औषधे घेतल्यास लवकर आराम मिळतो आणि प्रकृती सुधारते.'
              )}
            </span>
          </div>

          {/* Primary Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleTakeDose}
              className="btn btn-success"
              style={{
                flex: 1.5,
                minWidth: '180px',
                padding: '0.85rem 1.25rem',
                fontSize: '0.95rem',
                fontWeight: 800,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.4)',
                cursor: 'pointer'
              }}
            >
              <CheckCircle2 size={20} />
              <span>{tr('✓ Mark as Taken', '✓ दवा ले ली (Taken)', '✓ औषध घेतले (Taken)')}</span>
            </button>

            <button
              type="button"
              onClick={handleSnooze}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '0.85rem 1rem',
                fontSize: '0.85rem',
                fontWeight: 700,
                borderRadius: '12px',
                borderColor: '#cbd5e1',
                color: '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                cursor: 'pointer'
              }}
            >
              <Clock size={16} />
              <span>{tr('Snooze 15m', '15 मिनट बाद', '१५ मि. नंतर')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
