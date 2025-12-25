'use client';

import { usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';
import { motion } from 'framer-motion';
import { Check, Globe, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const locales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
] as const;

export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [currentLocale, setCurrentLocale] = useState(locales[0].code);

  useEffect(() => {
    // Get current locale from pathname
    const locale = pathname.split('/')[1];
    const foundLocale = locales.find(l => l.code === locale);
    if (foundLocale) {
      setCurrentLocale(foundLocale.code);
    }
  }, [pathname]);

  const changeLocale = (localeCode: string) => {
    startTransition(() => {
      router.replace(`/${localeCode}${pathname.slice(3)}`);
    });
  };

  const currentLocaleData = locales.find(l => l.code === currentLocale) || locales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`
            relative overflow-hidden
            rounded-2xl
            px-4 py-2.5
            text-sm font-medium
            transition-all duration-300
            group
            ${neomorphismStyles}
            hover:scale-105
            active:scale-95
          `}
        >
          <motion.div
            className="relative z-10 flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">{currentLocaleData.flag}</span>
            <span className="hidden sm:inline">
              {currentLocaleData.name}
            </span>
            <Globe className="w-4 h-4 opacity-70" />
          </motion.div>

          {/* Animated Background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-primary/20 rounded-2xl"
            initial={{ opacity: 0.5 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={`
          min-w-[160px]
          p-1.5
          rounded-2xl
          ${neomorphismStyles}
        `}
      >
        {locales.map((locale) => (
          <motion.div
            key={locale.code}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <DropdownMenuItem
              onClick={() => changeLocale(locale.code)}
              className={`
                relative overflow-hidden
                rounded-xl
                px-3 py-2.5
                cursor-pointer
                transition-all duration-200
                ${locale.code === currentLocale
                  ? 'bg-gradient-to-r from-amber-500/20 to-primary/20'
                  : 'hover:bg-muted/50'
                }
                ${neomorphismStyles}
              `}
            >
              <div className="relative z-10 flex items-center gap-2">
                <span className="text-lg">{locale.flag}</span>
                <span className="font-medium">{locale.name}</span>
                {locale.code === currentLocale && (
                  <Check className="w-4 h-4 text-amber-500 ml-auto" />
                )}
              </div>

              {/* Hover Effect */}
              {locale.code !== currentLocale && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-primary/10 rounded-xl opacity-0"
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </DropdownMenuItem>
          </motion.div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Neomorphism styles
const neomorphismStyles = `
  bg-[#050505]
  border-[1px] border-[#1a1a1a]
  shadow-[8px_8px_16px_rgba(0,0,0,0.6),_8px_8px_16px_rgba(245,158,11,0.05)]
  text-foreground
`;

function useState<T>(initial: T): [T, (value: T) => void] {
  const [value, setValue] = React.useState(initial);
  return [value, setValue];
}
