import { delay, getStored, setStored, removeStored, STORAGE_KEYS } from './api';
import { INITIAL_PATIENT } from '../data/mockData';

const USERS_STORAGE_KEY = 'sehatsetu_all_users';
const SESSION_STORAGE_KEY = 'sehatsetu_active_session';

// Seed demo users if empty
const getInitialUsers = () => {
  return [
    {
      id: 'PAT-MH-2026-8491',
      role: 'patient',
      name: 'Rahul Sharma',
      nameHindi: 'राहुल शर्मा',
      nameMarathi: 'राहुल शर्मा',
      email: 'rahul.sharma@gmail.com',
      phone: '+91 98765 43210',
      village: 'Khed (Rajgurunagar)',
      district: 'Pune',
      bloodGroup: 'B+',
      abhaId: '91-4829-1029-4819',
      authProvider: 'phone'
    },
    {
      id: 'DOC-MH-2026-1042',
      role: 'doctor',
      name: 'Dr. Anjali Mehta',
      nameHindi: 'डॉ. अंजलि मेहता',
      nameMarathi: 'डॉ. अंजली मेहता',
      email: 'dr.anjali.mehta@phc.gov.in',
      phone: '+91 98221 44556',
      medicalRegNo: 'MMC-2012-08-3921',
      specialty: 'General Medicine',
      hospital: 'Khed Primary Health Centre (PHC)',
      district: 'Pune',
      authProvider: 'google'
    },
    {
      id: 'HOSP-MH-2026-0089',
      role: 'hospital_admin',
      name: 'Dr. Suresh Deshpande (Admin)',
      nameHindi: 'डॉ. सुरेश देशपांडे (प्रशासक)',
      nameMarathi: 'डॉ. सुरेश देशपांडे (प्रशासक)',
      email: 'admin.khedphc@arogya.gov.in',
      phone: '+91 94231 88990',
      facilityName: 'Khed Primary Health Centre & 108 Emergency Bay',
      facilityId: 'PHC-PUN-042',
      district: 'Pune',
      authProvider: 'email'
    },
    {
      id: 'ASHA-MH-2026-4018',
      role: 'asha',
      name: 'Sunita Kamble',
      nameHindi: 'सुनीता कांबळे (आशा)',
      nameMarathi: 'सुनिता कांबळे (आशा)',
      email: 'sunita.asha@arogya.gov.in',
      phone: '+91 97654 33211',
      village: 'Khed Rural & Alandi Sector',
      district: 'Pune',
      state: 'Maharashtra',
      connectedPhc: 'Khed Primary Health Centre (PHC)',
      phcId: 'PHC-PUN-042',
      authProvider: 'phone'
    }
  ];
};

const sanitizeQueueForUser = (user) => {
  const existingQueue = getStored(STORAGE_KEYS.QUEUE, null);
  if (!existingQueue) return;

  if (!user) {
    removeStored(STORAGE_KEYS.QUEUE);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: null }));
    return;
  }

  const idMatch = existingQueue.patientId && existingQueue.patientId === user.id;
  const abhaMatch = existingQueue.patientAbhaId && existingQueue.patientAbhaId === user.abhaId;
  const phoneMatch = existingQueue.patientPhone && user.phone && existingQueue.patientPhone.replace(/\s+/g, '') === user.phone.replace(/\s+/g, '');
  const nameMatch = existingQueue.patientName && user.name && existingQueue.patientName.toLowerCase().trim() === user.name.toLowerCase().trim();
  const isRahul = (user.name?.toLowerCase().includes('rahul') || user.abhaId?.includes('4829')) && (!existingQueue.patientName || existingQueue.patientName.toLowerCase().includes('rahul'));

  if (!idMatch && !abhaMatch && !phoneMatch && !nameMatch && !isRahul) {
    removeStored(STORAGE_KEYS.QUEUE);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: null }));
  }
};

const enrichWithLiveLocation = (user) => {
  if (!user) return user;
  const savedLoc = getStored(STORAGE_KEYS.USER_LOCATION, null);
  if (savedLoc) {
    const locName = savedLoc.village || savedLoc.city;
    return {
      ...user,
      village: locName || user.village,
      district: savedLoc.district || user.district,
      state: savedLoc.state || user.state
    };
  }
  return user;
};

export const authService = {
  async getSession() {
    await delay(100);
    const session = getStored(SESSION_STORAGE_KEY, null);
    if (session && session.user && !session.loggedOut) {
      return {
        isAuthenticated: true,
        role: session.role,
        user: enrichWithLiveLocation(session.user)
      };
    }

    return {
      isAuthenticated: false,
      role: null,
      user: null
    };
  },

  async registerUser({ role, name, email, phone, password, roleSpecificData = {}, authProvider = 'email' }) {
    await delay(400);

    const users = getStored(USERS_STORAGE_KEY, getInitialUsers());
    const newId = `${role.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newUser = {
      id: newId,
      role,
      name,
      email: email || `${phone.replace(/[^0-9]/g, '')}@sehatsetu.in`,
      phone: phone ? (phone.startsWith('+91') ? phone : `+91 ${phone}`) : '+91 98000 00000',
      authProvider,
      abhaId: role === 'patient' ? `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}` : null,
      village: roleSpecificData.village || 'Khed (Rajgurunagar)',
      district: roleSpecificData.district || 'Pune',
      state: 'Maharashtra',
      bloodGroup: roleSpecificData.bloodGroup || 'B+',
      ...roleSpecificData,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [newUser, ...users];
    setStored(USERS_STORAGE_KEY, updatedUsers);

    // Save active session
    setStored(SESSION_STORAGE_KEY, { role, user: newUser });
    if (role === 'patient') {
      setStored(STORAGE_KEYS.PATIENT, newUser);
      // New user registration has no active OPD appointments or tokens yet
      removeStored(STORAGE_KEYS.QUEUE);
      window.dispatchEvent(new CustomEvent('queue_state_change', { detail: null }));
    }

    return { success: true, role, user: newUser };
  },

  async loginWithEmail(email, password, role) {
    await delay(350);
    const users = getStored(USERS_STORAGE_KEY, getInitialUsers());
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Auto-create demo user with this email for friendly testing
      user = {
        id: `${role.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        role,
        name: email.split('@')[0].replace('.', ' '),
        email,
        phone: '+91 98765 00000',
        abhaId: '91-4829-1029-4819',
        village: 'Khed (Rajgurunagar)',
        district: 'Pune',
        authProvider: 'email'
      };
      setStored(USERS_STORAGE_KEY, [user, ...users]);
    }

    const enrichedUser = enrichWithLiveLocation(user);
    setStored(SESSION_STORAGE_KEY, { role, user: enrichedUser });
    if (role === 'patient') {
      setStored(STORAGE_KEYS.PATIENT, enrichedUser);
      sanitizeQueueForUser(enrichedUser);
    }
    return { success: true, role, user: enrichedUser };
  },

  async loginWithPhoneOtp(phone, otp, role, firebaseUser = null) {
    await delay(250);
    if (!phone || phone.length < 10) {
      throw new Error('Please enter a valid 10-digit mobile phone number.');
    }

    const rawDigits = phone.replace(/[^0-9]/g, '');
    const cleanTenDigits = rawDigits.slice(-10);
    const formattedPhone = firebaseUser?.phoneNumber || `+91 ${cleanTenDigits.slice(0, 5)} ${cleanTenDigits.slice(5)}`;
    const users = getStored(USERS_STORAGE_KEY, getInitialUsers());
    let user = users.find(u => (u.phone && u.phone.replace(/\D/g, '').endsWith(cleanTenDigits)) && u.role === role);

    if (!user) {
      user = {
        id: firebaseUser?.uid || `${role.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        role,
        name: role === 'doctor' ? 'Dr. Rural Specialist' : role === 'hospital_admin' ? 'Facility Incharge' : role === 'asha' ? 'Sunita Kamble (ASHA)' : 'Rural Patient',
        phone: formattedPhone,
        email: `${cleanTenDigits}@sehatsetu.in`,
        abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
        village: role === 'asha' ? 'Khed Rural & Alandi Sector' : 'Live Village',
        district: 'District PHC',
        connectedPhc: 'Khed Primary Health Centre (PHC)',
        authProvider: firebaseUser ? 'firebase_phone' : 'phone',
        phoneVerified: true
      };
      setStored(USERS_STORAGE_KEY, [user, ...users]);
    } else {
      user.phoneVerified = true;
    }

    const enrichedUser = enrichWithLiveLocation(user);
    setStored(SESSION_STORAGE_KEY, { role, user: enrichedUser });
    if (role === 'patient') {
      setStored(STORAGE_KEYS.PATIENT, enrichedUser);
      sanitizeQueueForUser(enrichedUser);
    }
    return { success: true, role, user: enrichedUser };
  },

  async loginWithGoogle(role) {
    await delay(500);
    // Instant Google OAuth simulation with authentic profile
    const users = getStored(USERS_STORAGE_KEY, getInitialUsers());
    const googleEmail = role === 'doctor' ? 'dr.mehta.telemed@gmail.com' : role === 'hospital_admin' ? 'admin.khedhospital@gmail.com' : role === 'asha' ? 'sunita.asha@arogya.gov.in' : 'rahul.sharma.rural@gmail.com';
    const googleName = role === 'doctor' ? 'Dr. Anjali Mehta' : role === 'hospital_admin' ? 'Dr. Suresh Deshpande' : role === 'asha' ? 'Sunita Kamble' : 'Rahul Sharma';

    let user = users.find(u => u.email === googleEmail);
    if (!user) {
      user = {
        id: `${role.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        role,
        name: googleName,
        email: googleEmail,
        phone: role === 'asha' ? '+91 97654 33211' : '+91 98765 43210',
        abhaId: '91-4829-1029-4819',
        village: role === 'asha' ? 'Khed Rural & Alandi Sector' : 'Live Village',
        district: 'District PHC',
        connectedPhc: 'Khed Primary Health Centre (PHC)',
        avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
        authProvider: 'google'
      };
      setStored(USERS_STORAGE_KEY, [user, ...users]);
    }

    const enrichedUser = enrichWithLiveLocation(user);
    setStored(SESSION_STORAGE_KEY, { role, user: enrichedUser });
    if (role === 'patient') {
      setStored(STORAGE_KEYS.PATIENT, enrichedUser);
      sanitizeQueueForUser(enrichedUser);
    }
    return { success: true, role, user: enrichedUser };
  },

  async loginWithBiometrics(role = 'patient', biometricCredential = null) {
    await delay(350);
    const users = getStored(USERS_STORAGE_KEY, getInitialUsers());
    
    // 1. Try finding enrolled user by ID or email from credential
    let user = null;
    if (biometricCredential && biometricCredential.userId) {
      user = users.find(u => u.id === biometricCredential.userId);
    }
    if (!user && biometricCredential && biometricCredential.email) {
      user = users.find(u => u.email === biometricCredential.email);
    }
    // 2. Fallback to first user matching the selected role
    if (!user) {
      user = users.find(u => u.role === role);
    }
    // 3. Fallback to default role profile if needed
    if (!user) {
      const defaultName = role === 'doctor' ? 'Dr. Anjali Mehta' : role === 'hospital_admin' ? 'Dr. Suresh Deshpande' : role === 'asha' ? 'Sunita Kamble' : 'Rahul Sharma';
      const defaultEmail = role === 'doctor' ? 'dr.anjali.mehta@phc.gov.in' : role === 'hospital_admin' ? 'admin.khedphc@arogya.gov.in' : role === 'asha' ? 'sunita.asha@arogya.gov.in' : 'rahul.sharma@gmail.com';
      user = {
        id: `${role.toUpperCase().slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
        role,
        name: defaultName,
        email: defaultEmail,
        phone: role === 'asha' ? '+91 97654 33211' : '+91 98765 43210',
        abhaId: '91-4829-1029-4819',
        village: role === 'asha' ? 'Khed Rural & Alandi Sector' : 'Khed (Rajgurunagar)',
        district: 'Pune',
        connectedPhc: 'Khed Primary Health Centre (PHC)',
        bloodGroup: 'B+',
        authProvider: 'biometric'
      };
      setStored(USERS_STORAGE_KEY, [user, ...users]);
    }

    const enrichedUser = enrichWithLiveLocation(user);
    enrichedUser.authProvider = 'biometric';
    setStored(SESSION_STORAGE_KEY, { role, user: enrichedUser });
    if (role === 'patient') {
      setStored(STORAGE_KEYS.PATIENT, enrichedUser);
      sanitizeQueueForUser(enrichedUser);
    }
    return { success: true, role, user: enrichedUser, biometric: true };
  },

  async logout() {
    await delay(150);
    setStored(SESSION_STORAGE_KEY, { loggedOut: true });
    removeStored(STORAGE_KEYS.QUEUE);
    window.dispatchEvent(new CustomEvent('queue_state_change', { detail: null }));
    return { success: true };
  }
};

export const patientService = {
  async getProfile() {
    await delay(200);
    return getStored(STORAGE_KEYS.PATIENT, INITIAL_PATIENT);
  },

  async updateProfile(updates) {
    await delay(300);
    const current = getStored(STORAGE_KEYS.PATIENT, INITIAL_PATIENT);
    const updated = { ...current, ...updates };
    setStored(STORAGE_KEYS.PATIENT, updated);

    // Also update active session if patient
    const session = getStored(SESSION_STORAGE_KEY, null);
    if (session && session.role === 'patient') {
      setStored(SESSION_STORAGE_KEY, { ...session, user: updated });
    }

    return updated;
  },

  async addEmergencyContact(contact) {
    await delay(200);
    const current = getStored(STORAGE_KEYS.PATIENT, INITIAL_PATIENT);
    const contacts = [...(current.emergencyContacts || []), contact];
    const updated = { ...current, emergencyContacts: contacts };
    setStored(STORAGE_KEYS.PATIENT, updated);
    return updated;
  }
};
