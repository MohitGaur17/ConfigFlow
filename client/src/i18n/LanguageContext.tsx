'use client';

import React, { createContext, useContext, useSyncExternalStore, ReactNode } from 'react';
import { Language, DEFAULT_LANGUAGE, translations } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, defaultValue?: string) => string;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const RTL_LANGUAGES: Language[] = ['ar'];
const LANGUAGE_STORAGE_KEY = 'language';
const LANGUAGE_CHANGE_EVENT = 'configflow-language-change';

function isLanguage(value: string): value is Language {
  return ['en', 'es', 'fr', 'de', 'ja', 'zh', 'pt', 'ar'].includes(value as Language);
}

function getBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE;

  const browserLang = navigator.language.split('-')[0].toLowerCase();
  return isLanguage(browserLang) ? browserLang : DEFAULT_LANGUAGE;
}

function getStoredLanguage(): Language | null {
  if (typeof window === 'undefined') return null;

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return storedLanguage && isLanguage(storedLanguage) ? storedLanguage : null;
}

function getLanguageSnapshot(): Language {
  return getStoredLanguage() || getBrowserLanguage();
}

function subscribeToLanguageChanges(callback: () => void) {
  if (typeof window === 'undefined') return () => undefined;

  const handleChange = () => callback();

  window.addEventListener('storage', handleChange);
  window.addEventListener(LANGUAGE_CHANGE_EVENT, handleChange);

  return () => {
    window.removeEventListener('storage', handleChange);
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleChange);
  };
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeToLanguageChanges, getLanguageSnapshot, () => DEFAULT_LANGUAGE);

  const setLanguage = (newLanguage: Language) => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    document.documentElement.dir = RTL_LANGUAGES.includes(newLanguage) ? 'rtl' : 'ltr';
    document.documentElement.lang = newLanguage;
  };

  const t = (key: string, defaultValue?: string): string => {
    const table: Record<string, string> = translations[language];

    if (key in table) {
      return table[key];
    }

    const keys = key.split('.');
    let current: unknown = table as Record<string, unknown>;

    for (const k of keys) {
      if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[k];
      } else {
        return defaultValue || key;
      }
    }

    return typeof current === 'string' ? current : defaultValue || key;
  };

  const direction: 'ltr' | 'rtl' = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

