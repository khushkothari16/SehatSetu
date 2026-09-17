// Base API Client and Offline-First Storage Helper
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const STORAGE_KEYS = {
  PATIENT: 'sehatsetu_patient',
  DOCTORS: 'sehatsetu_doctors',
  APPOINTMENTS: 'sehatsetu_appointments',
  QUEUE: 'sehatsetu_queue',
  PRESCRIPTIONS: 'sehatsetu_prescriptions',
  UPLOADS: 'sehatsetu_uploads',
  PHARMACIES: 'sehatsetu_pharmacies',
  TESTS: 'sehatsetu_tests',
  REPORTS: 'sehatsetu_reports',
  FOLLOW_UPS: 'sehatsetu_followups',
  REFERRALS: 'sehatsetu_referrals',
  FACILITIES: 'sehatsetu_facilities',
  NOTIFICATIONS: 'sehatsetu_notifications',
  MEDICINE_REMINDERS: 'sehatsetu_medicine_reminders',
  EMERGENCY_STATE: 'sehatsetu_emergency_state',
  USER_LOCATION: 'sehatsetu_location',
  ASHA_PATIENTS: 'sehatsetu_asha_patients',
  ASHA_CONSULT_REQUESTS: 'sehatsetu_asha_consult_requests',
  ASHA_MESSAGES: 'sehatsetu_asha_messages',
  ASHA_AUDIT_LOGS: 'sehatsetu_asha_audit_logs',
  OFFLINE_SYNC_QUEUE: 'sehatsetu_offline_sync_queue'
};

export const getStored = (key, fallback) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading localStorage for key ${key}:`, err);
    return fallback;
  }
};

export const setStored = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving localStorage for key ${key}:`, err);
  }
};

export const removeStored = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing localStorage for key ${key}:`, err);
  }
};

// Simulated network latency
export const delay = (ms = 250) => new Promise(res => setTimeout(res, ms));

/**
 * Resilient API Fetcher with automatic fallback to local state
 * If backend server on http://localhost:5000 is online, uses live data.
 * If server is offline or restarting, seamlessly falls back to client storage.
 */
export const apiFetch = async (endpoint, options = {}, fallbackData = null) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    // Graceful offline fallback
    return fallbackData;
  }
};

export { STORAGE_KEYS, API_BASE_URL };
