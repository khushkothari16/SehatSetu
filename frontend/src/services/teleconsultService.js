// Real-Time On-Demand Teleconsultation Engine for SehatSetu
// Features: Cross-Tab & Cross-Device Real-Time Sync, Direct Call Request (No Appointment/Token),
// Broadcast Dispatch to Free General Doctors, First-to-Accept Locking, and Separation from Offline OPD Queue.

import { delay, apiFetch } from './api.js';
import { cloudSyncService } from './cloudSyncService.js';

const STORAGE_KEY = 'sehatsetu_teleconsult_v2';
const CHANNEL_NAME = 'sehatsetu_teleconsult_channel';

// ---------------------------------------------------------------------
// 1. CROSS-TAB / CROSS-WINDOW BROADCAST CHANNEL (0ms Real-Time Sync)
// ---------------------------------------------------------------------
let teleconsultChannel = null;

try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    teleconsultChannel = new BroadcastChannel(CHANNEL_NAME);
    teleconsultChannel.onmessage = (event) => {
      const { type, detail } = event.data || {};
      if (type && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(type, { detail }));
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel initialization note:', e);
}

/**
 * Broadcast event locally, across browser tabs, AND across different physical laptops globally
 */
export const broadcastCrossTab = (type, detail, syncToCloud = true) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  }
  if (teleconsultChannel) {
    try {
      teleconsultChannel.postMessage({ type, detail });
    } catch (e) {
      console.warn('Error posting to BroadcastChannel:', e);
    }
  }
  if (syncToCloud) {
    cloudSyncService.publish(type, detail);
  }
};

// ---------------------------------------------------------------------
// 2. GLOBAL CLOUD REALTIME SYNC (Cross-Laptop & Cross-Device Support)
// ---------------------------------------------------------------------
if (typeof window !== 'undefined') {
  cloudSyncService.subscribe((type, detail) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const state = raw ? JSON.parse(raw) : getInitialState();
      let stateChanged = false;

      if (type === 'teleconsult_broadcast' && detail) {
        const callId = detail.id || detail.callId;
        const exists = (state.activeBroadcasts || []).some((b) => b.id === callId);
        const inActive = (state.activeCalls || []).some((a) => a.id === callId);

        if (!exists && !inActive) {
          state.activeBroadcasts = [detail, ...(state.activeBroadcasts || []).filter((b) => b.id !== callId)];
          stateChanged = true;
        }
        window.dispatchEvent(new CustomEvent('teleconsult_broadcast', { detail }));
      } else if (type === 'teleconsult_call_accepted' && detail) {
        const { callId, doctor, call } = detail;
        state.activeBroadcasts = (state.activeBroadcasts || []).filter((b) => b.id !== callId);
        state.waitingPool = (state.waitingPool || []).filter((w) => w.id !== callId);

        const fullCall = call || {
          id: callId,
          status: 'accepted',
          acceptedBy: doctor,
          acceptedAt: new Date().toISOString()
        };

        const exists = (state.activeCalls || []).some((a) => a.id === callId);
        if (!exists) {
          state.activeCalls = [fullCall, ...(state.activeCalls || [])];
        } else {
          state.activeCalls = (state.activeCalls || []).map((a) =>
            a.id === callId ? { ...a, status: 'accepted', acceptedBy: doctor } : a
          );
        }

        if (doctor?.id) {
          state.doctors = (state.doctors || INITIAL_GENERAL_DOCTORS).map((d) =>
            d.id === doctor.id ? { ...d, status: 'in_call' } : d
          );
        }
        stateChanged = true;
        window.dispatchEvent(new CustomEvent('teleconsult_call_accepted', { detail }));
      } else if (type === 'teleconsult_call_ended' && detail) {
        const { callId, call } = detail;
        state.activeCalls = (state.activeCalls || []).filter((a) => a.id !== callId);
        if (call) {
          state.recentCalls = [call, ...(state.recentCalls || []).slice(0, 15)];
        }
        state.doctors = (state.doctors || INITIAL_GENERAL_DOCTORS).map((d) => ({
          ...d,
          status: 'available'
        }));
        stateChanged = true;
        window.dispatchEvent(new CustomEvent('teleconsult_call_ended', { detail }));
      } else if (type === 'teleconsult_call_cancelled' && detail) {
        const { callId } = detail;
        state.activeBroadcasts = (state.activeBroadcasts || []).filter((b) => b.id !== callId);
        state.waitingPool = (state.waitingPool || []).filter((w) => w.id !== callId);
        stateChanged = true;
        window.dispatchEvent(new CustomEvent('teleconsult_call_cancelled', { detail }));
      }

      if (stateChanged) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('teleconsult_state_change', { detail: state }));
      }
    } catch (err) {
      console.warn('[SehatSetu CloudSync Handler Error]', err);
    }
  });
}

// ---------------------------------------------------------------------
// 3. CROSS-TAB LOCALSTORAGE STORAGE EVENT LISTENER (Fallback Local Sync)
// ---------------------------------------------------------------------
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        window.dispatchEvent(new CustomEvent('teleconsult_state_change', { detail: parsed }));
        if (parsed.activeBroadcasts && parsed.activeBroadcasts.length > 0) {
          parsed.activeBroadcasts.forEach((call) => {
            window.dispatchEvent(new CustomEvent('teleconsult_broadcast', { detail: call }));
          });
        }
      } catch (err) {}
    }
  });
}

export const INITIAL_GENERAL_DOCTORS = [
  {
    id: 'DOC-01',
    name: 'Dr. Anjali Mehta',
    specialty: 'General Physician',
    facility: 'Khed Primary Health Centre (PHC)',
    medicalRegNo: 'MCI-2015-84920',
    status: 'available', // 'available' | 'busy_opd' | 'in_call'
    rating: 4.9,
    experience: '11 yrs',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-03',
    name: 'Dr. Sneha Patil',
    specialty: 'General Practitioner',
    facility: 'Alandi Rural Sub-Centre',
    medicalRegNo: 'MMC-2018-47291',
    status: 'available',
    rating: 4.8,
    experience: '7 yrs',
    avatar: 'https://images.unsplash.com/photo-1594824813533-3d0d82937740?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-04',
    name: 'Dr. Rahul Kulkarni',
    specialty: 'Family Medicine Officer',
    facility: 'Chakan Community Health Centre',
    medicalRegNo: 'MMC-2014-19402',
    status: 'available',
    rating: 4.7,
    experience: '10 yrs',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-05',
    name: 'Dr. Priya Deshmukh',
    specialty: 'General Duty Medical Officer',
    facility: 'District Civil Hospital Telemedicine Hub',
    medicalRegNo: 'MMC-2020-58201',
    status: 'busy_opd', // Currently conducting in-person physical OPD exam
    rating: 4.9,
    experience: '6 yrs',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&auto=format&fit=crop&q=80'
  }
];

function getInitialState() {
  return {
    doctors: INITIAL_GENERAL_DOCTORS,
    activeBroadcasts: [],
    waitingPool: [],
    activeCalls: [],
    recentCalls: []
  };
}

export const teleconsultService = {
  getStateSync() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading teleconsult state:', e);
    }
    const initial = getInitialState();
    this.saveState(initial);
    return initial;
  },

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving teleconsult state:', e);
    }
    broadcastCrossTab('teleconsult_state_change', state, false);
  },

  getDoctors() {
    const state = this.getStateSync();
    return state.doctors || INITIAL_GENERAL_DOCTORS;
  },

  getAvailableDoctors() {
    const doctors = this.getDoctors();
    return doctors.filter((d) => d.status === 'available');
  },

  getAvailableDoctorsCount() {
    return this.getAvailableDoctors().length;
  },

  setDoctorStatus(doctorId, newStatus) {
    const state = this.getStateSync();
    let updatedDoctor = null;

    state.doctors = state.doctors.map((d) => {
      if (d.id === doctorId) {
        updatedDoctor = { ...d, status: newStatus };
        return updatedDoctor;
      }
      return d;
    });

    // If a doctor just switched to 'available', check if any patient is waiting in the waiting pool
    if (newStatus === 'available' && state.waitingPool.length > 0) {
      const nextWaiting = state.waitingPool.shift();
      nextWaiting.status = 'ringing';
      nextWaiting.forwardedAt = new Date().toISOString();
      state.activeBroadcasts.push(nextWaiting);

      broadcastCrossTab('teleconsult_broadcast', nextWaiting);
    }

    this.saveState(state);
    return updatedDoctor;
  },

  /**
   * Patient initiates direct instant teleconsultation (No token / No booking needed)
   */
  async requestInstantTeleconsult({ patient, symptoms, callMode = 'video' }) {
    await delay(150);
    const state = this.getStateSync();

    const callId = `TC-${Date.now().toString().slice(-5)}`;
    const newCall = {
      id: callId,
      callId,
      patientId: patient?.id || 'PAT-MH-2026-8491',
      patientName: patient?.name || 'Rahul Sharma',
      patientAge: patient?.age || 34,
      patientGender: patient?.gender || 'Male',
      patientVillage: patient?.village || 'Khed (Rajgurunagar)',
      patientPhone: patient?.phone || '+91 98765 43210',
      patientAbhaId: patient?.abhaId || '91-4829-1029-4819',
      symptoms: symptoms || 'General Consultation / Seasonal Viral Assessment',
      callMode: callMode || 'video',
      requestedAt: new Date().toISOString(),
      requestedTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      acceptedBy: null,
      acceptedAt: null,
      declinedByDoctors: []
    };

    const availableCount = state.doctors.filter((d) => d.status === 'available').length;

    if (availableCount > 0) {
      newCall.status = 'ringing';
      state.activeBroadcasts = [newCall, ...state.activeBroadcasts.filter((c) => c.id !== callId)];
      this.saveState(state);

      // Instantly broadcast across all open browser windows & tabs
      broadcastCrossTab('teleconsult_broadcast', newCall);
    } else {
      newCall.status = 'waiting_pool';
      newCall.poolPosition = state.waitingPool.length + 1;
      state.waitingPool = [...state.waitingPool, newCall];
      this.saveState(state);

      broadcastCrossTab('teleconsult_waiting_pool_update', newCall);
    }

    // Seamlessly notify backend API for cross-device support (fire-and-forget)
    try {
      apiFetch('/teleconsult/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCall)
      }).catch(() => {});
    } catch (err) {}

    return newCall;
  },

  /**
   * First-to-Accept Lock Mechanism:
   * Any free connected doctor can click Accept. The first one locks the call;
   * other doctors are notified and the broadcast auto-dismisses for them.
   */
  async acceptCall(callId, doctor) {
    await delay(100);
    const state = this.getStateSync();

    // Find the call in active broadcasts or waiting pool
    let call = state.activeBroadcasts.find((c) => c.id === callId);
    let fromWaiting = false;

    if (!call) {
      call = state.waitingPool.find((c) => c.id === callId);
      if (call) fromWaiting = true;
    }

    if (!call) {
      return {
        success: false,
        reason: 'Call request was cancelled or is no longer available.'
      };
    }

    // Check if another doctor already accepted this call
    if (call.status === 'accepted') {
      return {
        success: false,
        reason: `Call was already accepted by ${call.acceptedBy?.name || 'another doctor'}.`,
        acceptedBy: call.acceptedBy
      };
    }

    // Lock the call for this doctor
    call.status = 'accepted';
    call.acceptedBy = {
      id: doctor?.id || 'DOC-01',
      name: doctor?.name || 'Dr. Anjali Mehta',
      specialty: doctor?.specialty || 'General Physician',
      facility: doctor?.facility || doctor?.hospital || 'Khed Primary Health Centre',
      medicalRegNo: doctor?.medicalRegNo || 'MCI-2015-84920',
      avatar: doctor?.avatar || 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
    };
    call.acceptedAt = new Date().toISOString();

    // Clean up lists
    state.activeBroadcasts = state.activeBroadcasts.filter((c) => c.id !== callId);
    if (fromWaiting) {
      state.waitingPool = state.waitingPool.filter((c) => c.id !== callId);
    }
    state.activeCalls = [call, ...state.activeCalls.filter((c) => c.id !== callId)];

    // Mark doctor as 'in_call'
    state.doctors = state.doctors.map((d) => (d.id === doctor.id ? { ...d, status: 'in_call' } : d));

    this.saveState(state);

    // Notify ALL components & tabs that this call was successfully locked and accepted
    broadcastCrossTab('teleconsult_call_accepted', {
      callId,
      call,
      doctor: call.acceptedBy
    });

    // Notify backend API
    try {
      apiFetch('/teleconsult/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          doctorId: call.acceptedBy.id,
          doctorName: call.acceptedBy.name,
          doctorSpecialty: call.acceptedBy.specialty,
          doctorFacility: call.acceptedBy.facility
        })
      }).catch(() => {});
    } catch (err) {}

    return { success: true, call };
  },

  /**
   * Doctor dismisses the call banner on their screen only without declining for other doctors
   */
  declineCall(callId, doctorId) {
    const state = this.getStateSync();
    const call = state.activeBroadcasts.find((c) => c.id === callId);
    if (call) {
      if (!call.declinedByDoctors) call.declinedByDoctors = [];
      if (!call.declinedByDoctors.includes(doctorId)) {
        call.declinedByDoctors.push(doctorId);
      }
      this.saveState(state);
    }
  },

  /**
   * Patient cancels their call request while ringing or on hold
   */
  async cancelRequest(callId) {
    await delay(100);
    const state = this.getStateSync();

    state.activeBroadcasts = state.activeBroadcasts.filter((c) => c.id !== callId);
    state.waitingPool = state.waitingPool.filter((c) => c.id !== callId);

    this.saveState(state);

    broadcastCrossTab('teleconsult_call_cancelled', { callId });

    return { success: true };
  },

  /**
   * Ends an active teleconsultation session and frees up the doctor
   */
  async endCall(callId, doctorId, prescription = null) {
    await delay(150);
    const state = this.getStateSync();

    const callIndex = state.activeCalls.findIndex((c) => c.id === callId);
    let endedCall = null;

    if (callIndex !== -1) {
      endedCall = {
        ...state.activeCalls[callIndex],
        status: 'ended',
        endedAt: new Date().toISOString(),
        prescriptionId: prescription?.id || null
      };
      state.activeCalls.splice(callIndex, 1);
      state.recentCalls = [endedCall, ...state.recentCalls.slice(0, 15)];
    }

    // Free the doctor
    state.doctors = state.doctors.map((d) => (d.id === doctorId ? { ...d, status: 'available' } : d));

    // If patients are waiting in the waiting pool, immediately dispatch to the newly free doctor!
    let nextWaitingCall = null;
    if (state.waitingPool.length > 0) {
      nextWaitingCall = state.waitingPool.shift();
      nextWaitingCall.status = 'ringing';
      nextWaitingCall.forwardedAt = new Date().toISOString();
      state.activeBroadcasts.push(nextWaitingCall);

      broadcastCrossTab('teleconsult_broadcast', nextWaitingCall);
    }

    this.saveState(state);

    broadcastCrossTab('teleconsult_call_ended', {
      callId,
      call: endedCall,
      nextWaiting: nextWaitingCall
    });

    return { success: true, call: endedCall, nextWaiting: nextWaitingCall };
  },

  getActiveCallForPatient(patientId) {
    const state = this.getStateSync();
    const broadcast = state.activeBroadcasts.find((c) => c.patientId === patientId);
    if (broadcast) return broadcast;

    const waiting = state.waitingPool.find((c) => c.patientId === patientId);
    if (waiting) return waiting;

    const active = state.activeCalls.find((c) => c.patientId === patientId);
    if (active) return active;

    return null;
  },

  getActiveCallForDoctor(doctorId) {
    const state = this.getStateSync();
    return state.activeCalls.find((c) => c.acceptedBy?.id === doctorId) || null;
  },

  getWaitingPool() {
    const state = this.getStateSync();
    return state.waitingPool || [];
  },

  getActiveBroadcasts() {
    const state = this.getStateSync();
    return state.activeBroadcasts || [];
  }
};

// ---------------------------------------------------------------------
// 3. PERIODIC BACKGROUND SYNC WITH BACKEND API (Cross-Device Support)
// ---------------------------------------------------------------------
if (typeof window !== 'undefined') {
  setInterval(async () => {
    try {
      const res = await apiFetch('/teleconsult/pool', {}, null);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const state = teleconsultService.getStateSync();
        let changed = false;

        res.data.forEach((remoteCall) => {
          const callId = remoteCall.id || remoteCall.callId;
          const exists = state.activeBroadcasts.some((b) => b.id === callId);
          const inWaiting = state.waitingPool.some((w) => w.id === callId);
          const inActive = state.activeCalls.some((a) => a.id === callId);

          if (!exists && !inWaiting && !inActive) {
            const formatted = {
              ...remoteCall,
              id: callId,
              status: remoteCall.status || 'ringing'
            };
            state.activeBroadcasts = [formatted, ...state.activeBroadcasts];
            changed = true;
            broadcastCrossTab('teleconsult_broadcast', formatted);
          }
        });

        if (changed) {
          teleconsultService.saveState(state);
        }
      }
    } catch (err) {
      // Offline fallback
    }
  }, 2500);
}
