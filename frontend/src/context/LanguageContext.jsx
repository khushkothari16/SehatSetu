import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('sehatsetu_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('sehatsetu_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, fallback) => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key]) return langDict[key];
    
    // In case language is Marathi and key is missing in Marathi, fall back to Hindi before English
    if (language === 'mr' && translations.hi && translations.hi[key]) {
      return translations.hi[key];
    }

    return fallback || (translations.en && translations.en[key]) || key;
  };

  // Direct 3-way language translator helper: tr(enText, hiText, mrText)
  const tr = (en, hi, mr) => {
    if (language === 'mr') return mr || hi || en;
    if (language === 'hi') return hi || en;
    return en;
  };

  const changeLanguage = (lang) => {
    if (['en', 'hi', 'mr'].includes(lang)) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, tr }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
