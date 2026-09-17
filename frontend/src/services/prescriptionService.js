import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_PRESCRIPTIONS, INITIAL_PHYSICAL_UPLOADS } from '../data/mockData';
import { medicineService } from './medicineService';
import { medicineReminderService } from './medicineReminderService';

export const prescriptionService = {
  async getPrescriptions() {
    await delay(150);
    return getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
  },

  async getPrescriptionById(id) {
    await delay(100);
    const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const rx = prescriptions.find(p => p.id === id);
    if (!rx) throw new Error('Prescription not found');
    return rx;
  },

  async getPhysicalUploads() {
    await delay(150);
    return getStored(STORAGE_KEYS.UPLOADS, INITIAL_PHYSICAL_UPLOADS);
  },

  async uploadPhysicalPrescription({ fileName, fileSize, doctorName, notes, fileDataUrl }) {
    await delay(350);
    if (!fileName) {
      throw new Error('Please select a valid image or PDF document to upload.');
    }

    const uploads = getStored(STORAGE_KEYS.UPLOADS, INITIAL_PHYSICAL_UPLOADS);
    const newUpload = {
      id: `UP-2026-${Math.floor(10 + Math.random() * 90)}`,
      fileName,
      fileSize: fileSize || '1.4 MB',
      uploadDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      doctorName: doctorName || 'External Medical Practitioner',
      notes: notes || 'Physical prescription record',
      status: 'Pending Verification',
      fileDataUrl: fileDataUrl || null
    };

    const updated = [newUpload, ...uploads];
    setStored(STORAGE_KEYS.UPLOADS, updated);
    return newUpload;
  },

  async createPrescription(rxData) {
    await delay(250);
    const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const newRx = {
      id: `RX-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Active',
      isDigital: true,
      ...rxData
    };

    const updated = [newRx, ...prescriptions];
    setStored(STORAGE_KEYS.PRESCRIPTIONS, updated);

    // Automatically index prescribed medicines into searchable pharmacy catalog and stock
    if (newRx.medicines && newRx.medicines.length > 0) {
      try {
        medicineService.indexPrescribedMedicines(newRx.medicines, newRx.facility, newRx.doctorName);
        medicineReminderService.syncNewPrescription(newRx);
      } catch (e) {
        console.warn('Medicine indexing / reminder note:', e);
      }
    }

    // Broadcast system event so patient portal instantly receives the prescription
    window.dispatchEvent(new CustomEvent('prescription_created', { detail: newRx }));
    return newRx;
  }
};
