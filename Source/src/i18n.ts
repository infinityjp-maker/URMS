import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enJSON from './locales/en.json';
import jaJSON from './locales/ja.json';

const resources = {
  en: { translation: enJSON },
  ja: { translation: jaJSON },
};

// Get saved language or default to 'ja'
const savedLanguage = localStorage.getItem('urms.language') || 'ja';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'ja',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('urms.language', lng);
});

export default i18n;
