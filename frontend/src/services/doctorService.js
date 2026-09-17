import { delay, getStored, STORAGE_KEYS } from './api';
import { INITIAL_DOCTORS } from '../data/mockData';

export const doctorService = {
  async getDoctors(filters = {}) {
    await delay(200);
    const doctors = getStored(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    let result = [...doctors];

    if (filters.specialty && filters.specialty !== 'All') {
      result = result.filter(d => d.specialty.toLowerCase() === filters.specialty.toLowerCase());
    }

    if (filters.mode && filters.mode !== 'all') {
      result = result.filter(d => d.consultationModes.includes(filters.mode));
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q) ||
        d.hospital.toLowerCase().includes(q) ||
        (d.specialtyHindi && d.specialtyHindi.includes(q))
      );
    }

    return result;
  },

  async getDoctorById(id) {
    await delay(150);
    const doctors = getStored(STORAGE_KEYS.DOCTORS, INITIAL_DOCTORS);
    const doc = doctors.find(d => d.id === id);
    if (!doc) throw new Error('Doctor not found');
    return doc;
  },

  async getSpecialties() {
    return [
      'All',
      'General Physician',
      'Cardiologist',
      'Pediatrician',
      'Gynecologist',
      'Orthopedic',
      'ENT Specialist'
    ];
  },

  // Future AI-ready symptom recommendation engine
  async getSmartDoctorRecommendation(symptomText) {
    await delay(350);
    if (!symptomText || symptomText.trim().length < 3) {
      return null;
    }

    const lower = symptomText.toLowerCase();

    // Red flag safety check
    if (
      lower.includes('chest pain') ||
      lower.includes('heart attack') ||
      lower.includes('cannot breathe') ||
      lower.includes('unconscious') ||
      lower.includes('snake') ||
      lower.includes('poison')
    ) {
      return {
        isEmergency: true,
        recommendedSpecialty: 'Cardiologist / Emergency Medicine',
        recommendedDepartment: 'Casualty / Emergency Dept',
        alertMessage: 'These symptoms indicate a potential medical emergency. Please proceed to the Emergency SOS workflow immediately or call 108.',
        confidence: 0.96
      };
    }

    if (lower.includes('child') || lower.includes('baby') || lower.includes('kid') || lower.includes('vaccin') || lower.includes('infant')) {
      return {
        isEmergency: false,
        recommendedSpecialty: 'Pediatrician',
        recommendedDepartment: 'Pediatrics & Child Health',
        explanation: 'For infants, children, and immunization concerns, consulting a Pediatrician ensures age-appropriate care.',
        matchedDoctorIds: ['DOC-03'],
        confidence: 0.92
      };
    }

    if (lower.includes('period') || lower.includes('pregnant') || lower.includes('pregnancy') || lower.includes('pelvic') || lower.includes('uterus') || lower.includes('delivery')) {
      return {
        isEmergency: false,
        recommendedSpecialty: 'Gynecologist',
        recommendedDepartment: 'Obstetrics & Gynecology',
        explanation: 'For maternal care, women’s reproductive health, or pregnancy checkups, a Gynecologist is recommended.',
        matchedDoctorIds: ['DOC-05'],
        confidence: 0.94
      };
    }

    if (lower.includes('bone') || lower.includes('joint') || lower.includes('knee') || lower.includes('fracture') || lower.includes('back pain') || lower.includes('fall')) {
      return {
        isEmergency: false,
        recommendedSpecialty: 'Orthopedic',
        recommendedDepartment: 'Orthopedics & Joint Care',
        explanation: 'For bone, spine, joint stiffness or trauma, an Orthopedic specialist can evaluate with imaging.',
        matchedDoctorIds: ['DOC-04'],
        confidence: 0.90
      };
    }

    if (lower.includes('ear') || lower.includes('nose') || lower.includes('throat') || lower.includes('sinus') || lower.includes('hearing') || lower.includes('tonsil')) {
      return {
        isEmergency: false,
        recommendedSpecialty: 'ENT Specialist',
        recommendedDepartment: 'Otorhinolaryngology (ENT)',
        explanation: 'For ear discharge, nasal blockages, or chronic throat issues, an ENT specialist is best suited.',
        matchedDoctorIds: ['DOC-06'],
        confidence: 0.88
      };
    }

    if (lower.includes('heart') || lower.includes('palpitation') || lower.includes('blood pressure') || lower.includes('bp') || lower.includes('hypertension')) {
      return {
        isEmergency: false,
        recommendedSpecialty: 'Cardiologist',
        recommendedDepartment: 'Cardiology',
        explanation: 'For elevated blood pressure, palpitations, or cardiac assessment, a Cardiologist provides targeted diagnostics.',
        matchedDoctorIds: ['DOC-02'],
        confidence: 0.91
      };
    }

    // Default primary care triage
    return {
      isEmergency: false,
      recommendedSpecialty: 'General Physician',
      recommendedDepartment: 'General Medicine / Primary OPD',
      explanation: 'For general malaise, seasonal fever, cough, stomach upset, or preliminary evaluation, a General Physician at the PHC is the ideal first step.',
      matchedDoctorIds: ['DOC-01'],
      confidence: 0.85
    };
  }
};
