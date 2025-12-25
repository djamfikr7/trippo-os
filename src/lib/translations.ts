import { useTranslations as useNextIntl } from 'next-intl';

// Helper hook for accessing translations
export function useTranslations(namespace?: string) {
  return useNextIntl(namespace);
}

// Usage: const t = useTranslations('common');
// t('loading') -> Returns "Loading..." in current language
