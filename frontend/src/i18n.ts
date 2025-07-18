import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Импорт языковых ресурсов
import translationRu from './locales/ru/translation.json';
import translationEn from './locales/en/translation.json';

// Настройка ресурсов
const resources = {
  ru: {
    translation: translationRu
  },
  en: {
    translation: translationEn
  }
};

// Конфигурация i18n
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'ru', // Язык по умолчанию
    fallbackLng: 'ru', // Запасной язык, если перевода нет
    interpolation: {
      escapeValue: false // Реакт уже экранирует значения
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

export default i18n; 