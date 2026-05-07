'use client';

import { useLanguage } from './LanguageContext';
import { useEffect } from 'react';
import { Language } from './translations';

interface LanguageConfig {
  defaultLanguage?: Language;
  supportedLanguages?: Language[];
  detectFromBrowser?: boolean;
}

/**
 * Hook to configure language settings from app config or props
 * Allows for programmatic language setting based on configuration
 */
export function useLanguageConfig(config?: LanguageConfig) {
  const { setLanguage } = useLanguage();

  useEffect(() => {
    if (!config) return;

    if (config.defaultLanguage) {
      setLanguage(config.defaultLanguage);
    }
  }, [config, setLanguage]);

  return {
    setLanguageFromConfig: (lang: Language) => {
      if (config?.supportedLanguages && !config.supportedLanguages.includes(lang)) {
        console.warn(`Language ${lang} not in supported languages`);
        return false;
      }
      setLanguage(lang);
      return true;
    },
  };
}

/**
 * Helper function to get language from URL query parameters
 * Usage: ?lang=es will set language to Spanish
 */
export function getLanguageFromUrl(): Language | null {
  if (typeof window === 'undefined') return null;
  
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  
  const validLanguages: Language[] = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ar'];
  return lang && validLanguages.includes(lang as Language) ? (lang as Language) : null;
}

/**
 * Creates a language switcher for given supported languages
 */
export function createLanguageConfig(
  defaultLanguage?: Language,
  supportedLanguages?: Language[]
): LanguageConfig {
  return {
    defaultLanguage: defaultLanguage || 'en',
    supportedLanguages: supportedLanguages || ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ar'],
    detectFromBrowser: true,
  };
}
