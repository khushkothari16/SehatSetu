import express from 'express';
import { store } from '../db/store.js';

export const createReferralRouter = (io) => {
  const router = express.Router();

  // 1. Get all referral chains
  router.get('/referrals', (req, res) => {
    const chains = store.get('referralChains') || [];
    res.json({ success: true, data: chains });
  });

  // 2. Get referral chain by ID
  router.get('/referrals/:id', (req, res) => {
    const { id } = req.params;
    const chains = store.get('referralChains') || [];
    const chain = chains.find(c => c.id === id);

    if (!chain) {
      return res.status(404).json({ success: false, message: `Referral chain ${id} not found.` });
    }

    res.json({ success: true, data: chain });
  });

  // 3. Create a new referral chain
  router.post('/referrals', (req, res) => {
    const { patientId, patientName, patientNameHindi, abhaId, age, gender, village, primaryCondition, priority, hops } = req.body;

    if (!patientName) {
      return res.status(400).json({ success: false, message: 'Patient name is required to create a referral.' });
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const newChain = {
      id: `REF-TRK-${Date.now().toString().slice(-4)}`,
      patientId: patientId || 'P-NEW',
      patientName,
      patientNameHindi: patientNameHindi || '',
      abhaId: abhaId || '91-4829-1029-4819',
      age: age || 34,
      gender: gender || 'Male',
      village: village || 'Local Village',
      status: 'In Transit to Specialist',
      priority: priority || 'High Priority',
      primaryCondition: primaryCondition || 'Specialist Medical Evaluation',
      createdAt: `${formattedDate}, ${formattedTime}`,
      lastUpdated: `${formattedDate}, ${formattedTime}`,
      hops: hops || []
    };

    store.update((data) => {
      if (!data.referralChains) data.referralChains = [];
      data.referralChains.unshift(newChain);
      return data;
    });

    if (io) {
      io.emit('referral_chain_updated', { trackingId: newChain.id, chain: newChain });
      io.emit('notification_received', {
        title: `New Referral Created: ${newChain.patientName}`,
        message: `${newChain.primaryCondition} - ${newChain.priority}`,
        type: 'referral'
      });
    }

    res.status(201).json({ success: true, data: newChain });
  });

  // 4. Add hop to an existing referral chain (Doctor or ASHA referral transfer)
  router.post('/referrals/:id/hops', (req, res) => {
    const { id } = req.params;
    const hopData = req.body;

    let targetChain = null;
    let newHop = null;

    const updated = store.update((data) => {
      if (!data.referralChains) data.referralChains = [];
      const chainIndex = data.referralChains.findIndex(c => c.id === id);

      if (chainIndex === -1) return null;

      const chain = data.referralChains[chainIndex];
      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      newHop = {
        hopId: `hop-${Date.now()}`,
        stepNumber: (chain.hops || []).length + 1,
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
        vitals: hopData.vitals || { bp: '120/80 mmHg', pulse: '76 bpm', spo2: '98%', temp: '98.6°F' },
        clinicalFindings: hopData.clinicalFindings || 'Patient referred for advanced diagnosis & clinical care.',
        doctorRemarks: hopData.doctorRemarks || 'Please review clinical notes and initiate appropriate specialist treatment.',
        actionTaken: hopData.actionTaken || `Referred to ${hopData.facility}`,
        referralSlipId: `REF-${Date.now().toString().slice(-6)}`
      };

      // Mark previous hops as completed
      chain.hops = (chain.hops || []).map(h => ({ ...h, status: 'completed' }));
      chain.hops.push(newHop);
      chain.lastUpdated = `${formattedDate}, ${formattedTime}`;
      chain.status = hopData.chainStatus || 'In Transit to Specialist';
      if (hopData.priority) chain.priority = hopData.priority;

      targetChain = chain;
      return data;
    });

    if (!updated || !targetChain) {
      return res.status(404).json({ success: false, message: `Referral chain ${id} not found.` });
    }

    if (io) {
      io.emit('referral_chain_updated', { trackingId: id, chain: targetChain, newHop });
    }

    res.json({ success: true, data: targetChain, newHop });
  });

  // 5. Update referral lifecycle status (Hospital Accept -> Patient Arrived -> Treatment Started -> Completed -> Closed -> Rejected)
  router.put('/referrals/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, remarks, facility, doctorName, department } = req.body;

    const validStatuses = [
      'Referral Sent',
      'Accepted by Facility',
      'Patient Arrived & Registered',
      'Under Specialist Review',
      'Treatment Started',
      'Treatment Completed',
      'Referral Closed',
      'Rejected',
      'Cancelled'
    ];

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status field is required.' });
    }

    let targetChain = null;
    const updated = store.update((data) => {
      if (!data.referralChains) data.referralChains = [];
      const chain = data.referralChains.find(c => c.id === id);

      if (!chain) return null;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

      chain.status = status;
      chain.lastUpdated = `${formattedDate}, ${formattedTime}`;

      // Update latest hop status or append status transition note
      if (chain.hops && chain.hops.length > 0) {
        const latestHop = chain.hops[chain.hops.length - 1];
        if (status === 'Accepted by Facility') {
          latestHop.actionTaken = `Accepted by ${facility || latestHop.facility} (Doctor: ${doctorName || latestHop.doctorName})`;
          latestHop.doctorRemarks = remarks || latestHop.doctorRemarks;
        } else if (status === 'Patient Arrived & Registered') {
          latestHop.actionTaken = `Patient Arrived at ${facility || latestHop.facility}`;
          latestHop.doctorRemarks = remarks || 'Patient registered at intake triage desk.';
        } else if (status === 'Treatment Started' || status === 'Under Specialist Review') {
          latestHop.status = 'in_progress';
          latestHop.actionTaken = `Treatment Initiated in ${department || latestHop.department}`;
          latestHop.doctorRemarks = remarks || latestHop.doctorRemarks;
        } else if (status === 'Treatment Completed') {
          latestHop.status = 'completed';
          latestHop.actionTaken = `Treatment Completed at ${facility || latestHop.facility}`;
          latestHop.doctorRemarks = remarks || 'Treatment concluded successfully.';
        } else if (status === 'Referral Closed') {
          latestHop.status = 'completed';
          latestHop.actionTaken = `Referral Concluded & Discharged`;
          latestHop.doctorRemarks = remarks || 'Case resolved. Patient discharged with home care advice.';
        } else if (status === 'Rejected' || status === 'Cancelled') {
          latestHop.status = 'cancelled';
          latestHop.actionTaken = `Referral ${status}`;
          latestHop.doctorRemarks = remarks || `Referral was ${status.toLowerCase()} by hospital.`;
        }
      }

      targetChain = chain;
      return data;
    });

    if (!updated || !targetChain) {
      return res.status(404).json({ success: false, message: `Referral chain ${id} not found.` });
    }

    if (io) {
      io.emit('referral_chain_updated', { trackingId: id, chain: targetChain });
      io.emit('referral_status_changed', { id, status, remarks, facility });
    }

    res.json({ success: true, data: targetChain });
  });

  return router;
};
