import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl/react';
import { setRequestLocale } from 'next-intl/server';
import { ReactNode } from 'react';
import { getMessages } from 'next-intl/server';

export const locales = ['en', 'fr', 'ar'] as const;
export const defaultLocale = 'en' as const;

export type Locale = (typeof locales)[number];

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale as Locale);

  // Provide all messages to client side
  const messages = await getMessages();

  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
