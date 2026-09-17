import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_STATE = {
  patient: {
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
    abhaId: '91-4829-1029-4819'
  },
  doctors: [
    {
      id: 'DOC-01',
      name: 'Dr. Anjali Mehta',
      specialty: 'General Physician',
      specialtyHindi: 'सामान्य चिकित्सक',
      specialtyMarathi: 'सामान्य फिजिशियन',
      degrees: 'MBBS, MD (Medicine)',
      experience: '11 years',
      hospital: 'Khed Primary Health Centre (PHC)',
      room: 'OPD Room 4',
      fee: 0,
      feeDisplay: 'Free',
      consultationModes: ['offline', 'online'],
      availableDays: 'Mon - Sat',
      opdTimings: '9:00 AM - 2:00 PM'
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
      room: 'Cardiac OPD Room 12',
      fee: 0,
      feeDisplay: 'Free',
      consultationModes: ['offline', 'online'],
      availableDays: 'Mon, Wed, Fri',
      opdTimings: '10:00 AM - 4:00 PM'
    }
  ],
  appointments: [
    {
      id: 'APT-2026-9821',
      doctorId: 'DOC-01',
      doctorName: 'Dr. Anjali Mehta',
      doctorSpecialty: 'General Physician',
      facility: 'Khed Primary Health Centre (PHC)',
      room: 'OPD Room 4',
      date: '2026-09-10',
      time: '11:30 AM',
      type: 'In-Person OPD',
      mode: 'offline',
      status: 'Confirmed',
      tokenNumber: 35,
      token: '#35',
      patientId: 'PAT-MH-2026-8491',
      patientName: 'Rahul Sharma',
      patientPhone: '+91 98765 43210',
      reason: 'Fever with dry cough for 3 days and throat irritation'
    }
  ],
  queue: {
    userToken: 35,
    currentToken: 35,
    patientsAhead: 0,
    estimatedWaitMinutes: 0,
    status: 'Your Turn',
    doctorName: 'Dr. Anjali Mehta',
    room: 'OPD Room 4',
    facility: 'Khed Primary Health Centre (PHC)'
  },
  prescriptions: [
    {
      id: 'RX-2026-8910',
      date: '10 Sep 2026',
      doctorName: 'Dr. Anjali Mehta',
      facility: 'Khed Primary Health Centre (PHC)',
      diagnosis: 'Acute Upper Respiratory Tract Infection (URTI) with High Fever',
      medicines: [
        {
          name: 'Amoxicillin 500mg',
          type: 'Capsule',
          dosage: '1 Capsule',
          frequency: '1-0-1 (Twice daily)',
          duration: '5 Days',
          instructions: 'Take strictly after food with warm water'
        },
        {
          name: 'Paracetamol 650mg',
          type: 'Tablet',
          dosage: '1 Tablet',
          frequency: '1-0-1 (Morning & Night)',
          duration: '3 Days',
          instructions: 'Take after meals for fever > 100°F'
        }
      ],
      qrData: 'ABHA:91-4829-1029-4819|RX:RX-2026-8910|NMC:2014082941'
    }
  ],
  reminders: [],
  completedCheckups: [],
  staffRequests: [],
  teleconsultWaitingPool: [],
  referralChains: [
    {
      id: 'REF-TRK-2026-8941',
      patientId: 'PAT-MH-2026-8491',
      patientName: 'Rahul Sharma',
      patientNameHindi: 'राहुल शर्मा',
      abhaId: '91-4829-1029-4819',
      age: 34,
      gender: 'Male',
      village: 'Khed Rural (खेड)',
      status: 'In Transit to Specialist',
      priority: 'High Priority',
      primaryCondition: 'Atypical Angina with ST Segment Fluctuations',
      createdAt: '08 Sep 2026, 10:15 AM',
      lastUpdated: '11 Sep 2026, 11:30 AM',
      hops: [
        {
          hopId: 'hop-1',
          stepNumber: 1,
          status: 'completed',
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
          vitals: { bp: '135/88 mmHg', pulse: '84 bpm', spo2: '97%', temp: '98.4°F', bloodSugar: '142 mg/dL' },
          clinicalFindings: 'Intermittent exertional chest discomfort for 4 days.',
          doctorRemarks: 'Patient needs immediate escalation to secondary PHC.',
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
          vitals: { bp: '130/84 mmHg', pulse: '88 bpm', spo2: '98%', temp: '98.6°F', bloodSugar: '136 mg/dL' },
          clinicalFindings: 'Repeat 12-lead ECG demonstrates persistent ST depression in leads V3-V5.',
          doctorRemarks: 'Immediate tertiary cardiology referral required for formal Angiography.',
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
          vitals: { bp: 'Pending Intake', pulse: 'Pending Intake', spo2: 'Pending Intake', temp: 'Pending Intake' },
          clinicalFindings: 'Priority Cath Lab Queue allocated.',
          doctorRemarks: 'Electronic ABHA health records successfully transferred from Khed PHC.',
          actionTaken: 'Awaiting Physical Cath Lab Consultation & Echo',
          referralSlipId: 'SLIP-CHAKAN-018'
        }
      ]
    },
    {
      id: 'REF-TRK-2026-4410',
      patientId: 'PAT-MH-2026-3829',
      patientName: 'Sunita Devi',
      patientNameHindi: 'सुनीता देवी',
      abhaId: '91-6621-9982-1102',
      age: 28,
      gender: 'Female',
      village: 'Alandi Rural',
      status: 'Referral Sent',
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
          vitals: { bp: '150/96 mmHg', pulse: '92 bpm', spo2: '96%', temp: '98.2°F', hemoglobin: '7.8 g/dL' },
          clinicalFindings: 'Severe anemia in pregnancy with pre-eclampsia features.',
          doctorRemarks: 'Urgent OBGYN referral initiated.',
          actionTaken: 'Referred to Khed PHC Maternity Wing',
          referralSlipId: 'SLIP-ALANDI-4410'
        }
      ]
    }
  ]
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize DB
const loadData = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_STATE, null, 2), 'utf-8');
      return JSON.parse(JSON.stringify(INITIAL_STATE));
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const data = JSON.parse(raw);
    if (!data.referralChains || data.referralChains.length === 0) {
      data.referralChains = INITIAL_STATE.referralChains;
    }
    return data;
  } catch (err) {
    console.error('Error reading db.json:', err);
    return JSON.parse(JSON.stringify(INITIAL_STATE));
  }
};

const saveData = (data) => {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error writing db.json:', err);
  }
};

export const store = {
  get(collection) {
    const data = loadData();
    return collection ? data[collection] : data;
  },

  set(collection, value) {
    const data = loadData();
    data[collection] = value;
    saveData(data);
    return data[collection];
  },

  update(updaterFn) {
    const data = loadData();
    const result = updaterFn(data);
    saveData(data);
    return result;
  }
};
