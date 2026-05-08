# Multi-Language Support (i18n)

ConfigFlow includes built-in localization support with a language context, runtime switching, browser detection, and RTL handling.

## Features

- 8 supported languages: `en`, `es`, `fr`, `de`, `ja`, `zh`, `pt`, `ar`
- RTL language support for Arabic
- Browser language detection on first visit
- Local persistence via `localStorage`
- URL-based override with `?lang=<code>`
- Runtime language switch with no page reload

## Installation

The i18n system is pre-configured in the client app. No additional setup is required.

## Usage

### Using Translations in Components

```typescript
'use client';

import { useTranslation } from '@/i18n/useTranslation';

export default function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('home.title')}</h1>
      <p>{t('home.subtitle')}</p>
    </div>
  );
}
```

### Accessing Language Info

```typescript
const { t, language, setLanguage, direction } = useTranslation();

// language: current language code
// direction: 'ltr' or 'rtl'
// setLanguage(): change language programmatically
```

### Adding the Language Switcher

```typescript
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Header() {
  return (
    <header>
      <h1>My App</h1>
      <LanguageSwitcher />
    </header>
  );
}
```

## Core Files

- `src/i18n/translations.ts` - dictionary and language metadata
- `src/i18n/LanguageContext.tsx` - provider and language state
- `src/i18n/useTranslation.ts` - translation hook
- `src/i18n/useLanguageConfig.ts` - URL/config helpers

## Translation Keys

### Navigation
- `nav.allTasks` - All Tasks
- `nav.newTask` - New Task
- `nav.dashboard` - Dashboard
- `nav.language` - Language
- `nav.logout` - Sign out

### Authentication
- `auth.email` - Email
- `auth.password` - Password
- `auth.login` - Login
- `auth.register` - Register
- `auth.signup` - Sign up
- `auth.haveAccount` - Already have account?
- `auth.noAccount` - Don't have account?
- `auth.forgotPassword` - Forgot password?
- `auth.rememberMe` - Remember me
- `auth.loading` - Loading...

### Common Actions
- `common.save` - Save
- `common.cancel` - Cancel
- `common.delete` - Delete
- `common.edit` - Edit
- `common.close` - Close
- `common.confirm` - Confirm
- `common.error` - Error
- `common.success` - Success
- `common.loading` - Loading
- `common.noData` - No data available
- `common.back` - Back

## Adding New Translations

### Step 1: Update translations.ts

Edit `src/i18n/translations.ts` and add the key to all language objects:

```typescript
export const translations: Record<Language, Record<string, string>> = {
  en: {
    'myFeature.heading': 'My Feature',
    'myFeature.description': 'This is my feature',
  },
  es: {
    'myFeature.heading': 'Mi Caracteristica',
    'myFeature.description': 'Esta es mi caracteristica',
  },
};
```

### Step 2: Use in a Component

```typescript
const { t } = useTranslation();

return (
  <div>
    <h1>{t('myFeature.heading')}</h1>
    <p>{t('myFeature.description')}</p>
  </div>
);
```

## Adding New Languages

### Step 1: Extend the Language Type

```typescript
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'ar' | 'ko';
```

### Step 2: Add Language Metadata and Translations

```typescript
export const languages = [
  { code: 'ko', name: 'Korean', nativeName: 'Korean' },
];

export const translations: Record<Language, Record<string, string>> = {
  ko: {
    'nav.allTasks': 'All tasks',
  },
};
```

### Step 3: Optional RTL Support

```typescript
const RTL_LANGUAGES: Language[] = ['ar', 'he'];
```

## URL-Based Language Setting

Use URL query:

```text
https://your-app.com/?lang=fr
```

## Styling with Direction

```typescript
const { direction } = useTranslation();

return <div className={direction === 'rtl' ? 'mr-4' : 'ml-4'}>Content</div>;
```

```css
html[dir='rtl'] .my-element {
  margin-right: 1rem;
}

html[dir='ltr'] .my-element {
  margin-left: 1rem;
}
```

## Fallback Behavior

If a key is missing:

1. The key is returned.
2. A warning is logged in development.
3. Optional fallback value can be used.

```typescript
t('missing.key', 'Default Value');
```

## Troubleshooting

### Language Not Persisting
- Ensure localStorage is available.
- Clear cache and reload.
- Check console errors.

### Translations Not Appearing
- Use key format `namespace.key`.
- Ensure key exists in all languages in `translations.ts`.
- Verify `t()` receives the expected key.

### RTL Not Working
- Ensure language is listed in `RTL_LANGUAGES`.
- Verify CSS selectors use `[dir='rtl']`.

## API Reference

### useTranslation()
Returns:
- `t(key, defaultValue?)` - get translation string
- `language` - current language code
- `setLanguage(code)` - update language
- `direction` - `ltr` or `rtl`

### LanguageSwitcher
Prebuilt language selector component with RTL support.

### LanguageProvider
Wraps app and provides language context with persistence and detection.

## Examples

- `src/app/dashboard/page.tsx`
- `src/app/login/page.tsx`
- `src/components/LanguageSwitcher.tsx`
