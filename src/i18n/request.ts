import { getRequestConfig } from 'next-intl/server';
import { routing } from '@/i18n/routing';

// Get the current locale and messages
export default getRequestConfig(routing.locales);
