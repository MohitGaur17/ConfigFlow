'use client';

import { useLanguageSyncDOM } from '@/i18n/useLanguageInitializer';

/**
 * Component that syncs language with DOM attributes
 * Must be placed inside LanguageProvider
 */
export default function LanguageSyncComponent() {
  useLanguageSyncDOM();
  return null;
}
