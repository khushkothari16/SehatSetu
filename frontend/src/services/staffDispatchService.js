import { delay, getStored, setStored } from './api';

const STORAGE_KEY = 'sehatsetu_staff_requests';

export const AVAILABLE_STAFF_ROSTER = [
  {
    id: 'STAFF-101',
    name: 'Nurse Priya Sharma',
    role: 'Senior Staff Nurse / ANM',
    phone: '+91 98234 11223',
    qualification: 'B.Sc Nursing, Certified Immunizer',
    facility: 'Chakan Primary Health Centre (PHC)',
    distanceKm: 0.8,
    etaMinutes: 12,
    rating: 4.9,
    status: 'available',
    specialties: ['Injections (IM/IV/SC)', 'Wound Dressing', 'IV Saline Drip', 'Pediatric Immunization']
  },
  {
    id: 'STAFF-102',
    name: 'Staff Nurse Ramesh Patil',
    role: 'Community Health Nurse (GNM)',
    phone: '+91 98765 88990',
    qualification: 'GNM, Emergency Care Certified',
    facility: 'Talegaon Rural Sub-Centre',
    distanceKm: 1.4,
    etaMinutes: 18,
    rating: 4.8,
    status: 'available',
    specialties: ['Injections (Insulin / Antibiotic)', 'Post-Op Stitches Care', 'Catheter Maintenance']
  },
  {
    id: 'STAFF-103',
    name: 'Sunita Devi (ASHA)',
    role: 'Certified ASHA Community Caregiver',
    phone: '+91 97654 33211',
    qualification: 'Certified Community Health Volunteer',
    facility: 'Village Ward 3 Health Post',
    distanceKm: 0.5,
    etaMinutes: 8,
    rating: 4.9,
    status: 'available',
    specialties: ['Basic Home Care', 'BP & Sugar Monitoring', 'Medication Assistance']
  },
  {
    id: 'STAFF-104',
    name: 'Amit Deshmukh',
    role: 'Clinical Phlebotomist & Injection Tech',
    phone: '+91 99887 66554',
    qualification: 'DMLT, Certified Phlebotomist',
    facility: 'District Diagnostic Mobile Unit',
    distanceKm: 2.1,
    etaMinutes: 25,
    rating: 4.7,
    status: 'available',
    specialties: ['Blood Sample Draw', 'IV Cannula Setup', 'Injections']
  }
];

export const staffDispatchService = {
  getStaffRoster() {
    return AVAILABLE_STAFF_ROSTER;
  },

  getAllRequestsSync() {
    return getStored(STORAGE_KEY, []);
  },

  getActiveRequestSync() {
    const list = getStored(STORAGE_KEY, []);
    return list.find(r => r.status === 'Pending Staff' || r.status === 'Dispatched & En Route') || null;
  },

  async createStaffRequest({
    patientName,
    patientPhone,
    patientAbhaId,
    purpose,
    subPurpose,
    medicationDetails,
    address,
    userCoords,
    urgency,
    notes,
    userLocation
  }) {
    await delay(300);

    const list = getStored(STORAGE_KEY, []);
    const reqId = `NURSE-REQ-${Math.floor(1000 + Math.random() * 9000)}`;

    const newRequest = {
      id: reqId,
      patientName: patientName || 'Rahul Sharma',
      patientPhone: patientPhone || '+91 98765 43210',
      patientAbhaId: patientAbhaId || '91-4829-1029-4819',
      purpose: purpose || 'Injection Administration (इंजेक्शन लगवाना)',
      subPurpose: subPurpose || 'Insulin / Antibiotic Injection',
      medicationDetails: medicationDetails || 'Insulin Glargine 10 Units (Post Dinner)',
      address: address || `${userLocation?.village || 'Khed Shivapur'}, Ward 2, Near Panchayat Office`,
      userCoords: userCoords || { lat: 18.356, lng: 73.847 },
      urgency: urgency || 'Immediate (Within 15-30 mins)',
      notes: notes || 'Please send nurse with sterile injection syringe and spirit swab.',
      requestedAt: new Date().toISOString(),
      status: 'Pending Staff',
      assignedStaff: null,
      dispatchedAt: null,
      completedAt: null
    };

    const updated = [newRequest, ...list];
    setStored(STORAGE_KEY, updated);

    window.dispatchEvent(new CustomEvent('staff_request_change', { detail: newRequest }));
    return newRequest;
  },

  async dispatchStaff(requestId, staffMember = null) {
    await delay(300);

    const list = getStored(STORAGE_KEY, []);
    const staff = staffMember || AVAILABLE_STAFF_ROSTER[0];

    let targetReq = null;
    const updated = list.map(req => {
      if (req.id === requestId) {
        targetReq = {
          ...req,
          status: 'Dispatched & En Route',
          assignedStaff: {
            id: staff.id,
            name: staff.name,
            role: staff.role,
            phone: staff.phone,
            facility: staff.facility,
            etaMinutes: staff.etaMinutes || 12,
            distanceKm: staff.distanceKm || 0.8
          },
          dispatchedAt: new Date().toISOString()
        };
        return targetReq;
      }
      return req;
    });

    setStored(STORAGE_KEY, updated);
    window.dispatchEvent(new CustomEvent('staff_request_change', { detail: targetReq }));
    return targetReq;
  },

  async completeStaffRequest(requestId, completionNotes = 'Injection applied successfully at patient home. Patient vitals stable.') {
    await delay(300);

    const list = getStored(STORAGE_KEY, []);
    let targetReq = null;
    const updated = list.map(req => {
      if (req.id === requestId) {
        targetReq = {
          ...req,
          status: 'Completed',
          completedAt: new Date().toISOString(),
          completionNotes
        };
        return targetReq;
      }
      return req;
    });

    setStored(STORAGE_KEY, updated);
    window.dispatchEvent(new CustomEvent('staff_request_change', { detail: targetReq }));
    return targetReq;
  },

  async cancelStaffRequest(requestId) {
    await delay(200);

    const list = getStored(STORAGE_KEY, []);
    let targetReq = null;
    const updated = list.map(req => {
      if (req.id === requestId) {
        targetReq = {
          ...req,
          status: 'Cancelled',
          cancelledAt: new Date().toISOString()
        };
        return targetReq;
      }
      return req;
    });

    setStored(STORAGE_KEY, updated);
    window.dispatchEvent(new CustomEvent('staff_request_change', { detail: null }));
    return targetReq;
  }
};
