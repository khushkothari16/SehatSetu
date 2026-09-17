import { delay } from './api';

export const consultationService = {
  async getConsultationSession(appointmentId) {
    await delay(200);
    return {
      sessionId: `SES-RTC-${appointmentId || '2026-01'}`,
      doctorName: 'Dr. Anjali Mehta',
      doctorSpecialty: 'General Physician',
      facility: 'Khed PHC Telemedicine Hub',
      doctorStatus: 'Online & Ready',
      callType: 'Video Call (WebRTC Ready)',
      connectionQuality: 'Good (4G / Broadband)',
      isDoctorJoined: true,
      patientVitals: {
        bloodPressure: '120/80 mmHg',
        pulseRate: '76 bpm',
        temperature: '98.6 °F',
        spO2: '99%'
      }
    };
  },

  async endConsultation(sessionId, notes) {
    await delay(300);
    return {
      success: true,
      summary: 'Consultation concluded. Digital prescription generated and ready to view.',
      prescriptionId: 'RX-2026-0042'
    };
  }
};
