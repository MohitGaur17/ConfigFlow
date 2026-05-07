'use client';

import { useLanguage } from './LanguageContext';

export function useTranslation() {
  const { t, language, setLanguage, direction } = useLanguage();

  return {
    t,
    language,
    setLanguage,
    direction,
  };
}
