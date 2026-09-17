import { getStored, setStored, STORAGE_KEYS, delay, apiFetch } from './api';

const TRACKING_STORAGE_KEY = 'sehatsetu_referral_chains';

export const INITIAL_REFERRAL_CHAINS = [
  {
    id: 'REF-TRK-2026-8941',
    patientId: 'P-001',
    patientName: 'Rahul Sharma',
    patientNameHindi: 'राहुल शर्मा',
    abhaId: '91-4829-1029-4819',
    age: 34,
    gender: 'Male',
    village: 'Khed Rural (खेड)',
    status: 'In Transit to Specialist', // 'Consultation Booked' | 'In Transit to Specialist' | 'Under Specialist Review' | 'Completed'
    priority: 'High Priority',
    primaryCondition: 'Atypical Angina with ST Segment Fluctuations',
    createdAt: '08 Sep 2026, 10:15 AM',
    lastUpdated: '11 Sep 2026, 11:30 AM',
    hops: [
      {
        hopId: 'hop-1',
        stepNumber: 1,
        status: 'completed', // 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
        title: 'Initial Primary Care & Triage Consultation',
        titleHindi: 'प्रारंभिक प्राथमिक जांच व परामर्श',
        doctorName: 'Dr. Kavita Deshmukh',
        doctorDegree: 'MBBS, DCH (NMC Reg: 74921)',
        doctorRole: 'Primary Medical Officer',
        facility: 'Shirur Sub-Centre & Rural Clinic',
        facilityType: 'Sub-Centre / Primary Health Post',
        department: 'General Rural OPD',
        date: '08 Sep 2026',
        time: '10:15 AM',
        timestamp: '2026-09-08T10:15:00Z',
        vitals: {
          bp: '135/88 mmHg',
          pulse: '84 bpm',
          spo2: '97%',
          temp: '98.4°F',
          bloodSugar: '142 mg/dL'
        },
        clinicalFindings: 'Intermittent exertional chest discomfort for 4 days. Sub-centre resting ECG indicates non-specific ST-T wave changes.',
        doctorRemarks: 'Patient needs immediate escalation to secondary PHC with digital 12-lead ECG and physician evaluation. Advised complete rest, Tab Sorbitrate 5mg SOS, avoid heavy lifting. Referred to Khed PHC Room 4 for confirmatory diagnosis.',
        actionTaken: 'Referred to Khed PHC (Room 4 General Medicine)',
        referralSlipId: 'SLIP-SHIRUR-8941'
      },
      {
        hopId: 'hop-2',
        stepNumber: 2,
        status: 'completed',
        title: 'Secondary Physician Review & Cardiac Workup',
        titleHindi: 'द्वितीयक चिकित्सक जांच एवं कार्डियक मूल्यांकन',
        doctorName: 'Dr. Anjali Mehta',
        doctorDegree: 'MD (Gen Med), DNB (NMC Reg: 849204-RJ)',
        doctorRole: 'Senior Medical Officer & Duty Physician',
        facility: 'Khed Primary Health Centre (PHC)',
        facilityType: 'Primary Health Centre (PHC)',
        department: 'Room 4 - General Medicine & OPD',
        date: '11 Sep 2026',
        time: '11:30 AM',
        timestamp: '2026-09-11T11:30:00Z',
        vitals: {
          bp: '130/84 mmHg',
          pulse: '88 bpm',
          spo2: '98%',
          temp: '98.6°F',
          bloodSugar: '136 mg/dL'
        },
        clinicalFindings: 'Physical exam reveals S1 S2 normal, no murmurs. Repeat 12-lead ECG demonstrates persistent ST depression in leads V3-V5. Troponin-I rapid card is weakly positive.',
        doctorRemarks: 'High suspicion of non-ST elevation acute coronary syndrome (NSTE-ACS). Tele-stabilized on dual antiplatelets (Aspirin 300mg + Clopidogrel 300mg stat) and Atorvastatin 80mg. Immediate tertiary cardiology referral required for formal 2D-Echocardiography, Coronary Angiography and catheterization.',
        actionTaken: 'Referred to District Civil Hospital, Chakan (Cardiology Dept)',
        referralSlipId: 'SLIP-KHED-0911'
      },
      {
        hopId: 'hop-3',
        stepNumber: 3,
        status: 'in_progress',
        title: 'Tertiary Specialist Cardiology Consult & Angiography',
        titleHindi: 'तृतीयक विशेषज्ञ हृदय रोग परामर्श व एंजियोग्राफी',
        doctorName: 'Dr. Vikram Joshi',
        doctorDegree: 'DM (Cardiology), MD, FACC',
        doctorRole: 'Chief Interventional Cardiologist',
        facility: 'District Civil Hospital & Trauma Centre, Chakan',
        facilityType: 'District Civil Hospital',
        department: 'Department of Cardiology & Cath Lab',
        date: '15 Sep 2026',
        time: '10:30 AM',
        timestamp: '2026-09-15T10:30:00Z',
        vitals: {
          bp: 'Pending Intake',
          pulse: 'Pending Intake',
          spo2: 'Pending Intake',
          temp: 'Pending Intake'
        },
        clinicalFindings: 'Appointment reserved in Priority Cath Lab Queue. Electronic ABHA health records successfully transferred from Khed PHC.',
        doctorRemarks: 'Keep 4 hours fasting prior to appointment. Bring all sub-centre and PHC ECG tracings. Fast-track admission token #12 pre-allocated.',
        actionTaken: 'Awaiting Physical Cath Lab Consultation & Echo',
        referralSlipId: 'SLIP-CHAKAN-018'
      }
    ]
  },
  {
    id: 'REF-TRK-2026-4410',
    patientId: 'P-002',
    patientName: 'Sunita Devi',
    patientNameHindi: 'सुनीता देवी',
    abhaId: '91-6621-9982-1102',
    age: 28,
    gender: 'Female',
    village: 'Alandi Rural',
    status: 'Consultation Booked',
    priority: 'Urgent Priority',
    primaryCondition: 'High-Risk Pregnancy (Gestational Hypertension & Severe Anemia)',
    createdAt: '09 Sep 2026, 02:40 PM',
    lastUpdated: '10 Sep 2026, 09:15 AM',
    hops: [
      {
        hopId: 'hop-1',
        stepNumber: 1,
        status: 'completed',
        title: 'Village Sub-Centre ANC Screening',
        titleHindi: 'ग्राम उप-केंद्र प्रसव पूर्व जांच',
        doctorName: 'Dr. Priya S. Patil',
        doctorDegree: 'MBBS, DGO',
        doctorRole: 'Community Health Officer & MO',
        facility: 'Alandi Gramin Sub-Centre',
        facilityType: 'Sub-Centre',
        department: 'Maternal & Child Health',
        date: '09 Sep 2026',
        time: '02:40 PM',
        timestamp: '2026-09-09T14:40:00Z',
        vitals: {
          bp: '150/96 mmHg',
          pulse: '92 bpm',
          spo2: '96%',
          temp: '98.2°F',
          hemoglobin: '7.8 g/dL'
        },
        clinicalFindings: '32 weeks gestation. Bilateral pedal edema. Pallor present. Urine protein 1+.',
        doctorRemarks: 'Severe anemia in pregnancy with pre-eclampsia features. Started oral Labetalol 100mg BD and Iron Sucrose infusion scheduled. Urgent OBGYN referral initiated.',
        actionTaken: 'Referred to Khed PHC Maternity Wing',
        referralSlipId: 'SLIP-ALANDI-4410'
      },
      {
        hopId: 'hop-2',
        stepNumber: 2,
        status: 'in_progress',
        title: 'PHC High-Risk Obstetric Care & Fetal Monitoring',
        titleHindi: 'पीएचसी उच्च-जोखिम प्रसूति देखभाल',
        doctorName: 'Dr. Anjali Mehta',
        doctorDegree: 'MD (OBGYN Consultant Visiting)',
        doctorRole: 'Senior Medical Officer',
        facility: 'Khed Primary Health Centre (PHC)',
        facilityType: 'PHC Maternity Wing',
        department: 'Specialist ANC Clinic',
        date: '10 Sep 2026',
        time: '09:15 AM',
        timestamp: '2026-09-10T09:15:00Z',
        vitals: {
          bp: '142/90 mmHg',
          pulse: '86 bpm',
          spo2: '98%',
          temp: '98.4°F',
          fetalHeartRate: '144 bpm'
        },
        clinicalFindings: 'Fetal movements good. NST reactive. Hemoglobin response sluggish. Ultrasound shows adequate liquor.',
        doctorRemarks: 'Blood pressure slightly improved on Labetalol. Needs tertiary institutional delivery backup in case of early induction.',
        actionTaken: 'Scheduled for Ultrasound Doppler & Specialized Delivery at District Hospital',
        referralSlipId: 'SLIP-KHED-ANC-02'
      }
    ]
  }
];

export const referralTrackingService = {
  /**
   * Returns all referral tracking chains from local storage / backend
   */
  async getTrackingChains() {
    await delay(60);
    const local = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    try {
      const remote = await apiFetch('/referrals', {}, null);
      if (Array.isArray(remote) && remote.length > 0) {
        setStored(TRACKING_STORAGE_KEY, remote);
        return remote;
      }
    } catch (e) {}
    return local;
  },

  /**
   * Get specific referral chain by tracking ID
   */
  async getChainById(id) {
    await delay(80);
    const chains = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    const found = chains.find(c => c.id === id);
    if (!found) {
      // Fallback: return the first chain
      return chains[0] || null;
    }
    return found;
  },

  /**
   * Get chain for a specific patient by Name or ID or ABHA
   */
  async getChainByPatient({ name, patientId, abhaId }) {
    await delay(80);
    const chains = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    
    if (name) {
      const matchByName = chains.find(c => c.patientName.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(c.patientName.toLowerCase()));
      if (matchByName) return matchByName;
    }

    if (patientId) {
      const matchById = chains.find(c => c.patientId === patientId);
      if (matchById) return matchById;
    }

    if (abhaId) {
      const matchByAbha = chains.find(c => c.abhaId === abhaId);
      if (matchByAbha) return matchByAbha;
    }

    return chains[0] || null;
  },

  /**
   * Doctor adds a new referral hop (transfers / refers patient to another doctor or facility)
   */
  async addReferralHop(trackingId, hopData) {
    await delay(150);
    const chains = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    const chainIndex = chains.findIndex(c => c.id === trackingId);

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newHop = {
      hopId: `hop-${Date.now()}`,
      stepNumber: chainIndex >= 0 ? chains[chainIndex].hops.length + 1 : 1,
      status: hopData.status || 'in_progress',
      title: hopData.title || `Specialist Referral to ${hopData.specialty || 'Department'}`,
      titleHindi: hopData.titleHindi || `${hopData.specialty || 'विशेषज्ञ'} रेफरल`,
      doctorName: hopData.doctorName || 'Dr. Specialist',
      doctorDegree: hopData.doctorDegree || 'Specialist Consultant',
      doctorRole: hopData.doctorRole || 'Consultant Specialist',
      facility: hopData.facility || 'District Civil Hospital, Chakan',
      facilityType: hopData.facilityType || 'District Civil Hospital',
      department: hopData.department || hopData.specialty || 'Specialist OPD',
      date: hopData.date || formattedDate,
      time: hopData.time || formattedTime,
      timestamp: now.toISOString(),
      vitals: hopData.vitals || {
        bp: 'Recorded in Clinic',
        pulse: 'Recorded',
        spo2: '98%',
        temp: '98.6°F'
      },
      clinicalFindings: hopData.clinicalFindings || 'Patient referred for advanced diagnosis & clinical care.',
      doctorRemarks: hopData.doctorRemarks || 'Please review clinical notes and initiate appropriate specialist treatment.',
      actionTaken: hopData.actionTaken || `Referred to ${hopData.facility}`,
      referralSlipId: `REF-${Date.now().toString().slice(-6)}`
    };

    if (chainIndex >= 0) {
      // Mark previous hops as completed if not already
      chains[chainIndex].hops = chains[chainIndex].hops.map(h => ({
        ...h,
        status: 'completed'
      }));

      // Append new hop as active / in_progress
      chains[chainIndex].hops.push(newHop);
      chains[chainIndex].lastUpdated = `${formattedDate}, ${formattedTime}`;
      chains[chainIndex].status = hopData.chainStatus || 'In Transit to Specialist';
      if (hopData.priority) chains[chainIndex].priority = hopData.priority;
    } else {
      // Create new chain if doesn't exist
      const newChain = {
        id: trackingId || `REF-TRK-${Date.now().toString().slice(-4)}`,
        patientId: hopData.patientId || 'P-NEW',
        patientName: hopData.patientName || 'Patient',
        patientNameHindi: hopData.patientNameHindi || 'मरीज',
        abhaId: hopData.abhaId || '91-0000-0000-0000',
        age: hopData.age || 30,
        gender: hopData.gender || 'Unknown',
        village: hopData.village || 'Local',
        status: 'In Transit to Specialist',
        priority: hopData.priority || 'High Priority',
        primaryCondition: hopData.primaryCondition || hopData.clinicalFindings || 'Specialist Evaluation',
        createdAt: `${formattedDate}, ${formattedTime}`,
        lastUpdated: `${formattedDate}, ${formattedTime}`,
        hops: [newHop]
      };
      chains.unshift(newChain);
    }

    setStored(TRACKING_STORAGE_KEY, chains);

    // Dispatch global event so both Doctor and Patient portals sync instantly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('referral_chain_updated', {
        detail: { trackingId, newHop }
      }));
    }

    // Also sync to backend API if reachable
    try {
      if (trackingId) {
        apiFetch(`/referrals/${trackingId}/hops`, {
          method: 'POST',
          body: JSON.stringify(hopData)
        });
      }
    } catch (e) {}

    return {
      success: true,
      chain: chainIndex >= 0 ? chains[chainIndex] : chains[0],
      newHop
    };
  },

  /**
   * Updates referral lifecycle status (e.g., Hospital accepts, patient arrives, treatment started/completed, closed, rejected)
   */
  async updateReferralStatus(trackingId, newStatus, details = {}) {
    await delay(120);
    const chains = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    const chainIndex = chains.findIndex(c => c.id === trackingId);
    if (chainIndex === -1) {
      throw new Error(`Referral ${trackingId} not found.`);
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const targetChain = chains[chainIndex];
    targetChain.status = newStatus;
    targetChain.lastUpdated = `${formattedDate}, ${formattedTime}`;

    if (targetChain.hops && targetChain.hops.length > 0) {
      const latestHop = targetChain.hops[targetChain.hops.length - 1];
      if (newStatus === 'Accepted by Facility') {
        latestHop.actionTaken = `Accepted by ${details.facility || latestHop.facility} (Doctor: ${details.doctorName || latestHop.doctorName})`;
        if (details.notes) latestHop.doctorRemarks = details.notes;
      } else if (newStatus === 'Patient Arrived & Registered') {
        latestHop.actionTaken = `Patient Arrived at ${details.facility || latestHop.facility}`;
        latestHop.doctorRemarks = details.notes || 'Patient arrived and registered at hospital reception desk.';
      } else if (newStatus === 'Treatment Started' || newStatus === 'Under Specialist Review') {
        latestHop.status = 'in_progress';
        latestHop.actionTaken = `Treatment Initiated in ${details.department || latestHop.department}`;
        if (details.notes) latestHop.doctorRemarks = details.notes;
      } else if (newStatus === 'Treatment Completed') {
        latestHop.status = 'completed';
        latestHop.actionTaken = `Treatment Completed at ${details.facility || latestHop.facility}`;
        if (details.notes) latestHop.doctorRemarks = details.notes;
      } else if (newStatus === 'Referral Closed') {
        latestHop.status = 'completed';
        latestHop.actionTaken = `Referral Concluded & Discharged`;
        if (details.notes) latestHop.doctorRemarks = details.notes;
      } else if (newStatus === 'Rejected' || newStatus === 'Cancelled') {
        latestHop.status = 'cancelled';
        latestHop.actionTaken = `Referral ${newStatus}`;
        latestHop.doctorRemarks = details.notes || `Referral was marked ${newStatus.toLowerCase()}.`;
      }
    }

    setStored(TRACKING_STORAGE_KEY, chains);

    // Call backend API if online
    try {
      await apiFetch(`/referrals/${trackingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status: newStatus,
          remarks: details.notes,
          facility: details.facility,
          doctorName: details.doctorName,
          department: details.department
        })
      });
    } catch (e) {}

    // Dispatch global event for instant multi-dashboard synchronization
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('referral_chain_updated', {
        detail: { trackingId, chain: targetChain, status: newStatus }
      }));
    }

    return targetChain;
  },

  /**
   * Patient or Doctor initiates a new referral track from scratch
   */
  async createTrackingChain(chainData) {
    await delay(150);
    const chains = getStored(TRACKING_STORAGE_KEY, INITIAL_REFERRAL_CHAINS);
    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newChain = {
      id: `REF-TRK-${Date.now().toString().slice(-4)}`,
      patientId: chainData.patientId || 'P-LIVE',
      patientName: chainData.patientName || 'Rahul Sharma',
      patientNameHindi: chainData.patientNameHindi || 'राहुल शर्मा',
      abhaId: chainData.abhaId || '91-4829-1029-4819',
      age: chainData.age || 34,
      gender: chainData.gender || 'Male',
      village: chainData.village || 'Khed Rural',
      status: 'Consultation Booked',
      priority: chainData.priority || 'High Priority',
      primaryCondition: chainData.primaryCondition || 'Specialist Medical Evaluation',
      createdAt: `${formattedDate}, ${formattedTime}`,
      lastUpdated: `${formattedDate}, ${formattedTime}`,
      hops: chainData.hops || []
    };

    chains.unshift(newChain);
    setStored(TRACKING_STORAGE_KEY, chains);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('referral_chain_updated', {
        detail: { trackingId: newChain.id, chain: newChain }
      }));
    }

    return newChain;
  }
};
