import { delay, getStored, setStored, removeStored, STORAGE_KEYS } from './api';
import { FIRST_AID_GUIDES } from '../data/mockData';
import { cloudSyncService } from './cloudSyncService';

// Listen for cross-device emergency broadcasts
if (typeof window !== 'undefined') {
  cloudSyncService.subscribe((type, detail) => {
    if (type === 'emergency_state_change') {
      if (detail) {
        setStored(STORAGE_KEYS.EMERGENCY_STATE, detail);
      } else {
        removeStored(STORAGE_KEYS.EMERGENCY_STATE);
      }
      window.dispatchEvent(new CustomEvent('emergency_state_change', { detail }));
    }
  });
}

export const emergencyService = {
  getActiveEmergencySync() {
    try {
      const rec = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
      if (!rec || rec.status === 'Cancelled') return null;
      return rec;
    } catch {
      return null;
    }
  },

  async dispatchEmergency({ targetType, description, photoUrl, photoUrls, userCoords, address, callerName, callerPhone, userLocation, injuredCount = 1, alertPolice = false, isSeriousInjury = false }) {
    await delay(350);

    const parsedInjuredCount = Math.max(1, parseInt(injuredCount, 10) || 1);
    const shouldAlertPolice = Boolean(alertPolice || isSeriousInjury || parsedInjuredCount >= 2);
    const emergencyId = `EMERG-108-${Math.floor(10000 + Math.random() * 90000)}`;
    const patientLat = userCoords?.lat || 28.1878;
    const patientLng = userCoords?.lng || 75.5001;

    // Ambulance initially ~2.4 km away from the patient's real coordinates
    const initialAmbulanceLat = patientLat + 0.015;
    const initialAmbulanceLng = patientLng + 0.012;

    // Nearest Police PCR patrol van ~1.8 km away
    const initialPoliceLat = patientLat - 0.011;
    const initialPoliceLng = patientLng + 0.009;

    const patientDisplayName = callerName || (targetType === 'myself' ? 'Rahul Sharma' : 'Bystander Citizen (Accident Reporter)');
    const patientDisplayPhone = callerPhone || '+91 98765 43210';
    const locPrefix = address ? address.split(',')[0].trim() : (userLocation?.village || userLocation?.city || 'Local Area');

    // Dynamic state vehicle code determination
    const getStateVehicleCode = (stateName) => {
      const map = {
        'Rajasthan': 'RJ',
        'Maharashtra': 'MH',
        'Delhi': 'DL',
        'Uttar Pradesh': 'UP',
        'Bihar': 'BR',
        'Madhya Pradesh': 'MP',
        'Gujarat': 'GJ',
        'Karnataka': 'KA',
        'Tamil Nadu': 'TN',
        'Punjab': 'PB',
        'Haryana': 'HR',
        'West Bengal': 'WB',
        'Telangana': 'TS',
        'Andhra Pradesh': 'AP',
        'Kerala': 'KL',
        'Odisha': 'OD',
        'Assam': 'AS'
      };
      return (stateName && map[stateName]) || 'RJ';
    };

    const stCode = getStateVehicleCode(userLocation?.state);
    const distNum = Math.floor(10 + Math.random() * 89);
    const dynamicAmbulanceVehicle = `${stCode}-${distNum}-EM-1084`;

    // Normalize multiple photos
    const normalizedPhotos = Array.isArray(photoUrls) && photoUrls.length > 0
      ? photoUrls.filter(Boolean)
      : (photoUrl ? (Array.isArray(photoUrl) ? photoUrl.filter(Boolean) : [photoUrl]) : []);

    const policeStationData = shouldAlertPolice ? {
      stationId: `PS-${Math.floor(100 + Math.random() * 900)}`,
      stationName: `${locPrefix} Police Station (थाना)`,
      jurisdiction: `${userLocation?.district || locPrefix} Police Department`,
      pcrUnit: `PCR Cheetah-${Math.floor(1 + Math.random() * 9)}`,
      pcrDriver: 'Head Constable Rajendra Singh',
      pcrPhone: '+91 98290 11211',
      officerInCharge: 'Sub-Inspector Devendra Choudhary (Duty Officer)',
      stationPhone: '112 / +91 1593 222100',
      distanceKm: 1.8,
      etaMinutes: 6,
      status: 'PCR Dispatched • Securing Traffic & Green Corridor',
      pcrCoords: { lat: initialPoliceLat, lng: initialPoliceLng },
      incidentLocationTransmitted: true,
      accidentLocation: address || `${locPrefix}, Live GPS Position`,
      accidentCoords: { lat: patientLat, lng: patientLng },
      photosTransmittedCount: normalizedPhotos.length,
      photosTransmitted: normalizedPhotos,
      diaryEntryNumber: `GD-108-${Math.floor(1000 + Math.random() * 9000)}`,
      notifiedAt: new Date().toISOString()
    } : null;

    const emergencyRecord = {
      id: emergencyId,
      targetType, // 'myself' or 'someone_else'
      callerName: patientDisplayName,
      callerPhone: patientDisplayPhone,
      injuredCount: parsedInjuredCount,
      isSeriousInjury: Boolean(isSeriousInjury || parsedInjuredCount >= 2),
      policeNotified: shouldAlertPolice,
      policeStation: policeStationData,
      description: description || (targetType === 'myself' ? 'Immediate patient SOS medical alert' : 'Bystander reported acute road accident/incident'),
      photoUrl: normalizedPhotos[0] || null,
      photoUrls: normalizedPhotos,
      status: 'Ambulance Dispatched', // Dispatched, En Route, Arrived, Hospital Transit, Completed
      patientCoords: { lat: patientLat, lng: patientLng },
      ambulanceCoords: { lat: initialAmbulanceLat, lng: initialAmbulanceLng },
      address: address || `${locPrefix}, Live GPS Position`,
      etaMinutes: 8,
      distanceKm: 2.4,

      // Hospital Notification
      hospitalName: `${locPrefix} Primary Health Centre & 108 Emergency Trauma Bay`,
      hospitalNotified: true,
      hospitalDesk: {
        facilityId: `PHC-${Math.floor(100 + Math.random() * 900)}`,
        facilityName: `${locPrefix} Primary Health Centre (PHC)`,
        traumaBay: parsedInjuredCount > 3 ? `Emergency Bays 1-${Math.min(parsedInjuredCount, 4)} (MCI Multi-Bed Priority)` : 'Emergency Bay 1 (Red Priority)',
        adminOnDuty: 'Duty Medical Superintendent',
        status: parsedInjuredCount > 1
          ? `${parsedInjuredCount} Casualty Beds & Multi-Patient Trauma Kits Prepped`
          : 'Trauma Bay & Resuscitation Equipment Prepped',
        notifiedAt: new Date().toISOString()
      },

      // Assigned Doctor on Duty
      assignedDoctor: {
        id: 'doc-101',
        name: 'Dr. Anjali Mehta',
        specialty: 'Emergency Physician & Duty Medical Officer (MBBS)',
        hospital: `${locPrefix} Primary Health Centre (PHC)`,
        phone: '+91 98220 12345',
        status: parsedInjuredCount > 1 ? `Alert Received • Triage for ${parsedInjuredCount} Injured Patients` : 'Alert Received • Reviewing Case',
        notifiedAt: new Date().toISOString()
      },

      // Doctor Two-Way Replies & Clinical Advisories
      doctorMessages: [
        {
          id: `msg-${Date.now()}-1`,
          sender: 'Dr. Anjali Mehta',
          senderRole: `Duty Medical Officer (${locPrefix} PHC)`,
          text: parsedInjuredCount > 1
            ? `Emergency SOS received at ${locPrefix} PHC for ${parsedInjuredCount} injured casualties. 108 Ambulance (${dynamicAmbulanceVehicle}) dispatched with multi-patient trauma kits and paramedics. ${parsedInjuredCount} emergency bay beds are prepped.${shouldAlertPolice ? ` Nearest Police Station (${locPrefix} Thana) and 112 PCR alerted with GPS coordinates and photos.` : ''} Follow first-aid guidance below.`
            : `Emergency SOS received at ${locPrefix} PHC. 108 Ambulance (${dynamicAmbulanceVehicle}) dispatched with paramedic team. Trauma Bay is prepped.${shouldAlertPolice ? ` Nearest Police Station (${locPrefix} Thana) alerted with accident location and photos.` : ''} Please follow first-aid instructions below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isDoctor: true
        }
      ],

      familyNotified: targetType === 'myself',
      ambulanceVehicleNumber: dynamicAmbulanceVehicle,
      driverName: 'Ramesh Kumar (Paramedic Certified)',
      driverPhone: '+91 98221 08108',
      timestamp: new Date().toISOString()
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, emergencyRecord);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: emergencyRecord }));
    cloudSyncService.publish('emergency_state_change', emergencyRecord);
    return emergencyRecord;
  },

  async getActiveEmergency() {
    await delay(50);
    const rec = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!rec || rec.status === 'Cancelled') {
      removeStored(STORAGE_KEYS.EMERGENCY_STATE);
      return null;
    }
    return rec;
  },

  // Doctor sending real-time advisory or reply to patient/bystander
  async sendDoctorReply(text, doctorName = 'Dr. Anjali Mehta') {
    await delay(150);
    const current = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!current) return null;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: doctorName,
      senderRole: `Emergency Medical Officer (${current.hospitalName || 'PHC'})`,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDoctor: true
    };

    const updated = {
      ...current,
      doctorMessages: [...(current.doctorMessages || []), newMessage],
      assignedDoctor: {
        ...(current.assignedDoctor || {}),
        status: 'Active Advisory Sent to Caller'
      }
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, updated);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: updated }));
    window.dispatchEvent(new CustomEvent('emergency_doctor_reply', { detail: newMessage }));
    return updated;
  },

  // Patient / Caller sending status update back to the attending doctor
  async sendPatientReply(text) {
    await delay(150);
    const current = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!current) return null;

    const newMessage = {
      id: `msg-${Date.now()}`,
      sender: current.callerName || 'Patient / Caller',
      senderRole: current.targetType === 'myself' ? 'Self Patient' : 'Bystander Citizen',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDoctor: false
    };

    const updated = {
      ...current,
      doctorMessages: [...(current.doctorMessages || []), newMessage]
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, updated);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: updated }));
    return updated;
  },

  // Add additional photos to an active emergency during live response
  async addEmergencyPhotos(newPhotos) {
    await delay(150);
    const current = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!current) return null;

    const incoming = Array.isArray(newPhotos) ? newPhotos.filter(Boolean) : (newPhotos ? [newPhotos] : []);
    if (incoming.length === 0) return current;

    const existingPhotos = Array.isArray(current.photoUrls) && current.photoUrls.length > 0
      ? current.photoUrls
      : (current.photoUrl ? [current.photoUrl] : []);

    const mergedPhotos = [...existingPhotos, ...incoming];
    const updated = {
      ...current,
      photoUrls: mergedPhotos,
      photoUrl: mergedPhotos[0] || null,
      policeStation: current.policeStation ? {
        ...current.policeStation,
        photosTransmittedCount: mergedPhotos.length,
        photosTransmitted: mergedPhotos
      } : null
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, updated);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: updated }));
    return updated;
  },

  // Alert nearest police station during an active emergency if not already alerted
  async alertPoliceForActiveEmergency() {
    await delay(150);
    const current = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!current) return null;
    if (current.policeStation) return current;

    const patientLat = current.patientCoords?.lat || 28.1878;
    const patientLng = current.patientCoords?.lng || 75.5001;
    const initialPoliceLat = patientLat - 0.016;
    const initialPoliceLng = patientLng - 0.014;
    const locPrefix = current.address?.split(',')[0] || 'Local Jurisdiction';

    const currentPhotos = Array.isArray(current.photoUrls) && current.photoUrls.length > 0
      ? current.photoUrls
      : (current.photoUrl ? [current.photoUrl] : []);

    const policeStationData = {
      stationId: `PS-${Math.floor(100 + Math.random() * 900)}`,
      stationName: `${locPrefix} Police Station (थाना)`,
      jurisdiction: `${locPrefix} Police Department`,
      pcrUnit: `PCR Cheetah-${Math.floor(1 + Math.random() * 9)}`,
      pcrDriver: 'Head Constable Rajendra Singh',
      pcrPhone: '+91 98290 11211',
      officerInCharge: 'Sub-Inspector Devendra Choudhary (Duty Officer)',
      stationPhone: '112 / +91 1593 222100',
      distanceKm: 1.8,
      etaMinutes: 6,
      status: 'PCR Dispatched • Securing Traffic & Green Corridor',
      pcrCoords: { lat: initialPoliceLat, lng: initialPoliceLng },
      incidentLocationTransmitted: true,
      accidentLocation: current.address,
      accidentCoords: { lat: patientLat, lng: patientLng },
      photosTransmittedCount: currentPhotos.length,
      photosTransmitted: currentPhotos,
      diaryEntryNumber: `GD-108-${Math.floor(1000 + Math.random() * 9000)}`,
      notifiedAt: new Date().toISOString()
    };

    const updated = {
      ...current,
      policeNotified: true,
      isSeriousInjury: true,
      policeStation: policeStationData
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, updated);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: updated }));
    return updated;
  },

  async cancelEmergency() {
    await delay(150);
    removeStored(STORAGE_KEYS.EMERGENCY_STATE);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: null }));
    cloudSyncService.publish('emergency_state_change', null);
    return { success: true };
  },

  // Simulates live ambulance and police PCR movement towards patient
  async tickAmbulanceLocation() {
    const current = getStored(STORAGE_KEYS.EMERGENCY_STATE, null);
    if (!current) return null;

    const pLat = current.patientCoords?.lat || 18.8472;
    const pLng = current.patientCoords?.lng || 73.9142;
    let aLat = current.ambulanceCoords?.lat || (pLat + 0.015);
    let aLng = current.ambulanceCoords?.lng || (pLng + 0.012);

    // Step 25% closer to patient coordinates
    aLat = aLat + (pLat - aLat) * 0.25;
    aLng = aLng + (pLng - aLng) * 0.25;

    const newEta = Math.max(1, current.etaMinutes - 1);
    const newDist = Math.max(0.2, (current.distanceKm * 0.75).toFixed(1));

    let newStatus = current.status;
    if (newEta <= 2) {
      newStatus = 'Ambulance Arriving Shortly';
    } else if (newEta === 1) {
      newStatus = 'Ambulance at Scene';
    }

    // Step police PCR patrol closer to patient
    let updatedPoliceStation = current.policeStation;
    if (current.policeStation && current.policeStation.pcrCoords) {
      let polLat = current.policeStation.pcrCoords.lat;
      let polLng = current.policeStation.pcrCoords.lng;
      polLat = polLat + (pLat - polLat) * 0.26;
      polLng = polLng + (pLng - polLng) * 0.26;
      const polEta = Math.max(1, (current.policeStation.etaMinutes || 6) - 1);
      const polDist = Math.max(0.2, ((current.policeStation.distanceKm || 1.8) * 0.75).toFixed(1));
      updatedPoliceStation = {
        ...current.policeStation,
        pcrCoords: { lat: polLat, lng: polLng },
        etaMinutes: polEta,
        distanceKm: polDist,
        status: polEta <= 2 ? 'PCR Arriving • Securing Accident Site' : current.policeStation.status
      };
    }

    const updated = {
      ...current,
      ambulanceCoords: { lat: aLat, lng: aLng },
      etaMinutes: newEta,
      distanceKm: newDist,
      status: newStatus,
      policeStation: updatedPoliceStation
    };

    setStored(STORAGE_KEYS.EMERGENCY_STATE, updated);
    window.dispatchEvent(new CustomEvent('emergency_state_change', { detail: updated }));
    return updated;
  },

  getFirstAidGuides() {
    return FIRST_AID_GUIDES;
  }
};
