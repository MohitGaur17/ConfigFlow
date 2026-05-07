'use client';

import { Globe } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslation';
import { languages } from '@/i18n/translations';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current language info
  const currentLang = languages.find((l) => l.code === language);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-900 active:scale-[0.98]"
        title={t('nav.language')}
        aria-label={t('nav.language')}
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{currentLang?.nativeName}</span>
        <span className="inline sm:hidden text-xs">{language.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900 shadow-lg backdrop-blur-xl">
          <div className="p-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  language === lang.code
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-300 hover:bg-white/5'
                }`}
              >
                <div className="font-semibold">{lang.nativeName}</div>
                <div className="text-xs text-slate-400">{lang.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
