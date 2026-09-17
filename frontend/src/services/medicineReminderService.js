import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_PRESCRIPTIONS } from '../data/mockData';
import { voiceService } from './voiceService';

/**
 * Medicine Timing Slots & Defaults
 */
export const DEFAULT_SLOTS = {
  Morning: { time: '08:00 AM', label: 'Morning Dose', labelHi: 'सुबह की खुराक (नाश्ते के बाद)', labelMr: 'सकाळची मात्रा (नाश्त्यानंतर)', icon: 'Sunrise' },
  Afternoon: { time: '01:30 PM', label: 'Afternoon Dose', labelHi: 'दोपहर की खुराक (भोजन के बाद)', labelMr: 'दुपारची मात्रा (जेवणानंतर)', icon: 'Sun' },
  Evening: { time: '05:30 PM', label: 'Evening Dose', labelHi: 'शाम की खुराक', labelMr: 'संध्याकाळची मात्रा', icon: 'Sunset' },
  Night: { time: '08:30 PM', label: 'Night Dose', labelHi: 'रात की खुराक (खाने के बाद)', labelMr: 'रात्रीची मात्रा (जेवणानंतर)', icon: 'Moon' },
  Bedtime: { time: '10:00 PM', label: 'Bedtime Dose', labelHi: 'सोने से पहले की खुराक', labelMr: 'झोपण्यापूर्वीची मात्रा', icon: 'Bed' },
  SOS: { time: 'As Needed', label: 'SOS / As Needed', labelHi: 'जरूरत पड़ने पर (SOS)', labelMr: 'गरज भासल्यास (SOS)', icon: 'AlertCircle' }
};

/**
 * Parse medicine frequency string into timing slots
 */
function parseSlotsFromFrequency(freqStr = '') {
  const f = (freqStr || '').toLowerCase();
  const slots = [];

  if (f.includes('1-1-1') || f.includes('thrice') || f.includes('3 times')) {
    slots.push('Morning', 'Afternoon', 'Night');
  } else if (f.includes('1-0-1') || f.includes('twice') || f.includes('2 times')) {
    slots.push('Morning', 'Night');
  } else if (f.includes('1-0-0') || f.includes('morning')) {
    slots.push('Morning');
  } else if (f.includes('0-1-0') || f.includes('afternoon') || f.includes('noon')) {
    slots.push('Afternoon');
  } else if (f.includes('0-0-1') || f.includes('night') || f.includes('bedtime')) {
    slots.push('Night');
  } else if (f.includes('sos') || f.includes('as needed') || f.includes('when required')) {
    slots.push('SOS');
  } else {
    // Default fallback to Morning and Night
    slots.push('Morning', 'Night');
  }

  return slots;
}

/**
 * Generate reminders from prescriptions
 */
function extractRemindersFromPrescriptions(prescriptions = []) {
  const todayStr = new Date().toISOString().split('T')[0];
  const reminders = [];

  prescriptions.forEach((rx) => {
    (rx.medicines || []).forEach((med, medIdx) => {
      const slots = parseSlotsFromFrequency(med.frequency);
      slots.forEach((slotKey) => {
        const slotConfig = DEFAULT_SLOTS[slotKey] || DEFAULT_SLOTS.Morning;
        const reminderId = `REM-${rx.id || 'RX'}-${medIdx}-${slotKey.toLowerCase()}`;

        reminders.push({
          id: reminderId,
          prescriptionId: rx.id || 'RX-2026',
          doctorName: rx.doctorName || 'Dr. Rural Specialist',
          facility: rx.facility || 'Primary Health Centre',
          medicineName: med.name,
          medicineType: med.type || 'Tablet',
          dosage: med.dosage || '1 tablet',
          frequency: med.frequency || '1-0-1',
          duration: med.duration || '5 days',
          instructions: med.instructions || 'Take after food with water',
          timingSlot: slotKey,
          scheduledTime: slotConfig.time,
          status: 'pending', // 'pending' | 'taken' | 'snoozed'
          date: todayStr,
          takenAt: null
        });
      });
    });
  });

  return reminders;
}

export const medicineReminderService = {
  /**
   * Get all active medicine reminders for today
   */
  async getReminders() {
    await delay(100);
    const existing = getStored(STORAGE_KEYS.MEDICINE_REMINDERS, null);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }

    // Auto-initialize from stored or mock prescriptions
    const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const generated = extractRemindersFromPrescriptions(prescriptions);
    setStored(STORAGE_KEYS.MEDICINE_REMINDERS, generated);
    return generated;
  },

  /**
   * Synchronous getter for instant UI renders
   */
  getRemindersSync() {
    const existing = getStored(STORAGE_KEYS.MEDICINE_REMINDERS, null);
    if (existing && Array.isArray(existing) && existing.length > 0) {
      return existing;
    }
    const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const generated = extractRemindersFromPrescriptions(prescriptions);
    setStored(STORAGE_KEYS.MEDICINE_REMINDERS, generated);
    return generated;
  },

  /**
   * Save reminder list
   */
  saveReminders(reminders) {
    setStored(STORAGE_KEYS.MEDICINE_REMINDERS, reminders);
    window.dispatchEvent(new CustomEvent('medicine_reminder_updated', { detail: reminders }));
  },

  /**
   * Mark a specific dose reminder as TAKEN
   */
  async markDoseTaken(reminderId) {
    const reminders = await this.getReminders();
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedTarget = null;
    const updated = reminders.map((r) => {
      if (r.id === reminderId) {
        updatedTarget = {
          ...r,
          status: 'taken',
          takenAt: timeNow
        };
        return updatedTarget;
      }
      return r;
    });

    this.saveReminders(updated);

    // Sync notification if present
    try {
      const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, []);
      const updatedNotifs = notifs.map(n => {
        if (n.medicineReminderId === reminderId) {
          return { ...n, read: true, taken: true };
        }
        return n;
      });
      setStored(STORAGE_KEYS.NOTIFICATIONS, updatedNotifs);
    } catch (e) {}

    window.dispatchEvent(new CustomEvent('dose_taken_success', { detail: updatedTarget }));
    return updated;
  },

  /**
   * Mark dose back to PENDING (undo)
   */
  async markDosePending(reminderId) {
    const reminders = await this.getReminders();
    const updated = reminders.map((r) => {
      if (r.id === reminderId) {
        return {
          ...r,
          status: 'pending',
          takenAt: null
        };
      }
      return r;
    });
    this.saveReminders(updated);
    return updated;
  },

  /**
   * Snooze a reminder for N minutes
   */
  async snoozeReminder(reminderId, minutes = 15) {
    const reminders = await this.getReminders();
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutes);
    const newTime = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const updated = reminders.map((r) => {
      if (r.id === reminderId) {
        return {
          ...r,
          status: 'snoozed',
          scheduledTime: newTime,
          snoozedUntil: d.toISOString()
        };
      }
      return r;
    });
    this.saveReminders(updated);
    return updated;
  },

  /**
   * Trigger an immediate live notification & audible chime for a dose reminder
   */
  triggerReminderNow(reminder) {
    if (!reminder) return;

    // 1. Play gentle pleasant medical audio chime
    this.playChime();

    // 2. Add an official entry into notifications list
    try {
      const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, []);
      const newNotif = {
        id: `NOTIF-MED-${Date.now()}`,
        title: `⏰ Medicine Reminder: ${reminder.medicineName}`,
        titleHi: `⏰ दवा लेने का समय: ${reminder.medicineName}`,
        titleMr: `⏰ औषध घेण्याची वेळ: ${reminder.medicineName}`,
        message: `Time to take ${reminder.dosage} (${reminder.timingSlot} Dose). Instructions: ${reminder.instructions}. Prescribed by ${reminder.doctorName}.`,
        messageHi: `${reminder.dosage} लेने का समय (${reminder.timingSlot})। निर्देश: ${reminder.instructions}। डॉक्टर: ${reminder.doctorName}।`,
        messageMr: `${reminder.dosage} घेण्याची वेळ (${reminder.timingSlot}). सूचना: ${reminder.instructions}. डॉक्टर: ${reminder.doctorName}.`,
        time: 'Just now',
        type: 'medicine_reminder',
        read: false,
        link: '/medicines',
        medicineReminderId: reminder.id,
        medicineData: { ...reminder }
      };
      setStored(STORAGE_KEYS.NOTIFICATIONS, [newNotif, ...notifs.filter(n => n.medicineReminderId !== reminder.id)]);
      window.dispatchEvent(new CustomEvent('notification_received', { detail: newNotif }));
    } catch (e) {
      console.warn('Error saving notification for medicine reminder:', e);
    }

    // 3. Dispatch global live alert event for on-screen modal/toast
    window.dispatchEvent(new CustomEvent('medicine_dose_alert', { detail: reminder }));
    return reminder;
  },

  /**
   * Sync reminders when a new prescription is issued by doctor
   */
  syncNewPrescription(newRx) {
    if (!newRx || !newRx.medicines || newRx.medicines.length === 0) return;

    const existingReminders = this.getRemindersSync();
    const newReminders = extractRemindersFromPrescriptions([newRx]);

    // Merge: add new reminders while keeping existing ones
    const existingIds = new Set(existingReminders.map(r => r.id));
    const merged = [
      ...existingReminders,
      ...newReminders.filter(r => !existingIds.has(r.id))
    ];

    this.saveReminders(merged);

    // Also add a summary notification
    try {
      const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, []);
      const rxNotif = {
        id: `NOTIF-RX-${Date.now()}`,
        title: `💊 Medicine Schedule Set: ${newRx.doctorName}`,
        titleHi: `💊 दवा की अनुसूची सेट: ${newRx.doctorName}`,
        titleMr: `💊 औषधांचे वेळापत्रक तयार: ${newRx.doctorName}`,
        message: `New prescription (${newRx.id}) registered with daily reminders for ${newRx.medicines.map(m => m.name).join(', ')}.`,
        messageHi: `नई पर्ची (${newRx.id}) के लिए रोजाना दवा रिमाइंडर सेट कर दिए गए हैं: ${newRx.medicines.map(m => m.name).join(', ')}।`,
        messageMr: `नवीन प्रिस्क्रिप्शन (${newRx.id}) साठी दररोज औषधांचे स्मरणपत्रे सेट केली आहेत: ${newRx.medicines.map(m => m.name).join(', ')}.`,
        time: 'Just now',
        type: 'medicine_reminder',
        read: false,
        link: '/medicines'
      };
      setStored(STORAGE_KEYS.NOTIFICATIONS, [rxNotif, ...notifs]);
      window.dispatchEvent(new CustomEvent('notification_received', { detail: rxNotif }));
    } catch (e) {}

    return merged;
  },

  /**
   * Calculate daily adherence/compliance stats
   */
  getComplianceStats(reminders = []) {
    const list = Array.isArray(reminders) && reminders.length > 0 ? reminders : this.getRemindersSync();
    const total = list.length;
    const taken = list.filter(r => r.status === 'taken').length;
    const pending = total - taken;
    const percentage = total > 0 ? Math.round((taken / total) * 100) : 100;

    return { total, taken, pending, percentage };
  },

  /**
   * Web Audio API synthesized gentle hospital chime (no external MP3 required)
   */
  playChime() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      const playTone = (freq, start, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };

      // Two-tone bell: 587.33 Hz (D5) then 880 Hz (A5)
      playTone(587.33, 0, 0.45);
      playTone(880.00, 0.22, 0.65);
    } catch (err) {
      console.warn('Audio chime note:', err);
    }
  },

  /**
   * Speak reminder using multilingual Text-to-Speech
   */
  speakReminder(reminder, language = 'en') {
    if (!reminder) return;

    let text = '';
    if (language === 'hi') {
      text = `दवा लेने का समय हो गया है। कृपया ${reminder.medicineName}, खुराक ${reminder.dosage}, ${reminder.instructions || 'भोजन के बाद पानी के साथ'} लें। डॉक्टर ${reminder.doctorName} द्वारा निर्देशित।`;
    } else if (language === 'mr') {
      text = `औषध घेण्याची वेळ झाली आहे. कृपया ${reminder.medicineName}, मात्रा ${reminder.dosage}, ${reminder.instructions || 'जेवणानंतर पाण्यासोबत'} घ्या. डॉक्टर ${reminder.doctorName} यांनी सांगितल्यानुसार.`;
    } else {
      text = `Medicine time reminder! Please take ${reminder.medicineName}, dosage ${reminder.dosage}, ${reminder.instructions || 'after food with water'}. Prescribed by ${reminder.doctorName}.`;
    }

    voiceService.speakText({
      text,
      language
    });
  }
};
