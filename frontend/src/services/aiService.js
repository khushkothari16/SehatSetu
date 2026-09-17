import { delay } from './api';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AQ.Ab8RN6K8eUIQ5jQFye4bamdQOm2ojvpECENTh9SfymaHfSxxjg';
const PRIMARY_MODEL = 'gemini-3.6-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash';

export const aiService = {
  // Safety detector for high-risk red-flag symptoms
  detectEmergencyFlags(text) {
    const lower = (text || '').toLowerCase();
    const redFlags = [
      { trigger: 'chest pain', message: 'Crushing or radiating chest discomfort is a potential cardiac emergency.' },
      { trigger: 'cannot breathe', message: 'Severe respiratory distress requires immediate clinical intervention.' },
      { trigger: 'shortness of breath', message: 'Sudden shortness of breath may indicate acute cardiopulmonary stress.' },
      { trigger: 'unconscious', message: 'Loss of consciousness is a critical emergency.' },
      { trigger: 'fainted', message: 'Unexplained syncope requires emergency medical evaluation.' },
      { trigger: 'snake', message: 'Suspected snakebite requires immediate Anti-Snake Venom at a PHC/Hospital.' },
      { trigger: 'poison', message: 'Ingestion of pesticide or toxic substance is an acute medical emergency.' },
      { trigger: 'heavy bleeding', message: 'Uncontrolled hemorrhage requires immediate direct pressure and emergency transport.' },
      { trigger: 'stroke', message: 'Facial drooping, arm weakness, or slurred speech are urgent signs of stroke.' }
    ];

    for (const flag of redFlags) {
      if (lower.includes(flag.trigger)) {
        return {
          isEmergency: true,
          matchedTrigger: flag.trigger,
          warningMessage: `⚠️ RED FLAG DETECTED: ${flag.message} Please DO NOT delay. Activate Emergency SOS immediately or call 108.`
        };
      }
    }

    return { isEmergency: false };
  },

  /**
   * Helper to call Google Gemini API with fallback models
   */
  async callGeminiApi({ prompt, mediaType, mediaUrl, language = 'en' }) {
    if (!GEMINI_API_KEY) return null;

    const langInstructions = {
      hi: 'IMPORTANT: Respond clearly and politely in Hindi (हिंदी). Use simple, understandable words suitable for rural families.',
      mr: 'IMPORTANT: Respond clearly and politely in Marathi (मराठी). Use simple, compassionate language.',
      en: 'IMPORTANT: Respond clearly and politely in English with simple, easy-to-understand explanations.'
    };

    const selectedLangInstruction = langInstructions[language] || langInstructions.en;

    const systemPrompt = `You are "SehatSetu Swasthya Sahayak" (सेहतसेतु स्वास्थ्य सहायक), a verified AI rural healthcare assistant for India (SIH 2026).
${selectedLangInstruction}
- Always provide COMPLETE, THOROUGH, and DETAILED medical guidance and health literacy. Never cut off or shorten responses mid-sentence.
- Structure your response into clear, comprehensive sections:
  1. Explanation: What the symptom/condition generally indicates.
  2. Practical Home Care & Comfort: Hydration, rest, nutrition, cooling/steam measures.
  3. Over-the-Counter Guidance: Standard Jan Aushadhi generic medicines (e.g. Paracetamol, ORS) with safe dosage cautions.
  4. Red Flags / Warning Signs: Specific signs (e.g. fever > 102°F, breathlessness, duration > 48h) requiring urgent medical care.
  5. Next Steps: When and how to consult a doctor at the Primary Health Centre (PHC Room 4) or book a teleconsultation.
- Keep the tone encouraging, reassuring, and culturally respectful.`;

    const parts = [
      { text: `${systemPrompt}\n\nPatient Query: ${prompt}` }
    ];

    // Handle base64 image if attached
    if (mediaUrl && mediaUrl.startsWith('data:image')) {
      const match = mediaUrl.match(/^data:(image\/\w+);base64,(.+)$/);
      if (match) {
        parts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2]
          }
        });
      }
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
      ]
    };

    const modelsToTry = [PRIMARY_MODEL, FALLBACK_MODEL];

    for (const model of modelsToTry) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          }
        );

        if (response.ok) {
          const data = await response.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            return generatedText.trim();
          }
        } else {
          console.warn(`Gemini API returned status ${response.status} for ${model}`);
        }
      } catch (err) {
        console.warn(`Gemini API error with ${model}:`, err);
      }
    }

    return null;
  },

  /**
   * Main query method for the AI Assistant with Gemini & Offline Rule fallback
   */
  async queryAssistant({ prompt, mediaType, mediaUrl, language = 'en' }) {
    // 1. Critical safety emergency check first
    const safety = this.detectEmergencyFlags(prompt);
    if (safety.isEmergency) {
      return {
        role: 'assistant',
        isEmergencyAlert: true,
        text: safety.warningMessage,
        suggestedActions: [
          { type: 'emergency', label: '🚨 Trigger Emergency SOS (108)', action: 'OPEN_EMERGENCY' },
          { type: 'doctor', label: '👨‍⚕️ View Emergency OPD Doctors', action: 'OPEN_DOCTORS' }
        ],
        disclaimer: 'DISCLAIMER: This AI assistant is an informational triage aid only and cannot provide medical diagnosis or replace a licensed physician.'
      };
    }

    // 2. Attempt real live Gemini API generation
    let geminiText = null;
    try {
      geminiText = await this.callGeminiApi({ prompt, mediaType, mediaUrl, language });
    } catch (apiError) {
      console.warn('Gemini query encountered error, falling back to local guidance:', apiError);
    }

    if (geminiText) {
      // Dynamic follow-up suggestion generator based on query
      const followUps = this.generateFollowUpSuggestions(prompt, language);

      return {
        role: 'assistant',
        isEmergencyAlert: false,
        text: geminiText,
        hasMedia: Boolean(mediaUrl),
        mediaType: mediaType || null,
        followUpSuggestions: followUps,
        disclaimer: 'DISCLAIMER: Powered by Google Gemini AI. General health literacy only; does not replace consultation with a registered medical practitioner.'
      };
    }

    // 3. Robust offline rule-based fallback (if network is unavailable or quota exceeds)
    await delay(300);
    const lower = (prompt || '').toLowerCase();
    let answer = '';
    let followUpSuggestions = [];

    if (lower.includes('fever') || lower.includes('temperature') || lower.includes('ताप') || lower.includes('बुखार')) {
      if (language === 'hi') {
        answer = `**हल्के बुखार के लिए सम्पूर्ण प्राथमिक मार्गदर्शन:**\n\n1. **आराम और जलयोजन (Rest & Hydration):**\n   - खूब उबला हुआ ठंडा पानी, नारियल पानी, ओआरएस या पतली दाल का सूप पिएं ताकि शरीर में पानी की कमी न हो।\n   - भरपूर आराम करें और भारी काम से बचें।\n\n2. **शरीर का तापमान नियंत्रित करना (Cooling):**\n   - हल्के, सूती और ढीले कपड़े पहनें। भारी कंबल न ओढ़ें।\n   - यदि माथा बहुत गरम लगे तो सामान्य तापमान वाले ताजे पानी की पट्टी माथे व गर्दन पर रखें।\n\n3. **सुरक्षित दवा (Jan Aushadhi Generic):**\n   - दर्द व बेचैनी में प्रधानमंत्री जन औषधि केंद्र से पैरासिटामोल (Paracetamol) डॉक्टर या फार्मासिस्ट के निर्देशानुसार लें।\n\n4. **खतरे के लक्षण (कब डॉक्टर को तुरंत दिखाएं):**\n   - बुखार 102°F से अधिक हो या 48 घंटे से अधिक लगातार बना रहे।\n   - सांस लेने में कठिनाई, तेज सिरदर्द, गर्दन में अकड़न या उल्टी हो तो तुरंत नजदीकी पीएचसी (कमरा 4) में संपर्क करें।`;
      } else if (language === 'mr') {
        answer = `**सौम्य तापासाठी संपूर्ण प्राथमिक मार्गदर्शन:**\n\n1. **विश्रांती आणि भरपूर पाणी (Hydration):**\n   - भरपूर उकळलेले थंड पाणी, नारळ पाणी, किंवा सूप प्या.\n   - शरीराला पुरेशी विश्रांती द्या.\n\n2. **तापमान नियंत्रण:**\n   - सैल सुती कपडे घाला. कपाळावर साध्या पाण्याच्या घड्या ठेवा.\n\n3. **औषधे (Jan Aushadhi):**\n   - आवश्यकतेनुसार जन औषधी केंद्रातून पॅरासिटामॉल गोळी डॉक्टरांच्या सल्ल्याने घ्या.\n\n4. **धोक्याची चिन्हे:**\n   - ताप १०२°F पेक्षा जास्त असल्यास किंवा २ दिवसांपेक्षा जास्त राहिल्यास तातडीने प्राथमिक आरोग्य केंद्रात (PHC) डॉक्टरांना दाखवा.`;
      } else {
        answer = `**Comprehensive Guidance for Mild Fever:**\n\n1. **Rest & Hydration:**\n   - Drink plenty of clean boiled & cooled water, ORS, tender coconut water, or clear broth to prevent dehydration.\n   - Avoid strenuous physical exertion; give your body adequate rest.\n\n2. **Temperature Management:**\n   - Wear loose, breathable cotton clothing. Avoid heavy blankets.\n   - If body feels hot, apply lukewarm or room-temperature wet cloth sponging on forehead and neck. Avoid cold water or ice baths.\n\n3. **Safe Over-the-Counter Relief:**\n   - Jan Aushadhi generic Paracetamol (500mg) can help relieve body ache and lower temperature as per physician/pharmacist advice.\n\n4. **Red Flags & Warning Signs:**\n   - Temperature exceeds 102°F (38.9°C) or persists beyond 48–72 hours.\n   - Accompanied by stiff neck, shortness of breath, continuous vomiting, or confusion.\n   - If warning signs appear, visit your nearest Primary Health Centre (PHC Room 4) or start a Teleconsultation immediately.`;
      }
      followUpSuggestions = this.generateFollowUpSuggestions(prompt, language);
    } else if (lower.includes('cough') || lower.includes('cold') || lower.includes('खोकला') || lower.includes('खांसी')) {
      if (language === 'hi') {
        answer = `**हल्की खांसी व जुकाम के लिए सम्पूर्ण देखभाल:**\n\n1. **भाप लेना (Steam Inhalation):** दिन में 1-2 बार सादे गर्म पानी की भाप लें।\n2. **गरारे (Warm Saline Gargle):** हल्के गर्म पानी में चुटकी भर नमक डालकर दिन में 2 बार गरारे करें।\n3. **गर्म तरल पदार्थ:** अदरक-तुलसी की चाय, गर्म पानी या हल्दी वाला दूध पिएं।\n4. **सावधानी:** यदि सांस फूलती है या 5 दिन से अधिक खांसी रहे तो पीएचसी में डॉक्टर को दिखाएं।`;
      } else if (language === 'mr') {
        answer = `**सौम्य खोकला आणि सर्दीसाठी संपूर्ण काळजी:**\n\n1. **वाफ घेणे (Steam Inhalation):** दिवसातून १-२ वेळा साध्या गरम पाण्याची वाफ घ्या.\n2. **गुळण्या करणे (Warm Saline Gargle):** कोमट पाण्यात थोडे मीठ टाकून दिवसातून २ वेळा गुळण्या करा.\n3. **गरम पेये:** आलं-तुळशीचा चहा, कोमट पाणी किंवा हळदीचे दूध प्या.\n4. **खबरदारी:** धाप लागत असल्यास किंवा ५ दिवसांपेक्षा जास्त खोकला राहिल्यास प्राथमिक आरोग्य केंद्रात (PHC) डॉक्टरांना दाखवा.`;
      } else {
        answer = `**Comprehensive Guidance for Mild Cough & Cold:**\n\n1. **Steam Inhalation:** Inhaling plain warm steam 1-2 times daily helps clear nasal congestion.\n2. **Warm Saline Gargle:** Gargle with warm salt water twice daily to soothe throat irritation.\n3. **Warm Fluids:** Sip warm water, ginger-tulsi tea, or warm turmeric milk to stay hydrated.\n4. **Warning Signs:** If your cough produces discolored phlegm, blood, or is accompanied by chest pain or shortness of breath, please book an appointment with a General Physician immediately.`;
      }
      followUpSuggestions = this.generateFollowUpSuggestions(prompt, language);
    } else if (lower.includes('ors') || lower.includes('diarrhea') || lower.includes('loose motion') || lower.includes('उलट्या') || lower.includes('दस्त')) {
      if (language === 'hi') {
        answer = `**ओआरएस (ORS) घोल बनाने व दस्त में सम्पूर्ण निर्देश:**\n\n1. **तैयारी:** जन औषधि ओआरएस का 1 पूरा पैकेट ठीक 1 लीटर उबले व ठंडे किए पानी में घोलें।\n2. **सेवन:** प्रत्येक दस्त या उल्टी के बाद 1 गिलास थोड़ा-थोड़ा करके पिएं।\n3. **घरेलू विकल्प:** 1 लीटर पानी में 6 चम्मच चीनी और आधा चम्मच नमक घोलें।\n4. **चेतावनी:** यदि आंखें धंसने लगें, अत्यधिक प्यास लगे या 6 घंटे से पेशाब न आए, तो बिना देरी किए तुरंत अस्पताल जाएं।`;
      } else if (language === 'mr') {
        answer = `**ओआरएस (ORS) द्रावण तयार करणे आणि अतिसारासाठी सूचना:**\n\n1. **तयारी:** जन औषधी ओआरएसचे १ पूर्ण पाकीट बरोबर १ लिटर उकळून थंड केलेल्या पाण्यात विरघळवा.\n2. **वापर:** प्रत्येक जुलाब किंवा उलटीनंतर १ ग्लास थोडे थोडे करून प्या.\n3. **घरगुती पर्याय:** १ लिटर पाण्यात ६ चमचे साखर आणि अर्धा चमचा मीठ विरघळवा.\n4. **तातडीचा इशारा:** डोळे खोल जाणे, खूप तहान लागणे किंवा ६ तास लघवी न होणे अशी लक्षणे दिसल्यास तातडीने रुग्णालयात जा.`;
      } else {
        answer = `**Comprehensive Oral Rehydration Therapy (ORS) Instructions:**\n\n1. **Preparation:** Mix 1 standard sachet of Jan Aushadhi ORS in exactly 1 Liter of clean boiled & cooled drinking water.\n2. **Usage:** Give small, frequent sips after each loose stool or vomiting episode.\n3. **Home Alternative:** In 1 Liter of clean water, mix 6 level teaspoons of sugar and 1/2 level teaspoon of salt.\n4. **Urgent Warning:** Look out for signs of severe dehydration: sunken eyes, extreme thirst, dry mouth, or no urination for 6 hours. Seek PHC medical care immediately.`;
      }
      followUpSuggestions = this.generateFollowUpSuggestions(prompt, language);
    } else {
      if (language === 'hi') {
        answer = `सेहतसेतु स्वास्थ्य सहायक से संपर्क करने के लिए धन्यवाद।\n\n1. **आराम और जलयोजन:** पर्याप्त आराम करें और साफ पीने के पानी से हाइड्रेटेड रहें।\n2. **निगरानी:** अगले 24 घंटों तक अपने लक्षणों की सावधानीपूर्वक निगरानी करें।\n3. **डॉक्टर परामर्श:** यदि लक्षण बिगड़ते हैं या बने रहते हैं, तो कृपया अपॉइंटमेंट बुक करें या नजदीकी प्राथमिक स्वास्थ्य केंद्र (PHC कमरा 4) में जाएं।\n\nक्या आप अपॉइंटमेंट बुक करना चाहते हैं या ओपीडी टोकन स्थिति देखना चाहते हैं?`;
      } else if (language === 'mr') {
        answer = `सेहतसेतू आरोग्य सहायकाशी संपर्क साधल्याबद्दल धन्यवाद.\n\n१. **विश्रांती आणि पाणी:** पुरेशी विश्रांती घ्या आणि स्वच्छ पिण्याचे पाणी पिऊन हायड्रेटेड राहा.\n२. **लक्ष ठेवणे:** पुढील २४ तास आपल्या लक्षणांवर काळजीपूर्वक लक्ष ठेवा.\n३. **डॉक्टरांचा सल्ला:** लक्षणे वाढल्यास किंवा कायम राहिल्यास, कृपया अपॉइंटमेंट बुक करा किंवा जवळच्या प्राथमिक आरोग्य केंद्रात (PHC) भेट द्या.\n\nतुम्हाला डॉक्टरांची वेळ घ्यायची आहे का किंवा ओपीडी रांगेची स्थिती पहायची आहे का?`;
      } else {
        answer = `Thank you for reaching out to SehatSetu Swasthya Sahayak.\n\n1. **Rest & Hydration:** Maintain adequate rest and stay well hydrated with clean drinking water.\n2. **Observation:** Monitor your symptoms carefully over the next 24 hours.\n3. **Medical Consultation:** If symptoms worsen, persist, or cause discomfort, please schedule an appointment or visit Room 4 at your nearest Primary Health Centre (PHC).\n\nWould you like me to help you book an appointment or check OPD token availability?`;
      }
      followUpSuggestions = this.generateFollowUpSuggestions(prompt, language);
    }

    return {
      role: 'assistant',
      isEmergencyAlert: false,
      text: answer,
      hasMedia: Boolean(mediaUrl),
      mediaType: mediaType || null,
      followUpSuggestions,
      disclaimer: 'DISCLAIMER: This system provides general health literacy and non-diagnostic triage. It does not replace professional medical advice or emergency care.'
    };
  },

  generateFollowUpSuggestions(prompt, language) {
    const lower = (prompt || '').toLowerCase();
    if (language === 'hi') {
      if (lower.includes('बुखार') || lower.includes('ताप') || lower.includes('fever')) {
        return ['डॉक्टर को कब दिखाना चाहिए?', 'दवा की सही खुराक क्या है?', 'निकटतम प्राथमिक स्वास्थ्य केंद्र'];
      }
      return ['नजदीकी डॉक्टर से अपॉइंटमेंट लें', 'ओपीडी कतार स्थिति देखें', 'जन औषधि केंद्र खोजें'];
    }
    if (language === 'mr') {
      return ['जवळच्या डॉक्टरांची वेळ घ्या', 'ओपीडी रांगेची स्थिती', 'जन औषधी केंद्र शोधा'];
    }
    if (lower.includes('fever') || lower.includes('temperature')) {
      return ['When should I see a PHC doctor?', 'What diet is recommended during fever?', 'Check Room 4 OPD Queue'];
    }
    return ['Book appointment with General Physician', 'Check live OPD queue status', 'Find nearest Jan Aushadhi Pharmacy'];
  }
};
