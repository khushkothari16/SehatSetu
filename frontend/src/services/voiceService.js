/**
 * Voice & Speech Synthesis Service for SehatSetu
 * SIH 2026 - Rural Multilingual Accessibility
 * 
 * Features:
 * - Speech-to-Text (STT): Real Web Speech Recognition in Hindi, Marathi, and English.
 * - Text-to-Speech (TTS): Speech Synthesis for patient answers with clean markdown stripping.
 */

export const voiceService = {
  // Check if speech recognition is supported in current browser
  isSpeechRecognitionSupported() {
    return Boolean(
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  },

  // Check if text-to-speech synthesis is supported
  isSpeechSynthesisSupported() {
    return Boolean(typeof window !== 'undefined' && window.speechSynthesis);
  },

  /**
   * Map app language to standard BCP 47 language code
   */
  getLanguageCode(appLang = 'en') {
    switch (appLang) {
      case 'hi':
        return 'hi-IN';
      case 'mr':
        return 'mr-IN';
      case 'en':
      default:
        return 'en-IN';
    }
  },

  /**
   * Start Speech-to-Text listening session
   */
  startListening({ onResult, onError, onEnd, language = 'en' }) {
    if (!this.isSpeechRecognitionSupported()) {
      if (onError) onError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = this.getLanguageCode(language);

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (onResult) {
        onResult({
          final: finalTranscript.trim(),
          interim: interimTranscript.trim(),
          text: (finalTranscript || interimTranscript).trim()
        });
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition event error:', event.error);
      if (onError) onError(event.error);
    };

    recognition.onend = () => {
      if (onEnd) onEnd();
    };

    try {
      recognition.start();
      return recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      if (onError) onError(err.message || 'Mic access failed');
      return null;
    }
  },

  /**
   * Clean markdown tags for natural, human-like voice reading
   */
  cleanTextForSpeech(markdownText) {
    if (!markdownText) return '';
    return markdownText
      .replace(/[*_~`#]+/g, '') // Remove markdown bold/italic/headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) -> link text
      .replace(/[🚨⚠️🩺💉●•]+/g, '') // Remove icons/emojis that sound awkward in TTS
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Speak given text aloud via SpeechSynthesis
   */
  speakText({ text, language = 'en', onStart, onEnd, onError }) {
    if (!this.isSpeechSynthesisSupported()) {
      if (onError) onError('Text-to-speech is not supported on this device.');
      return;
    }

    // Stop any ongoing speech first
    window.speechSynthesis.cancel();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langCode = this.getLanguageCode(language);
    utterance.lang = langCode;
    utterance.rate = 0.95; // Slightly slower, calm cadence for medical guidance
    utterance.pitch = 1.0;

    // Try finding the best regional voice
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.startsWith(langCode.slice(0, 2)) || v.lang === langCode);
    if (regionalVoice) {
      utterance.voice = regionalVoice;
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error:', e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    window.speechSynthesis.speak(utterance);
  },

  /**
   * Stop any active audio speech
   */
  stopSpeaking() {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  /**
   * Check if speech synthesis is currently speaking
   */
  isSpeaking() {
    return Boolean(typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking);
  }
};
