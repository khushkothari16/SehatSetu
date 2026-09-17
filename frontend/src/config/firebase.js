import { initializeApp, getApps, deleteApp } from 'firebase/app';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

const STORAGE_KEY = 'sehatsetu_firebase_config';

export const getFirebaseConfig = () => {
  let stored = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {
    // ignore
  }

  return {
    apiKey: stored.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: stored.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: stored.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: stored.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: stored.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: stored.appId || import.meta.env.VITE_FIREBASE_APP_ID || ''
  };
};

export const saveFirebaseConfig = (cfg) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    initFirebaseAuth(true);
    return true;
  } catch (e) {
    console.error('Failed to save Firebase config', e);
    return false;
  }
};

export const clearFirebaseConfig = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    initFirebaseAuth(true);
  } catch (e) {
    // ignore
  }
};

export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return Boolean(
    config.apiKey &&
    config.projectId &&
    !config.apiKey.includes('YOUR_') &&
    config.apiKey.length > 10
  );
};

let currentApp = null;
let currentAuth = null;

export const initFirebaseAuth = (forceReinit = false) => {
  if (currentApp && !forceReinit) {
    return { app: currentApp, auth: currentAuth };
  }

  if (forceReinit && currentApp) {
    try {
      deleteApp(currentApp);
    } catch (e) {
      // ignore
    }
    currentApp = null;
    currentAuth = null;
  }

  if (isFirebaseConfigured()) {
    try {
      const config = getFirebaseConfig();
      currentApp = initializeApp(config, 'sehatsetu-auth-' + Date.now());
      currentAuth = getAuth(currentApp);
    } catch (err) {
      console.error('[Firebase Init Error]', err);
    }
  }

  return { app: currentApp, auth: currentAuth };
};

// Initial setup
initFirebaseAuth();

export const getFirebaseAuth = () => {
  if (!currentAuth) {
    initFirebaseAuth();
  }
  return currentAuth;
};

export const resetRecaptcha = () => {
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    window.recaptchaVerifier = null;
  }
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
};

/**
 * Setup fresh reCAPTCHA verifier for Phone Auth
 * @param {string} containerId - Element ID for reCAPTCHA (invisible or visible)
 * @param {Function} [onExpired] - Callback when captcha expires
 */
export const setupRecaptcha = (containerId = 'recaptcha-container', onExpired) => {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase Authentication is not configured. Please provide Firebase credentials in settings or .env');
  }

  // 1. Clear previous verifier instance
  if (window.recaptchaVerifier) {
    try {
      window.recaptchaVerifier.clear();
    } catch (e) {
      // ignore
    }
    window.recaptchaVerifier = null;
  }

  // 2. Recreate the container element to ensure pristine node for Google grecaptcha
  let container = document.getElementById(containerId);
  if (container && container.parentNode) {
    const freshNode = document.createElement('div');
    freshNode.id = containerId;
    container.parentNode.replaceChild(freshNode, container);
    container = freshNode;
  }

  const verifier = new RecaptchaVerifier(authInstance, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      resetRecaptcha();
      if (onExpired) onExpired();
    }
  });

  window.recaptchaVerifier = verifier;
  return verifier;
};

/**
 * Parses Firebase Phone Auth error into user-friendly message
 */
export const formatFirebasePhoneError = (err) => {
  if (!err) return 'An unexpected error occurred while sending OTP.';
  const code = err.code || '';
  const msg = err.message || '';

  if (code.includes('invalid-phone-number')) {
    return 'Invalid phone number format. Please ensure you enter a valid 10-digit mobile number.';
  }
  if (code.includes('quota-exceeded')) {
    return 'SMS quota exceeded for today. Please try again later or contact support.';
  }
  if (code.includes('too-many-requests')) {
    return 'Too many OTP requests have been sent to this number. Please wait a few minutes before trying again.';
  }
  if (code.includes('invalid-verification-code')) {
    return 'Incorrect OTP. Please check the 6-digit code received on your phone and try again.';
  }
  if (code.includes('code-expired')) {
    return 'OTP has expired. Please click "Resend OTP" to receive a new code.';
  }
  if (msg.toLowerCase().includes('already been rendered') || code.includes('recaptcha') || msg.toLowerCase().includes('recaptcha')) {
    return 'Security verification refreshed. Please click "Send Real SMS OTP" again.';
  }
  if (msg.toLowerCase().includes('region') || msg.toLowerCase().includes('unable to be sent until this region enabled')) {
    return 'SMS Region Restriction: In Firebase Console > Authentication > Settings > SMS Region Policy, enable India (+91), or add your number under "Phone numbers for testing".';
  }
  if (code.includes('configuration-not-found') || code.includes('operation-not-allowed')) {
    return 'Phone Sign-In is not enabled yet in your Firebase Console. In your open tab (SIH-2026 - Authentication), click "Get started" and enable "Phone" under Sign-in method.';
  }
  if (code.includes('billing-not-enabled')) {
    return 'Firebase Identity Platform requires SMS quota configuration in Firebase Console.';
  }
  if (msg.includes('auth/')) {
    return `Firebase Auth Error: ${code.replace('auth/', '').replace(/-/g, ' ')}`;
  }
  return msg || 'Failed to process phone verification.';
};

/**
 * Sends real SMS OTP to phone number using Firebase Phone Authentication
 * @param {string} phoneNumber - Full phone number (e.g. +91 9876543210 or 9876543210)
 * @param {RecaptchaVerifier} verifier
 * @returns {Promise<ConfirmationResult>}
 */
export const sendPhoneOtpSms = async (phoneNumber, verifier) => {
  const authInstance = getFirebaseAuth();
  if (!authInstance) {
    throw new Error('Firebase Authentication is not configured. Please configure Firebase credentials.');
  }

  // Ensure E.164 phone format (+91...)
  let cleanPhone = phoneNumber.replace(/[\s-]/g, '');
  if (!cleanPhone.startsWith('+')) {
    cleanPhone = `+91${cleanPhone}`;
  }

  const confirmationResult = await signInWithPhoneNumber(authInstance, cleanPhone, verifier);
  return confirmationResult;
};

/**
 * Verifies the 6-digit OTP code against the Firebase ConfirmationResult
 * @param {ConfirmationResult} confirmationResult
 * @param {string} code - 6-digit OTP
 * @returns {Promise<UserCredential>}
 */
export const verifyPhoneOtpSms = async (confirmationResult, code) => {
  if (!confirmationResult || !confirmationResult.confirm) {
    throw new Error('No active OTP session found. Please click "Send OTP" first.');
  }
  const cleanCode = code.replace(/\D/g, '');
  if (cleanCode.length !== 6) {
    throw new Error('Please enter a valid 6-digit SMS OTP code.');
  }

  const result = await confirmationResult.confirm(cleanCode);
  return result;
};
