// SehatSetu Realistic Healthcare Mock Data & Initial State

export const INITIAL_PATIENT = {
  id: 'PAT-MH-2026-8491',
  name: 'Rahul Sharma',
  nameHindi: 'राहुल शर्मा',
  nameMarathi: 'राहुल शर्मा',
  age: 34,
  gender: 'Male',
  dob: '1992-04-14',
  phone: '+91 98765 43210',
  email: 'rahul.sharma.rural@gmail.com',
  village: 'Khed (Rajgurunagar)',
  district: 'Pune',
  state: 'Maharashtra',
  pincode: '410505',
  bloodGroup: 'B+',
  abhaId: '91-4829-1029-4819',
  emergencyContacts: [
    { name: 'Sunita Sharma', relation: 'Spouse', phone: '+91 98220 12345' },
    { name: 'Ramesh Sharma', relation: 'Brother', phone: '+91 94230 67890' }
  ],
  healthProfile: {
    height: '172 cm',
    weight: '68 kg',
    allergies: ['Penicillin (mild rash)'],
    chronicConditions: ['None diagnosed'],
    currentMedications: ['Paracetamol 650mg (SOS)']
  }
};

export const INITIAL_DOCTORS = [
  {
    id: 'DOC-01',
    name: 'Dr. Anjali Mehta',
    specialty: 'General Physician',
    specialtyHindi: 'सामान्य चिकित्सक',
    specialtyMarathi: 'सामान्य फिजिशियन',
    degrees: 'MBBS, MD (Medicine)',
    experience: '11 years',
    hospital: 'Khed Primary Health Centre (PHC)',
    distance: '1.8 km',
    lat: 18.8472,
    lng: 73.9142,
    rating: 4.8,
    reviewsCount: 142,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline', 'online'],
    nextSlot: 'Today, 11:30 AM',
    availableDays: 'Mon - Sat',
    opdTimings: '9:00 AM - 2:00 PM',
    bio: 'Dedicated medical officer experienced in rural primary care, seasonal fever management, and chronic disease screening.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-02',
    name: 'Dr. Rajesh Deshmukh',
    specialty: 'Cardiologist',
    specialtyHindi: 'हृदय रोग विशेषज्ञ',
    specialtyMarathi: 'हृदयरोग तज्ज्ञ',
    degrees: 'MBBS, MD, DM (Cardiology)',
    experience: '16 years',
    hospital: 'District Civil Hospital, Chakan',
    distance: '12.4 km',
    lat: 18.7606,
    lng: 73.8636,
    rating: 4.9,
    reviewsCount: 310,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline', 'online'],
    nextSlot: 'Tomorrow, 10:00 AM',
    availableDays: 'Mon, Wed, Fri',
    opdTimings: '10:00 AM - 4:00 PM',
    bio: 'Senior consultant cardiologist handling rural cardiac triage, hypertensive heart disease, and tele-echocardiography reviews.',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-03',
    name: 'Dr. Priya Patil',
    specialty: 'Pediatrician',
    specialtyHindi: 'बाल रोग विशेषज्ञ',
    specialtyMarathi: 'बालरोग तज्ज्ञ',
    degrees: 'MBBS, DCH (Pediatrics)',
    experience: '9 years',
    hospital: 'Rural Community Health Centre, Alandi',
    distance: '3.2 km',
    lat: 18.8510,
    lng: 73.9210,
    rating: 4.7,
    reviewsCount: 98,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline', 'online'],
    nextSlot: 'Today, 02:00 PM',
    availableDays: 'Mon - Sat',
    opdTimings: '1:00 PM - 6:00 PM',
    bio: 'Child health specialist focused on child immunization, malnutrition intervention, and neonatal safety.',
    avatar: 'https://images.unsplash.com/photo-1594824813576-651268612185?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-04',
    name: 'Dr. Suresh Shinde',
    specialty: 'Orthopedic',
    specialtyHindi: 'हड्डी रोग विशेषज्ञ',
    specialtyMarathi: 'अस्थिरोग तज्ज्ञ',
    degrees: 'MBBS, MS (Orthopedics)',
    experience: '14 years',
    hospital: 'Sub-District Hospital, Manchar',
    distance: '18.5 km',
    lat: 18.9950,
    lng: 73.9400,
    rating: 4.8,
    reviewsCount: 220,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline'],
    nextSlot: 'Friday, 11:00 AM',
    availableDays: 'Tue, Thu, Sat',
    opdTimings: '9:30 AM - 1:30 PM',
    bio: 'Experienced in joint trauma, agricultural injuries, rural osteoarthritis, and post-fracture rehabilitation.',
    avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-05',
    name: 'Dr. Kavita Jadhav',
    specialty: 'Gynecologist',
    specialtyHindi: 'महिला रोग विशेषज्ञ',
    specialtyMarathi: 'स्त्रीरोग तज्ज्ञ',
    degrees: 'MBBS, DGO, FICOG',
    experience: '12 years',
    hospital: 'Matru Seva Rural Clinic',
    distance: '2.1 km',
    lat: 18.8430,
    lng: 73.9090,
    rating: 4.9,
    reviewsCount: 185,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline', 'online'],
    nextSlot: 'Today, 04:30 PM',
    availableDays: 'Mon - Fri',
    opdTimings: '10:00 AM - 5:00 PM',
    bio: 'Dedicated maternal-fetal care specialist supporting prenatal checkups, high-risk pregnancy screening and anemia eradication.',
    avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'DOC-06',
    name: 'Dr. Manoj Verma',
    specialty: 'ENT Specialist',
    specialtyHindi: 'कान, नाक और गला विशेषज्ञ',
    specialtyMarathi: 'कान, नाक आणि घसा तज्ज्ञ',
    degrees: 'MBBS, MS (ENT)',
    experience: '8 years',
    hospital: 'Khed Community Clinic',
    distance: '2.7 km',
    lat: 18.8490,
    lng: 73.9180,
    rating: 4.6,
    reviewsCount: 89,
    fee: 0,
    feeDisplay: 'Free',
    consultationModes: ['offline', 'online'],
    nextSlot: 'Thursday, 09:30 AM',
    availableDays: 'Mon, Thu, Sat',
    opdTimings: '9:00 AM - 1:00 PM',
    bio: 'Treats ear infections, sinusitis, throat allergies, and occupational hearing loss in farming communities.',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_APPOINTMENTS = [
  {
    id: 'APT-2026-9821',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Anjali Mehta',
    doctorSpecialty: 'General Physician',
    doctorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80',
    facility: 'Khed Primary Health Centre (PHC)',
    room: 'OPD Room 4',
    date: '2026-09-10',
    time: '11:30 AM',
    type: 'In-Person OPD',
    mode: 'offline',
    status: 'Confirmed',
    tokenNumber: 35,
    reason: 'Fever with dry cough for 3 days and throat irritation',
    fee: 0
  },
  {
    id: 'APT-2026-8402',
    doctorId: 'DOC-02',
    doctorName: 'Dr. Rajesh Deshmukh',
    doctorSpecialty: 'Cardiologist',
    doctorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    facility: 'District Civil Hospital, Chakan',
    room: 'Cardiac OPD Room 12',
    date: '2026-09-15',
    time: '10:30 AM',
    type: 'Teleconsultation / Video',
    mode: 'online',
    status: 'Scheduled',
    tokenNumber: 12,
    reason: 'Digital Referral review for chest discomfort',
    fee: 250
  }
];

export const INITIAL_QUEUE_STATE = {
  appointmentId: 'APT-2026-9821',
  doctorName: 'Dr. Anjali Mehta',
  facility: 'Khed Primary Health Centre',
  room: 'Room 4 (General OPD)',
  userToken: 35,
  currentToken: 35,
  patientsAhead: 0,
  estimatedWaitMinutes: 0,
  status: 'Your Turn', // Booked, Waiting, Almost Your Turn, Your Turn, Completed
  updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
};

export const INITIAL_PRESCRIPTIONS = [
  {
    id: 'RX-2026-0042',
    appointmentId: 'APT-2026-9821',
    doctorName: 'Dr. Anjali Mehta',
    doctorSpecialty: 'General Physician',
    doctorRegNo: 'MMC-2012-08-3921',
    facility: 'Khed Primary Health Centre',
    date: '08 Sep 2026',
    patientName: 'Rahul Sharma',
    patientAge: 34,
    diagnosis: 'Acute Upper Respiratory Tract Infection (Mild Viral Bronchitis)',
    medicines: [
      {
        name: 'Amoxicillin 500mg',
        type: 'Capsule',
        dosage: '1 capsule',
        frequency: '1-0-1 (Twice daily)',
        duration: '5 days',
        instructions: 'Take strictly after food with water',
        inStockNearby: true
      },
      {
        name: 'Paracetamol 650mg',
        type: 'Tablet',
        dosage: '1 tablet',
        frequency: 'SOS / 1-0-1 (As needed)',
        duration: '3 days',
        instructions: 'Take only when fever exceeds 99.5°F or severe body ache',
        inStockNearby: true
      },
      {
        name: 'Cetirizine 10mg',
        type: 'Tablet',
        dosage: '1 tablet',
        frequency: '0-0-1 (Night time)',
        duration: '5 days',
        instructions: 'Take at bedtime; may cause mild drowsiness',
        inStockNearby: true
      }
    ],
    generalAdvice: 'Steam inhalation twice daily. Drink warm fluids. Strict rest for 48 hours. Report immediately if fever exceeds 102°F or breathlessness develops.',
    followUpDate: '18 September 2026',
    isDigital: true
  }
];

export const INITIAL_PHYSICAL_UPLOADS = [
  {
    id: 'UP-2026-01',
    fileName: 'Local_Dispensary_Rx_Aug2026.jpg',
    uploadDate: '20 Aug 2026',
    doctorName: 'Dr. V. K. Kulkarni (Private Clinic)',
    notes: 'Prescription for seasonal allergic rhinitis',
    status: 'Verified',
    fileSize: '1.8 MB'
  }
];

export const INITIAL_PHARMACIES = [
  {
    id: 'PHARM-01',
    name: 'Pradhan Mantri Jan Aushadhi Kendra',
    address: 'Shop 4, Khed Bazaar Road, Near Bus Stand',
    distance: '0.9 km',
    phone: '+91 94231 11223',
    lat: 18.8450,
    lng: 73.9110,
    isOpen: true,
    timing: '8:00 AM - 9:00 PM',
    isGovtDiscount: true,
    medicinesStock: {
      'Amoxicillin 500mg': { status: 'Available' },
      'Paracetamol 650mg': { status: 'Available' },
      'Cetirizine 10mg': { status: 'Available' },
      'Azithromycin 500mg': { status: 'Available' },
      'Oral Rehydration Salts (ORS)': { status: 'Available' }
    }
  },
  {
    id: 'PHARM-02',
    name: 'Khed Gramin 24x7 Medical Store',
    address: 'Opp. Taluka Hospital Gate, Station Road',
    distance: '1.4 km',
    phone: '+91 98223 99881',
    lat: 18.8480,
    lng: 73.9160,
    isOpen: true,
    timing: '24 Hours Open',
    isGovtDiscount: false,
    medicinesStock: {
      'Amoxicillin 500mg': { status: 'Available' },
      'Paracetamol 650mg': { status: 'Available' },
      'Cetirizine 10mg': { status: 'Available' },
      'Azithromycin 500mg': { status: 'Available' },
      'Oral Rehydration Salts (ORS)': { status: 'Available' }
    }
  },
  {
    id: 'PHARM-03',
    name: 'Sanjeevani Wellness Chemist',
    address: 'Near Khed PHC, Alandi Road',
    distance: '1.9 km',
    phone: '+91 91580 44332',
    lat: 18.8465,
    lng: 73.9135,
    isOpen: true,
    timing: '9:00 AM - 10:00 PM',
    isGovtDiscount: false,
    medicinesStock: {
      'Amoxicillin 500mg': { status: 'Limited Stock' },
      'Paracetamol 650mg': { status: 'Available' },
      'Cetirizine 10mg': { status: 'Out of Stock' },
      'Oral Rehydration Salts (ORS)': { status: 'Available' }
    }
  }
];

export const INITIAL_TESTS = [
  {
    id: 'TEST-01',
    name: 'Complete Blood Count (CBC)',
    category: 'Pathology / Blood',
    description: 'Measures Hemoglobin, White Blood Cells, Platelets, RBC count to check for infection, anemia or inflammation.',
    fastingRequired: false,
    turnaroundTime: '4 Hours',
    sampleType: 'Blood Sample (Venous)',
    centersCount: 3
  },
  {
    id: 'TEST-02',
    name: 'Fasting Blood Sugar (FBS)',
    category: 'Biochemistry',
    description: 'Measures blood glucose levels after 8-10 hours overnight fasting to screen for diabetes mellitus.',
    fastingRequired: true,
    turnaroundTime: '2 Hours',
    sampleType: 'Blood Sample (Fluoride)',
    centersCount: 4
  },
  {
    id: 'TEST-03',
    name: 'Chest X-Ray (PA View)',
    category: 'Radiology',
    description: 'High-resolution digital X-ray of lungs and heart to assess bronchitis, pneumonia or cardiomegaly.',
    fastingRequired: false,
    turnaroundTime: '1 Hour',
    sampleType: 'Digital Imaging',
    centersCount: 2
  },
  {
    id: 'TEST-04',
    name: 'Lipid Profile (Cholesterol Panel)',
    category: 'Biochemistry',
    description: 'Total Cholesterol, HDL (good), LDL (bad), Triglycerides to assess cardiovascular risk.',
    fastingRequired: true,
    turnaroundTime: '6 Hours',
    sampleType: 'Blood Sample (Serum)',
    centersCount: 3
  },
  {
    id: 'TEST-05',
    name: 'Dengue NS1 Antigen & IgM/IgG',
    category: 'Serology / Rapid',
    description: 'Rapid diagnostic test for early dengue fever antigen and antibody response.',
    fastingRequired: false,
    turnaroundTime: '3 Hours',
    sampleType: 'Blood Sample',
    centersCount: 3
  },
  {
    id: 'TEST-06',
    name: 'Urine Routine & Microscopy',
    category: 'Clinical Pathology',
    description: 'Screening for urinary tract infections, kidney stone crystals, and protein loss.',
    fastingRequired: false,
    turnaroundTime: '2 Hours',
    sampleType: 'Midstream Urine',
    centersCount: 4
  }
];

export const INITIAL_REPORTS = [
  {
    id: 'REP-2026-881',
    testName: 'Complete Blood Count (CBC)',
    category: 'Pathology',
    date: '12 Aug 2026',
    diagnosticCenter: 'Khed PHC Pathology Laboratory',
    status: 'Ready',
    doctorReferred: 'Dr. Anjali Mehta',
    fileUrl: '#',
    summary: 'Normal counts. No severe infection or acute anemia detected.',
    parameters: [
      { name: 'Hemoglobin', value: '13.8', unit: 'g/dL', normalRange: '13.0 - 17.0', status: 'Normal' },
      { name: 'Total Leukocyte (WBC) Count', value: '7,200', unit: '/cu mm', normalRange: '4,000 - 11,000', status: 'Normal' },
      { name: 'Platelet Count', value: '2.4', unit: 'Lakhs/cu mm', normalRange: '1.5 - 4.5', status: 'Normal' },
      { name: 'Neutrophils', value: '62', unit: '%', normalRange: '40 - 70', status: 'Normal' },
      { name: 'Lymphocytes', value: '30', unit: '%', normalRange: '20 - 40', status: 'Normal' }
    ]
  },
  {
    id: 'REP-2026-724',
    testName: 'Fasting Blood Sugar (FBS)',
    category: 'Biochemistry',
    date: '15 Jul 2026',
    diagnosticCenter: 'Apex Rural Diagnostic Centre',
    status: 'Ready',
    doctorReferred: 'Dr. Anjali Mehta',
    fileUrl: '#',
    summary: 'Fasting glucose is within the healthy non-diabetic range.',
    parameters: [
      { name: 'Glucose (Fasting)', value: '94', unit: 'mg/dL', normalRange: '70 - 99', status: 'Normal' }
    ]
  }
];

export const INITIAL_FOLLOW_UPS = [
  {
    id: 'FUP-2026-01',
    doctorName: 'Dr. Anjali Mehta',
    specialty: 'General Physician',
    facility: 'Khed Primary Health Centre',
    dueDate: '2026-09-18',
    status: 'Upcoming', // Upcoming, Due Today, Overdue, Completed
    instructions: 'Follow up after 10 days to review cough resolution and repeat chest auscultation if symptoms persist.',
    previousAppointmentDate: '08 Sep 2026',
    prescriptionRef: 'RX-2026-0042'
  }
];

export const INITIAL_REFERRALS = [
  {
    id: 'REF-2026-018',
    referringDoctor: 'Dr. Anjali Mehta',
    referringFacility: 'Khed Primary Health Centre (PHC)',
    referredFacility: 'District Civil Hospital, Chakan (Cardiology Dept)',
    specialty: 'Cardiology',
    patientName: 'Rahul Sharma',
    patientAge: 34,
    date: '05 Sep 2026',
    priority: 'High Priority',
    status: 'Appointment Scheduled', // Created, Accepted, Appointment Scheduled, In Progress, Completed
    reason: 'Patient presented with intermittent exertional chest tightness and baseline resting ECG showing non-specific ST-T wave changes. Recommend formal 2D Echocardiography and TMT evaluation under specialist supervision.',
    appointmentDate: '15 Sep 2026, 10:30 AM',
    instructions: 'Carry previous ECG strips and CBC reports. Keep 4 hours fasting before echo if advised.',
    isClinicalLocked: true
  }
];

export const INITIAL_FACILITIES = [
  {
    id: 'FAC-01',
    name: 'Khed Primary Health Centre (PHC)',
    type: 'PHC',
    typeHindi: 'प्राथमिक स्वास्थ्य केंद्र',
    typeMarathi: 'प्राथमिक आरोग्य केंद्र',
    distance: '1.8 km',
    address: 'Near Old Tehsil Office, Khed (Rajgurunagar)',
    phone: '+91 2135 222108',
    lat: 18.8472,
    lng: 73.9142,
    isOpen: true,
    hours: '24x7 Emergency • OPD: 9 AM - 2 PM',
    hasEmergency: true,
    availableServices: ['General OPD', 'Maternal & Child Health', 'Free Pharmacy', 'Diagnostic Lab', 'Immunization', '108 Ambulance Bay'],
    doctorsCount: 4,
    availableBeds: 12
  },
  {
    id: 'FAC-02',
    name: 'District Civil Hospital, Chakan',
    type: 'Hospital',
    typeHindi: 'जिला नागरिक अस्पताल',
    typeMarathi: 'जिल्हा सामान्य रुग्णालय',
    distance: '12.4 km',
    address: 'Sector 4, Chakan-Talegaon Road, Chakan',
    phone: '+91 2135 249000',
    lat: 18.7606,
    lng: 73.8636,
    isOpen: true,
    hours: '24x7 Full Emergency & Trauma Care',
    hasEmergency: true,
    availableServices: ['ICU & Critical Care', 'Cardiology Dept', 'Trauma Surgery', 'Pediatric Care', '24x7 Blood Bank', 'CT Scan & X-Ray'],
    doctorsCount: 28,
    availableBeds: 150
  },
  {
    id: 'FAC-03',
    name: 'Apex Rural Diagnostic & Imaging Centre',
    type: 'Diagnostic Centre',
    typeHindi: 'डायग्नोस्टिक सेंटर',
    typeMarathi: 'तपासणी केंद्र',
    distance: '2.4 km',
    address: 'Near Shivaji Chowk, Khed',
    phone: '+91 98224 88112',
    lat: 18.8495,
    lng: 73.9175,
    isOpen: true,
    hours: '7:00 AM - 9:00 PM',
    hasEmergency: false,
    availableServices: ['Digital X-Ray', 'Complete Blood Tests', 'Ultrasound Sonography', 'ECG', 'Home Sample Collection'],
    doctorsCount: 2,
    availableBeds: 0
  },
  {
    id: 'FAC-04',
    name: 'Pradhan Mantri Jan Aushadhi Kendra',
    type: 'Pharmacy',
    typeHindi: 'जन औषधि केंद्र',
    typeMarathi: 'जन औषध केंद्र',
    distance: '0.9 km',
    address: 'Shop 4, Khed Bazaar Road, Near Bus Stand',
    phone: '+91 94231 11223',
    lat: 18.8450,
    lng: 73.9110,
    isOpen: true,
    hours: '8:00 AM - 9:00 PM',
    hasEmergency: false,
    availableServices: ['Affordable Generic Medicines', 'Surgical Items', 'Glucose Monitors', 'Nutritional Supplements'],
    doctorsCount: 0,
    availableBeds: 0
  },
  {
    id: 'FAC-05',
    name: 'Matru Seva Rural Women Clinic',
    type: 'Clinic',
    typeHindi: 'मातृ सेवा क्लिनिक',
    typeMarathi: 'मातृ सेवा दवाखाना',
    distance: '2.1 km',
    address: 'Alandi Phata, Khed',
    phone: '+91 2135 224411',
    lat: 18.8430,
    lng: 73.9090,
    isOpen: true,
    hours: '9:00 AM - 6:00 PM',
    hasEmergency: false,
    availableServices: ['Antenatal Care', 'Ultrasound Screening', 'Nutrition Counseling', 'Vaccination'],
    doctorsCount: 2,
    availableBeds: 4
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'NOTIF-01',
    title: 'Appointment Approaching',
    message: 'Your token #27 is near. Dr. Anjali Mehta is currently examining token #19.',
    time: '15 mins ago',
    type: 'queue',
    read: false,
    link: '/queue'
  },
  {
    id: 'NOTIF-02',
    title: 'Prescription Issued',
    message: 'Dr. Anjali Mehta has issued digital prescription #RX-2026-0042.',
    time: '2 hours ago',
    type: 'prescription',
    read: false,
    link: '/prescriptions'
  },
  {
    id: 'NOTIF-03',
    title: 'Lab Report Ready',
    message: 'Your CBC Blood Test report from Khed PHC is now available to download.',
    time: 'Yesterday',
    type: 'report',
    read: true,
    link: '/reports'
  },
  {
    id: 'NOTIF-04',
    title: 'Specialist Referral Confirmed',
    message: 'Referral #REF-2026-018 to District Civil Hospital Cardiology has been accepted for 15 Sep.',
    time: '2 days ago',
    type: 'referral',
    read: true,
    link: '/referrals'
  }
];

export const FIRST_AID_GUIDES = [
  {
    id: 'fa-bleeding',
    title: 'Severe Bleeding & Cuts',
    titleHindi: 'गंभीर रक्तस्राव और घाव',
    titleMarathi: 'गंभीर रक्तस्त्राव आणि जखमा',
    icon: 'Droplets',
    steps: [
      'Apply direct and firm pressure to the wound with a clean cloth or sterile bandage.',
      'Keep the injured limb elevated above heart level if no bone fracture is suspected.',
      'Do NOT remove foreign objects deeply embedded in the wound; apply pressure around them.',
      'Keep the patient calm and warm until the emergency ambulance arrives.'
    ],
    warning: 'Do not use dirty cloth or tie a tourniquet unless specifically instructed by 108 emergency staff.'
  },
  {
    id: 'fa-unconscious',
    title: 'Unconsciousness / Fainting',
    titleHindi: 'बेहोशी / मूर्छा',
    titleMarathi: 'बेशुद्धी / भोवळ येणे',
    icon: 'UserX',
    steps: [
      'Check breathing by listening near mouth and watching chest rise.',
      'If breathing normally, gently turn the person onto their side (recovery position) to keep airway open.',
      'Loosen tight collars, belts, or restrictive clothing around the neck.',
      'Do NOT force-feed water or food to an unconscious or drowsy person.'
    ],
    warning: 'Seek immediate emergency dispatch if patient does not regain consciousness within 60 seconds.'
  },
  {
    id: 'fa-chestpain',
    title: 'Suspected Heart Attack / Chest Pain',
    titleHindi: 'सीने में तेज दर्द / दिल का दौरा',
    titleMarathi: 'छातीत तीव्र वेदना / हृदयविकाराचा झटका',
    icon: 'HeartPulse',
    steps: [
      'Have the person sit down immediately in a comfortable semi-reclined position.',
      'Keep the surroundings ventilated, calm, and loose tight garments.',
      'If the patient has prescribed emergency Sorbitrate or Aspirin and doctor previously advised, assist them.',
      'Do NOT allow the patient to walk or exert themselves under any circumstances.'
    ],
    warning: 'Every second counts. Dispatch ambulance immediately without delay.'
  },
  {
    id: 'fa-snakebite',
    title: 'Snakebite Emergency (Rural Protocol)',
    titleHindi: 'सांप काटने पर प्राथमिक उपचार',
    titleMarathi: 'सर्पदंश प्राथमिक उपचार',
    icon: 'ShieldAlert',
    steps: [
      'Keep the patient completely calm and immobilized. Panic accelerates venom circulation.',
      'Immobilize the bitten limb with a splint or sling at heart level.',
      'Remove tight rings, anklets, or watches before swelling starts.',
      'Do NOT cut the wound, do NOT try to suck venom, and do NOT apply ice or electric shock.',
      'Transport immediately to the nearest PHC/Hospital with Anti-Snake Venom (ASVS).'
    ],
    warning: 'Govt anti-snake venom is available at Khed PHC and District Hospital Chakan.'
  }
];

export const INITIAL_ASHA_WORKER = {
  id: 'ASHA-MH-2026-4018',
  role: 'asha',
  name: 'Sunita Kamble',
  nameHindi: 'सुनीता कांबळे',
  nameMarathi: 'सुनिता कांबळे',
  email: 'sunita.asha@arogya.gov.in',
  phone: '+91 97654 33211',
  village: 'Khed Rural & Alandi Sector',
  district: 'Pune',
  state: 'Maharashtra',
  connectedPhc: 'Khed Primary Health Centre (PHC)',
  phcId: 'PHC-PUN-042',
  assignedWards: ['Ward 2 (Khed Gaon)', 'Ward 4 (Alandi Road)', 'Bhamerwadi Post'],
  totalAssignedCount: 148,
  activeFollowUpsCount: 6,
  highRiskCount: 3
};

export const INITIAL_ASHA_PATIENTS = [
  {
    id: 'PAT-MH-2026-8491',
    name: 'Rahul Sharma',
    nameHindi: 'राहुल शर्मा',
    age: 34,
    gender: 'Male',
    village: 'Khed (Rajgurunagar)',
    phone: '+91 98765 43210',
    emergencyContact: '+91 98220 12345 (Sunita Sharma - Spouse)',
    bloodGroup: 'B+',
    abhaId: '91-4829-1029-4819',
    riskStatus: 'Moderate', // 'Normal' | 'Moderate' | 'High-Risk' | 'Emergency'
    riskCategory: 'Cardiac Review & Seasonal Bronchitis',
    currentDoctor: 'Dr. Anjali Mehta (General Physician)',
    lastVisit: '10 Sep 2026',
    nextFollowUp: '18 Sep 2026',
    referralStatus: 'Referred to District Hospital (Cardiology)',
    activePrescriptionId: 'RX-2026-0042',
    vitals: { bp: '126/82 mmHg', pulse: '88 bpm', spo2: '97%', temp: '99.4°F' },
    conditions: ['Mild Viral Bronchitis', 'Non-specific resting ST-T wave changes'],
    allergies: ['Penicillin'],
    currentMeds: ['Amoxicillin 500mg', 'Paracetamol 650mg SOS', 'Cetirizine 10mg'],
    ashaNotes: 'Recovering well from URTI fever. Advised not to miss referral visit at Chakan Hospital.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  },
  {
    id: 'PAT-36',
    name: 'Savita Kamble',
    nameHindi: 'सविता कांबळे',
    age: 52,
    gender: 'Female',
    village: 'Alandi Rural Sector',
    phone: '+91 98230 45678',
    emergencyContact: '+91 98223 99881 (Sunil Kamble - Son)',
    bloodGroup: 'O+',
    abhaId: '91-3829-4410-9281',
    riskStatus: 'High-Risk',
    riskCategory: 'Hypertension & Type 2 Diabetes',
    currentDoctor: 'Dr. Anjali Mehta',
    lastVisit: '08 Sep 2026',
    nextFollowUp: '16 Sep 2026',
    referralStatus: 'PHC Review Completed',
    activePrescriptionId: 'RX-2026-7819',
    vitals: { bp: '165/100 mmHg', pulse: '92 bpm', spo2: '97%', temp: '98.4°F', sugar: '198 mg/dL' },
    conditions: ['Essential Hypertension (7 yrs)', 'Type 2 Diabetes (4 yrs)', 'Pedal Edema'],
    allergies: ['Amlodipine'],
    currentMeds: ['Telmisartan 40mg OD', 'Metformin 500mg BD'],
    ashaNotes: 'BP remains elevated. Visited home on 12 Sep; reminded salt restriction and morning walks.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  },
  {
    id: 'PAT-38',
    name: 'Priya Deshmukh',
    nameHindi: 'प्रिया देशमुख',
    age: 26,
    gender: 'Female',
    village: 'Manchar Sub-Centre',
    phone: '+91 97654 32190',
    emergencyContact: '+91 97650 11223 (Ramesh Deshmukh - Husband)',
    bloodGroup: 'B+',
    abhaId: '91-4921-9982-1284',
    riskStatus: 'High-Risk',
    riskCategory: 'Maternal ANC (22 Weeks) - Severe Anemia',
    currentDoctor: 'Dr. Kavita Jadhav (Gynecologist)',
    lastVisit: '08 Sep 2026',
    nextFollowUp: '19 Sep 2026',
    referralStatus: 'Referred to Khed PHC Maternity Wing',
    activePrescriptionId: 'RX-2026-9012',
    vitals: { bp: '110/70 mmHg', pulse: '76 bpm', spo2: '99%', temp: '98.6°F', hb: '9.4 g/dL' },
    conditions: ['Primigravida (22 Weeks)', 'Nutritional Anemia'],
    allergies: ['None'],
    currentMeds: ['Iron-Folic Acid (IFA) Tablets', 'Calcium 500mg OD'],
    ashaNotes: 'Monitored daily IFA intake. Nutrition counselling given with green leafy vegetables and jaggery.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  },
  {
    id: 'PAT-37',
    name: 'Maruti Shinde',
    nameHindi: 'मारुती शिंदे',
    age: 61,
    gender: 'Male',
    village: 'Bhamerwadi Village',
    phone: '+91 94220 89123',
    emergencyContact: '+91 94220 89124 (Vikas Shinde - Son)',
    bloodGroup: 'AB+',
    abhaId: '91-8821-3940-5812',
    riskStatus: 'Moderate',
    riskCategory: 'Elderly Mobility & Osteoarthritis',
    currentDoctor: 'Dr. Suresh Shinde (Orthopedic)',
    lastVisit: '08 Sep 2026',
    nextFollowUp: '22 Sep 2026',
    referralStatus: 'Physiotherapy Scheduled',
    activePrescriptionId: 'RX-2026-6641',
    vitals: { bp: '134/84 mmHg', pulse: '74 bpm', spo2: '98%', temp: '98.2°F' },
    conditions: ['Bilateral Knee Osteoarthritis Grade 3', 'Dyslipidemia'],
    allergies: ['None reported'],
    currentMeds: ['Paracetamol 650mg TDS SOS', 'Glucosamine Sulfate 500mg'],
    ashaNotes: 'Assisted in acquiring walking stick. Needs help booking transport for next hospital visit.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  },
  {
    id: 'PAT-39',
    name: 'Aarav Gaikwad',
    nameHindi: 'आरव गायकवाड',
    age: 3,
    gender: 'Male',
    village: 'Khed (Rajgurunagar)',
    phone: '+91 98901 23456',
    emergencyContact: '+91 98901 23456 (Sunita Gaikwad - Mother)',
    bloodGroup: 'O+',
    abhaId: '91-1122-3344-5566',
    riskStatus: 'High-Risk',
    riskCategory: 'Child Malnutrition & Delayed Immunization',
    currentDoctor: 'Dr. Priya Patil (Pediatrician)',
    lastVisit: '04 Sep 2026',
    nextFollowUp: '17 Sep 2026',
    referralStatus: 'NRC Screening Scheduled',
    activePrescriptionId: 'RX-2026-4412',
    vitals: { weight: '10.2 kg', height: '86 cm', temp: '98.6°F', muac: '11.8 cm' },
    conditions: ['Moderate Acute Malnutrition (MAM)', 'DPT Booster Due'],
    allergies: ['None'],
    currentMeds: ['Multivitamin Syrup 5ml OD', 'Zinc Syrup 10mg'],
    ashaNotes: 'MUAC in yellow band. Distributed Supplementary Nutrition Pack from Anganwadi.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  },
  {
    id: 'PAT-40',
    name: 'Laxmibai Patil',
    nameHindi: 'लक्ष्मीबाई पाटील',
    age: 72,
    gender: 'Female',
    village: 'Alandi Rural Sector',
    phone: '+91 98211 55667',
    emergencyContact: '+91 98211 55668 (Anand Patil - Grandson)',
    bloodGroup: 'A+',
    abhaId: '91-7788-9900-1122',
    riskStatus: 'High-Risk',
    riskCategory: 'Post-Discharge Cardiac & Geriatric Care',
    currentDoctor: 'Dr. Rajesh Deshmukh (Cardiologist)',
    lastVisit: '02 Sep 2026',
    nextFollowUp: '20 Sep 2026',
    referralStatus: 'Post-Discharge Home Care Active',
    activePrescriptionId: 'RX-2026-3390',
    vitals: { bp: '138/86 mmHg', pulse: '70 bpm', spo2: '96%', temp: '98.4°F' },
    conditions: ['Ischemic Heart Disease', 'Post-Cataract Surgery OD'],
    allergies: ['Sulfa drugs'],
    currentMeds: ['Aspirin 75mg OD', 'Atorvastatin 20mg Bedtime', 'Ciprofloxacin Eye Drops'],
    ashaNotes: 'Checked eye drops application technique. BP measured normal today.',
    ashaAssignedId: 'ASHA-MH-2026-4018'
  }
];

export const INITIAL_ASHA_CONSULT_REQUESTS = [
  {
    id: 'REQ-ASHA-2026-01',
    patientId: 'PAT-36',
    patientName: 'Savita Kamble',
    patientAge: 52,
    patientGender: 'Female',
    patientAbhaId: '91-3829-4410-9281',
    village: 'Alandi Rural Sector',
    doctorId: 'DOC-01',
    doctorName: 'Dr. Anjali Mehta',
    triageCategory: 'Urgent', // 'Normal' (Green), 'Urgent' (Yellow), 'Emergency' (Red)
    symptoms: 'Uncontrolled BP (165/100 mmHg), persistent morning dizziness, bilateral mild ankle puffiness',
    vitals: { bp: '165/100', pulse: '92', spo2: '97%', temp: '98.4°F', sugar: '198 mg/dL' },
    ashaNotes: 'Patient missed last dosage of Telmisartan due to village dispensary stock shortage. Advised medication refill & doctor review.',
    status: 'Pending Review', // 'Pending Review' | 'Accepted' | 'Scheduled' | 'Completed' | 'Rejected'
    createdAt: '15 Sep 2026, 08:30 AM',
    ashaWorkerId: 'ASHA-MH-2026-4018',
    ashaWorkerName: 'Sunita Kamble'
  },
  {
    id: 'REQ-ASHA-2026-02',
    patientId: 'PAT-38',
    patientName: 'Priya Deshmukh',
    patientAge: 26,
    patientGender: 'Female',
    patientAbhaId: '91-4921-9982-1284',
    village: 'Manchar Sub-Centre',
    doctorId: 'DOC-05',
    doctorName: 'Dr. Kavita Jadhav',
    triageCategory: 'Normal',
    symptoms: 'Trimester 2 routine scan follow-up, requesting Iron-Folic Acid restock confirmation',
    vitals: { bp: '110/70', pulse: '76', spo2: '99%', temp: '98.6°F', hb: '9.4 g/dL' },
    ashaNotes: 'Vitals stable. Hemoglobin remains 9.4. Teleconsult recommended for dietary supplement dosage boost.',
    status: 'Accepted',
    createdAt: '14 Sep 2026, 11:20 AM',
    doctorRemarks: 'Prescription updated with elemental iron 100mg. Schedule repeat Hb test in 3 weeks.',
    ashaWorkerId: 'ASHA-MH-2026-4018',
    ashaWorkerName: 'Sunita Kamble'
  }
];

export const INITIAL_ASHA_MESSAGES = [
  {
    id: 'MSG-01',
    patientId: 'PAT-36',
    patientName: 'Savita Kamble',
    senderRole: 'asha',
    senderName: 'Sunita Kamble (ASHA)',
    recipientName: 'Dr. Anjali Mehta',
    doctorId: 'DOC-01',
    message: 'Doctor, Savita Kamble BP is 165/100 today. She complains of mild morning dizziness. Should we send her to PHC Room 4 or adjust Telmisartan?',
    timestamp: '15 Sep 2026, 08:35 AM',
    read: true
  },
  {
    id: 'MSG-02',
    patientId: 'PAT-36',
    patientName: 'Savita Kamble',
    senderRole: 'doctor',
    senderName: 'Dr. Anjali Mehta',
    recipientName: 'Sunita Kamble (ASHA)',
    doctorId: 'DOC-01',
    message: 'Sunita, please check her fasting blood sugar today. Ask her to visit PHC Room 4 between 10:30 and 12:00. I have kept her token ready in priority queue.',
    timestamp: '15 Sep 2026, 08:42 AM',
    read: true
  }
];

export const INITIAL_ASHA_AUDIT_LOGS = [
  {
    id: 'AUDIT-01',
    action: 'Patient Registered',
    actionHindi: 'मरीज पंजीकृत किया गया',
    details: 'ASHA Sunita Kamble registered new patient Kavita Shinde (Age 29, Khed). Linked to PHC-PUN-042.',
    actor: 'Sunita Kamble (ASHA)',
    timestamp: '14 Sep 2026, 04:15 PM'
  },
  {
    id: 'AUDIT-02',
    action: 'Digital Triage Conducted',
    actionHindi: 'डिजिटल ट्राइएज संपन्न',
    details: 'Conducted triage for Savita Kamble (Urgent - BP 165/100). Consultation request forwarded to Dr. Anjali Mehta.',
    actor: 'Sunita Kamble (ASHA)',
    timestamp: '15 Sep 2026, 08:30 AM'
  },
  {
    id: 'AUDIT-03',
    action: 'Follow-Up Completed',
    actionHindi: 'फॉलो-अप पूर्ण चिन्हित',
    details: 'Home visit completed for Rahul Sharma. Cough subsided, vitals checked normal.',
    actor: 'Sunita Kamble (ASHA)',
    timestamp: '15 Sep 2026, 09:00 AM'
  }
];
