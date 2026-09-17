// Automated Verification Test Suite for SehatSetu Backend APIs & Workflows
import http from 'http';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(body); } catch (e) { json = body; }
        resolve({ status: res.statusCode, data: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

const results = [];
function record(testId, name, passed, details, severity = 'MEDIUM') {
  results.push({ testId, name, status: passed ? 'PASS' : 'FAIL', details, severity });
  console.log(`${passed ? '✅' : '❌'} [${testId}] ${name}: ${passed ? 'PASS' : 'FAIL'} - ${details}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING SEHATSETU COMPREHENSIVE TEST SUITE');
  console.log('====================================================\n');

  try {
    // 1. Health check
    const r1 = await request({ hostname: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
    record('TC-API-01', 'Health Check Endpoint', r1.status === 200 && r1.data.status === 'online', `HTTP ${r1.status}`);

    // 2. Patient Profile
    const r2 = await request({ hostname: 'localhost', port: 5000, path: '/api/patient', method: 'GET' });
    record('TC-API-02', 'Patient Profile Retrieval', r2.status === 200 && r2.data.data?.name === 'Rahul Sharma', `Patient: ${r2.data.data?.name}`);

    // 3. Doctors List
    const r3 = await request({ hostname: 'localhost', port: 5000, path: '/api/doctors', method: 'GET' });
    record('TC-API-03', 'Doctors List Retrieval', r3.status === 200 && Array.isArray(r3.data.data) && r3.data.data.length >= 2, `Count: ${r3.data.data?.length}`);

    // 4. Book Offline Appointment
    const r4 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/appointments/book',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      doctor: { id: 'DOC-01', name: 'Dr. Anjali Mehta', hospital: 'Khed PHC', room: 'Room 4' },
      mode: 'offline',
      date: '2026-09-18',
      time: '10:00 AM',
      reason: 'Persistent fever and cough',
      patient: { name: 'Rahul Sharma', phone: '+91 98765 43210', village: 'Khed' }
    });
    const bookedApt = r4.data.data;
    record('TC-API-04', 'Book Offline OPD Appointment', r4.status === 201 && bookedApt?.tokenNumber !== undefined, `Token: #${bookedApt?.tokenNumber}`);

    // 5. Book Teleconsultation (Mode Isolation Verification)
    const r5 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/appointments/book',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      doctor: { id: 'DOC-01', name: 'Dr. Anjali Mehta' },
      mode: 'online',
      date: '2026-09-18',
      time: '02:00 PM',
      reason: 'Teleconsultation follow-up',
      patient: { name: 'Savita Kamble', phone: '+91 98230 45678' }
    });
    record('TC-API-05', 'Book Teleconsultation (Online Mode)', r5.status === 201 && r5.data.queue === null, 'Verified: Online mode does not block offline OPD queue');

    // 6. Doctor Queue Retrieval & Ascending Order Check
    const r6 = await request({ hostname: 'localhost', port: 5000, path: '/api/queue/doctor/DOC-01', method: 'GET' });
    const patients = r6.data.data || [];
    let isSorted = true;
    for (let i = 1; i < patients.length; i++) {
      if ((patients[i].tokenNumber || 0) < (patients[i-1].tokenNumber || 0)) isSorted = false;
    }
    record('TC-API-06', 'Doctor Queue Retrieval & Token Ordering', r6.status === 200 && isSorted && patients.length > 0, `Total: ${patients.length} patients, Sorted: ${isSorted}`);

    // 7. Doctor Call-Next Patient Buzzer
    const r7 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/queue/call-next',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      tokenNumber: 35,
      patientName: 'Rahul Sharma',
      doctorName: 'Dr. Anjali Mehta',
      room: 'OPD Room 4'
    });
    record('TC-API-07', 'Doctor Desk Call-Next Patient Buzzer', r7.status === 200 && r7.data.data.currentToken === 35, `Queue status: ${r7.data.data?.status}`);

    // 8. Negative Test: Complete Checkup with missing patient payload
    const r8neg = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/queue/complete-checkup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { diagnosis: 'Incomplete payload test' });
    record('TC-API-08', 'Negative Test: Complete Checkup Without Patient Payload', r8neg.status === 400, `Returned HTTP ${r8neg.status} (Properly guarded against crash)`);

    // 9. Positive Test: Complete Checkup
    const r8pos = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/queue/complete-checkup',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      patient: { id: 'PAT-35', tokenNumber: 35, token: '#35', name: 'Rahul Sharma', age: 34, gender: 'Male', village: 'Khed' },
      diagnosis: 'Acute Bronchitis & Rhinitis',
      notes: 'Advised rest and warm hydration',
      followUpRequired: true,
      followUpDate: '2026-09-22',
      medicines: [{ name: 'Amoxicillin 500mg', frequency: '1-0-1' }]
    });
    record('TC-API-09', 'Complete Patient Checkup & Advance Queue', r8pos.status === 200 && r8pos.data.data?.tokenNumber === 35, `Advancement confirmed for Token #35`);

    // 10. Prescriptions List & Create
    const r9 = await request({ hostname: 'localhost', port: 5000, path: '/api/prescriptions', method: 'GET' });
    record('TC-API-10', 'Prescriptions List Retrieval', r9.status === 200 && Array.isArray(r9.data.data), `Count: ${r9.data.data?.length}`);

    const r10 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/prescriptions',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      doctorName: 'Dr. Anjali Mehta',
      facility: 'Khed PHC',
      diagnosis: 'Seasonal Viral Pyrexia',
      patientName: 'Rahul Sharma',
      medicines: [
        { name: 'Paracetamol 650mg', dosage: '1 Tablet', frequency: '1-0-1', duration: '3 Days' },
        { name: 'Cetirizine 10mg', dosage: '1 Tablet', frequency: '0-0-1', duration: '5 Days' }
      ]
    });
    record('TC-API-11', 'Create Prescription with QR Code', r10.status === 201 && r10.data.data.qrData?.includes('ABHA:'), `Prescription ID: ${r10.data.data?.id}`);

    // 11. Medicine Reminders
    const r11 = await request({ hostname: 'localhost', port: 5000, path: '/api/reminders', method: 'GET' });
    const remList = r11.data.data || [];
    record('TC-API-12', 'Medicine Reminders Retrieval', r11.status === 200 && remList.length > 0, `Active Reminders: ${remList.length}`);

    if (remList.length > 0) {
      const r12 = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/reminders/${remList[0].id}/take`,
        method: 'POST'
      });
      record('TC-API-13', 'Mark Medicine Dose as Taken', r12.status === 200 && r12.data.data.status === 'taken', `Dose marked taken for: ${r12.data.data?.medicineName}`);
    }

    // 12. 108 Emergency SOS Dispatch & Cancellation
    const r13 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/emergency/dispatch',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      lat: 18.8472,
      lng: 73.9142,
      reason: 'Acute Chest Discomfort and Respiratory Distress',
      patientName: 'Rahul Sharma',
      patientPhone: '+91 98765 43210'
    });
    record('TC-API-14', 'Trigger 108 SOS Ambulance Dispatch', r13.status === 201 && r13.data.data.status === 'En Route', `Vehicle: ${r13.data.data?.ambulanceNumber}, ETA: ${r13.data.data?.estimatedArrivalMinutes} min`);

    const r14 = await request({ hostname: 'localhost', port: 5000, path: '/api/emergency/cancel', method: 'POST' });
    record('TC-API-15', 'Cancel Active Emergency Dispatch', r14.status === 200 && r14.data.success === true, 'Emergency cleared safely');

    // 13. Teleconsultation Waiting Pool
    const r15 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/teleconsult/broadcast',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      callId: `CALL-${Date.now()}`,
      patientName: 'Rahul Sharma',
      callerPeerId: 'peer_patient_test',
      symptoms: 'Follow-up teleconsultation review'
    });
    record('TC-API-16', 'Teleconsultation Call Broadcasting', r15.status === 200 && r15.data.data.callId !== undefined, `Call ID: ${r15.data.data?.callId}`);

    // 14. ASHA Consultation Request
    const r16 = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/asha/requests',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      patientName: 'Sunita Devi',
      patientPhone: '+91 98230 45678',
      triageCategory: 'Urgent',
      reason: 'High blood pressure 160/100 detected in village screening'
    });
    const createdAshaReq = r16.data.data;
    record('TC-API-17', 'ASHA Consultation Request Creation', r16.status === 200 && createdAshaReq?.id !== undefined, `Request ID: ${createdAshaReq?.id}`);

    // 15. Negative Test: ASHA Request Update with Non-existent ID
    const r17neg = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/asha/requests/NON_EXISTENT_ID',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'Approved' });
    record('TC-API-18', 'Negative Test: Update Non-existent ASHA Request', r17neg.status === 404, `Returned HTTP ${r17neg.status} (Expected 404 Not Found)`);

    // 16. REFERRAL WORKFLOW (Phases 7, 9, 20): Get All Referrals
    const r18 = await request({ hostname: 'localhost', port: 5000, path: '/api/referrals', method: 'GET' });
    record('TC-API-19', 'Referral Chains Retrieval (GET /api/referrals)', r18.status === 200 && Array.isArray(r18.data.data) && r18.data.data.length >= 1, `Count: ${r18.data.data?.length}`);

    // 17. REFERRAL WORKFLOW: Doctor Adds Hop to Chain
    const targetRefId = 'REF-TRK-2026-8941';
    const r19 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/hops`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      facility: 'District Civil Hospital, Chakan',
      department: 'Cardiology Department',
      specialty: 'Interventional Cardiology',
      doctorName: 'Dr. Rajesh Deshmukh',
      doctorRemarks: 'Patient referred for 2D-Echocardiography and troponin review.',
      priority: 'High Priority'
    });
    record('TC-API-20', 'Doctor Adds Referral Hop (Transfer to Specialist)', r19.status === 200 && r19.data.newHop !== undefined, `New hop added: #${r19.data.newHop?.stepNumber}`);

    // 18. REFERRAL WORKFLOW: Hospital Accepts Referral
    const r20 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'Accepted by Facility',
      facility: 'District Civil Hospital, Chakan',
      doctorName: 'Dr. Suresh Deshpande (Admin)',
      remarks: 'Referral accepted. Admitted to cardiac triage holding area.'
    });
    record('TC-API-21', 'Hospital Workflow: Accept Referral', r20.status === 200 && r20.data.data.status === 'Accepted by Facility', `Status: ${r20.data.data?.status}`);

    // 19. REFERRAL WORKFLOW: Patient Arrived at Hospital
    const r21 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'Patient Arrived & Registered',
      facility: 'District Civil Hospital, Chakan',
      remarks: 'Patient presented at emergency admissions counter. Vitals verified.'
    });
    record('TC-API-22', 'Hospital Workflow: Mark Patient Arrived', r21.status === 200 && r21.data.data.status === 'Patient Arrived & Registered', `Status: ${r21.data.data?.status}`);

    // 20. REFERRAL WORKFLOW: Treatment Started
    const r22 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'Treatment Started',
      facility: 'District Civil Hospital, Chakan',
      department: 'Cath Lab',
      remarks: 'Angiography evaluation initiated.'
    });
    record('TC-API-23', 'Hospital Workflow: Treatment Started', r22.status === 200 && r22.data.data.status === 'Treatment Started', `Status: ${r22.data.data?.status}`);

    // 21. REFERRAL WORKFLOW: Treatment Completed
    const r23 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'Treatment Completed',
      facility: 'District Civil Hospital, Chakan',
      remarks: 'Echo completed, mild ischemia managed medically. Patient stabilized.'
    });
    record('TC-API-24', 'Hospital Workflow: Treatment Completed', r23.status === 200 && r23.data.data.status === 'Treatment Completed', `Status: ${r23.data.data?.status}`);

    // 22. REFERRAL WORKFLOW: Referral Closed & Discharged
    const r24 = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      status: 'Referral Closed',
      facility: 'District Civil Hospital, Chakan',
      remarks: 'Discharged in stable condition. Counter-referral back to Khed PHC for weekly review.'
    });
    record('TC-API-25', 'Hospital Workflow: Referral Closed & Discharged', r24.status === 200 && r24.data.data.status === 'Referral Closed', `Status: ${r24.data.data?.status}`);

    // 23. Negative Test: Referral with invalid status
    const r25neg = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/referrals/${targetRefId}/status`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {});
    record('TC-API-26', 'Negative Test: Referral Status Missing Status Field', r25neg.status === 400, `Returned HTTP ${r25neg.status} (Expected 400 Bad Request)`);

    // 24. Negative Test: Referral for non-existent ID
    const r26neg = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/referrals/NON_EXISTENT_ID/status',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { status: 'Accepted by Facility' });
    record('TC-API-27', 'Negative Test: Status Update on Non-Existent Referral', r26neg.status === 404, `Returned HTTP ${r26neg.status} (Expected 404 Not Found)`);

  } catch (err) {
    console.error('Fatal test error:', err);
  }

  console.log('\n====================================================');
  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  console.log(`📊 TEST SUITE SUMMARY: ${passCount} PASSED, ${failCount} FAILED out of ${results.length} total tests`);
  console.log('====================================================\n');
}

runTests();
