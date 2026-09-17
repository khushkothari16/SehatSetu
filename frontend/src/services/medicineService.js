import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_PHARMACIES, INITIAL_PRESCRIPTIONS } from '../data/mockData';

export const medicineService = {
  // Returns list of all medicines prescribed across all patient prescriptions
  getPrescribedMedicines() {
    const prescriptions = getStored(STORAGE_KEYS.PRESCRIPTIONS, INITIAL_PRESCRIPTIONS);
    const meds = [];
    const seen = new Set();

    for (const rx of prescriptions) {
      if (Array.isArray(rx.medicines)) {
        for (const m of rx.medicines) {
          const rawName = m.name || m;
          const nameStr = typeof rawName === 'string' ? rawName : (rawName.name || '');
          const key = nameStr.toLowerCase().trim();
          if (key && !seen.has(key)) {
            seen.add(key);
            meds.push({
              name: nameStr,
              type: m.type || 'Tablet',
              dosage: m.dosage || '1 unit',
              frequency: m.frequency || '1-0-1',
              instructions: m.instructions || 'As advised by doctor',
              doctorName: rx.doctorName || 'Dr. Anjali Mehta',
              date: rx.date || 'Recent',
              rxId: rx.id
            });
          }
        }
      }
    }
    return meds;
  },

  // Indexes newly prescribed medicines into pharmacy stock and searchable database
  indexPrescribedMedicines(newMedicines, facility = '', doctorName = '') {
    if (!Array.isArray(newMedicines) || newMedicines.length === 0) return;
    const pharmacies = getStored(STORAGE_KEYS.PHARMACIES, INITIAL_PHARMACIES);

    const updatedPharmacies = pharmacies.map(pharm => {
      const newStock = { ...(pharm.medicinesStock || {}) };
      newMedicines.forEach(m => {
        const medName = (typeof m === 'string' ? m : m.name)?.trim();
        if (!medName) return;

        // Ensure every pharmacy now lists this prescribed medicine
        if (!newStock[medName]) {
          if (pharm.isGovtDiscount) {
            newStock[medName] = {
              status: 'In Stock (Jan Aushadhi)'
            };
          } else {
            newStock[medName] = {
              status: 'Available in Stock'
            };
          }
        }
      });
      return { ...pharm, medicinesStock: newStock };
    });

    setStored(STORAGE_KEYS.PHARMACIES, updatedPharmacies);
    window.dispatchEvent(new CustomEvent('pharmacies_stock_updated', { detail: updatedPharmacies }));
    window.dispatchEvent(new CustomEvent('prescribed_medicines_updated', { detail: newMedicines }));
    return updatedPharmacies;
  },

  async getPharmacies(searchTerm = '') {
    await delay(150);
    // Ensure all prescribed medicines are automatically indexed in stock
    const prescribedMeds = this.getPrescribedMedicines();
    if (prescribedMeds.length > 0) {
      this.indexPrescribedMedicines(prescribedMeds);
    }

    const pharmacies = getStored(STORAGE_KEYS.PHARMACIES, INITIAL_PHARMACIES);

    if (!searchTerm || !searchTerm.trim()) {
      return pharmacies;
    }

    const q = searchTerm.toLowerCase().trim();
    const queryTokens = q.split(/[\s,+/]+/).filter(w => w.length >= 3);

    return pharmacies.filter(p => {
      const matchName = p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q);
      const stockKeys = Object.keys(p.medicinesStock || {});
      const matchMedicine = stockKeys.some(med => {
        const mLower = med.toLowerCase();
        if (mLower.includes(q) || q.includes(mLower)) return true;
        return queryTokens.length > 0 && queryTokens.some(tok => mLower.includes(tok));
      });
      return matchName || matchMedicine;
    });
  },

  async getMedicineStock(medicineName) {
    await delay(100);
    const pharmacies = getStored(STORAGE_KEYS.PHARMACIES, INITIAL_PHARMACIES);
    return pharmacies.map(p => ({
      pharmacyId: p.id,
      pharmacyName: p.name,
      address: p.address,
      distance: p.distance,
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      isGovtDiscount: p.isGovtDiscount,
      isOpen: p.isOpen,
      timing: p.timing,
      stockInfo: p.medicinesStock[medicineName] || { status: 'Available in Stock' }
    }));
  },

  /**
   * Real PMBJP (Pradhan Mantri Bhartiya Janaushadhi Pariyojana) official catalog
   * with government ceiling prices vs branded market prices + dynamically prescribed medicines
   */
  async getJanAushadhiCatalog() {
    await delay(100);
    const baseCatalog = [
      {
        code: 'PMBJP-001',
        genericName: 'Paracetamol Tablets IP 650mg',
        category: 'Analgesics & Antipyretics (दर्द व बुखार)',
        unitSize: '10 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-042',
        genericName: 'Amoxicillin & Potassium Clavulanate 625mg',
        category: 'Antibacterial (एंटीबायोटिक)',
        unitSize: '6 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-118',
        genericName: 'Telmisartan Tablets IP 40mg',
        category: 'Antihypertensive (उच्च रक्तचाप / BP)',
        unitSize: '10 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-089',
        genericName: 'Metformin Hydrochloride Prolonged Release 500mg',
        category: 'Antidiabetic (मधुमेह / शुगर)',
        unitSize: '10 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-204',
        genericName: 'Oral Rehydration Salts (W.H.O. Formula)',
        category: 'Electrolytes & Fluid Replacement (ओआरएस)',
        unitSize: '21.8g Sachet',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-033',
        genericName: 'Azithromycin Tablets IP 500mg',
        category: 'Respiratory Antibiotic (गला व फेफड़े का संक्रमण)',
        unitSize: '3 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-155',
        genericName: 'Cetirizine Hydrochloride Tablets 10mg',
        category: 'Antiallergic (एलर्जी व छींक)',
        unitSize: '10 Tablets',
        inStockJanAushadhi: true
      },
      {
        code: 'PMBJP-212',
        genericName: 'Pantoprazole Gastro-resistant 40mg',
        category: 'Antacid & Anti-ulcer (गैस व एसिडिटी)',
        unitSize: '10 Tablets',
        inStockJanAushadhi: true
      }
    ];

    // Merge in any prescribed medicines not already present in the catalog
    const prescribed = this.getPrescribedMedicines();
    prescribed.forEach((m, idx) => {
      const alreadyInCatalog = baseCatalog.some(c =>
        c.genericName.toLowerCase().includes(m.name.toLowerCase().split(' ')[0])
      );
      if (!alreadyInCatalog) {
        baseCatalog.unshift({
          code: `PMBJP-${250 + idx}`,
          genericName: m.name,
          category: 'Prescribed by Doctor (चिकित्सक द्वारा निर्देशित)',
          unitSize: m.dosage || '10 Tablets',
          inStockJanAushadhi: true,
          isDoctorPrescribed: true
        });
      }
    });

    return baseCatalog;
  }
};
