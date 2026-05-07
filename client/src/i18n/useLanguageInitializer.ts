'use client';

import { useEffect } from 'react';
import { useLanguage } from './LanguageContext';
import { getLanguageFromUrl } from './useLanguageConfig';

/**
 * Hook to initialize language from URL parameters
 * Place this in the root layout or app component
 * Allows ?lang=es parameter to set language
 */
export function useLanguageInitializer() {
  const { setLanguage, language } = useLanguage();

  useEffect(() => {
    const langFromUrl = getLanguageFromUrl();
    if (langFromUrl && langFromUrl !== language) {
      setLanguage(langFromUrl);
    }
  }, [language, setLanguage]);

  return null;
}

/**
 * Hook to sync language with document element
 * Ensures dir and lang attributes are always in sync
 */
export function useLanguageSyncDOM() {
  const { language, direction } = useLanguage();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
  }, [language, direction]);

  return null;
}
