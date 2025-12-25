# Trippo.OS - Developer Quick Reference

## 🌍 Internationalization (i18n)

### How to Add Translations

**1. Adding to Translation File**
Edit `/src/locales/translations.json`:
```json
{
  "ar": {
    "your_key": "النص العربي",
    "another_key": "نص آخر"
  },
  "en": {
    "your_key": "English text",
    "another_key": "Another text"
  },
  "fr": {
    "your_key": "Texte en français",
    "another_key": "Autre texte"
  }
}
```

**2. Using Translations in Components**
```typescript
import { useTranslations } from '@/lib/translations';

export function MyComponent() {
  const t = useTranslations('dashboard'); // Use dashboard namespace

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('subtitle')}</p>
    </div>
  );
}
```

**3. Available Namespaces**
- `nav` - Navigation items
- `common` - Common UI terms (search, filter, loading, etc.)
- `auth` - Authentication (login, register, logout, etc.)
- `dashboard` - Dashboard (title, subtitle, stats, etc.)
- `drivers` - Driver management (name, status, actions, etc.)
- `trips` - Trip management (pickup, dropoff, fare, etc.)
- `tracking` - Real-time tracking (driver_location, trip_status, etc.)
- `heatmap` - Heat map (demand_zones, surge_pricing, etc.)
- `ratings` - Rating system (flagged_issues, issues_history, etc.)
- `rider` - Rider features (request_ride, select_pickup, etc.)
- `tracking_rider` - Rider tracking (track_ride, driver_info, etc.)
- `sos` - SOS/emergency (emergency_sos, trigger_emergency, etc.)

### RTL Support

Arabic automatically uses `dir="rtl"`:
```typescript
// In /[locale]/layout.tsx
const direction = locale === 'ar' ? 'rtl' : 'ltr';
// This applies to entire page
```

### Language Routing

**URL Structure:**
- `/en` - English (default)
- `/fr` - French
- `/ar` - Arabic (RTL)

**Redirects:**
- Invalid locale → 404
- No locale → Redirect to `/en`
- Auto-redirect user's preferred locale (not yet implemented)

### How to Add New Languages

1. Add to `locales` array in `/src/i18n/routing.ts`:
```typescript
export const locales = ['en', 'fr', 'ar', 'es', 'de'] as const;
```

2. Add translations to `/src/locales/translations.json`:
```json
{
  "es": {
    "your_key": "Texto en español"
  },
  "de": {
    "your_key": "Text auf Deutsch"
  }
}
```

3. Add flag to language switcher in `/src/components/ui/language-switcher.tsx`:
```typescript
const locales = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;
```

---

## 🎨 Neomorphism Design System

### How to Use Neomorphism Classes

**1. Basic Neomorphism Card**
```tsx
<div className="neomorph neomorph-md">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**2. Neomorphism Card with Hover**
```tsx
<div className="neomorph-card neomorph-md hover:scale-105">
  <h2>Title</h2>
  <p>Content</p>
</div>
```

**3. Neomorphism Button**
```tsx
<button className="neomorph-btn neomorph-sm">
  Button Text
</button>
```

**4. Neomorphism Button with Hover Glow**
```tsx
<button className="neomorph-btn neomorph-md hover:scale-105">
  Button Text
</button>
```

**5. Neomorphism Input**
```tsx
<input className="neomorph-input" placeholder="Enter text..." />
```

**6. Neomorphism Toggle**
```tsx
<div className="neomorph-toggle neomorph-sm">
  <div className="after"></div>
  Toggle
</div>
```

**7. Neomorphism Badge**
```tsx
<Badge className="neomorph-badge">
  Badge Text
</Badge>
```

**8. Neomorphism Progress Bar**
```tsx
<div className="neomorph-progress neomorph-sm">
  <div className="neomorph-progress-bar" style={{ width: '75%' }}></div>
</div>
```

**9. Neomorphism Avatar**
```tsx
<div className="neomorph-avatar neomorph-md">
  <img src="/avatar.jpg" alt="Avatar" />
</div>
```

**10. Neomorphism Icon Container**
```tsx
<div className="neomorph-icon neomorph-sm">
  <MapPin className="h-5 w-5" />
</div>
```

### Size Utility Classes

- `.neomorph-sm` - border-radius: 12px
- `.neomorph-md` - border-radius: 16px
- `.neomorph-lg` - border-radius: 24px
- `.neomorph-xl` - border-radius: 32px

### Available Colors

**Background:**
- `--neomorph-gradient` (main gradient)
- `--neomorph-gradient-subtle` (subtle gradient)

**Shadows:**
- `--neomorph-shadow-light` (light shadows)
- `--neomorph-shadow-dark` (dark shadows)
- `--neomorph-shadow-amber` (amber colored shadows)
- `--neomorph-shadow-green` (green colored shadows)
- `--neomorph-shadow-red` (red colored shadows)
- `--neomorph-inset` (inset shadows)

**Glows:**
- `--neomorph-glow-amber` (soft amber glow)
- `--neomorph-glow-green` (soft green glow)
- `--neomorph-glow-red` (soft red glow)

### RTL Support for Neomorphism

Neomorphism classes automatically handle RTL:
```css
[dir="rtl"] .neomorph-card:hover {
  transform: translate(-4px, 0);
}

[dir="rtl"] .neomorph-toggle::after {
  transform: translateY(-50%) rotate(180deg);
}
```

---

## 🎬 Animations (Framer Motion)

### How to Use Animations

**1. Container Fade-In Animation**
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  exit="exit"
  variants={containerVariants}
  transition={{ duration: 0.4, ease: 'easeInOut' }}
>
  <div>Content</div>
</motion.div>
```

**2. Staggered Item Animation**
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={itemVariants}
  transition={{ delay: 0.1, duration: 0.3 }}
>
  <div>Item 1</div>
</motion.div>
```

**3. Hover Animation**
```tsx
<motion.div
  whileHover={{ scale: 1.05, y: -2 }}
  whileTap={{ scale: 0.95 }}
>
  <div>Content</div>
</motion.div>
```

**4. Pulse Animation**
```tsx
<motion.div
  className="neomorph-pulse"
>
  <div>Pulsing Element</div>
</motion.div>
```

**5. Page Transition Animation**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  <div>Page Content</div>
</motion.div>
```

### Animation Variants

**Container Variants:**
```typescript
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95 },
};
```

**Item Variants:**
```typescript
const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};
```

### Animation Easing Functions

- `easeInOut` - Smooth ease-in-out
- `easeOut` - Smooth ease-out
- `spring` - Spring physics

### Animation Durations

- Fast: 0.2s (button taps, hover)
- Medium: 0.3s (fade-ins)
- Slow: 0.4s (page transitions)

---

## 🔗 Navigation with i18n

### Using Link Component

```typescript
import { Link } from '@/i18n/routing';

export function MyComponent() {
  return (
    <Link href="/drivers">
      {t('drivers')} {/* Translated */}
    </Link>
  );
}
```

### Using useRouter

```typescript
import { useRouter } from '@/i18n/routing';

export function MyComponent() {
  const router = useRouter();
  const t = useTranslations('drivers');

  return (
    <button onClick={() => router.push('/drivers')}>
      {t('title')}
    </button>
  );
}
```

### Using usePathname

```typescript
import { usePathname } from '@/i18n/routing';

export function MyComponent() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] as Locale;

  return (
    <div>Current locale: {locale}</div>
  );
}
```

---

## 📱 Responsive Design with Neomorphism

### Mobile Layout

```tsx
<div className="space-y-4 md:space-y-6 lg:space-y-8">
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    <div className="neomorph-card neomorph-sm md:neomorph-md">
      {/* Content */}
    </div>
  </div>
</div>
```

### Responsive Sidebar

```tsx
<aside className="
  w-full
  md:w-64
  lg:w-80
  neomorph
  neomorph-card
  h-screen
">
  {/* Sidebar Content */}
</aside>
```

### Responsive Navigation

```tsx
<nav className="
  neomorph-sm
  p-2
  md:p-4
  lg:p-6
">
  {/* Nav Items */}
</nav>
```

---

## 🎯 Best Practices

### 1. Translation Best Practices

**DO:**
- Use namespaces for organizing translations
- Use descriptive keys (e.g., `driver_list_title` not `title`)
- Provide context in keys (e.g., `driver_card_rating` not `rating`)
- Keep translations short and simple
- Use existing keys before creating new ones

**DON'T:**
- Don't hardcode text in components
- Don't use vague keys (e.g., `text1`, `label2`)
- Don't forget to translate all user-facing text
- Don't mix languages in one key

### 2. Neomorphism Design Best Practices

**DO:**
- Use neomorphism for interactive elements (cards, buttons, inputs)
- Add hover effects (scale, shadow intensification)
- Add pressed states (inset shadows)
- Use colored shadows for accents (amber for primary, green for success)
- Keep contrast high for accessibility

**DON'T:**
- Don't overuse neomorphism (can become heavy)
- Don't use neomorphism for static content (backgrounds)
- Don't mix neomorphism with other styles (keep consistent)
- Don't ignore accessibility (color contrast, focus states)

### 3. Animation Best Practices

**DO:**
- Use subtle animations (fade, scale)
- Keep animations fast (0.2-0.4s)
- Use staggered animations for lists
- Add exit animations for smooth transitions
- Respect user's reduced motion preference (check `prefers-reduced-motion`)

**DON'T:**
- Don't use distracting animations
- Don't use slow animations (over 0.5s)
- Don't animate too many elements at once
- Don't ignore performance (use `transform` instead of `top`/`left`)

### 4. Performance Best Practices

**DO:**
- Use dynamic imports for heavy components (maps, charts)
- Use React.memo for expensive components
- Use useCallback for event handlers
- Use TanStack Query for data fetching
- Use image optimization (next/image)
- Use code splitting

**DON'T:**
- Don't fetch data on every render
- Don't use inline styles (use CSS)
- Don't recreate functions on every render
- Don't ignore memory leaks (clean up intervals, event listeners)

---

## 🐛 Common Issues & Solutions

### Issue 1: Translations Not Showing

**Cause:** Using wrong namespace or key
```typescript
// Wrong
const t = useTranslations('common');
t('driver_name'); // Key not in 'common' namespace

// Correct
const t = useTranslations('drivers');
t('driver_name'); // Key is in 'drivers' namespace
```

### Issue 2: Neomorphism Not Showing

**Cause:** Not importing globals-neomorph.css
```tsx
// In app/layout.tsx
import "./globals.css";
import "./globals-neomorph.css"; // Add this line
```

### Issue 3: Animations Not Working

**Cause:** Not wrapping with client component
```tsx
// Wrong
export default function Page() {
  return (
    <motion.div {...}> {/* Won't work on server */}
    </motion.div>
  );
}

// Correct
'use client';
export default function Page() {
  return (
    <motion.div {...}> {/* Works on client */}
    </motion.div>
  );
}
```

### Issue 4: WebSocket Not Connecting

**Cause:** Wrong URL or server not running
```typescript
// Check websocket-service is running
cd mini-services/websocket-service
bun run dev

// Check URL is correct
const socket = io('http://localhost:3003'); // Default is port 3003
```

---

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [Framer Motion Documentation](https://www.framer.com/motion)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

### Design Resources
- [Neumorphism Design Principles](https://neumorphism.io/)
- [UI/UX Best Practices](https://lawsofux.com/)
- [Web Accessibility (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

### Code Quality
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Next.js Best Practices](https://nextjs.org/docs/getting-started/project-structure)

---

## 🚀 Quick Start

### For New Developers

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/trippo-os
cd trippo-os
bun install
```

2. **Start development server:**
```bash
bun run dev
```
Visit: http://localhost:3000

3. **Start WebSocket service (in new terminal):**
```bash
cd mini-services/websocket-service
bun install
bun run dev
```
WebSocket runs on port 3003

4. **Test localization:**
- Visit http://localhost:3000/en (English)
- Visit http://localhost:3000/fr (French)
- Visit http://localhost:3000/ar (Arabic - RTL)

5. **Test neomorphism:**
- Hover over cards to see lift effect
- Click buttons to see inset shadow
- Scroll to see smooth animations

6. **Test animations:**
- Page load with staggered items
- Hover effects with scale
- Tab transitions

---

## 💡 Tips & Tricks

### 1. Speed Up Development

```typescript
// Use ESLint to catch errors
bun lint

// Use TypeScript strict mode to catch type errors
// (Already enabled in tsconfig.json)

// Use Prettier for consistent formatting
// (Already configured in .prettierrc)
```

### 2. Test Real-Time Features

```bash
// Use socket.io-client to test from browser
// Open console and emit events
socket.emit('test_event', { data: 'test' });

// Or use the network tab in DevTools
// WebSocket connections are shown in the network tab
```

### 3. Debug Translations

```typescript
// Log current locale
const pathname = usePathname();
const locale = pathname.split('/')[1];
console.log('Current locale:', locale);

// Check if translations are loading
const t = useTranslations('dashboard');
console.log('Dashboard translations:', t);
```

### 4. Optimize Images

```typescript
// Use next/image for automatic optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Trippo.OS Logo"
  width={200}
  height={50}
  priority // Above the fold
/>
```

---

## 📞 Support

### Getting Help

1. **Check Documentation:**
   - Read `/CODEBASE_REVIEW.md` for codebase analysis
   - Read `/FINAL_SUMMARY.md` for session summary
   - Read `/PRODUCTION_IMPLEMENTATION_SUMMARY.md` for feature overview

2. **Search Existing Issues:**
   - Check GitHub Issues
   - Search in project Slack/Discord
   - Ask team members

3. **File a Bug:**
   - Describe the issue clearly
   - Provide steps to reproduce
   - Include error messages/screenshots
   - Suggest a fix if possible

### Contributing

1. **Adding Features:**
   - Create feature branch
   - Implement feature following patterns
   - Add tests
   - Create pull request with description

2. **Fixing Bugs:**
   - Identify root cause
   - Write fix
   - Add test to prevent regression
   - Create pull request with description

---

## 🎓 Learning Path

### For Beginners
1. Understand the project structure
2. Learn React and Next.js basics
3. Learn TypeScript fundamentals
4. Learn Tailwind CSS
5. Start with small features (add translation key)
6. Progress to larger features (add new page)

### For Intermediate
1. Learn TanStack Query for data fetching
2. Learn Socket.io for real-time features
3. Learn Framer Motion for animations
4. Learn Prisma for database operations
5. Learn next-intl for i18n
6. Contribute to core features (improve existing)

### For Advanced
1. Learn PostgreSQL + PostGIS for geospatial queries
2. Learn Redis for caching
3. Learn Docker for containerization
4. Learn Kubernetes for orchestration
5. Learn CI/CD for automation
6. Lead development of new major features

---

## 📊 Project Stats

**Files:** 60+
**Lines of Code:** 20,000+
**Translation Keys:** 500+
**Supported Languages:** 3 (EN, FR, AR)
**Neomorphism Classes:** 20+
**Framer Motion Animations:** 10+
**API Endpoints:** 18+
**Database Models:** 10
**UI Components:** 45+

---

## 🎯 Next Steps

### Immediate
1. Test all languages (EN, FR, AR)
2. Test RTL support for Arabic
3. Test all animations
4. Test all neomorphism components
5. File pull request for i18n and neomorphism

### Short-Term
1. Add file upload for driver documents
2. Implement email/SMS notifications
3. Set up PostgreSQL + PostGIS
4. Add Redis caching layer
5. Set up monitoring/logging

### Long-Term
1. Develop Flutter Rider App
2. Develop Flutter Driver App
3. Set up CI/CD pipeline
4. Add unit/integration/E2E tests
5. Deploy to production infrastructure

---

**Good luck and happy coding! 🚀**
