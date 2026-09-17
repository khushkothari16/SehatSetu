/**
 * SehatSetu - Database & Firebase Configuration
 * SIH 2026 Problem Statement 133
 * 
 * ARCHITECTURAL DECISION:
 * For rural healthcare applications and SIH 2026 demonstrations:
 * 1. Primary Engine: High-Performance Persistent LocalStorage Database (`sehatsetu_all_users`, `sehatsetu_active_session`).
 *    - 100% offline-first (crucial for rural clinics with patchy 2G/3G connectivity).
 *    - Zero downtime, zero risk of third-party API key expiration during live jury evaluations.
 * 2. Secondary Engine: Firebase Firestore / Auth Adapter (ready to switch via VITE_ENABLE_FIREBASE='true').
 */

export const FIREBASE_SCHEMA_DEFINITIONS = {
  collections: {
    users: {
      fields: {
        id: 'string (UID or PAT/DOC/HOSP code)',
        role: 'string ("patient" | "doctor" | "hospital_admin")',
        name: 'string',
        email: 'string',
        phone: 'string',
        authProvider: 'string ("phone" | "email" | "google")',
        createdAt: 'timestamp',
        // Patient specific
        abhaId: 'string (e.g. 91-4829-1029-4819)',
        village: 'string',
        district: 'string',
        state: 'string',
        bloodGroup: 'string',
        // Doctor specific
        medicalRegNo: 'string',
        specialty: 'string',
        hospital: 'string',
        // Hospital admin specific
        facilityName: 'string',
        facilityId: 'string'
      }
    },
    opd_queue: {
      fields: {
        tokenNumber: 'number',
        patientId: 'string (foreign key -> users.id)',
        doctorId: 'string (foreign key -> users.id)',
        facilityId: 'string',
        status: 'string ("waiting" | "in_consultation" | "completed")',
        registeredAt: 'timestamp'
      }
    },
    emergency_dispatches: {
      fields: {
        dispatchId: 'string',
        callerPhone: 'string',
        latitude: 'number',
        longitude: 'number',
        ambulanceVehicleNo: 'string',
        status: 'string ("dispatched" | "on_scene" | "transporting" | "resolved")',
        priority: 'string ("high" | "critical")',
        timestamp: 'timestamp'
      }
    }
  }
};

// Default environment configuration template
export const firebaseClientConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-sehatsetu-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'sehatsetu-sih2026.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'sehatsetu-sih2026',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'sehatsetu-sih2026.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '1029384756',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:1029384756:web:abcd1234efgh'
};

export const isFirebaseActive = Boolean(
  import.meta.env.VITE_ENABLE_FIREBASE === 'true' && import.meta.env.VITE_FIREBASE_API_KEY
);
