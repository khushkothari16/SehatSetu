// Medical Speech Recognition & AI Medicine Entity Extraction Engine for SehatSetu
// Focus: Strictly extracting Medicine Name & Strength, Duration (How many days), and Timings (When to take)

export const MEDICAL_SAMPLE_VOICES = [
  {
    id: 'fever_antibiotic',
    label: 'Fever & Infection (Paracetamol + Amoxicillin + Pantoprazole)',
    hindiLabel: 'बुखार और संक्रमण (पैरासिटामोल + अमोक्सिसिलिन)',
    transcript: 'Tablet Paracetamol 650mg twice daily for 3 days after meals, Capsule Amoxicillin 500mg twice daily for 5 days after food, and Tablet Pantoprazole 40mg once daily in morning before food for 5 days.'
  },
  {
    id: 'hypertension_care',
    label: 'Hypertension & BP (Telmisartan + Amlodipine)',
    hindiLabel: 'उच्च रक्तचाप बीपी (टेल्मिसार्टन + एम्लोडिपिन)',
    transcript: 'Tablet Telmisartan 40mg once daily in the morning before breakfast for 30 days, and Tablet Amlodipine 5mg once daily at night after dinner for 30 days.'
  },
  {
    id: 'cough_allergy',
    label: 'Cough & Allergy (Ambroxol Syrup + Cetirizine)',
    hindiLabel: 'खांसी और एलर्जी (एम्ब्रोक्सोल सिरप + सेटिरिज़िन)',
    transcript: 'Syrup Ambroxol 10ml thrice a day for 5 days with warm water after food, and Tablet Cetirizine 10mg once at night before sleep for 5 days.'
  },
  {
    id: 'hindi_rural_opd',
    label: 'Rural OPD Hindi Dictation (ग्रामीण ओपीडी हिंदी बोलचाल)',
    hindiLabel: 'ग्रामीण ओपीडी हिंदी बोलचाल',
    transcript: 'Tablet Paracetamol 650mg subah aur raat ko 3 din ke liye khana khane ke baad, Capsule Amoxicillin 500mg din mein do baar 5 din tak khana khane ke baad, aur Tablet Pantoprazole 40mg subah khali pet 5 din ke liye.'
  }
];

// Curated library of commonly prescribed OPD and inpatient drugs
export const COMMON_DRUG_DATABASE = [
  // Analgesics & Antipyretics
  { name: 'Paracetamol 650mg', type: 'Tablet', defaultDose: '1 tablet (650mg)', defaultDuration: '3 days', aliases: ['paracetamol', 'crocin', 'calpol', 'dolo', 'dolo 650', 'pacimol', 'pyremol', 'pcm'] },
  { name: 'Ibuprofen 400mg', type: 'Tablet', defaultDose: '1 tablet (400mg)', defaultDuration: '3 days', aliases: ['ibuprofen', 'brufen', 'combiflam'] },
  { name: 'Aceclofenac + Paracetamol', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '3 days', aliases: ['zerodol', 'zerodol p', 'zerodol-p', 'aceclo', 'hifenac'] },
  { name: 'Diclofenac 50mg', type: 'Tablet', defaultDose: '1 tablet (50mg)', defaultDuration: '3 days', aliases: ['diclofenac', 'voveran', 'dynapar'] },
  { name: 'Meftal-Spas', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '2 days', aliases: ['meftal', 'meftal spas', 'meftal-spas', 'dicyclomine'] },
  { name: 'Drotin-M', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '3 days', aliases: ['drotin', 'drotaverine'] },

  // Antibiotics & Antimicrobials
  { name: 'Amoxicillin 500mg', type: 'Capsule', defaultDose: '1 capsule (500mg)', defaultDuration: '5 days', aliases: ['amoxicillin', 'mox', 'novamox', 'amox'] },
  { name: 'Amoxicillin + Clavulanate 625mg', type: 'Tablet', defaultDose: '1 tablet (625mg)', defaultDuration: '5 days', aliases: ['augmentin', 'augmentin 625', 'moxikind cv', 'moxclav', 'clavum'] },
  { name: 'Azithromycin 500mg', type: 'Tablet', defaultDose: '1 tablet (500mg)', defaultDuration: '3 days', aliases: ['azithromycin', 'azee', 'azithral', 'zady', 'aziwok'] },
  { name: 'Ciprofloxacin 500mg', type: 'Tablet', defaultDose: '1 tablet (500mg)', defaultDuration: '5 days', aliases: ['ciprofloxacin', 'cifran', 'cipro', 'ciplox'] },
  { name: 'Ofloxacin + Ornidazole', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '3 days', aliases: ['ofloxacin', 'oflax', 'oflox oz', 'zenflox', 'o2'] },
  { name: 'Cefixime 200mg', type: 'Tablet', defaultDose: '1 tablet (200mg)', defaultDuration: '5 days', aliases: ['cefixime', 'taxim o', 'taxim-o', 'zifi', 'mahacef'] },
  { name: 'Metronidazole 400mg', type: 'Tablet', defaultDose: '1 tablet (400mg)', defaultDuration: '3 days', aliases: ['metronidazole', 'flagyl', 'metrogyl'] },
  { name: 'Doxycycline 100mg', type: 'Capsule', defaultDose: '1 capsule (100mg)', defaultDuration: '7 days', aliases: ['doxycycline', 'doxy'] },

  // Antacids & GI
  { name: 'Pantoprazole 40mg', type: 'Tablet', defaultDose: '1 tablet (40mg)', defaultDuration: '5 days', aliases: ['pantoprazole', 'pan 40', 'pantocid', 'pantodac', 'penta'] },
  { name: 'Pantoprazole + Domperidone (Pan-D)', type: 'Capsule', defaultDose: '1 capsule', defaultDuration: '5 days', aliases: ['pan d', 'pan-d', 'pantocid d', 'pantoprazole d'] },
  { name: 'Omeprazole 20mg', type: 'Capsule', defaultDose: '1 capsule (20mg)', defaultDuration: '7 days', aliases: ['omeprazole', 'omez', 'omiz'] },
  { name: 'Rabeprazole 20mg', type: 'Tablet', defaultDose: '1 tablet (20mg)', defaultDuration: '7 days', aliases: ['rabeprazole', 'rabekind', 'happi', 'razo'] },
  { name: 'Ranitidine 150mg', type: 'Tablet', defaultDose: '1 tablet (150mg)', defaultDuration: '5 days', aliases: ['ranitidine', 'rantac', 'aciloc'] },
  { name: 'ORS Sachets', type: 'Sachet', defaultDose: '1 packet in 1L clean water', defaultDuration: '3 days', aliases: ['ors', 'electral', 'ors sachet', 'oral rehydration'] },
  { name: 'Digene / Antacid Gel', type: 'Syrup', defaultDose: '10 ml', defaultDuration: '5 days', aliases: ['digene', 'gelusil', 'mucaine'] },
  { name: 'Ondansetron 4mg', type: 'Tablet', defaultDose: '1 tablet (4mg)', defaultDuration: '2 days', aliases: ['ondansetron', 'emeset', 'vomikind'] },

  // Antihistamines & Cough
  { name: 'Cetirizine 10mg', type: 'Tablet', defaultDose: '1 tablet (10mg)', defaultDuration: '5 days', aliases: ['cetirizine', 'cetzine', 'alerid', 'okacet'] },
  { name: 'Levocetirizine 5mg', type: 'Tablet', defaultDose: '1 tablet (5mg)', defaultDuration: '5 days', aliases: ['levocetirizine', 'levocet', 'teczine', 'vocet'] },
  { name: 'Montair-LC (Montelukast + Levocetirizine)', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '7 days', aliases: ['montair lc', 'montair-lc', 'montelukast', 'telekast', 'montek lc'] },
  { name: 'Allegra 120mg (Fexofenadine)', type: 'Tablet', defaultDose: '1 tablet (120mg)', defaultDuration: '5 days', aliases: ['allegra', 'fexofenadine', 'fexo'] },
  { name: 'Ambroxol Cough Syrup', type: 'Syrup', defaultDose: '10 ml', defaultDuration: '5 days', aliases: ['ambroxol', 'ambrolite', 'ascoril', 'grilinctus', 'cough syrup', 'benadryl', 'chericof', 'alex'] },

  // Cardiovascular & Chronic Care
  { name: 'Telmisartan 40mg', type: 'Tablet', defaultDose: '1 tablet (40mg)', defaultDuration: '30 days', aliases: ['telmisartan', 'telma', 'telpres', 'telsar'] },
  { name: 'Amlodipine 5mg', type: 'Tablet', defaultDose: '1 tablet (5mg)', defaultDuration: '30 days', aliases: ['amlodipine', 'amlong', 'amlovas', 'stamlo'] },
  { name: 'Atenolol 50mg', type: 'Tablet', defaultDose: '1 tablet (50mg)', defaultDuration: '30 days', aliases: ['atenolol', 'aten'] },
  { name: 'Ecosprin 75mg (Aspirin)', type: 'Tablet', defaultDose: '1 tablet (75mg)', defaultDuration: '30 days', aliases: ['ecosprin', 'aspirin', 'disprin'] },
  { name: 'Atorvastatin 10mg', type: 'Tablet', defaultDose: '1 tablet (10mg)', defaultDuration: '30 days', aliases: ['atorvastatin', 'atorva', 'lipitor', 'storvas'] },

  // Diabetes
  { name: 'Metformin 500mg', type: 'Tablet', defaultDose: '1 tablet (500mg)', defaultDuration: '30 days', aliases: ['metformin', 'glycomet', 'glyciphage', 'gluformin'] },
  { name: 'Glimepiride 1mg', type: 'Tablet', defaultDose: '1 tablet (1mg)', defaultDuration: '30 days', aliases: ['glimepiride', 'amaryl', 'zoryl', 'glimy'] },

  // Vitamins & Supplements
  { name: 'Calcium + Vitamin D3', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '30 days', aliases: ['calcium', 'shelcal', 'cipcal', 'vitamin d3'] },
  { name: 'Multivitamin & Zinc (Becosules / Zincovit)', type: 'Capsule', defaultDose: '1 capsule', defaultDuration: '15 days', aliases: ['multivitamin', 'becosules', 'zincovit', 'supradyn', 'a to z', 'b complex'] },
  { name: 'Iron + Folic Acid', type: 'Tablet', defaultDose: '1 tablet', defaultDuration: '30 days', aliases: ['iron', 'folic acid', 'orofer', 'autrin'] }
];

/**
 * Parses "for how many days" from natural speech (English / Hindi / Hinglish)
 */
export function extractDuration(text, defaultVal = '5 days') {
  if (!text) return defaultVal;
  const lower = text.toLowerCase();

  // Pattern: "for 3 days", "3 days", "3 din", "तीन दिन"
  const dayMatch = lower.match(/(?:for\s+)?(\d+)\s*(?:days?|day|दिन|din)/i);
  if (dayMatch && dayMatch[1]) {
    return `${dayMatch[1]} days`;
  }

  // Hindi words for numbers (1 to 10 din)
  const hindiNumMap = {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5,
    'che': 6, 'chhah': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'पंद्रह': 15, 'pandrah': 15, 'tees': 30, 'तीस': 30
  };
  for (const [word, num] of Object.entries(hindiNumMap)) {
    if (lower.includes(`${word} din`) || lower.includes(`${word} days`)) {
      return `${num} days`;
    }
  }

  // Weeks
  const weekMatch = lower.match(/(?:for\s+)?(\d+)\s*(?:weeks?|week|हफ्ते|hafte)/i);
  if (weekMatch && weekMatch[1]) {
    const d = parseInt(weekMatch[1], 10) * 7;
    return `${d} days (${weekMatch[1]} week${weekMatch[1] > 1 ? 's' : ''})`;
  }
  if (lower.includes('one week') || lower.includes('1 week') || lower.includes('ek hafta')) {
    return '7 days (1 week)';
  }
  if (lower.includes('two weeks') || lower.includes('2 weeks') || lower.includes('do hafte')) {
    return '14 days (2 weeks)';
  }

  // Months
  const monthMatch = lower.match(/(?:for\s+)?(\d+)\s*(?:months?|month|महीने|mahine)/i);
  if (monthMatch && monthMatch[1]) {
    const d = parseInt(monthMatch[1], 10) * 30;
    return `${d} days (${monthMatch[1]} month${monthMatch[1] > 1 ? 's' : ''})`;
  }
  if (lower.includes('one month') || lower.includes('1 month') || lower.includes('ek mahina') || lower.includes('एक महीना')) {
    return '30 days (1 month)';
  }

  if (lower.includes('sos') || lower.includes('as needed') || lower.includes('जब जरूरत हो') || lower.includes('जरूरत पड़ने पर')) {
    return 'SOS (As needed)';
  }

  return defaultVal;
}

/**
 * Parses "at what timings the patient have to take"
 * Extracts frequency, time of day (Morning/Afternoon/Night), and meal relationship
 */
export function extractTimings(text, defaultType = 'Tablet') {
  if (!text) {
    return {
      frequency: '1-0-1 (Twice daily)',
      timing: 'Morning & Night (1-0-1) • After meals',
      instructions: 'Take after meals with water'
    };
  }

  const lower = text.toLowerCase();
  let frequency = '';
  let slotLabel = '';
  let mealRelation = '';

  // 1. Frequency / Slots
  if (
    lower.includes('twice daily') ||
    lower.includes('twice a day') ||
    lower.includes('two times') ||
    lower.includes('2 times') ||
    lower.includes('1-0-1') ||
    lower.includes('do baar') ||
    lower.includes('दो बार') ||
    lower.includes('subah aur raat') ||
    lower.includes('subah शाम') ||
    lower.includes('subah sham')
  ) {
    frequency = '1-0-1 (Twice daily)';
    slotLabel = 'Morning & Night (1-0-1)';
  } else if (
    lower.includes('thrice daily') ||
    lower.includes('thrice a day') ||
    lower.includes('three times') ||
    lower.includes('3 times') ||
    lower.includes('1-1-1') ||
    lower.includes('teen baar') ||
    lower.includes('तीन बार') ||
    lower.includes('subah dopahar raat') ||
    lower.includes('subah dopahar sham')
  ) {
    frequency = '1-1-1 (Thrice daily)';
    slotLabel = 'Morning, Afternoon & Night (1-1-1)';
  } else if (
    lower.includes('four times') ||
    lower.includes('4 times') ||
    lower.includes('1-1-1-1') ||
    lower.includes('char baar')
  ) {
    frequency = '1-1-1-1 (Four times daily)';
    slotLabel = 'Every 6 hours (1-1-1-1)';
  } else if (
    lower.includes('once at night') ||
    lower.includes('at night') ||
    lower.includes('bedtime') ||
    lower.includes('0-0-1') ||
    lower.includes('raat ko') ||
    lower.includes('रात को') ||
    lower.includes('sone se pehle') ||
    lower.includes('सोने से पहले')
  ) {
    frequency = '0-0-1 (Night only)';
    slotLabel = 'Night at bedtime (0-0-1)';
  } else if (
    lower.includes('afternoon only') ||
    lower.includes('0-1-0') ||
    lower.includes('dopahar') ||
    lower.includes('दोपहर')
  ) {
    frequency = '0-1-0 (Afternoon only)';
    slotLabel = 'Afternoon (0-1-0)';
  } else if (
    lower.includes('once daily') ||
    lower.includes('once a day') ||
    lower.includes('1-0-0') ||
    lower.includes('morning') ||
    lower.includes('subah') ||
    lower.includes('सुबह') ||
    lower.includes('ek baar') ||
    lower.includes('एक बार')
  ) {
    frequency = '1-0-0 (Once daily)';
    slotLabel = 'Morning (1-0-0)';
  } else if (
    lower.includes('sos') ||
    lower.includes('as needed') ||
    lower.includes('jab dard') ||
    lower.includes('jab bukhar') ||
    lower.includes('jarurat padne par')
  ) {
    frequency = 'SOS (As needed)';
    slotLabel = 'SOS (When needed for fever/pain)';
  } else {
    frequency = '1-0-1 (Twice daily)';
    slotLabel = 'Morning & Night (1-0-1)';
  }

  // 2. Meal relation (Empty stomach / before meals vs after meals vs with meals)
  if (
    lower.includes('empty stomach') ||
    lower.includes('before breakfast') ||
    lower.includes('before meal') ||
    lower.includes('before food') ||
    lower.includes('khali pet') ||
    lower.includes('खाली पेट') ||
    lower.includes('खाने से पहले')
  ) {
    mealRelation = 'Before meals (Empty stomach)';
  } else if (
    lower.includes('after food') ||
    lower.includes('after meal') ||
    lower.includes('after meals') ||
    lower.includes('after breakfast') ||
    lower.includes('after lunch') ||
    lower.includes('after dinner') ||
    lower.includes('post meal') ||
    lower.includes('khana khane ke baad') ||
    lower.includes('खाने के बाद')
  ) {
    mealRelation = 'After meals';
  } else if (
    lower.includes('with food') ||
    lower.includes('with meal') ||
    lower.includes('खाने के साथ')
  ) {
    mealRelation = 'With meals';
  } else if (lower.includes('bedtime') || lower.includes('sone se pehle')) {
    mealRelation = 'At bedtime';
  } else {
    // Default sensible meal relation based on formulation/drug
    if (lower.includes('pantoprazole') || lower.includes('omeprazole') || lower.includes('rabeprazole') || lower.includes('pan 40')) {
      mealRelation = 'Before breakfast (Empty stomach)';
    } else {
      mealRelation = 'After meals';
    }
  }

  const timing = `${slotLabel} • ${mealRelation}`;
  const instructions = `Take ${mealRelation.toLowerCase()} with water`;

  return {
    frequency,
    timing,
    instructions
  };
}

export const aiTranscribeService = {
  isSpeechRecognitionSupported() {
    return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  },

  createSpeechRecognizer({ onResult, onError, onEnd, language = 'en-IN' }) {
    if (!this.isSpeechRecognitionSupported()) {
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    if (language === 'mr' || language === 'mr-IN') {
      recognition.lang = 'mr-IN';
    } else if (language === 'hi' || language === 'hi-IN') {
      recognition.lang = 'hi-IN';
    } else {
      recognition.lang = 'en-IN';
    }

    // Safely accumulate full spoken text so subsequent turns don't overwrite previous spoken words
    recognition.onresult = (event) => {
      let finalSegment = '';
      let interimSegment = '';

      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i][0];
        if (!item || !item.transcript) continue;
        const piece = item.transcript.trim();
        if (event.results[i].isFinal) {
          finalSegment += (finalSegment ? ' ' : '') + piece;
        } else {
          interimSegment += (interimSegment ? ' ' : '') + piece;
        }
      }

      const full = (finalSegment + (interimSegment ? ' ' + interimSegment : '')).trim();

      if (onResult) {
        onResult({ final: finalSegment, interim: interimSegment, full });
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition warning/error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    return recognition;
  },

  /**
   * Smart AI Medicine & Prescription Extraction Engine
   * Strictly extracts ONLY:
   * 1. Medicine Name, Formulation & Strength
   * 2. For how many days (Duration)
   * 3. At what timings the patient has to take (Timing & Frequency)
   */
  parseMedicalTranscript(rawText) {
    if (!rawText || !rawText.trim()) {
      return {
        rawTranscript: '',
        medicines: [],
        totalCount: 0
      };
    }

    const text = rawText.trim();
    const lower = text.toLowerCase();

    const medicines = [];
    const matchedDrugNames = new Set();
    const matchedAliases = new Set();

    // 1. Search for Known Drugs from the comprehensive medical catalog
    COMMON_DRUG_DATABASE.forEach((drug) => {
      let matchedAlias = null;
      for (const alias of drug.aliases) {
        // Regex word boundary matching for aliases to avoid partial false positives
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        if (regex.test(lower)) {
          matchedAlias = alias;
          break;
        }
      }

      if (matchedAlias) {
        matchedDrugNames.add(drug.name.toLowerCase());
        matchedAliases.add(matchedAlias.toLowerCase());
        drug.aliases.forEach((a) => matchedAliases.add(a.toLowerCase()));

        // Extract the contextual sentence / clause for this drug to determine its duration & timings
        const aliasEscaped = matchedAlias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match from the drug mention until the next comma/period/and/or next drug
        const clauseRegex = new RegExp(`(?:Tablet|Tab|Capsule|Cap|Syrup|Syp)?\\s*${aliasEscaped}[^.,;\\n]*(?:[.,;\\n]|and|aur|$)`, 'i');
        const clauseMatch = lower.match(clauseRegex);
        const contextText = clauseMatch ? clauseMatch[0] : lower;

        // Strength override check (e.g. if spoken "Paracetamol 500mg" vs default 650mg)
        let resolvedName = drug.name;
        const strengthMatch = contextText.match(/(\d+\s*(?:mg|g|ml|mcg|iu))/i);
        if (strengthMatch && strengthMatch[1]) {
          const baseName = drug.name.replace(/\s*\d+\s*(?:mg|g|ml|mcg|iu)/i, '').trim();
          resolvedName = `${baseName} ${strengthMatch[1].replace(/\s+/g, '')}`;
        }

        // Duration (how many days)
        const duration = extractDuration(contextText, drug.defaultDuration || '5 days');

        // Timings (when to take)
        const timingInfo = extractTimings(contextText, drug.type);

        medicines.push({
          name: resolvedName,
          type: drug.type,
          dosage: drug.defaultDose,
          duration,
          timing: timingInfo.timing,
          frequency: timingInfo.frequency,
          instructions: timingInfo.instructions
        });
      }
    });

    // 2. Dynamic Fallback Regex for medicines not present in the pre-defined catalog
    // Pattern: "(Tablet/Tab/Capsule/Cap/Syrup) [Medicine Name] [Optional Strength] [Timing] for [X days]"
    const dynamicMedRegex = /\b(Tablet|Tab|Capsule|Cap|Syrup|Syp|Injection|Inj|Drops?|Sachet)\s+([A-Za-z0-9\-+]{3,25}(?:\s+[A-Za-z0-9\-+]{2,15})?)\s*(\d+\s*(?:mg|g|ml|mcg|%)?)?/gi;
    let match;

    while ((match = dynamicMedRegex.exec(text)) !== null) {
      const typePrefix = match[1];
      const medNameRaw = match[2].trim();
      const strength = match[3] || '';
      const medNameLower = medNameRaw.toLowerCase();

      // Check if this word is just a common English/medical word (e.g., "Paracetamol", "twice daily", etc.)
      const ignoredWords = ['twice', 'thrice', 'once', 'daily', 'every', 'after', 'before', 'with', 'food', 'meals', 'days', 'hours', 'night', 'morning'];
      if (ignoredWords.includes(medNameLower)) continue;

      const normalizedType =
        typePrefix.toLowerCase().startsWith('tab') ? 'Tablet' :
        typePrefix.toLowerCase().startsWith('cap') ? 'Capsule' :
        typePrefix.toLowerCase().startsWith('syp') || typePrefix.toLowerCase().startsWith('syrup') ? 'Syrup' :
        typePrefix.toLowerCase().startsWith('inj') ? 'Injection' :
        typePrefix.toLowerCase().startsWith('drop') ? 'Drops' :
        typePrefix.toLowerCase().startsWith('sachet') ? 'Sachet' : 'Tablet';

      const fullCandidateName = `${medNameRaw}${strength ? ' ' + strength.trim() : ''}`.trim();

      // Check if we already added this via catalog or already in medicines list
      const medTokens = medNameLower.split(/\s+/);
      const alreadyAdded =
        medicines.some((m) => {
          const mLower = m.name.toLowerCase();
          return medTokens.some((t) => t.length > 3 && mLower.includes(t));
        }) ||
        Array.from(matchedAliases).some((a) => a.length > 3 && (medNameLower.includes(a) || a.includes(medNameLower)));

      if (!alreadyAdded && medNameRaw.length > 2) {
        // Find clause context around this match
        const startIdx = match.index;
        const chunk = text.slice(startIdx, startIdx + 120);

        const duration = extractDuration(chunk, '5 days');
        const timingInfo = extractTimings(chunk, normalizedType);

        medicines.push({
          name: fullCandidateName,
          type: normalizedType,
          dosage: normalizedType === 'Syrup' ? '10 ml' : '1 tablet',
          duration,
          timing: timingInfo.timing,
          frequency: timingInfo.frequency,
          instructions: timingInfo.instructions
        });
      }
    }

    return {
      rawTranscript: text,
      medicines,
      totalCount: medicines.length
    };
  }
};
