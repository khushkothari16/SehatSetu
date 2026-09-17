import { delay, getStored, setStored, removeStored, STORAGE_KEYS } from './api';
import { INITIAL_QUEUE_STATE } from '../data/mockData';

export const queueService = {
  getQueueStatusSync(patientOverride) {
    const queue = getStored(STORAGE_KEYS.QUEUE, null);
    if (!queue || !queue.userToken) return null;

    // Get current logged-in patient
    const currentPatient = patientOverride || getStored(STORAGE_KEYS.PATIENT, null);
    if (!currentPatient) return null;

    // If queue is tagged with patient information, verify ownership
    if (queue.patientId || queue.patientAbhaId || queue.patientPhone || queue.patientName) {
      const idMatch = queue.patientId && queue.patientId === currentPatient.id;
      const abhaMatch = queue.patientAbhaId && queue.patientAbhaId === currentPatient.abhaId;
      const phoneMatch = queue.patientPhone && currentPatient.phone && queue.patientPhone.replace(/\s+/g, '') === currentPatient.phone.replace(/\s+/g, '');
      const nameMatch = queue.patientName && currentPatient.name && queue.patientName.toLowerCase().trim() === currentPatient.name.toLowerCase().trim();

      if (!idMatch && !abhaMatch && !phoneMatch && !nameMatch) {
        // Stored queue belongs to a different patient, purge stale queue
        removeStored(STORAGE_KEYS.QUEUE);
        return null;
      }
    } else {
      // Untagged/seed demo queue only belongs to demo user Rahul Sharma
      const isRahul = currentPatient.name?.toLowerCase().includes('rahul') || currentPatient.abhaId?.includes('4829');
      if (!isRahul) {
        removeStored(STORAGE_KEYS.QUEUE);
        return null;
      }
    }

    if (queue.status === 'Completed' || queue.status === 'Cancelled') {
      return null;
    }

    // Ensure accurate patient name
    if (currentPatient.name && (!queue.patientName || queue.patientName === 'Patient')) {
      queue.patientName = currentPatient.name;
    }

    // Auto-reconcile with real active doctor appointments
    try {
      const appointments = getStored(STORAGE_KEYS.APPOINTMENTS, []);
      const completedCheckups = getStored('sehatsetu_completed_checkups', []);
      const completedAptIds = new Set(completedCheckups.map(c => c.appointmentId).filter(Boolean));
      
      const activeOfflineAppointments = appointments.filter(a => 
        a.mode === 'offline' && 
        a.status !== 'Cancelled' && 
        a.status !== 'Completed' &&
        !completedAptIds.has(a.id)
      );

      // Check how many patients are actually ahead of this patient
      const aheadList = activeOfflineAppointments.filter(a => {
        const t = Number(a.tokenNumber) || 0;
        return t < queue.userToken && a.patientId !== queue.patientId && a.patientAbhaId !== queue.patientAbhaId;
      });

      const realAhead = aheadList.length;
      if (realAhead === 0 && (queue.patientsAhead > 0 || queue.currentToken < queue.userToken)) {
        queue.patientsAhead = 0;
        queue.currentToken = queue.userToken;
        queue.estimatedWaitMinutes = 0;
        if (queue.status === 'Waiting' || !queue.status) {
          queue.status = 'Your Turn';
        }
        setStored(STORAGE_KEYS.QUEUE, queue);
      }
    } catch (e) {
      // ignore
    }

    return queue;
  },

  async getQueueStatus(appointmentId) {
    await delay(100);
    return this.getQueueStatusSync();
  },

  // Direct synchronization: Doctor calls specific patient token into the consultation room
  async callPatientToken(tokenNumber, patientName, doctorName = 'Dr. Anjali Mehta', room = 'OPD Room 4') {
    await delay(150);
    const queue = getStored(STORAGE_KEYS.QUEUE, null);
    if (!queue) return null;
    const targetToken = Number(tokenNumber) || queue.currentToken;

    const isUserTurn = queue.userToken === targetToken;
    const patientsAhead = Math.max(0, queue.userToken - targetToken);

    let status = 'Serving Other Patients';
    if (isUserTurn) {
      status = 'Your Turn';
    } else if (patientsAhead <= 2 && patientsAhead > 0) {
      status = 'Almost Your Turn';
    }

    const updated = {
      ...queue,
      currentToken: targetToken,
      callingPatientName: patientName || queue.callingPatientName,
      doctorName: doctorName || queue.doctorName,
      room: room || queue.room,
      patientsAhead,
      estimatedWaitMinutes: patientsAhead * 4,
      status,
      buzzerActive: true,
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setStored(STORAGE_KEYS.QUEUE, updated);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: updated }));
    return updated;
  },

  // Simulates Doctor calling next patient token in rural OPD
  async advanceQueue() {
    await delay(150);
    const queue = getStored(STORAGE_KEYS.QUEUE, null);
    if (!queue || !queue.userToken) return null;

    if (queue.currentToken < queue.userToken) {
      const nextToken = queue.currentToken + 1;
      const patientsAhead = Math.max(0, queue.userToken - nextToken);
      let status = 'Waiting';

      if (patientsAhead === 0) {
        status = 'Your Turn';
      } else if (patientsAhead <= 2) {
        status = 'Almost Your Turn';
      }

      const updated = {
        ...queue,
        currentToken: nextToken,
        patientsAhead,
        estimatedWaitMinutes: patientsAhead * 4,
        status,
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setStored(STORAGE_KEYS.QUEUE, updated);
      window.dispatchEvent(new CustomEvent('queue_state_change', { detail: updated }));
      return updated;
    } else if (queue.currentToken === queue.userToken) {
      const updated = {
        ...queue,
        status: 'Completed',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStored(STORAGE_KEYS.QUEUE, updated);
      window.dispatchEvent(new CustomEvent('queue_state_change', { detail: updated }));
      return updated;
    }

    return queue;
  },

  async resetQueueDemo() {
    await delay(100);
    const currentPatient = getStored(STORAGE_KEYS.PATIENT, null);
    const demoQueue = {
      ...INITIAL_QUEUE_STATE,
      patientId: currentPatient?.id,
      patientName: currentPatient?.name || 'Patient',
      patientAbhaId: currentPatient?.abhaId,
      patientPhone: currentPatient?.phone
    };
    setStored(STORAGE_KEYS.QUEUE, demoQueue);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: demoQueue }));
    return demoQueue;
  },

  clearQueue() {
    removeStored(STORAGE_KEYS.QUEUE);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: null }));
  }
};
