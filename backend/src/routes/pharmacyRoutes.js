import express from 'express';

const router = express.Router();

const PHARMACIES = [
  {
    id: 'PHARM-01',
    name: 'Pradhan Mantri Jan Aushadhi Kendra #1421',
    nameHindi: 'प्रधानमंत्री जन औषधि केंद्र #1421',
    type: 'Jan Aushadhi Kendra (Govt. Subsidized)',
    address: 'Near Khed Bus Stand, Old Pune-Nashik Highway',
    distance: '0.8 km',
    open24x7: true,
    rating: 4.8,
    phone: '+91 98220 11223',
    stock: [
      { medicine: 'Amoxicillin 500mg', available: true, units: 140, price: '₹14 (Pack of 10)' },
      { medicine: 'Paracetamol 650mg', available: true, units: 320, price: '₹9 (Pack of 10)' },
      { medicine: 'Cetirizine 10mg', available: true, units: 95, price: '₹7 (Pack of 10)' }
    ]
  },
  {
    id: 'PHARM-02',
    name: 'Gramin Seva 24x7 Medical & Chemist',
    nameHindi: 'ग्रामीण सेवा मेडिकल व केमिस्ट',
    type: 'Authorized PHC Dispenser',
    address: 'Opposite Sub-District Hospital Entrance',
    distance: '1.4 km',
    open24x7: true,
    rating: 4.6,
    phone: '+91 98230 44556',
    stock: [
      { medicine: 'Amoxicillin 500mg', available: true, units: 85, price: '₹18 (Pack of 10)' },
      { medicine: 'Paracetamol 650mg', available: true, units: 210, price: '₹12 (Pack of 10)' }
    ]
  }
];

router.get('/pharmacies', (req, res) => {
  res.json({ success: true, data: PHARMACIES });
});

export default router;
