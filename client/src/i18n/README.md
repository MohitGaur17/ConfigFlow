# Multi-Language Support (i18n)

ConfigFlow includes comprehensive multi-language support with 8 languages out of the box and extensible architecture for adding more.

## Features

✅ **8 Languages Supported**
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Japanese (ja)
- Chinese (zh)
- Portuguese (pt)
- Arabic (ar)

✅ **RTL Language Support**
- Automatic direction switching for Arabic
- DOM dir attribute automatically updated

✅ **Automatic Language Detection**
- Browser language detection on first visit
- Respects user's system language preference

✅ **Language Persistence**
- Selected language saved to localStorage
- Persists across sessions and page reloads

✅ **URL-Based Language Switching**
- Use `?lang=es` to set language via URL parameter
- Perfect for sharing links with specific languages

✅ **Dynamic Switching**
- Switch languages on-the-fly with LanguageSwitcher component
- No page reload required
- Instant UI update

## Installation

The i18n system is pre-configured in your app. No additional setup required!

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

// language: current language code ('en', 'es', 'fr', etc.)
// direction: 'ltr' or 'rtl' (for CSS styling)
// setLanguage(): change the language programmatically
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

### Pages
- `home.title` - Page title
- `home.subtitle` - Page subtitle
- `dashboard.title` - Dashboard
- `dashboard.welcome` - Welcome message
- `tasks.allTasks` - All Tasks
- `tasks.search` - Search records
- `tasks.add` - Add

## Adding New Translations

### Step 1: Update translations.ts

Edit `src/i18n/translations.ts` and add your key to all language objects:

```typescript
export const translations: Record<Language, Record<string, string>> = {
  en: {
    'myFeature.heading': 'My Feature',
    'myFeature.description': 'This is my feature',
    // ... other keys
  },
  es: {
    'myFeature.heading': 'Mi Característica',
    'myFeature.description': 'Esta es mi característica',
    // ... other keys
  },
  // ... other languages
};
```

### Step 2: Use in Your Component

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

### Step 1: Add Language Code

Edit `src/i18n/translations.ts`:

```typescript
export type Language = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'pt' | 'ar' | 'ko'; // Add 'ko'

export const languages = [
  // ... existing languages
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];
```

### Step 2: Add Translation Object

```typescript
export const translations: Record<Language, Record<string, string>> = {
  // ... existing translations
  ko: {
    'nav.allTasks': '모든 작업',
    'nav.newTask': '새 작업',
    // ... all other keys
  },
};
```

### Step 3: (Optional) Add RTL Support

If the language is RTL (right-to-left), update the RTL_LANGUAGES array:

```typescript
const RTL_LANGUAGES: Language[] = ['ar', 'he']; // Add 'he' for Hebrew
```

## Advanced Features

### Language Configuration (Config-Based)

Use the `useLanguageConfig` hook to configure language settings:

```typescript
import { useLanguageConfig, createLanguageConfig } from '@/i18n/useLanguageConfig';

const config = createLanguageConfig('es', ['en', 'es', 'fr']);
useLanguageConfig(config);
```

### URL-Based Language Setting

Append `?lang=CODE` to set language via URL:

```
https://your-app.com/?lang=fr  // Sets French
https://your-app.com/?lang=ja  // Sets Japanese
```

### Accessing Language from URL

```typescript
import { getLanguageFromUrl } from '@/i18n/useLanguageConfig';

const langFromUrl = getLanguageFromUrl(); // Returns 'fr' if ?lang=fr
```

## Styling with Language Direction

For RTL language support, use the `direction` from `useTranslation`:

```typescript
const { direction } = useTranslation();

return (
  <div className={direction === 'rtl' ? 'mr-4' : 'ml-4'}>
    Content
  </div>
);
```

Or use CSS media queries:

```css
html[dir="rtl"] .my-element {
  margin-right: 1rem;
}

html[dir="ltr"] .my-element {
  margin-left: 1rem;
}
```

## Default Fallbacks

If a translation key is missing, the system will:

1. Return the key itself as fallback
2. Log a console warning (in development)
3. Optionally accept a default value:

```typescript
t('missing.key', 'Default Value') // Returns "Default Value"
```

## Browser Detection

On first visit, ConfigFlow automatically detects the user's browser language:

- Reads from `navigator.language`
- Matches against supported languages
- Falls back to English if no match
- User can override by manually selecting language

## Performance Considerations

- Language data is loaded once and cached in memory
- localStorage is used for persistence (lightweight)
- No external API calls for language switching
- DOM updates are minimal and batched

## Accessibility

- `lang` attribute automatically set on `<html>` element
- `dir` attribute automatically set for RTL languages
- LanguageSwitcher includes proper ARIA labels
- Keyboard accessible dropdown menu

## Troubleshooting

### Language not persisting
- Check that localStorage is enabled in browser
- Clear browser cache and try again
- Check browser console for errors

### Translations not appearing
- Ensure you're using correct key format: `'namespace.key'`
- Check that key exists in all language objects in translations.ts
- Use browser DevTools to verify t() function receives correct key

### RTL not working
- Ensure language is added to RTL_LANGUAGES array
- Verify CSS uses `[dir="rtl"]` selectors
- Clear cache and reload page

## API Reference

### useTranslation()
Returns object with:
- `t(key, defaultValue?)` - Get translation
- `language` - Current language code
- `setLanguage(code)` - Change language
- `direction` - 'ltr' or 'rtl'

### useLanguage()
Raw context hook (use useTranslation instead):
- Same as useTranslation()

### LanguageSwitcher
Component: Pre-built language selector dropdown
- Auto-detects RTL
- Styled with Tailwind CSS
- Responsive design

### LanguageProvider
Wraps app and provides context
- Automatic localStorage sync
- Browser language detection
- Already included in Providers.tsx

## Examples

See these files for implementation examples:
- `src/app/dashboard/page.tsx` - Dashboard with translations
- `src/app/login/page.tsx` - Auth page with LanguageSwitcher
- `src/components/LanguageSwitcher.tsx` - Component implementation
